import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Trip } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type TripIdAPIResponse = Trip;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripIdAPIResponse>
) {
  const { tripId } = req.query;

  if (!tripId || typeof tripId !== "string") {
    return res.end();
  }

  const trip = await prisma.trip.findFirst({ where: { tripId } });

  if (!trip) {
    throw new ApiError(404, "No trips found");
  }

  return res.json(trip);
}

export default withErrorHandler(handler);
