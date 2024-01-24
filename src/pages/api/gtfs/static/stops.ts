import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Stop } from "@prisma/client";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes } from "http-status-codes";

export type StopsAPIResponse = Stop[];
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StopsAPIResponse>
) {
  const { stopQuery = "" } = req.query;

  if (!stopQuery || typeof stopQuery !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const startsWithQuery = `${stopQuery.toLowerCase().trim()}%`;
  const containsQuery = `%${stopQuery.toLowerCase().trim()}%`;

  const stops = await prisma.$queryRaw<Stop[]>`
    SELECT stop_id,
           stop_code, 
           stop_lat, 
           stop_lon,
           stop_name
    FROM stop
    WHERE stop_id ILIKE ${startsWithQuery} OR 
          stop_code ILIKE ${startsWithQuery} OR
          stop_name ILIKE ${startsWithQuery} OR
          stop_name ILIKE ${containsQuery}
    ORDER BY stop_name ILIKE ${startsWithQuery} OR NULL,
          stop_id
    LIMIT 6;
 `;

  if (!stops.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  return res.status(StatusCodes.OK).json(camelcaseKeys(stops));
}

export default withErrorHandler(handler);
