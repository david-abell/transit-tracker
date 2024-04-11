import { prisma } from "@/lib/db";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route } from "@prisma/client";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";

export type RouteAPIResponse = Route[];

const handler: ApiHandler<RouteAPIResponse> = async (req, res) => {
  const { q = "" } = req.query;

  if (typeof q !== "string") {
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  const likeShortNameQuery = `${q}%`;
  const likeLongNameQuery = `%${q}%`;
  const globQuery = `${q}[a-zA-Z]`;

  let routes: Route[] | undefined;

  if (q.length) {
    routes = await prisma.$queryRaw<Route[]>`
    SELECT r.route_short_name,
          r.route_long_name,
          r.agency_id,
          r.route_id,
          r.route_type
    FROM route r
    WHERE route_short_name ILIKE ${likeShortNameQuery} OR 
          route_long_name ILIKE ${likeLongNameQuery}
    ORDER BY route_short_name = ${q} DESC,
          COALESCE(SUBSTRING(route_short_name FROM '^(\\d+)')::INTEGER, 99999999),
          SUBSTRING(route_short_name FROM '^\\d* *(.*?)( \\d+)?$'),
          COALESCE(SUBSTRING(route_short_name FROM ' (\\d+)$')::INTEGER, 0),
          substring(route_short_name, ${globQuery} ) DESC
    LIMIT 20;
    `;
  } else {
    routes = await prisma.route.findMany();
  }

  if (q.length && !routes) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: `There was an error searching for routes with the query ${q}`,
    });
  }

  if (!routes.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  if (q.length) {
    return res.status(StatusCodes.OK).json(camelcaseKeys(routes));
  }

  return res.status(StatusCodes.OK).json(routes);
};

export default withErrorHandler(handler);
