import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Stop, Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type StaticAPIResponse = {
  stops: Stop[];
  trips: Trip[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaticAPIResponse>
) {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.end();
  }

  const trips = await prisma.trip.findMany({ where: { routeId } });

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { trip: { routeId: routeId } } } },
  });

  return res.json({
    stops,
    trips,
  });
}

export default withErrorHandler(handler);
