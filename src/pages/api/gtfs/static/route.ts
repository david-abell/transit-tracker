import { prisma } from "@/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/withErrorHandler";
import { Routes } from "@prisma/client";

export type RouteAPIResponse = {
  routeId: string;
  routes: Routes[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse>
) {
  const { shortName } = req.query;

  if (!shortName || typeof shortName !== "string") {
    return res.end();
    // throw new Error("Route shortname is required", { cause: 400 });
    // return res.status(400).end("Route shortname is required");
  }
  const routes = await prisma.routes.findMany({
    where: { routeShortName: shortName },
  });

  if (!routes.length) {
    throw new Error("Invalid route shortname", { cause: 404 });
    // return res.status(404).end("Invalid route shortname");
  }

  return res.json({
    routeId: routes[0].routeId,
    routes,
  });
}

export default withErrorHandler(handler);
