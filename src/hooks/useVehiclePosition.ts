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
import { MutableRefObject, useMemo, useRef, useState } from "react";
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

export type VehiclePositionProps = {
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

const vehicleError = {
  vehiclePosition: undefined,
  bearing: undefined,
  nextStop: undefined,
  vehicleError: true,
} as const;

type VehicleError = typeof vehicleError;

function useVehiclePosition({
  stopIds,
  shape,
  stopTimesByStopId,
  stopsById,
  stopTimeUpdate,
  options,
}: VehiclePositionProps): VehiclePosition | VehicleError {
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 500);

  const seenSlices = useRef(new Map<[number, number][], Position[]>());

  const lastStopTimeUpdate = useMemo(
    () => stopTimeUpdate && stopTimeUpdate.at(-1),
    [stopTimeUpdate],
  );

  const arrivals = useMemo(
    () =>
      createArrivalList(
        stopIds,
        stopsById,
        stopTimesByStopId,
        stopTimeUpdate,
        lastStopTimeUpdate,
      ),
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
    return vehicleError;
  }

  const currentStopSequence = findCurrentArrivalIndex(arrivals);

  // bail early if two coordinates not possible
  if (currentStopSequence <= 0 || currentStopSequence > arrivals.length - 1) {
    return vehicleError;
  }

  const lastStop = arrivals[currentStopSequence - 1];

  // some stops in sequence have same arrival time
  // check upcoming arrival times for stops with same arrival time and take last
  const allNextStops = arrivals.filter(
    ({ arrivalTime }) =>
      arrivalTime === arrivals[currentStopSequence].arrivalTime,
  );

  const nextStop = allNextStops.at(-1)!;

  // let chunks: FeatureCollection<LineString, Properties>;
  const slicePositions = getOrUpdateSlicePositions(
    nextStop,
    lastStop,
    seenSlices,
    shape,
  );

  maybeReverseSliceDirection();

  const vehiclePosition = getCurrentSlicePosition(
    lastStop,
    nextStop,
    slicePositions,
  );

  const bearing = getBearing(vehiclePosition, nextStop.coordinates);
  return { vehiclePosition, bearing, nextStop, vehicleError: undefined };

  function maybeReverseSliceDirection() {
    // Check if slice is correct direction of travel
    const nextStopPoint = point(nextStop.coordinates);
    const sliceStart = slicePositions.at(0);
    const sliceEnd = slicePositions.at(-1);
    const sliceStartDistance =
      sliceStart && rhumbDistance(sliceStart, nextStopPoint);
    const sliceEndDistance = sliceEnd && rhumbDistance(sliceEnd, nextStopPoint);

    if (
      sliceStartDistance &&
      sliceEndDistance &&
      sliceStartDistance > sliceEndDistance
    ) {
      slicePositions.reverse();
    }
  }
}

export default useVehiclePosition;

function getOrUpdateSlicePositions(
  nextStop: Arrival,
  lastStop: Arrival,
  seenSlices: MutableRefObject<Map<[number, number][], Position[]>>,
  shape: Position[],
) {
  // let slicePositions: Position[];

  // calling lineSlice is expensive. Storing results reduced call time by 450ms on longer routes...
  const currentSliceKey = [nextStop.coordinates, lastStop.coordinates];

  if (seenSlices.current.has(currentSliceKey)) {
    return seenSlices.current.get(currentSliceKey)!;
  } else {
    const currentShapeSection = lineSlice(
      nextStop.coordinates,
      lastStop.coordinates,
      {
        type: "LineString",
        coordinates: shape,
      },
    );

    const chunks = lineChunk(currentShapeSection, 20, { units: "meters" });
    const slicePositions = chunks.features.flatMap(
      ({ geometry }) => geometry.coordinates,
    );

    seenSlices.current.set(currentSliceKey, slicePositions);

    return slicePositions;
  }
}

function getCurrentSlicePosition(
  lastStop: Arrival,
  nextStop: Arrival,
  slicePositions: Position[],
) {
  const slicePercentage = getPercentageToArrival(
    lastStop.delayedArrivalTime || lastStop.arrivalTime,
    nextStop.delayedArrivalTime || nextStop.arrivalTime,
  );

  const sliceIndex =
    slicePositions.length > 0
      ? Math.floor((slicePositions.length - 1) * slicePercentage)
      : 0;

  // turf.js Position = number[] will always be a tuple...
  // Leaflet.js LatLngTuple = [number, number]
  const vehiclePosition = slicePositions[sliceIndex] as LatLngTuple;
  return vehiclePosition;
}

function findCurrentArrivalIndex(arrivals: Arrival[]) {
  return arrivals.findIndex(
    ({ arrivalTime, delayedArrivalTime }) =>
      !isPastArrivalTime(delayedArrivalTime || arrivalTime),
  );
}

function createArrivalList(
  stopIds: string[] | undefined,
  stopsById: Map<
    string,
    {
      stopId: string;
      stopCode: string | null;
      stopName: string | null;
      stopLat: number | null;
      stopLon: number | null;
    }
  >,
  stopTimesByStopId: Map<
    string,
    {
      tripId: string;
      arrivalTime: string | null;
      arrivalTimestamp: number | null;
      departureTime: string | null;
      departureTimestamp: number | null;
      stopId: string;
      stopSequence: number;
      stopHeadsign: string | null;
      pickupType: number | null;
      dropOffType: number | null;
      timepoint: number | null;
      id: number;
    }
  >,
  stopTimeUpdate: StopTimeUpdate[] | undefined,
  lastStopTimeUpdate: StopTimeUpdate | undefined,
): Arrival[] | undefined {
  return (
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
          ),
          coordinates: [stop.stopLat, stop.stopLon],
          stopSequence,
          stopUpdate: closestStopUpdate,
          stop,
        };
      })
      .sort((a, b) => a.stopSequence - b.stopSequence)
  );
}
