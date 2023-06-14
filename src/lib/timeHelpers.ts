import { Calendar } from "@prisma/client";
import {
  format,
  parse,
  getDay,
  compareAsc,
  addSeconds,
  differenceInSeconds,
} from "date-fns";

// non standard format for input type="datetime"
// 2023-06-01T13:31
const LUXON_DATE_INPUT_TOKENS = "kkkk'-'LL'-'dd'T'T";
import { DateTime, Duration, Settings } from "luxon";

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
  return dateTime.toFormat("H:mm:ss");
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
  delay: number | undefined
) {
  if (!timeString) return "";
  if (!delay) return timeString;
  const date = stopTimeStringToDate(timeString);
  const delayDuration = Duration.fromObject({ seconds: delay });
  const delayedDate = date.plus(delayDuration);
  return dateToStopTimeString(delayedDate);
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
  const totalSeconds = getDifferenceInSeconds(destinationTime, beginTime);
  const now = DateTime.now();
  const arrival = stopTimeStringToDate(destinationTime);
  const secondsToArrival = arrival.diff(now, "seconds").toObject().seconds;

  if (!secondsToArrival || !totalSeconds) return 0;
  if (secondsToArrival > totalSeconds) return 1;

  const percentage =
    secondsToArrival > 0 && totalSeconds > 0
      ? secondsToArrival / totalSeconds
      : 0;

  return percentage;
}
