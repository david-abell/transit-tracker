import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { Stop } from "@prisma/client";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";

export type StopAPIResponse = Stop;

export const handler: ApiHandler<StopAPIResponse> = async (req, res) => {
  const { stopId } = req.query;

  if (!stopId || typeof stopId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const stop = await prisma.stop.findFirst({ where: { stopId } });

  if (!stop) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: `No stop found with id ${stopId}` });
  }

  return res.status(StatusCodes.OK).json(stop);
};

export default withErrorHandler(handler);
