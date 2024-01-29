import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";
import { ApiErrorResponse } from "@/lib/FetchHelper";

export type StopTimeByStopIdApiResponse = StopTime[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopTimeByStopIdApiResponse | ApiErrorResponse>
) {
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

  const stopTimes = await prisma.stopTime.findMany({
    where: { tripId: tripId },
    orderBy: { stopSequence: "asc" },
  });

  if (!stopTimes || !stopTimes.length) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: `No stop times found for trip ${tripId}` });
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
