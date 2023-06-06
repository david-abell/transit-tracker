import { prisma } from "@/lib/db";
import camelcaseKeys from "camelcase-keys";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { Calendar, Prisma, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { parseISO } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService, serviceException } from "@/lib/api/static/consts";

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
    return res.end();
  }

  const date = parseISO(dateTime);
  const dayOfWeek = getDayString(date);
  const dateOfYear = getCalendarDate(date);

  // Find all trips on Route where:
  // service is scheduled on selected dateTime
  // or service is added
  // and service is not canceled
  async function findOrderedTrips(routeId: string) {
    const tripList = await prisma.$queryRaw<Trip[]>`
      SELECT
        trips.route_id,
        trips.service_id,
        trips.trip_id,
        trips.trip_headsign,
        trips.trip_short_name,
        trips.direction_id,
        trips.block_id,
        trips.shape_id 
      FROM
        trips 
          LEFT JOIN
            calendar_dates 
            ON trips.service_id = calendar_dates.service_id 
            AND calendar_dates.date = ${dateOfYear} 
          INNER JOIN
            calendar 
            ON trips.service_id = calendar.service_id 
      WHERE
        trips.route_id = ${routeId} 
        AND 
        (
          exception_type IS NULL 
          AND ${calendarDayColumns[dayOfWeek]} = ${scheduledService.isTrue} 
          AND ${dateOfYear} BETWEEN start_date AND end_date 
          OR exception_type =  ${serviceException.added}
        )
      ORDER BY
        trip_id ASC;`;

    return tripList;
  }

  const trips = await findOrderedTrips(routeId);

  if (!trips.length) {
    throw new ApiError(404, "No trips found");
  }

  return res.json(camelcaseKeys(trips));
}

export default withErrorHandler(handler);
