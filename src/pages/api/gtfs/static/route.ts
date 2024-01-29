import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route } from "@prisma/client";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes } from "http-status-codes";
import { ApiErrorResponse } from "@/lib/FetchHelper";

export type RouteAPIResponse = Route[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse | ApiErrorResponse>
) {
  const { routeName = "" } = req.query;

  if (!routeName || typeof routeName !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const likeShortNameQuery = `${routeName}%`;
  const likeLongNameQuery = `%${routeName}%`;
  const globQuery = `${routeName}[a-zA-Z]`;

  const routes = await prisma.$queryRaw<Route[]>`
    SELECT r.route_short_name,
          r.route_long_name,
          r.agency_id,
          r.route_id,
          r.route_type
    FROM route r
    WHERE route_short_name ILIKE ${likeShortNameQuery} OR 
          route_long_name ILIKE ${likeLongNameQuery}
    ORDER BY route_short_name = ${routeName} DESC,
          COALESCE(SUBSTRING(route_short_name FROM '^(\\d+)')::INTEGER, 99999999),
          SUBSTRING(route_short_name FROM '^\\d* *(.*?)( \\d+)?$'),
          COALESCE(SUBSTRING(route_short_name FROM ' (\\d+)$')::INTEGER, 0),
          substring(route_short_name, ${globQuery} ) DESC
    LIMIT 6;
 `;

  if (!routes) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: `There was an error searching for routes with the query ${routeName}`,
    });
  }

  if (!routes.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  return res.status(StatusCodes.OK).json(camelcaseKeys(routes));
}

export default withErrorHandler(handler);
