import { StopAndStopTime } from "@/components/DestinationSelect";
import { ValidStop } from "@/components/Map/MapContentLayer";
import { StopTimeUpdate } from "@/types/realtime";
import { Stop, StopTime } from "@prisma/client";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { getDelayedTime } from "./timeHelpers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isValidStop(stop: Stop | undefined) {
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
    if (!stop || stop?.stopLat == null || stop?.stopLon == null) continue;
    orderedStops.push(stop as ValidStop);
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
  let { arrivalTimestamp } = time;
  if (!Number.isNaN(time.arrivalTimestamp)) {
    arrivalTimestamp = arrivalTimestamp! + stopTimeUpdate.arrival?.delay!;
  }
  if (arrivalTime && !Number.isNaN(time.arrivalTimestamp)) {
    return { ...time, arrivalTimestamp, arrivalTime };
  } else {
    return time;
  }
}
