import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Stop } from "@prisma/client";

import { StatusCodes } from "http-status-codes";

export type RouteStopsAPIResponse = Stop[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteStopsAPIResponse>
) {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { trip: { routeId: routeId } } } },
  });

  return res.status(StatusCodes.OK).json(stops);
}

export default withErrorHandler(handler);
