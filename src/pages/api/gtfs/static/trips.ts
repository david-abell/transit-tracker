import { prisma } from "@/lib/db";
import camelcaseKeys from "camelcase-keys";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { Calendar, Prisma, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { parseISO } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService, serviceException } from "@/lib/api/static/consts";

import { StatusCodes } from "http-status-codes";

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

export type TripAPIResponse = Trip[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripAPIResponse>
) {
  const { routeId, dateTime } = req.query;
  if (
    !routeId ||
    typeof routeId !== "string" ||
    !dateTime ||
    typeof dateTime !== "string"
  ) {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const trips = await findOrderedTrips(routeId, dateTime);

  if (!trips.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  return res.status(StatusCodes.OK).json(camelcaseKeys(trips));
}

// Find all trips on Route where:
// service is scheduled on selected dateTime
// or service is added
// and service is not canceled
async function findOrderedTrips(routeId: string, dateTime: string) {
  const date = parseISO(dateTime);
  const dayOfWeek = getDayString(date);
  const dateOfYear = getCalendarDate(date);
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
            AND calendar_date.date = ${dateOfYear} 
          INNER JOIN
            calendar 
            ON trip.service_id = calendar.service_id 
      WHERE
        trip.route_id = ${routeId} 
        AND 
        (
          exception_type IS NULL 
          AND ${calendarDayColumns[dayOfWeek]} = ${scheduledService.isTrue} 
          AND ${dateOfYear} BETWEEN start_date AND end_date 
          OR exception_type =  ${serviceException.added}
        )
      GROUP BY block_id
      HAVING count(block_id) > 1
      ORDER BY
        trip_id ASC;`;

  return tripList;
}

export default withErrorHandler(handler);
