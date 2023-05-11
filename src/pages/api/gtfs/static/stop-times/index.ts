import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { addHours, parseISO, startOfDay, differenceInSeconds } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import { scheduledService, serviceException } from "@/lib/api/static/consts";

export type StopTimesApiResponse = {
  stopTimesZero: StopTime[];
  stopTimesOne: StopTime[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopTimesApiResponse>
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
  const calendarDay = getDayString(date);
  const calendarDate = getCalendarDate(date);

  const trips = await prisma.trip.findMany({
    where: { routeId: routeId },
  });

  const [directionZeroTripsById, directionOneTripsById] = trips?.length
    ? trips.reduce<[Map<Trip["tripId"], Trip>, Map<string, Trip>]>(
        (acc, trip) => {
          const { directionId } = trip;
          let [directionZero, directionOne] = acc;

          if (directionId === 0) {
            directionZero.set(trip.tripId, trip);
          } else {
            directionOne.set(trip.tripId, trip);
          }
          return acc;
        },
        [new Map(), new Map()]
      )
    : [];

  if (!trips.length) {
    throw new ApiError(400, "Invalid route Id");
  }

  const serviceZeroIds = directionZeroTripsById
    ? [...directionZeroTripsById.values()].map(({ serviceId }) => serviceId)
    : undefined;
  const serviceOneIds = directionOneTripsById
    ? [...directionOneTripsById.values()].map(({ serviceId }) => serviceId)
    : undefined;

  const calendarZeroDates = await prisma.calendarDate.findMany({
    where: { serviceId: { in: serviceZeroIds } },
  });
  const calendarOneDates = await prisma.calendarDate.findMany({
    where: { serviceId: { in: serviceOneIds } },
  });

  const servicesZeroAdded = calendarZeroDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.added
    )
    .map(({ serviceId }) => serviceId);

  const servicesOneAdded = calendarOneDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.added
    )
    .map(({ serviceId }) => serviceId);

  const servicesZeroRemoved = calendarZeroDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.removed
    )
    .map(({ serviceId }) => serviceId);
  const servicesOneRemoved = calendarOneDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.removed
    )
    .map(({ serviceId }) => serviceId);

  const calendarZero = await prisma.calendar.findMany({
    select: { serviceId: true },
    where: {
      NOT: { serviceId: { in: servicesZeroRemoved } },
      AND: [
        { serviceId: { in: serviceZeroIds } },
        {
          OR: [
            { [calendarDay]: { equals: scheduledService.isTrue } },
            { serviceId: { in: servicesZeroAdded } },
          ],
        },
        { startDate: { lte: calendarDate } },
        { endDate: { gte: calendarDate } },
      ],
    },
  });

  const calendarOne = await prisma.calendar.findMany({
    select: { serviceId: true },
    where: {
      NOT: { serviceId: { in: servicesOneRemoved } },
      AND: [
        { serviceId: { in: serviceOneIds } },
        {
          OR: [
            { [calendarDay]: { equals: scheduledService.isTrue } },
            { serviceId: { in: servicesOneAdded } },
          ],
        },
        { startDate: { lte: calendarDate } },
        { endDate: { gte: calendarDate } },
      ],
    },
  });

  const startOfDate = startOfDay(date);
  const departureTimeInSeconds = differenceInSeconds(date, startOfDate);
  const maxDepartureTimeInSeconds = differenceInSeconds(
    addHours(date, 3),
    startOfDate
  );

  let stopTimesZero: StopTime[] = [];

  if (directionZeroTripsById) {
    stopTimesZero = await prisma.stopTime.findMany({
      // take: 20,
      where: {
        AND: [
          {
            tripId: {
              in: [...directionZeroTripsById.values()].map(
                ({ tripId }) => tripId
              ),
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
                in: calendarZero.map(({ serviceId }) => serviceId),
              },
            },
          },
        ],
      },
      orderBy: { stopSequence: "asc" },
    });
  }

  let stopTimesOne: StopTime[] = [];

  if (directionOneTripsById) {
    stopTimesOne = await prisma.stopTime.findMany({
      // take: 20,
      where: {
        AND: [
          {
            tripId: {
              in: [...directionOneTripsById.values()].map(
                ({ tripId }) => tripId
              ),
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
              serviceId: { in: calendarOne.map(({ serviceId }) => serviceId) },
            },
          },
        ],
      },
      orderBy: { stopSequence: "asc" },
    });
  }

  return res.json({
    stopTimesZero,
    stopTimesOne,
  });
}

export default withErrorHandler(handler);
