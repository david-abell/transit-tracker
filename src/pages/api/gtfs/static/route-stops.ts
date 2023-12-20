import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Stop } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type StopsAPIResponse = Stop[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopsAPIResponse>
) {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.end();
  }

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { trip: { routeId: routeId } } } },
  });

  if (!stops.length) {
    throw new ApiError(404, "No stops found");
  }

  return res.json(stops);
}

export default withErrorHandler(handler);
