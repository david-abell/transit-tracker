import { prisma } from "@/lib/db";

import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";

import { Route } from "@prisma/client";
import { ApiHandler } from "@/lib/FetchHelper";

export type SingleRouteAPIResponse = Route;

const handler: ApiHandler<SingleRouteAPIResponse> = async (req, res) => {
  const { routeId = "" } = req.query;

  if (!routeId || typeof routeId !== "string") {
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
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
};

export default withErrorHandler(handler);
