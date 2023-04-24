import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type TripAPIResponse = Trip[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripAPIResponse>
) {
  const { tripId } = req.query;

  if (!tripId || typeof tripId !== "string") {
    return res.end();
  }

  const trips = await prisma.trip.findMany({ where: { tripId } });

  if (!trips.length) {
    throw new ApiError(404, "No trips found");
  }

  return res.json(trips);
}

export default withErrorHandler(handler);
