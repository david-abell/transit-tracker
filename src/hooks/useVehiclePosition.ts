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

  // calling lineSlice is expensive. storing reduced call time by 450ms on longer routes...
  // Here we store results from getOrUpdateSlicePositions
  const seenSlices = useRef(new Map<[number, number][], Position[]>());

  const prevStopTimeUpdate = useMemo(
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
        prevStopTimeUpdate,
      ),
    [prevStopTimeUpdate, stopTimesByStopId, stopIds, stopTimeUpdate, stopsById],
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

  const currentArrivalsIndex = findCurrentArrivalIndex(arrivals);

  // bail early if two coordinates not possible
  if (currentArrivalsIndex <= 0 || currentArrivalsIndex > arrivals.length - 1) {
    return vehicleError;
  }

  const prevStop = arrivals[currentArrivalsIndex - 1];

  // some stops in sequence have same arrival time
  // check upcoming arrival times for stops with same arrival time and take last
  const allNextStops = arrivals.filter(
    ({ arrivalTime }) =>
      arrivalTime === arrivals[currentArrivalsIndex].arrivalTime,
  );

  const nextStop = allNextStops.at(-1)!;

  // let chunks: FeatureCollection<LineString, Properties>;
  const slicePositions = getOrUpdateSlicePositions(
    nextStop,
    prevStop,
    seenSlices,
    shape,
  );

  const vehiclePosition = getCurrentSlicePosition(
    prevStop,
    nextStop,
    slicePositions,
  );
  const bearing = getBearing(vehiclePosition, nextStop.coordinates);

  return { vehiclePosition, bearing, nextStop, vehicleError: undefined };
}

export default useVehiclePosition;

function getOrUpdateSlicePositions(
  nextStop: Arrival,
  prevStop: Arrival,
  seenSlices: MutableRefObject<Map<[number, number][], Position[]>>,
  shape: Position[],
) {
  const currentSliceKey = [nextStop.coordinates, prevStop.coordinates];

  if (seenSlices.current.has(currentSliceKey)) {
    return seenSlices.current.get(currentSliceKey)!;
  } else {
    const currentShapeSection = lineSlice(
      nextStop.coordinates,
      prevStop.coordinates,
      {
        type: "LineString",
        coordinates: shape,
      },
    );

    const chunks = lineChunk(currentShapeSection, 20, { units: "meters" });
    const slicePositions = chunks.features.flatMap(
      ({ geometry }) => geometry.coordinates,
    );

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

    seenSlices.current.set(currentSliceKey, slicePositions);

    return slicePositions;
  }
}

function getCurrentSlicePosition(
  prevStop: Arrival,
  nextStop: Arrival,
  slicePositions: Position[],
) {
  const slicePercentage = getPercentageToArrival(
    prevStop.delayedArrivalTime || prevStop.arrivalTime,
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
  prevStopTimeUpdate: StopTimeUpdate | undefined,
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
          prevStopTimeUpdate;

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
