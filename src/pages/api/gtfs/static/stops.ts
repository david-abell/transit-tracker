import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route, Stop } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import camelcaseKeys from "camelcase-keys";

export type StopsAPIResponse = Stop[];
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopsAPIResponse>
) {
  const { stopQuery = "" } = req.query;

  if (!stopQuery || typeof stopQuery !== "string") {
    return res.end();
  }

  const startsWithQuery = `${stopQuery.toLowerCase().trim()}%`;
  const containsQuery = `%${stopQuery.toLowerCase().trim()}%`;

  const stops = await prisma.$queryRaw<Stop[]>`
    SELECT stop_id,
        stop_name
    FROM stop
    WHERE stop_id ILIKE ${startsWithQuery} OR 
        stop_name ILIKE ${startsWithQuery} OR
        stop_name ILIKE ${containsQuery}
    ORDER BY stop_name ILIKE ${startsWithQuery} OR NULL,
        stop_id
    LIMIT 10;
 `;

  if (!stops.length) {
    return res.end();
  }

  return res.json(camelcaseKeys(stops));
}

export default withErrorHandler(handler);
