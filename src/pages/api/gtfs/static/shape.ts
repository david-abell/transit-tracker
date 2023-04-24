import { prisma } from "@/db";
import withErrorHandler from "@/lib/withErrorHandler";

import type { NextApiRequest, NextApiResponse } from "next";
import { ApiError } from "next/dist/server/api-utils";
import { LatLngExpression } from "leaflet";

export type ShapeAPIResponse = LatLngExpression[];

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ShapeAPIResponse>
) {
  const { shapeId } = req.query;

  if (!shapeId || typeof shapeId !== "string") {
    throw new ApiError(400, "Must provide a valid trip id");
  }

  const shapePoints = await prisma.shape.findMany({
    where: { shapeId: shapeId },
    orderBy: [{ shapePtSequence: "asc" }],
  });

  if (!shapePoints.length) {
    throw new ApiError(404, `No shapes found for shape id: ${shapeId}`);
  }

  return res.json(
    shapePoints.map(({ shapePtLat, shapePtLon }) => [shapePtLat, shapePtLon])
  );
}

export default withErrorHandler(handler);
