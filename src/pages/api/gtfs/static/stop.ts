import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Stop } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type StopAPIResponse = Stop;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopAPIResponse>
) {
  const { stopId } = req.query;

  if (!stopId || typeof stopId !== "string") {
    return res.end();
  }

  const stop = await prisma.stop.findFirst({ where: { stopId } });

  if (!stop) {
    throw new ApiError(404, "No stops found");
  }

  return res.json(stop);
}

export default withErrorHandler(handler);
