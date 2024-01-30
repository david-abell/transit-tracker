import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { Trip } from "@prisma/client";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";

export type TripIdAPIResponse = Trip;

const handler: ApiHandler<TripIdAPIResponse> = async (req, res) => {
  const { tripId } = req.query;
  if (!tripId || typeof tripId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const trip = await prisma.trip.findFirst({ where: { tripId } });

  if (!trip) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: `No trip found with id ${tripId}. Try selecting a different trip.`,
    });
  }

  return res.status(StatusCodes.OK).json(trip);
};

export default withErrorHandler(handler);
