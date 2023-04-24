import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime[]>) {
  const { tripId, stopId } = req.query;

  if (!tripId?.length) {
    return res.end();
  }

  if (typeof stopId !== "string" || typeof tripId !== "string") {
    throw new Error("Must only supply one stop id");
  }

  let stopTimes = await prisma.stopTime.findMany({
    where: { stopId: stopId, tripId: tripId },
  });

  if (!stopTimes.length) {
    throw new ApiError(
      404,
      `No stop times were found for trip: ${tripId} at stop: ${stopId}`
    );
  }

  console.log(
    `stop times for stop: ${stopId} on trip: ${tripId} are:`,
    stopTimes
  );
  return res.json(stopTimes);
}

export default withErrorHandler(handler);
