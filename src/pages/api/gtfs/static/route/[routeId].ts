import { prisma } from "@/lib/db";
import type { NextApiRequest, NextApiResponse } from "next";

import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";

import { Route } from "@prisma/client";
import { ApiErrorResponse } from "@/lib/FetchHelper";

export type SingleRouteAPIResponse = Route;
// old trip_id query
// ?stopId=8370B2405601&tripId=3789_103867&routeId=3789_59188&destId=8380B244351
async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SingleRouteAPIResponse | ApiErrorResponse>
) {
  const { routeId = "" } = req.query;

  if (!routeId || typeof routeId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const route = await prisma.route.findFirst({
    where: { routeId },
  });

  if (!route) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: `No route found with id #${routeId}` });
  }

  return res.status(StatusCodes.OK).json(route);
}

export default withErrorHandler(handler);
