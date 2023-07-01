import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";
import camelcaseKeys from "camelcase-keys";

export type RouteAPIResponse = Route[];
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse>
) {
  const { routeName = "" } = req.query;

  if (!routeName || typeof routeName !== "string") {
    return res.end();
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
    WHERE route_short_name LIKE ${likeShortNameQuery} OR 
          route_long_name LIKE ${likeLongNameQuery}
    ORDER BY route_short_name = ${routeName} DESC,
          CAST (route_short_name AS INTEGER) ASC,
          route_short_name GLOB ${globQuery} DESC
    LIMIT 10;
 `;

  if (!routes.length) {
    return res.end();
  }

  camelcaseKeys;

  return res.json(camelcaseKeys(routes));
}

export default withErrorHandler(handler);
