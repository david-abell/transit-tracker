import { Calendar } from "@prisma/client";
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
  if (!timeString || !delay) return null;

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

export function formatDelay(delayInSeconds: number | undefined) {
  if (!delayInSeconds) return undefined;
  // Less than an hour early
  if (delayInSeconds < -3600) {
    // const seconds = Math.abs(delayInSeconds % 60);
    // const minutes = (delayInSeconds + seconds) / 60;
    // return `${minutes}:${String(seconds).padStart(2, String(0))}`;
    return undefined;
  }
  if (delayInSeconds > -3600 && delayInSeconds < -60) {
    const seconds = Math.abs(delayInSeconds % 60);
    const minutes = (delayInSeconds + seconds) / 60;
    return `${minutes}:${String(seconds).padStart(2, String(0))}`;
  }
  // less than a minute early or late
  if (delayInSeconds < 60) {
    return `${delayInSeconds} s`;
  }
  // Less than an hour
  if (delayInSeconds < 3600) {
    const seconds = delayInSeconds % 60;
    const minutes = (delayInSeconds - seconds) / 60;
    return `${minutes}:${String(seconds).padStart(2, String(0))}`;
  }

  return ">1hr";
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
