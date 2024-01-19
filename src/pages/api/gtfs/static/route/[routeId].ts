import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";

import { Route } from "@prisma/client";

export type RouteAPIResponse = Route;
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RouteAPIResponse>
) {
  const { routeId = "" } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const route = await prisma.route.findFirst({
    where: { routeId },
  });

  if (!route) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  return res.status(StatusCodes.OK).json(route);
}

export default withErrorHandler(handler);
