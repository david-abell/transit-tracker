import { Calendar } from "@prisma/client";
import {
  format,
  parse,
  getDay,
  compareAsc,
  addSeconds,
  differenceInSeconds,
} from "date-fns";

import { DateTime, Duration, Settings } from "luxon";

Settings.defaultZone = "Europe/Dublin";

export function stopTimeStringToDate(timeString: string) {
  return DateTime.fromISO(timeString);
}

export function dateToStopTimeString(dateTime: DateTime) {
  return dateTime.toLocaleString(DateTime.TIME_24_WITH_SECONDS);
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
  // non standard format for input type="datetime"
  // 2023-06-01T13:31
  return DateTime.now().toFormat("kkkk'-'MM'-'dd'T'T");
}

// add trip start time instead of new Date()
export function isPastArrivalTime(arrivalTime: string) {
  const now = DateTime.now();
  return now > stopTimeStringToDate(arrivalTime);
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
