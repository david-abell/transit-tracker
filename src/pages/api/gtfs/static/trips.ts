import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { parseISO } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService } from "@/lib/api/static/consts";

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

  const trips = await prisma.trip.findMany({
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

  if (!trips.length) {
    throw new ApiError(404, "No trips found");
  }

  return res.json(trips);
}

export default withErrorHandler(handler);
