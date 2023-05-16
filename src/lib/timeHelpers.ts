import { Calendar } from "@prisma/client";
import { format, parse, getDay, compareAsc, addSeconds } from "date-fns";

export function stopTimeStringToDate(timeString: string) {
  return parse(timeString, "H:mm:ss", new Date());
}

export function dateToStopTimeString(date: Date) {
  return format(date, "H:mm:ss");
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
  return format(new Date(), `yyyy-MM-dd\'T\'HH:mm`);
}

// add trip start time instead of new Date()
export function isPastArrivalTime(arrivalTime: string) {
  const comparedDate = compareAsc(
    new Date(),
    stopTimeStringToDate(arrivalTime)
  );

  return comparedDate === 1;
}

export function getDelayedTime(
  timeString: string | null,
  delay: number | undefined
) {
  if (!timeString || !delay) return "";
  const date = stopTimeStringToDate(timeString);
  const delayedDate = addSeconds(date, delay);

  return dateToStopTimeString(delayedDate);
}
