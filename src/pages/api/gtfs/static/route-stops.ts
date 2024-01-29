import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { Stop } from "@prisma/client";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";
import { StopsAPIResponse } from "./stops";

const handler: ApiHandler<StopsAPIResponse> = async (req, res) => {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { trip: { routeId: routeId } } } },
  });

  if (!stops || !stops.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: `No stops found for route id ${routeId}` });
  }

  return res.status(StatusCodes.OK).json(stops);
};

export default withErrorHandler(handler);
