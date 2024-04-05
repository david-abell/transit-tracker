import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";
import { StopsAPIResponse } from "./stops";

const handler: ApiHandler<StopsAPIResponse> = async (req, res) => {
  const { routeId } = req.query;

  if (!routeId || typeof routeId !== "string") {
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  const stops = await prisma.stop.findMany({
    where: { stopTime: { some: { trip: { routeId } } } },
  });

  if (!stops || !stops.length) {
    return res.status(StatusCodes.NOT_FOUND).json({
      error: `This route is not currently in service. Please make a different selection.`,
    });
  }

  return res.status(StatusCodes.OK).json(stops);
};

export default withErrorHandler(handler);
