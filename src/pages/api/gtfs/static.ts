import { prisma } from "@/lib/db";
import { Calendar, Prisma, Stop, StopTime, Trip } from "@prisma/client";

import type { NextApiRequest, NextApiResponse } from "next";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";

import { addHours, parseISO, startOfDay, differenceInSeconds } from "date-fns";
import {
  getCalendarDate,
  getDayString,
  initDateTimeValue,
} from "@/lib/timeHelpers";

import { scheduledService, serviceException } from "@/lib/api/static/consts";
import camelcaseKeys from "camelcase-keys";

// create safe SQL column names for raw SQL version
// from https://github.com/prisma/prisma/issues/9765#issuecomment-1528729000
type ColumnName<T> = string & keyof T;
export const fieldName = <T>(name: ColumnName<T>) => Prisma.sql([`"${name}"`]);

const monday = fieldName<Calendar>("monday");
const tuesday = fieldName<Calendar>("tuesday");
const wednesday = fieldName<Calendar>("wednesday");
const thursday = fieldName<Calendar>("thursday");
const friday = fieldName<Calendar>("friday");
const saturday = fieldName<Calendar>("saturday");
const sunday = fieldName<Calendar>("sunday");

export const calendarDayColumns = {
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday,
};

export type StaticAPIResponse = { trips: Trip[]; stopTimes: StopTime[] };
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaticAPIResponse>
) {
  const { routeId, dateTime } = req.query;
  if (
    !routeId ||
    typeof routeId !== "string" ||
    !dateTime ||
    typeof dateTime !== "string"
  ) {
    return res.end();
  }

  // Time variables
  const date = parseISO(dateTime);
  const dayOfWeek = getDayString(date);
  const calendarDate = getCalendarDate(date);
  const startOfDate = startOfDay(date);
  const departureDifferenceInSeconds = differenceInSeconds(date, startOfDate);
  // Show trips in last 5 minutes
  const departureOffset = departureDifferenceInSeconds > 60 * 5 ? 60 * 5 : 0;
  const departureTimeInSeconds = departureDifferenceInSeconds - departureOffset;

  const maxDepartureTimeInSeconds = differenceInSeconds(
    addHours(date, 3),
    startOfDate
  );

  const tripList = await prisma.$queryRaw<Trip[]>`
  SELECT
    trip.route_id,
    trip.service_id,
    trip.trip_id,
    trip.trip_headsign,
    trip.trip_short_name,
    trip.direction_id,
    trip.block_id,
    trip.shape_id 
  FROM
    trip 
      LEFT JOIN
        calendar_date 
        ON trip.service_id = calendar_date.service_id 
        AND calendar_date.date = ${calendarDate} 
      INNER JOIN
        calendar 
        ON trip.service_id = calendar.service_id 
  WHERE
    trip.route_id = ${routeId} 
    AND 
    (
      exception_type IS NULL 
      AND ${calendarDayColumns[dayOfWeek]} = ${scheduledService.isTrue} 
      AND ${calendarDate} BETWEEN start_date AND end_date 
      OR exception_type =  ${serviceException.added}
    )
  ORDER BY
    trip_id ASC;`;

  if (!tripList.length) {
    throw new ApiError(404, "No trips found");
  }

  const trips = camelcaseKeys(tripList);

  const serviceIds = trips.map(({ serviceId }) => serviceId);

  if (!serviceIds.length) {
    throw new ApiError(404, "No services found");
  }

  const calendarDates = await prisma.calendarDate.findMany({
    where: { serviceId: { in: serviceIds } },
  });

  const servicesAdded = calendarDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.added
    )
    .map(({ serviceId }) => serviceId);

  const servicesRemoved = calendarDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.removed
    )
    .map(({ serviceId }) => serviceId);

  const calendar = await getServiceCalendar(
    servicesRemoved,
    serviceIds,
    dayOfWeek,
    servicesAdded,
    calendarDate
  );

  const stopTimes = await getStoptimes(
    trips,
    calendar,
    departureTimeInSeconds,
    maxDepartureTimeInSeconds
  );

  return res.json({ trips, stopTimes });
}

export default withErrorHandler(handler);

async function getServiceCalendar(
  servicesRemoved: string[],
  serviceIds: string[] | undefined,
  calendarDay: string,
  servicesAdded: string[],
  calendarDate: number
) {
  return await prisma.calendar.findMany({
    select: { serviceId: true },
    where: {
      NOT: { serviceId: { in: servicesRemoved } },
      AND: [
        { serviceId: { in: serviceIds } },
        {
          OR: [
            { [calendarDay]: { equals: scheduledService.isTrue } },
            { serviceId: { in: servicesAdded } },
          ],
        },
        { startDate: { lte: calendarDate } },
        { endDate: { gte: calendarDate } },
      ],
    },
  });
}

async function getStoptimes(
  trips: Trip[],
  serviceCalendar: { serviceId: string }[],
  departureTimeInSeconds: number,
  maxDepartureTimeInSeconds: number
) {
  return await prisma.stopTime.findMany({
    // take: 20,
    where: {
      AND: [
        {
          tripId: {
            in: trips.map(({ tripId }) => tripId),
          },
        },
        {
          departureTimestamp: {
            gte: departureTimeInSeconds,
            lte: maxDepartureTimeInSeconds,
          },
        },
        {
          trip: {
            serviceId: {
              in: serviceCalendar.map(({ serviceId }) => serviceId),
            },
          },
        },
      ],
    },
    orderBy: [{ arrivalTimestamp: "asc" }, { stopSequence: "asc" }],
  });
}
