import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { Calendar } from "@prisma/client";

import { StatusCodes } from "http-status-codes";
import { ApiHandler } from "@/lib/FetchHelper";

export type CalendarAPIResponse = Calendar;

const handler: ApiHandler<CalendarAPIResponse> = async (req, res) => {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== "string") {
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  const service = await prisma.calendar.findFirst({ where: { serviceId } });

  if (!service) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: `No service calendar found for service id ${serviceId}` });
  }

  return res.status(StatusCodes.OK).json(service);
};

export default withErrorHandler(handler);
