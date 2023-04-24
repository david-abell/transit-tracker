import { prisma } from "@/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route, Stop, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type StaticAPIResponse = {
  route: Route;
  stops: Stop[];
  trips: Trip[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaticAPIResponse>
) {
  const { shortName } = req.query;

  if (!shortName || typeof shortName !== "string") {
    return res.end();
  }
  const route = await prisma.route.findFirst({
    where: { routeShortName: shortName },
  });

  if (!route) {
    throw new ApiError(404, "Invalid route shortname");
  }

  const routeId = route.routeId;

  const trips = await prisma.trip.findMany({ where: { routeId } });
  const tripIds = trips.map(({ tripId }) => tripId);

  const stopTimes = await prisma.stopTime.findMany({
    where: { tripId: { in: tripIds } },
  });
  const stopTimeIds = stopTimes.map(({ stopId }) => stopId);

  const stops = await prisma.stop.findMany({
    where: {
      stopId: { in: stopTimeIds },
    },
  });

  return res.json({
    route,
    stops,
    trips,
  });
}

export default withErrorHandler(handler);
