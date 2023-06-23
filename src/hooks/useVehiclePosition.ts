import { getBearing } from "@/components/Map/mapUtils";
import {
  getDelayedTime,
  getPercentageToArrival,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";
import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { Position, point } from "@turf/helpers";
import lineChunk from "@turf/line-chunk";
import lineSlice from "@turf/line-slice";
import rhumbDistance from "@turf/rhumb-distance";
import equal from "fast-deep-equal/es6";
import { LatLngTuple } from "leaflet";
import { useRef } from "react";
import { KeyedMutator } from "swr";

type Arrival = {
  arrivalTime: string;
  coordinates: {
    stopLat: number;
    stopLon: number;
  };
  // delayedArrivalTime: string;
  stopSequence: number;
};

type Props = {
  stopIds: string[] | undefined;
  shape: LatLngTuple[] | undefined;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopsById: Map<string, Stop>;
  stopUpdates: Map<string, StopTimeUpdate>;
  options: {
    skip: boolean;
  };
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopUpdates,
  options,
}: Props): {
  vehiclePosition: LatLngTuple;
  bearing: number;
  vehicleError: undefined;
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopUpdates,
  options,
}: Props): {
  vehicleError: true;
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopUpdates,
  options,
}: Props) {
  const prevStopSequence = useRef(0);
  const stopTimeRef = useRef(selectedTripStopTimesById);
  const prevCoordinateRef = useRef<Arrival | undefined>();

  if (options.skip || !shape || shape.length < 1 || !stopIds) {
    return { vehicleError: true };
  }

  const arrivals = stopIds
    .flatMap<Arrival>((stopId) => {
      const { stopLat, stopLon } = stopsById.get(stopId) || {};
      if (!stopLat || !stopLon) {
        return [];
      }
      const { arrivalTime, stopSequence } =
        selectedTripStopTimesById.get(stopId) || {};
      if (!arrivalTime || !stopSequence) {
        return [];
      }
      // const stopUpdate = stopUpdates?.get(stopId);
      // const { arrival: realtimeArrival } = stopUpdate || {};

      return {
        arrivalTime: arrivalTime,
        // delayedArrivalTime: realtimeArrival?.delay
        //   ? getDelayedTime(arrivalTime, realtimeArrival.delay)
        //   : "",
        coordinates: { stopLat, stopLon },
        stopSequence,
      };
    })
    .sort((a, b) => a.stopSequence - b.stopSequence);

  if (arrivals.length < 1 && !prevCoordinateRef.current) {
    return { vehicleError: true };
  }

  let currentStopSequence = prevStopSequence.current;

  // Check if new trip
  if (
    currentStopSequence === undefined ||
    (currentStopSequence <= 0 && !prevCoordinateRef.current) ||
    !equal(stopTimeRef.current, selectedTripStopTimesById)
  ) {
    stopTimeRef.current = selectedTripStopTimesById;
    prevCoordinateRef.current = undefined;

    const newStopSequence = arrivals.findIndex(
      ({ arrivalTime }) => !isPastArrivalTime(arrivalTime)
    );
    currentStopSequence = newStopSequence;
    prevStopSequence.current = newStopSequence;
  }

  // bail early if two coordinates not possible
  if (
    currentStopSequence < 0 ||
    (currentStopSequence === 0 && !prevCoordinateRef.current)
  ) {
    return { vehicleError: true };
  }
  // this should never happen
  if (currentStopSequence > arrivals.length - 1) {
    return { vehicleError: true };
  }

  const lastStop =
    currentStopSequence === 0 && prevCoordinateRef.current
      ? prevCoordinateRef.current
      : arrivals[currentStopSequence - 1];

  // some stops in sequence have same arrival time
  // check upcoming arrival times for stops with same arrival time and take last
  const allNextStops = arrivals.filter(
    ({ arrivalTime }) =>
      arrivalTime === arrivals[currentStopSequence].arrivalTime
  );

  const nextStop = allNextStops.at(-1)!;

  // nextStop.delayedArrivalTime
  const slicePercentage = getPercentageToArrival(
    lastStop.arrivalTime,
    nextStop.arrivalTime
  );

  // slicePercentage is 1 when arrival time is greater than total slice time,
  // try backtracking stopSequence to reset
  if (slicePercentage === 1) {
    const newStopSequence = arrivals.findIndex(
      ({ arrivalTime }) => !isPastArrivalTime(arrivalTime)
    );
    prevStopSequence.current = newStopSequence;
    // invalidateRealtime();
    return { vehicleError: true };
  }

  const sliced = lineSlice(
    [nextStop.coordinates.stopLat, nextStop.coordinates.stopLon],
    [lastStop.coordinates.stopLat, lastStop.coordinates.stopLon],
    { type: "LineString", coordinates: shape }
  );

  const chunks = lineChunk(sliced, 20, { units: "meters" });

  const nextShapeSlice = chunks.features.flatMap(
    ({ geometry }) => geometry.coordinates
  );

  // Check if slice is correct direction of travel
  const nextStopPoint = point([
    nextStop.coordinates.stopLat,
    nextStop.coordinates.stopLon,
  ]);
  const sliceStart = nextShapeSlice.at(0);
  const sliceEnd = nextShapeSlice.at(-1);

  const sliceStartDistance =
    sliceStart && rhumbDistance(sliceStart, nextStopPoint);
  const sliceEndDistance = sliceEnd && rhumbDistance(sliceEnd, nextStopPoint);
  if (
    sliceStartDistance &&
    sliceEndDistance &&
    sliceStartDistance > sliceEndDistance
  ) {
    nextShapeSlice.reverse();
  }

  const sliceIndex =
    nextShapeSlice.length > 0
      ? Math.floor((nextShapeSlice.length - 1) * slicePercentage)
      : 0;

  // turf.js Position = number[] will always be a tuple...
  // Leaflet.js LatLngTuple = [number, number]
  const vehiclePosition = nextShapeSlice[sliceIndex] as LatLngTuple;

  const bearing = getBearing(vehiclePosition, [
    nextStop.coordinates.stopLat,
    nextStop.coordinates.stopLon,
  ]);

  if (sliceIndex <= 0) {
    currentStopSequence =
      currentStopSequence > arrivals.length - 1 ? -1 : currentStopSequence + 1;
    prevCoordinateRef.current = nextStop;
  }

  prevStopSequence.current = currentStopSequence;

  return { vehiclePosition: vehiclePosition, bearing };
}

export default useVehiclePosition;
