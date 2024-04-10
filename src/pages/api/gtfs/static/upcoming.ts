import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import { Route, StopTime, Trip } from "@prisma/client";
import { differenceInSeconds, parseISO, startOfDay } from "date-fns";
import { getCalendarDate, getDayString } from "@/lib/timeHelpers";
import { scheduledService, serviceException } from "@/lib/api/static/consts";
import { calendarDayColumns } from "./trips";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";

type TripFields = Pick<Trip, "routeId" | "tripHeadsign" | "blockId">;
type RouteFields = Pick<Route, "routeShortName" | "routeLongName">;
type StopTimeFields = Pick<
  StopTime,
  | "tripId"
  | "arrivalTime"
  | "arrivalTimestamp"
  | "departureTime"
  | "departureTimestamp"
  | "stopSequence"
>;
type UpcomingTrip = TripFields & RouteFields & StopTimeFields;

export type UpcomingTripsAPIResponse = {
  upcomingTrips: UpcomingTrip[];
};

// type NumericalString = `${number}`;

const DEPARTURE_LOOKBACK_SECONDS = 60 * 35;

const handler: ApiHandler<UpcomingTripsAPIResponse> = async (req, res) => {
  const { dateTime, stopId, page } = req.query;
  if (typeof dateTime !== "string" || typeof stopId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  if (Number.isNaN(Number(page))) {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const date = parseISO(dateTime);
  const dayOfWeek = getDayString(date);
  const dateOfYear = getCalendarDate(date);
  const startOfDate = startOfDay(date);
  const departureDifferenceInSeconds = differenceInSeconds(date, startOfDate);
  // Show trips in last 5 minutes
  const departureOffset =
    departureDifferenceInSeconds > DEPARTURE_LOOKBACK_SECONDS
      ? DEPARTURE_LOOKBACK_SECONDS
      : 0;
  const departureTimeInSeconds = departureDifferenceInSeconds - departureOffset;

  const stopTimeResponse = await prisma.$queryRaw<UpcomingTrip[]>`
    SELECT ST.TRIP_ID,
      ST.ARRIVAL_TIME,
      ST.ARRIVAL_TIMESTAMP,
      ST.DEPARTURE_TIME,
      ST.DEPARTURE_TIMESTAMP,
      ST.STOP_SEQUENCE,
      TRIP.ROUTE_ID,
      TRIP.BLOCK_ID,
      TRIP.TRIP_HEADSIGN,
      ROUTE.ROUTE_SHORT_NAME,
      ROUTE.ROUTE_LONG_NAME
    FROM STOP_TIME AS ST
    JOIN TRIP ON TRIP.TRIP_ID = ST.TRIP_ID
    JOIN CALENDAR AS C ON C.SERVICE_ID = TRIP.SERVICE_ID
    JOIN ROUTE ON ROUTE.ROUTE_ID = TRIP.ROUTE_ID
    LEFT JOIN CALENDAR_DATE ON TRIP.SERVICE_ID = CALENDAR_DATE.SERVICE_ID
    AND CALENDAR_DATE.DATE = ${dateOfYear}
    WHERE ST.STOP_ID = ${stopId}
      AND ST.ARRIVAL_TIMESTAMP > ${departureTimeInSeconds}
      AND (EXCEPTION_TYPE IS NULL
                          AND ${calendarDayColumns[dayOfWeek]} = ${scheduledService.isTrue}
                          AND ${dateOfYear} BETWEEN C.START_DATE AND C.END_DATE
                          OR EXCEPTION_TYPE = ${serviceException.added})
    ORDER BY ST.ARRIVAL_TIMESTAMP ASC;`;

  if (!stopTimeResponse) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: `There was an error while searching for upcoming trips at stop id ${stopId} on date ${dateTime}`,
    });
  }

  const upcomingTrips = camelcaseKeys(stopTimeResponse);

  return res.status(StatusCodes.OK).json({ upcomingTrips });
};

export default withErrorHandler(handler);
