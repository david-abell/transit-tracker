import { prisma } from "@/lib/db";
import withErrorHandler from "@/lib/withErrorHandler";

import { LatLngTuple } from "leaflet";

import { StatusCodes } from "http-status-codes";
import { Shape } from "@prisma/client";
import camelcaseKeys from "camelcase-keys";
import { ApiHandler } from "@/lib/FetchHelper";

export type ShapeAPIResponse = LatLngTuple[];

const handler: ApiHandler<ShapeAPIResponse> = async (req, res) => {
  const { tripId } = req.query;

  if (!tripId || typeof tripId !== "string") {
    return res.status(StatusCodes.BAD_REQUEST).end();
  }

  const shapes = await prisma.$queryRaw<Shape[]>`
    SELECT S.SHAPE_ID,
      S.SHAPE_PT_LAT,
      S.SHAPE_PT_LON,
      S.SHAPE_PT_SEQUENCE,
      S.SHAPE_DIST_TRAVELED
    FROM SHAPE S
    INNER JOIN TRIP ON S.SHAPE_ID = TRIP.SHAPE_ID
    AND TRIP.TRIP_ID = ${tripId}
    ORDER BY S.SHAPE_PT_SEQUENCE;`;

  if (!shapes) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: `There was an error while searching for shapes for trip id ${tripId}`,
    });
  }
  if (!shapes.length) {
    return res.status(StatusCodes.OK).json([]);
  }

  const shapePoints: LatLngTuple[] = camelcaseKeys(shapes).map(
    ({ shapePtLat, shapePtLon }) => [shapePtLat, shapePtLon]
  );

  return res.json(shapePoints);
};

export default withErrorHandler(handler);
