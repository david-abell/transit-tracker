import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";

import type { NextApiRequest, NextApiResponse } from "next";
import type { StopTime } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse<StopTime>) {
  const { tripId, stopId } = req.query;

  if (!tripId?.length) {
    return res.end();
  }

  if (typeof stopId !== "string" || typeof tripId !== "string") {
    throw new Error("Must only supply one stop id");
  }

  let stopTime = await prisma.stopTime.findFirst({
    where: { AND: [{ stopId: stopId }, { tripId: tripId }] },
  });

  if (!stopTime) {
    throw new ApiError(
      404,
      `No stop times were found for trip: ${tripId} at stop: ${stopId}`
    );
  }

  return res.json(stopTime);
}

export default withErrorHandler(handler);
