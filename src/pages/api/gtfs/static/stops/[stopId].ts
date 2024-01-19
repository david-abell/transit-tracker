import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Stop } from "@prisma/client";

import { StatusCodes } from "http-status-codes";

export type StopAPIResponse = Stop;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopAPIResponse>
) {
  const { stopId } = req.query;

  if (!stopId || typeof stopId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const stop = await prisma.stop.findFirst({ where: { stopId } });

  if (!stop) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  return res.status(StatusCodes.OK).json(stop);
}

export default withErrorHandler(handler);
