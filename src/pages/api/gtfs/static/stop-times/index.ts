import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { addHours, parseISO, startOfDay, differenceInSeconds } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime, Trip } from "@prisma/client";

import { scheduledService, serviceException } from "@/lib/api/static/consts";

import { StatusCodes } from "http-status-codes";
import { ApiErrorResponse } from "@/lib/FetchHelper";

export type StopTimesApiResponse = {
  stopTimesZero: StopTime[];
  stopTimesOne: StopTime[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopTimesApiResponse | ApiErrorResponse>
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

  const trips = await prisma.trip.findMany({
    where: { routeId: routeId },
  });

  if (!trips.length) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  // Time variables
  const date = parseISO(dateTime);
  const calendarDay = getDayString(date);
  const calendarDate = getCalendarDate(date);
  const startOfDate = startOfDay(date);
  const departureTimeInSeconds = differenceInSeconds(date, startOfDate);
  const maxDepartureTimeInSeconds = differenceInSeconds(
    addHours(date, 3),
    startOfDate
  );

  // Split trips by direction
  const [directionZeroTripsById, directionOneTripsById] =
    splitTripsByDirection(trips);

  // Handle direction zero
  const serviceZeroIds = [...directionZeroTripsById.values()].map(
    ({ serviceId }) => serviceId
  );

  const calendarZeroDates = serviceZeroIds.length
    ? await getCalendarDates(serviceZeroIds)
    : [];

  const servicesZeroAdded = calendarZeroDates
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

  const calendarZero = await getServiceCalendar(
    servicesZeroRemoved,
    serviceZeroIds,
    calendarDay,
    servicesZeroAdded,
    calendarDate
  );

  const stopTimesZero = directionZeroTripsById.size
    ? await getStoptimes(
        directionZeroTripsById,
        calendarZero,
        departureTimeInSeconds,
        maxDepartureTimeInSeconds
      )
    : [];

  // Handle direction one
  const serviceOneIds = [...directionOneTripsById.values()].map(
    ({ serviceId }) => serviceId
  );

  const calendarOneDates = serviceOneIds.length
    ? await getCalendarDates(serviceOneIds)
    : [];

  const servicesOneAdded = calendarOneDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.added
    )
    .map(({ serviceId }) => serviceId);

  const servicesOneRemoved = calendarOneDates
    .filter(
      ({ date, exceptionType }) =>
        date === calendarDate && exceptionType === serviceException.removed
    )
    .map(({ serviceId }) => serviceId);

  const calendarOne = await getServiceCalendar(
    servicesOneRemoved,
    serviceOneIds,
    calendarDay,
    servicesOneAdded,
    calendarDate
  );

  const stopTimesOne = directionOneTripsById.size
    ? await getStoptimes(
        directionOneTripsById,
        calendarOne,
        departureTimeInSeconds,
        maxDepartureTimeInSeconds
      )
    : [];

  return res.status(StatusCodes.OK).json({
    stopTimesZero,
    stopTimesOne,
  });
}

export default withErrorHandler(handler);

function splitTripsByDirection(
  trips: Trip[]
): [Map<string, Trip>, Map<string, Trip>] {
  return trips.reduce<[Map<Trip["tripId"], Trip>, Map<string, Trip>]>(
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
  );
}

async function getCalendarDates(serviceIds: string[]) {
  return await prisma.calendarDate.findMany({
    where: { serviceId: { in: serviceIds } },
  });
}

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
  directionTripsById: Map<string, Trip>,
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
            in: [...directionTripsById.values()].map(({ tripId }) => tripId),
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
    orderBy: { stopSequence: "asc" },
  });
}
