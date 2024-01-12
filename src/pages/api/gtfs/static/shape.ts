import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { LatLngTuple } from "leaflet";

import { StatusCodes } from "http-status-codes";

export type ShapeAPIResponse = LatLngTuple[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShapeAPIResponse>
) {
  const { shapeId } = req.query;

  if (!shapeId || typeof shapeId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const shapePoints = await prisma.shape.findMany({
    where: { shapeId: shapeId },
    orderBy: [{ shapePtSequence: "asc" }],
  });

  if (!shapePoints.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  return res.json(
    shapePoints.map(({ shapePtLat, shapePtLon }) => [shapePtLat, shapePtLon])
  );
}

export default withErrorHandler(handler);
