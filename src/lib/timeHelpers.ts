import { StopTimeUpdate } from "@/types/realtime";
import { Calendar, Stop, StopTime, Trip } from "@prisma/client";
import { format, getDay } from "date-fns";

// non standard format for input type="datetime"
// 2023-06-01T13:31
const LUXON_DATE_INPUT_TOKENS = "kkkk'-'LL'-'dd'T'T";
import { DateTime, Settings } from "luxon";

Settings.defaultZone = "Europe/Dublin";

export function parseDatetimeLocale(timestring: string) {
  return DateTime.fromISO(timestring);
}

// Parse timestring in format HH:MM:SS exa: 20:07:17
export function stopTimeStringToDate(
  timeString: string,
  referenceDate: string = ""
) {
  const startOfReferenceDate =
    referenceDate && parseDatetimeLocale(referenceDate).startOf("day");

  if (startOfReferenceDate) {
    const startOfDay = DateTime.now().startOf("day");
    const timeOfDay = DateTime.fromSQL(timeString).diff(startOfDay);

    return startOfReferenceDate.plus(timeOfDay);
  }

  return DateTime.fromSQL(timeString);
}

// Return timestring in format HH:MM:SS exa: 20:07:17
export function dateToStopTimeString(dateTime: DateTime) {
  return dateTime.toFormat("HH:mm:ss");
}

export function timeInSecondsToDate(time: string) {
  const startOfDay = DateTime.now().startOf("day");

  return startOfDay.plus({ millisecond: Number(time) * 1000 });
}

export function formatSecondsAsTimeString(time: number | undefined) {
  if (!time) return null;

  const date = DateTime.fromMillis(Number(time) * 1000);
  return dateToStopTimeString(date);
}

export type DayString = keyof Omit<
  Calendar,
  "serviceId" | "startDate" | "endDate"
>;

