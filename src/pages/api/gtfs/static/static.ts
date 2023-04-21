import { prisma } from "@/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const routes = await prisma.route.findMany({
    where: { routeShortName: "208" },
  });

  const routeId = routes[0].routeId;

  const trips = await prisma.trip.findMany({
    where: { routeId },
  });

  // const stops = await prisma.stops.findMany({
  //   where: { stop_id: "8370B2103401" },
  // });
  // console.log(routes);
  res.json(trips);
}
