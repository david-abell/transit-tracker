import { prisma } from "@/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";
import { Route } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type RouteAPIResponse = Route[];
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse>
) {
  const { shortName = "", longName = "" } = req.query;

  if (
    (!shortName && !longName) ||
    typeof shortName !== "string" ||
    typeof longName !== "string"
  ) {
    return res.end();
  }

  const routes = await prisma.route.findMany({
    take: 10,
    where: {
      OR: [
        { routeShortName: { contains: shortName } },
        { routeLongName: { contains: longName } },
      ],
    },
  });

  if (!routes.length) {
    throw new ApiError(404, "No routes found");
  }

  return res.json(routes);
}

export default withErrorHandler(handler);
