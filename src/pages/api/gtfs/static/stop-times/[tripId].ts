import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
  const { tripId } = req.query;

  if (!tripId?.length) {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  if (typeof tripId !== "string") {
    console.error(
      `api/Stop-times: expected tripId to be a string, received ${typeof tripId}: ${typeof tripId}.`
    );
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  let stopTimes = await prisma.stopTime.findMany({
    where: { tripId: tripId },
    orderBy: { stopSequence: "asc" },
  });

  if (!stopTimes.length) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
