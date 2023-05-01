import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type RouteAPIResponse = Route[];
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse>
) {
  const { routeName = "" } = req.query;

  if (!routeName || typeof routeName !== "string") {
    return res.end();
  }

  const routes = await prisma.route.findMany({
    take: 10,
    where: {
      OR: [
        { routeShortName: { contains: routeName } },
        { routeLongName: { contains: routeName } },
      ],
    },
  });

  if (!routes.length) {
    return res.end();
  }

  return res.json(routes);
}

export default withErrorHandler(handler);
