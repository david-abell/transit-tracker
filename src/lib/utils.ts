import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDelayedTime, isPastArrivalTime } from "./timeHelpers";
import { StopAndStopTime, ValidStop } from "@/types/gtfsDerived";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidStop(stop: Stop | undefined) {
  return stop
    ? Object.values(stop).every((v): v is string | number => v !== null)
    : false;
}

export function filterValidStops(stops: Stop[] | undefined): ValidStop[] {
  if (!stops) return [];
  return stops.filter((s): s is ValidStop => isValidStop(s));
}

export function getOrderedStops(
  stopTimes: StopTime[] | undefined,
  stopsById: Map<string, Stop>,
): ValidStop[] {
  if (!stopTimes?.length) {
    const stops = filterValidStops([...stopsById.values()]);
    stops.sort((a, b) => {
      if (a.stopName && b.stopName) {
        return a.stopName < b.stopName ? -1 : 1;
      } else {
        return a.stopId < b.stopId ? -1 : 1;
      }
    });
    return stops;
  }
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
): StopTime[] {
  if (!stopTimeUpdates?.length || !stopTimes) return stopTimes ?? [];
  const adjustedStopTimes: StopTime[] = [];

  for (const time of stopTimes) {
    const stopTimeUpdate = stopTimeUpdates.findLast(
      ({ stopSequence }) => stopSequence <= time.stopSequence,
    );
    if (stopTimeUpdate) {
      adjustedStopTimes.push(getAdjustedStopTime(time, stopTimeUpdate));
    } else {
      adjustedStopTimes.push(time);
    }
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

  let adjustedArrivalTimestamp = time.arrivalTimestamp;
  let adjustedDepartureTimestamp = time.departureTimestamp;

  if (
    adjustedArrivalTimestamp === null ||
    adjustedDepartureTimestamp === null
  ) {
    if (adjustedArrivalTimestamp && adjustedDepartureTimestamp === null) {
      adjustedDepartureTimestamp = adjustedArrivalTimestamp;
    } else {
      adjustedArrivalTimestamp = adjustedDepartureTimestamp;
    }
  }
  if (
    adjustedArrivalTimestamp !== null &&
    adjustedDepartureTimestamp !== null
  ) {
    adjustedArrivalTimestamp = adjustedArrivalTimestamp + arrivalDelay;
    adjustedDepartureTimestamp = adjustedDepartureTimestamp + departureDelay;

    if (adjustedDepartureTimestamp < adjustedArrivalTimestamp) {
      adjustedDepartureTimestamp = adjustedArrivalTimestamp;
    }
  }

  return {
    ...time,
    arrivalTimestamp: adjustedArrivalTimestamp,
    arrivalTime,
    departureTimestamp: adjustedDepartureTimestamp,
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
