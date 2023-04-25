import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import type { Calendar } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

export type CalendarAPIResponse = Calendar;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CalendarAPIResponse>
) {
  const { serviceId } = req.query;

  if (!serviceId || typeof serviceId !== "string") {
    return res.end();
  }

  const service = await prisma.calendar.findFirst({ where: { serviceId } });

  if (!service) {
    throw new ApiError(404, "No service found");
  }

  return res.json(service);
}

export default withErrorHandler(handler);
