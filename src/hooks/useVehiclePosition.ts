import { getBearing } from "@/components/Map/mapUtils";
import {
  getDelayedTime,
  getPercentageToArrival,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";
import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { point } from "@turf/helpers";
import lineChunk from "@turf/line-chunk";
import lineSlice from "@turf/line-slice";
import rhumbDistance from "@turf/rhumb-distance";
import { LatLngTuple } from "leaflet";
import { useMemo } from "react";
import { KeyedMutator } from "swr";

type Arrival = {
  arrivalTime: string;
  coordinates: {
    stopLat: number;
    stopLon: number;
  };
  delayedArrivalTime: string | null;
  stopSequence: number;
};

type Props = {
  stopIds: string[] | undefined;
  shape: LatLngTuple[] | undefined;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopsById: Map<string, Stop>;
  stopTimeUpdate: StopTimeUpdate[] | undefined;
  options: {
    skip: boolean;
  };
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopTimeUpdate,
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
  stopTimeUpdate,
  options,
}: Props): {
  vehicleError: true;
};

function useVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopTimeUpdate,
  options,
}: Props) {
  const lastStopTimeUpdate = useMemo(
    () => stopTimeUpdate && stopTimeUpdate.at(-1),
    [stopTimeUpdate]
  );

  const arrivals = useMemo(
    () =>
      stopIds &&
      stopIds
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

          const closestStopUpdate =
            (stopTimeUpdate &&
              stopTimeUpdate.find(
                ({ stopSequence: realtimeSequence }) =>
                  stopSequence && realtimeSequence >= stopSequence
                // && scheduleRelationship !== "SKIPPED"
              )) ||
            lastStopTimeUpdate;

          // Not sure if the below accurately reflects vehicle behaviour
          // if (closestStopUpdate?.scheduleRelationship === "SKIPPED") {
          //   closestStopUpdate = stopTimeUpdate!.find(
          //     ({ arrival, departure }) => !!arrival?.delay || !!departure?.delay
          //   );
          // }

          const { arrival, departure } = closestStopUpdate || {};

          return {
            arrivalTime,
            delayedArrivalTime: getDelayedTime(
              arrivalTime,
              arrival?.delay || departure?.delay,
              true
            ),
            coordinates: { stopLat, stopLon },
            stopSequence,
          };
        })
        .sort((a, b) => a.stopSequence - b.stopSequence),
    [
      lastStopTimeUpdate,
      selectedTripStopTimesById,
      stopIds,
      stopTimeUpdate,
      stopsById,
    ]
  );

  // bail early if input requirements not met
  if (
    options.skip ||
    !shape ||
    shape.length < 2 ||
    !stopIds ||
    !arrivals ||
    arrivals.length < 2
  ) {
    return { vehicleError: true };
  }

  const currentStopSequence = arrivals.findIndex(
    ({ arrivalTime, delayedArrivalTime }) =>
      !isPastArrivalTime(delayedArrivalTime || arrivalTime)
  );

  // bail early if two coordinates not possible
  if (currentStopSequence <= 0 || currentStopSequence > arrivals.length - 1) {
    return { vehicleError: true };
  }

  const lastStop = arrivals[currentStopSequence - 1];

  // some stops in sequence have same arrival time
  // check upcoming arrival times for stops with same arrival time and take last
  const allNextStops = arrivals.filter(
    ({ arrivalTime }) =>
      arrivalTime === arrivals[currentStopSequence].arrivalTime
  );

  const nextStop = allNextStops.at(-1)!;

  const slicePercentage = getPercentageToArrival(
    lastStop.delayedArrivalTime || lastStop.arrivalTime,
    nextStop.delayedArrivalTime || nextStop.arrivalTime
  );

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

  return { vehiclePosition: vehiclePosition, bearing };
}

export default useVehiclePosition;
