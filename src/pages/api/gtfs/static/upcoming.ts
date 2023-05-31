import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { Route, StopTime, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { differenceInSeconds, parseISO, startOfDay } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService } from "@/lib/api/static/consts";

export type TripsByStopIdAPIResponse = {
  routes: Route[];
  stopTimes: StopTime[];
  trips: Trip[];
};

// type NumericalString = `${number}`;

const pageCount = 12;

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

  const stopTimes = await prisma.stopTime.findMany({
    skip: Number(page) * pageCount,
    take: 12,
    where: {
      AND: [
        { stopId: stopId },
        { arrivalTimestamp: { gte: departureTimeInSeconds } },
        {
          NOT: {
            trip: {
              calendar: {
                [dayOfWeek]: { equals: scheduledService.isFalse },
              },
            },
          },
          OR: [
            {
              trip: {
                calendar: { calendarDate: { some: { date: dateOfYear } } },
              },
            },
            {
              trip: {
                calendar: { [dayOfWeek]: { equals: scheduledService.isTrue } },
              },
            },
          ],
        },
      ],
    },
    orderBy: { stopSequence: "asc" },
  });

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
