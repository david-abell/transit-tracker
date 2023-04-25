import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { addHours, parseISO } from "date-fns";
import {
  dateToStopTimeString,
  getCalendarDate,
  getDayString,
  stopTimeStringToDate,
} from "@/lib/timeHelpers";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
  const { routeId, departureTime, utc } = req.query;

  if (
    !routeId ||
    typeof routeId !== "string" ||
    !utc ||
    typeof utc !== "string"
  ) {
    return res.end();
  }
  let date = parseISO(utc);
  let calendarDay = getDayString(date);
  let calendarDate = getCalendarDate(date);

  console.log(date, calendarDay);

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

  console.log("calendar:", calendar, "calendarDate:", calendarDate);

  const maxDepartureTime =
    departureTime &&
    dateToStopTimeString(
      addHours(stopTimeStringToDate(departureTime as string), 1)
    );

  const stopTimes = await prisma.stopTime.findMany({
    // take: 20,
    where: {
      AND: [
        { tripId: { in: trips.map(({ tripId }) => tripId) } },
        {
          departureTime: {
            gte: departureTime as string,
            lte: maxDepartureTime,
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

  console.log(stopTimes.length);

  if (!stopTimes.length) {
    throw new ApiError(404, "No stop times found");
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
