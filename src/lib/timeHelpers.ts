import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Calendar, Stop, StopTime, Trip } from "@prisma/client";
import { format, getDay } from "date-fns";

// non standard format for input type="datetime"
// 2023-06-01T13:31
const LUXON_DATE_INPUT_TOKENS = "kkkk'-'LL'-'dd'T'TT";
import { DateTime, Settings, type DateTimeMaybeValid } from "luxon";

Settings.defaultZone = "Europe/Dublin";

export function parseDatetimeLocale(timestring: string) {
  return DateTime.fromISO(timestring);
}

// Parse timestring in format HH:MM:SS exa: 20:07:17
export function stopTimeStringToDate(
  timeString: string,
  referenceDate: string = "",
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

export function hasSameDay(timestring: string) {
  return DateTime.now().hasSame(parseDatetimeLocale(timestring), "day");
}

// add trip start time instead of new Date()
export function isPastArrivalTime(
  arrivalTime: string,
  referenceDate: string = "",
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
) {
  if (!timeString || delay === undefined) return null;

  // feed has bad data sometimes delay is number like-1687598071
  // bail if delay is more than half a day
  if (delay > 43200 || delay < -43200) return null;

  const date = stopTimeStringToDate(timeString);

  const delayedDate = date.plus({ seconds: delay });

  return dateToStopTimeString(delayedDate);
}

// Return valid time duration string in format 19h 11m 32s | 11m 32s | 32s
// https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-time-element:valid-duration-string
export function formatDelayAsDuration(
  delayInSeconds: number | undefined,
  exact = false,
) {
  if (!delayInSeconds) return undefined;
  const positiveDelay = Math.round(Math.abs(delayInSeconds));
  const hours = Math.floor(positiveDelay / 3600);
  const minutes = Math.floor((positiveDelay - hours * 3600) / 60);
  const seconds = positiveDelay - hours * 3600 - minutes * 60;

  if (!exact && positiveDelay < 30) {
    return;
  }

  if (positiveDelay < 60) {
    return `${positiveDelay}s`;
  }

  const hourString = `${hours}h `.padStart(2, "0");
  const minuteString = `${minutes}m `.padStart(2, "0");
  const secondsString = seconds !== 0 ? `${seconds}s`.padStart(2, "0") : "";
  // Less than an hour
  if (positiveDelay < 3600) {
    return `${minuteString}${secondsString}`;
  }

  return `${hourString}${minuteString}${secondsString}`;
}

export function formatReadableDelay(delayInSeconds: number | undefined) {
  if (!delayInSeconds) return undefined;
  const positiveDelay = Math.round(Math.abs(delayInSeconds));
  const hours = Math.floor(positiveDelay / 3600);
  const minutes = Math.floor((positiveDelay - hours * 3600) / 60);
  const seconds = positiveDelay - hours * 3600 - minutes * 60;

  if (positiveDelay < 60) {
    return `${positiveDelay}s`;
  }

  const minuteString = minutes !== 0 ? `${minutes}m ` : "";
  const secondsString = seconds !== 0 ? `${seconds}s` : "";
  // Less than an hour
  if (positiveDelay < 3600) {
    return `${minuteString}${secondsString}`;
  }

  return `${hours}h ${minuteString}`;
}

export const delayStatus = {
  late: "late",
  early: "early",
  "on-time": "on-time",
  canceled: "canceled",
} as const;

export function getDelayStatus(
  stopTimeUpdate: StopTimeUpdate | undefined,
  departure = false,
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

  if (!delay || delay === 0) return delayStatus["on-time"];

  if (delay > 0) {
    return delayStatus.late;
  } else {
    return delayStatus.early;
  }
}

export function getDifferenceInSeconds(
  stopTimeOne: string,
  stopTimeTwo?: string,
) {
  const dateOne = stopTimeStringToDate(stopTimeOne);
  const dateTwo = stopTimeTwo
    ? stopTimeStringToDate(stopTimeTwo)
    : DateTime.now();
  const { seconds } = dateTwo.diff(dateOne, "seconds").toObject();

  return seconds ? Math.abs(seconds) : 0;
}

export function timeSinceLastVehicleUpdate(timestamp: string) {
  if (!timestamp) return "";

  const now = DateTime.now();
  const updateTime = DateTime.fromSeconds(Number(timestamp));
  const { seconds } = updateTime.diff(now, "seconds").toObject();

  return formatReadableDelay(seconds) ?? "";
}

export function getDelayedTimeFromTripUpdate(
  stopTime?: StopTime,
  tripUpdate?: TripUpdate,
) {
  if (!stopTime || !stopTime.arrivalTime || !stopTime.stopSequence) {
    return null;
  }

  const closestStopUpdate =
    tripUpdate?.stopTimeUpdate?.find(
      ({ stopSequence: realtimeSequence }) =>
        stopTime.stopSequence && realtimeSequence >= stopTime.stopSequence,
      // && scheduleRelationship !== "SKIPPED"
    ) || tripUpdate?.stopTimeUpdate?.at(-1);

  const { arrival, departure } = closestStopUpdate || {};

  const delayedArrivalTime = getDelayedTime(
    stopTime.arrivalTime,
    arrival?.delay || departure?.delay,
  );
  return delayedArrivalTime;
}

export function getPercentageToArrival(
  beginTime: string,
  destinationTime: string,
) {
  let now: DateTimeMaybeValid = DateTime.now();
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
