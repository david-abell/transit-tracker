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
  const { tripId } = req.query;

  if (!tripId || typeof tripId !== "string") {
    return res.end();
  }

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { tripId: tripId } } },
  });

  if (!stops) {
    throw new ApiError(404, "No stops found");
  }

  return res.json(stops);
}

export default withErrorHandler(handler);