const dayStrings: DayString[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function getDayString(dateTime: Date) {
  return dayStrings[getDay(dateTime)];
}

export function getCalendarDate(dateTime: Date) {
  return Number(format(dateTime, "yMMdd"));
}

export function initDateTimeValue() {
  return DateTime.now().toFormat(LUXON_DATE_INPUT_TOKENS);
}

// add trip start time instead of new Date()
export function isPastArrivalTime(
  arrivalTime: string,
  referenceDate: string = ""
) {
  const now = DateTime.now();
  const arrivalDate = referenceDate
    ? stopTimeStringToDate(arrivalTime, referenceDate)
    : stopTimeStringToDate(arrivalTime);
  if (!now.hasSame(arrivalDate, "day")) return false;

  return now > arrivalDate;
}

export function getDelayedTime(
  timeString: string | null | undefined,
  delay: number | undefined,
  precise: boolean = false
) {
  if (!timeString || delay === undefined) return null;

  // feed has bad data sometimes delay is number like-1687598071
  // bail if delay is more than half a day
  if (delay > 43200 || delay < -43200) return null;

  const date = stopTimeStringToDate(timeString);

  const delayedDate = date.plus({ seconds: delay });
  const { seconds } = delayedDate.diff(date, "seconds").toObject();

  // ignore any diff less than a minute
  if (!precise && seconds && seconds < 30 && seconds > -30) {
    return null;
  }

  return dateToStopTimeString(delayedDate);
}

// Return valid time duration string in format 19h 11m 32s | 11m 32s | 32s
// https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-time-element:valid-duration-string
export function formatDelay(delayInSeconds: number | undefined) {
  if (!delayInSeconds) return undefined;
  const positiveDelay = Math.abs(delayInSeconds);
  const hours = Math.floor(positiveDelay / 3600);
  const minutes = Math.floor((positiveDelay - hours * 3600) / 60);
  const seconds = positiveDelay - hours * 3600 - minutes * 60;

  if (positiveDelay < 30) {
    return;
  }

  if (positiveDelay < 60) {
    return `${positiveDelay}s`;
  }

  // Less than an hour
  if (positiveDelay < 3600) {
    return `${minutes}m ${seconds}s`;
  }

  return `${hours}h ${minutes}m ${seconds}s`;
}

export const delayStatus = {
  delay: "delay",
  early: "early",
  "on-time": "on-time",
  canceled: "canceled",
} as const;

export function getDelayStatus(
  stopTimeUpdate: StopTimeUpdate | undefined,
  departure = false
) {
  if (!stopTimeUpdate) return "";

  if (stopTimeUpdate.scheduleRelationship === "CANCELED") {
    return delayStatus.canceled;
  }

  let delay: number | undefined;

  if (departure && stopTimeUpdate.departure?.delay) {
    delay = stopTimeUpdate.departure.delay;
  } else if (stopTimeUpdate.arrival?.delay) {
    delay = stopTimeUpdate.arrival.delay;
  }

  if (!delay || (delay > -30 && delay < 30)) return delayStatus["on-time"];

  if (delay > 30) {
    return delayStatus.delay;
  } else {
    return delayStatus.early;
  }
}

export const tripStatus = {
  canceled: "canceled",
  future: "scheduled",
  active: "active",
  boarded: "in transit",
  finished: "completed",
  not: "not in service",
} as const;

// returns empty string on invalid input
export function getTripStatus(
  trip: Trip | undefined,
  stopTimes: StopTime[] | undefined,
  stopTimeUpdate: StopTimeUpdate[] | undefined,
  start: Stop["stopId"] | undefined,
  end: Stop["stopId"] | undefined
) {
  if (!trip || !stopTimes) return "";
  if (!stopTimes.length) return tripStatus.not;

  if (stopTimeUpdate?.at(-1)?.scheduleRelationship === "CANCELED") {
    return tripStatus.canceled;
  }

  const firstStop = stopTimes[0];

  const boardingStop =
    !!start && stopTimes.find((stop) => stop.stopId === start);

  const lastStop =
    stopTimes.find((stop) => stop.stopId === end) ?? stopTimes.at(-1);

  const startTime = firstStop.departureTime ?? firstStop.arrivalTime;
  const boardingTime = boardingStop
    ? boardingStop?.departureTime ?? boardingStop?.arrivalTime
    : undefined;
  const finishTime = lastStop?.arrivalTime;

  const realtime = stopTimeUpdate?.at(-1);
  const delay = (realtime?.arrival?.delay || realtime?.departure?.delay) ?? 0;

  const adjustedStartTime = getDelayedTime(startTime, delay, true);
  const adjustedFinishTime = getDelayedTime(finishTime, delay, true);

  if (!adjustedStartTime || !adjustedFinishTime) {
    return "";
  }

  // if after trip end with delay return return finished
  if (isPastArrivalTime(adjustedFinishTime)) {
    return tripStatus.finished;
  }
  // if after boarding time with delay return boarding
  if (!!boardingTime && isPastArrivalTime(boardingTime)) {
    return tripStatus.boarded;
  }
  // if after trip start time with delay return active
  if (isPastArrivalTime(adjustedStartTime)) {
    return tripStatus.active;
  }
  // else return future scheduled
  return tripStatus.future;
}

export function getDifferenceInSeconds(
  stopTimeOne: string,
  stopTimeTwo: string
) {
  const dateOne = stopTimeStringToDate(stopTimeOne);
  const dateTwo = stopTimeStringToDate(stopTimeTwo);
  const { seconds } = dateTwo.diff(dateOne, "seconds").toObject();

  return seconds ? Math.abs(seconds) : 0;
}

export function getPercentageToArrival(
  beginTime: string,
  destinationTime: string
) {
  let now = DateTime.now();
  const beginDate = stopTimeStringToDate(beginTime);

  if (now < beginDate) {
    now = stopTimeStringToDate(beginTime);
  }

  const totalSeconds = getDifferenceInSeconds(destinationTime, beginTime);
  const arrival = stopTimeStringToDate(destinationTime);
  const secondsToArrival = arrival.diff(now, "seconds").toObject().seconds;

  if (!secondsToArrival || !totalSeconds) return 0;

  if (secondsToArrival > totalSeconds) {
    return 1;
  }

  const percentage =
    secondsToArrival > 0 && totalSeconds > 0
      ? secondsToArrival / totalSeconds
      : 0;

  return percentage;
}
