import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { Route, StopTime, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { differenceInSeconds, parseISO, startOfDay } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService, serviceException } from "@/lib/api/static/consts";
import { calendarDayColumns } from "./trips";
import camelcaseKeys from "camelcase-keys";

export type TripsByStopIdAPIResponse = {
  routes: Route[];
  stopTimes: StopTime[];
  trips: Trip[];
};

// type NumericalString = `${number}`;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripsByStopIdAPIResponse>
) {
  const { dateTime, stopId, page } = req.query;
  if (typeof dateTime !== "string" || typeof stopId !== "string") {
    return res.end();
  }

  if (Number.isNaN(Number(page))) {
    throw new ApiError(500, "invalid page requested");
  }

  const date = parseISO(dateTime);
  const dayOfWeek = getDayString(date);
  const dateOfYear = getCalendarDate(date);
  const startOfDate = startOfDay(date);
  const departureTimeInSeconds = differenceInSeconds(date, startOfDate);

  const stopTimeResponse = await prisma.$queryRaw<StopTime[]>`
    SELECT t.trip_id,
           t.arrival_time,
           t.arrival_timestamp,
           t.departure_time,
           t.departure_timestamp,
           t.stop_id,
           t.stop_sequence,
           t.stop_headsign,
           t.pickup_type,
           t.drop_off_type,
           t.timepoint
    FROM
        stop_times AS t
            JOIN trips ON trips.trip_id = t.trip_id
            JOIN calendar AS c ON c.service_id = trips.service_id                     
          left JOIN
            calendar_dates 
            ON trips.service_id = calendar_dates.service_id 
            AND calendar_dates.date = ${dateOfYear}
    WHERE
        t.stop_id = ${stopId} AND
        t.arrival_timestamp > ${departureTimeInSeconds}
      AND 
        (
          exception_type IS NULL
          AND ${calendarDayColumns[dayOfWeek]} = ${scheduledService.isTrue} 
          AND ${dateOfYear} BETWEEN c.start_date AND c.end_date 
          OR exception_type =  ${serviceException.added}
        )
    ORDER BY t.arrival_timestamp ASC;
  `;

  const stopTimes: StopTime[] = camelcaseKeys(stopTimeResponse);

  const trips = await prisma.trip.findMany({
    where: {
      tripId: { in: stopTimes.map(({ tripId }) => tripId) },
    },
    orderBy: { tripId: "asc" },
  });

  const routes = await prisma.route.findMany({
    where: {
      routeId: { in: trips.map(({ routeId }) => routeId) },
    },
    orderBy: { routeId: "asc" },
  });

  return res.json({ stopTimes, trips, routes });
}

export default withErrorHandler(handler);
