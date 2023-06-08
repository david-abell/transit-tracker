import { getBearing } from "@/components/Map/mapUtils";
import {
  getDelayedTime,
  getPercentageToArrival,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { GTFSResponse, StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { point } from "@turf/helpers";
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
  delayedArrivalTime: string;
  stopSequence: number;
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopUpdates,
  invalidateRealtime,
}: {
  stopIds: string[];
  shape: LatLngTuple[] | undefined;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopsById: Map<string, Stop>;
  stopUpdates: Map<string, StopTimeUpdate>;
  invalidateRealtime: KeyedMutator<GTFSResponse>;
}) {
  const prevStopSequence = useRef(0);
  const stopTimeRef = useRef(selectedTripStopTimesById);

  if (!shape || shape.length < 1) {
    return { vehiclePosition: undefined, bearing: undefined };
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
      const stopUpdate = stopUpdates?.get(stopId);
      const { arrival: realtimeArrival } = stopUpdate || {};

      return {
        arrivalTime: arrivalTime,
        delayedArrivalTime: realtimeArrival?.delay
          ? getDelayedTime(arrivalTime, realtimeArrival.delay)
          : "",
        coordinates: { stopLat, stopLon },
        stopSequence,
      };
    })
    .sort((a, b) => a.stopSequence - b.stopSequence);

  if (arrivals.length < 2) {
    return { vehiclePosition: undefined, bearing: undefined };
  }

  let currentStopSequence = prevStopSequence.current;

  if (
    currentStopSequence === undefined ||
    currentStopSequence < 0 ||
    !equal(stopTimeRef.current, selectedTripStopTimesById)
  ) {
    stopTimeRef.current = selectedTripStopTimesById;

    const newStopSequence = arrivals.findIndex(
      ({ arrivalTime }) => !isPastArrivalTime(arrivalTime)
    );
    currentStopSequence = newStopSequence;
    prevStopSequence.current = newStopSequence;
  }

  // bail early if trip hasn't yet begun
  if (currentStopSequence <= 0) {
    return { vehiclePosition: undefined, bearing: undefined };
  }
  // this should never happen
  if (currentStopSequence > arrivals.length - 1) {
    return { vehiclePosition: undefined, bearing: undefined };
  }

  const lastStop = arrivals[currentStopSequence - 1];

  const nextStop = arrivals[currentStopSequence];

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
    return { vehiclePosition: undefined, bearing: undefined };
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

  const vehiclePosition = nextShapeSlice[sliceIndex];

  const nextPosition = nextShapeSlice.at(-1) || vehiclePosition;

  const bearing = getBearing(
    nextPosition as LatLngTuple,
    vehiclePosition as LatLngTuple
  );

  if (sliceIndex <= 0) {
    currentStopSequence =
      currentStopSequence > arrivals.length - 1 ? -1 : currentStopSequence + 1;
  }

  prevStopSequence.current = currentStopSequence;

  return { vehiclePosition: vehiclePosition as LatLngTuple, bearing };
}

export default useVehiclePosition;
