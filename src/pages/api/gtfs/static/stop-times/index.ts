import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { addHours, parseISO, startOfDay, differenceInSeconds } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
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
  const calendarDay = getDayString(date);
  const calendarDate = getCalendarDate(date);

  const trips = await prisma.trip.findMany({
    where: { routeId: routeId },
  });

  if (!trips.length) {
    throw new ApiError(400, "Invalid route Id");
  }

  const calendar = await prisma.calendar.findMany({
    where: {
      AND: [
        { serviceId: { in: trips.map(({ serviceId }) => serviceId) } },
        { [calendarDay]: { equals: 1 } },
        { startDate: { lte: calendarDate } },
        { endDate: { gte: calendarDate } },
      ],
    },
  });

  const startOfDate = startOfDay(date);
  const departureTimeInSeconds = differenceInSeconds(date, startOfDate);
  const maxDepartureTimeInSeconds = differenceInSeconds(
    addHours(date, 1),
    startOfDate
  );

  const stopTimes = await prisma.stopTime.findMany({
    // take: 20,
    where: {
      AND: [
        { tripId: { in: trips.map(({ tripId }) => tripId) } },
        {
          departureTimestamp: {
            gte: departureTimeInSeconds,
            lte: maxDepartureTimeInSeconds,
          },
        },
        {
          trip: {
            serviceId: { in: calendar.map(({ serviceId }) => serviceId) },
          },
        },
      ],
    },
    orderBy: { departureTime: "asc" },
  });

  if (!stopTimes.length) {
    throw new ApiError(404, "No stop times found");
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
