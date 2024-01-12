import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Trip } from "@prisma/client";

import { StatusCodes } from "http-status-codes";

export type TripIdAPIResponse = Trip;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripIdAPIResponse>
) {
  const { tripId } = req.query;

  if (!tripId || typeof tripId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const trip = await prisma.trip.findFirst({ where: { tripId } });

  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  return res.status(StatusCodes.OK).json(trip);
}

export default withErrorHandler(handler);
