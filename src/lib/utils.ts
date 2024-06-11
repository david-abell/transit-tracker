import { StopAndStopTime } from "@/components/DestinationSelect";
import { ValidStop } from "@/components/Map/MapContentLayer";
import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDelayedTime, isPastArrivalTime } from "./timeHelpers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidStop(stop: Stop | undefined): stop is ValidStop {
  return stop ? Object.values(stop).every((v) => v !== null) : false;
}

export function getOrderedStops(
  stopTimes: StopTime[] | undefined,
  stopsById: Map<string, Stop>,
): ValidStop[] {
  if (!stopTimes) return Object.values(stopsById) satisfies Stop[];
  const orderedStops: ValidStop[] = [];

  for (const time of stopTimes) {
    const stop = stopsById.get(time.stopId);
    if (isValidStop(stop)) {
      orderedStops.push(stop as ValidStop);
    }
  }

  return orderedStops;
}

export function getUpcomingOrderedStops(
  stopTimes: StopTime[] | undefined,
  stopsById: Map<string, Stop>,
): ValidStop[] {
  if (!stopTimes) return Object.values(stopsById) satisfies Stop[];
  let orderedStops: ValidStop[] = [];

  for (const time of stopTimes) {
    const stop = stopsById.get(time.stopId);
    if (isValidStop(stop)) {
      orderedStops.push(stop as ValidStop);
    }
  }

  const nextStopId = getNextStopTime(stopTimes)?.stopId;

  if (nextStopId) {
    const nextStopIndex = orderedStops.findIndex(
      ({ stopId }) => stopId === nextStopId,
    );
    if (nextStopIndex !== -1) {
      orderedStops = orderedStops.slice(nextStopIndex);
    }
  }

  return orderedStops;
}

export function getAdjustedStopTimes(
  stopTimes: StopTime[] | undefined,
  stopTimeUpdates: StopTimeUpdate[] | undefined,
  stopUpdateSequence?: number,
): StopTime[] {
  if (!stopTimeUpdates || !stopTimes) return stopTimes ?? [];
  const adjustedStopTimes: StopTime[] = [];
  let stopTimeUpdate: StopTimeUpdate | undefined;

  if (Number.isNaN(stopUpdateSequence)) {
    stopTimeUpdate = stopTimeUpdates?.at(-1);
  } else {
    stopTimeUpdate =
      stopTimeUpdates?.find(
        ({ stopSequence }) => stopSequence >= stopUpdateSequence!,
      ) || stopTimeUpdates?.at(-1);
  }

  if (!stopTimeUpdate) {
    return stopTimes;
  }

  for (const time of stopTimes) {
    adjustedStopTimes.push(getAdjustedStopTime(time, stopTimeUpdate));
  }

  return adjustedStopTimes;
}

export function getAdjustedStopTime(
  time: StopTime,
  stopTimeUpdate: StopTimeUpdate,
): StopTime {
  const arrivalTime = getDelayedTime(
    time.arrivalTime,
    stopTimeUpdate?.arrival?.delay,
  );
  const arrivalDelay = stopTimeUpdate.arrival?.delay ?? 0;
  const departureDelay = stopTimeUpdate.departure?.delay ?? 0;

  const departureTime = getDelayedTime(
    time.departureTime,
    stopTimeUpdate?.departure?.delay,
  );

  let { arrivalTimestamp, departureTimestamp } = time;
  if (arrivalTimestamp !== null) {
    arrivalTimestamp = arrivalTimestamp + arrivalDelay;
  }
  if (departureTimestamp !== null) {
    departureTimestamp = departureTimestamp + departureDelay;
  }

  return {
    ...time,
    arrivalTimestamp,
    arrivalTime,
    departureTimestamp,
    departureTime,
  };
}

export function getNextStopTime(stopTimes: StopTime[]): StopTime | undefined {
  return stopTimes.find(
    (stopTime) =>
      stopTime?.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  );
}

export function getStopsToDestination(
  stops: ValidStop[] | undefined,
  stopTimes: StopTime[] | undefined,
  destinationStopId: string,
): ValidStop[] {
  if (!stopTimes || !stops) return stops ?? [];

  const destinationStopIndex = stops.findIndex(
    (stop) => stop.stopId === destinationStopId,
  );
  if (destinationStopIndex !== -1) {
    return stops.slice(0, destinationStopIndex + 1);
  }

  return stops;
}

export function getStopsWithStopTimes(
  stopsById: Map<string, Stop>,
  stopTimes: StopTime[] | undefined,
  destinationStopId: string | null,
): StopAndStopTime[] {
  const stopsWithStopTimes: StopAndStopTime[] = [];

  if (stopTimes?.length && stopsById) {
    for (const stopTime of stopTimes) {
      const stop = stopsById.get(stopTime.stopId);
      if (isValidStop(stop)) {
        stopsWithStopTimes.push({
          stop: stop as ValidStop,
          stopTime,
        });
      }
    }
  }

  if (destinationStopId) {
    const destinationStopIndex = stopsWithStopTimes.findIndex(
      ({ stop }) => stop.stopId === destinationStopId,
    );
    if (destinationStopIndex !== -1) {
      return stopsWithStopTimes.slice(0, destinationStopIndex + 1);
    }
  }

  return stopsWithStopTimes;
}
