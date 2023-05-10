import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
  const { tripId } = req.query;

  if (!tripId?.length) {
    return res.end();
  }

  if (typeof tripId !== "string") {
    throw new Error("Must only supply one stop id");
  }

  let stopTimes = await prisma.stopTime.findMany({
    where: { tripId: tripId },
  });

  if (!stopTimes.length) {
    throw new ApiError(404, `No stop times were found for trip: ${tripId}`);
  }

  return res.json(stopTimes);
}

export default withErrorHandler(handler);
