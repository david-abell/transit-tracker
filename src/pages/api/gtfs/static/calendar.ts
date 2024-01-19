import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Calendar } from "@prisma/client";

import { StatusCodes } from "http-status-codes";

export type CalendarAPIResponse = Calendar;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CalendarAPIResponse>
) {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const service = await prisma.calendar.findFirst({ where: { serviceId } });

  if (!service) {
    return res.status(StatusCodes.NOT_FOUND).end();
  }

  return res.status(StatusCodes.OK).json(service);
}

export default withErrorHandler(handler);
