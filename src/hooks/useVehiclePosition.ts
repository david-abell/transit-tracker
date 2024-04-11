import { getBearing } from "@/components/Map/mapUtils";
import {
  getDelayedTime,
  getPercentageToArrival,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/trip-updates";
import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import {
  Coord,
  Feature,
  FeatureCollection,
  LineString,
  Position,
  Properties,
  point,
} from "@turf/helpers";
import lineChunk from "@turf/line-chunk";
import lineSlice from "@turf/line-slice";
import rhumbDistance from "@turf/rhumb-distance";
import { LatLngTuple } from "leaflet";
import { useMemo, useRef, useState } from "react";
import { KeyedMutator } from "swr";
import { useInterval } from "usehooks-ts";

export type Arrival = {
  arrivalTime: string;
  coordinates: [number, number];
  delayedArrivalTime: string | null;
  stopSequence: number;
  stop: Stop;
  stopUpdate: StopTimeUpdate | undefined;
};

type ShapeSlices = {
  shapeSlice: Feature<LineString, Properties>;
  chunks: FeatureCollection<LineString, Properties>;
  nextShapeSlice: Position[];
};

type Props = {
  stopIds: string[] | undefined;
  shape: Position[] | undefined;
  stopTimesByStopId: Map<StopTime["stopId"], StopTime>;
  stopsById: Map<string, Stop>;
  stopTimeUpdate: StopTimeUpdate[] | undefined;
  options: {
    skip: boolean;
  };
};

type VehiclePosition = {
  bearing: number;
  nextStop: Arrival;
  vehiclePosition: LatLngTuple;
  vehicleError: undefined;
};

type VehicleError = {
  bearing: undefined;
  nextStop: undefined;
  vehiclePosition: undefined;
  vehicleError: true;
};

function useVehiclePosition({
  stopIds,
  shape,
  stopTimesByStopId,
  stopsById,
  stopTimeUpdate,
  options,
}: Props): VehiclePosition | VehicleError {
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 500);

  const lineSlices = useRef(new Map<string, ShapeSlices>());

  const lastStopTimeUpdate = useMemo(
    () => stopTimeUpdate && stopTimeUpdate.at(-1),
    [stopTimeUpdate],
  );

  const arrivals = useMemo(
    () =>
      stopIds &&
      stopIds
        .flatMap((stopId): Arrival | [] => {
          const stop = stopsById.get(stopId);
          if (!stop?.stopLat || !stop?.stopLon) {
            return [];
          }
          const { arrivalTime, stopSequence } =
            stopTimesByStopId.get(stopId) || {};
          if (!arrivalTime || !stopSequence) {
            return [];
          }

          const closestStopUpdate =
            (stopTimeUpdate &&
              stopTimeUpdate.find(
                ({ stopSequence: realtimeSequence }) =>
                  stopSequence && realtimeSequence >= stopSequence,
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
              true,
            ),
            coordinates: [stop.stopLat, stop.stopLon],
            stopSequence,
            stopUpdate: closestStopUpdate,
            stop,
          };
        })
        .sort((a, b) => a.stopSequence - b.stopSequence),
    [lastStopTimeUpdate, stopTimesByStopId, stopIds, stopTimeUpdate, stopsById],
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
    return {
      vehiclePosition: undefined,
      bearing: undefined,
      nextStop: undefined,
      vehicleError: true,
    };
  }

  const currentStopSequence = arrivals.findIndex(
    ({ arrivalTime, delayedArrivalTime }) =>
      !isPastArrivalTime(delayedArrivalTime || arrivalTime),
  );

  // bail early if two coordinates not possible
  if (currentStopSequence <= 0 || currentStopSequence > arrivals.length - 1) {
    return {
      vehiclePosition: undefined,
      bearing: undefined,
      nextStop: undefined,
      vehicleError: true,
    };
  }

  const lastStop = arrivals[currentStopSequence - 1];

  // some stops in sequence have same arrival time
  // check upcoming arrival times for stops with same arrival time and take last
  const allNextStops = arrivals.filter(
    ({ arrivalTime }) =>
      arrivalTime === arrivals[currentStopSequence].arrivalTime,
  );

  const nextStop = allNextStops.at(-1)!;

  const slicePercentage = getPercentageToArrival(
    lastStop.delayedArrivalTime || lastStop.arrivalTime,
    nextStop.delayedArrivalTime || nextStop.arrivalTime,
  );

  let shapeSlice: Feature<LineString, Properties>;
  let chunks: FeatureCollection<LineString, Properties>;
  let nextShapeSlice: Position[];

  // calling lineSlice is expensive. Storing results reduced call time by 450ms on longer routes...
  const sliceKey = JSON.stringify(nextStop.coordinates, lastStop.coordinates);

  if (lineSlices.current.has(sliceKey)) {
    const slice = lineSlices.current.get(sliceKey)!;
    shapeSlice = slice.shapeSlice;
    chunks = slice.chunks;
    nextShapeSlice = slice.nextShapeSlice;
  } else {
    shapeSlice = lineSlice(nextStop.coordinates, lastStop.coordinates, {
      type: "LineString",
      coordinates: shape,
    });

    chunks = lineChunk(shapeSlice, 20, { units: "meters" });

    nextShapeSlice = chunks.features.flatMap(
      ({ geometry }) => geometry.coordinates,
    );

    lineSlices.current.set(sliceKey, {
      shapeSlice,
      chunks,
      nextShapeSlice,
    });
  }

  // Check if slice is correct direction of travel
  const nextStopPoint = point(nextStop.coordinates);
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

  const bearing = getBearing(vehiclePosition, nextStop.coordinates);
  return { vehiclePosition, bearing, nextStop, vehicleError: undefined };
}

export default useVehiclePosition;
