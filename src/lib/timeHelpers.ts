import { Calendar } from "@prisma/client";
import { format, parse, getDay } from "date-fns";

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
