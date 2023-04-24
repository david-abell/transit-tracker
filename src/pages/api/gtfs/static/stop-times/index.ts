import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
  const { tripId } = req.query;

  if (!tripId?.length) {
    return res.end();
  }

  let stopTimes: StopTime[];

  if (Array.isArray(tripId)) {
    stopTimes = await prisma.stopTime.findMany({
      where: { tripId: { in: tripId } },
    });
  } else {
    stopTimes = await prisma.stopTime.findMany({
      where: { tripId: tripId },
    });
  }

  if (!stopTimes.length) {
    throw new ApiError(404, "No stop times found");
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
