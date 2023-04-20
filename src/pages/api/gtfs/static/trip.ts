import { prisma } from "@/db";
import withErrorHandler from "@/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Trips } from "@prisma/client";

export type TripAPIResponse = Trips[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TripAPIResponse>
) {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.end();
  }

  const trips = await prisma.trips.findMany({ where: { routeId } });

  return res.json(trips);
}

export default withErrorHandler(handler);
