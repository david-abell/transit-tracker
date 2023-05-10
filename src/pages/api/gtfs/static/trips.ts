import { prisma } from "@/lib/db";
import camelcaseKeys from "camelcase-keys";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { Calendar, Prisma, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { addHours, differenceInSeconds, parseISO, startOfDay } from "date-fns";
import { DayString, getCalendarDate, getDayString } from "@/lib/timeHelpers";
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

  const startOfDate = startOfDay(date);
  const departureTimeInSeconds = differenceInSeconds(date, startOfDate);
  // const maxDepartureTimeInSeconds = differenceInSeconds(
  //   addHours(date, 1),
  //   startOfDate
  // );

  // Find all trips on Route where:
  // service is scheduled on selected dateTime
  // or service is added
  // and service is not canceled

  const trips = await prisma.trip.findMany({
    // take: 6,
    where: {
      AND: [
        { route: { routeId: routeId } },
        {
          NOT: {
            calendar: {
              [dayOfWeek]: { equals: scheduledService.isFalse },
            },
          },
          OR: [
            {
              calendar: { calendarDate: { some: { date: dateOfYear } } },
            },
            {
              calendar: { [dayOfWeek]: { equals: scheduledService.isTrue } },
            },
          ],
        },
      ],
    },
    orderBy: {},
  });

  // raw SQL version

  // async function findOrderedTrips(routeId: string, cursor?: string) {
  //   // const limit = 15;
  //   // const where = cursor
  //   //   ? Prisma.sql`AND last."sentDateTime" <= ${new Date(cursor)}`
  //   //   : Prisma.empty;
  //   // console.log("routeId:", routeId);

  //   const tripList = await prisma.$queryRaw<Trip[]>`
  //     SELECT DISTINCT
  //       t.route_id,
  //       t.service_id,
  //       t.trip_headsign,
  //       t.trip_short_name,
  //       t.direction_id,
  //       t.shape_id,
  //       t.trip_id
  //     FROM trips as t
  //     INNER JOIN (SELECT trip_id, arrival_time, departure_time FROM stop_times) stop_times
  //         ON stop_times.trip_id = t.trip_id
  //     INNER JOIN (SELECT ${
  //       calendarDayColumns[dayOfWeek]
  //     }, service_id, start_date, end_date FROM calendar) calendar
  //         ON calendar.service_id=t.service_id
  //         AND ${calendarDayColumns[dayOfWeek]}=1
  //         AND ${dateOfYear} BETWEEN start_date AND end_date
  //     WHERE t.route_id = ${routeId}
  //     AND (t.service_id NOT IN (
  //         SELECT service_id FROM calendar_dates
  //             WHERE calendar_dates.service_id=t.service_id
  //                 AND calendar_dates.exception_type=${serviceException.removed}
  //                 AND calendar_dates.date=${dateOfYear}
  //         )
  //         OR t.service_id IN (
  //             SELECT service_id FROM calendar_dates
  //                 WHERE calendar_dates.service_id=t.service_id
  //                 AND calendar_dates.exception_type=${1}
  //                 AND calendar_dates.date=${dateOfYear}
  //         ))
  //   `;

  //   return tripList;
  // }
  // this clause excludes valid partial trips
  // AND stop_times.departure_time >= ${departureTimeInSeconds};

  // const trips = await findOrderedTrips(routeId);

  if (!trips.length) {
    throw new ApiError(404, "No trips found");
  }

  return res.json(camelcaseKeys(trips));
}

export default withErrorHandler(handler);
