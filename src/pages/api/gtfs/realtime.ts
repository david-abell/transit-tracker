import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, TripUpdate } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { createRedisInstance } from "@/lib/redis/createRedisInstance";
import camelcaseKeys from "camelcase-keys";
import { Route, Trip } from "@prisma/client";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdates?format=json";

export type RealtimeTripUpdateResponse = {
  tripUpdates: [string, TripUpdate][];
  addedTrips: [string, TripUpdate][];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RealtimeTripUpdateResponse>
) {
  const { tripIds } = req.query;
  let idArray = typeof tripIds === "string" && !!tripIds && tripIds.split(",");

  if (!tripIds?.length) {
    return res.end();
  }

  console.log("realtime called:", new Date().toLocaleString());

  const redis = createRedisInstance();

  const tripUpdateKey = "tripUpdates";
  const addedTripsKey = "addTrips";

  // try fetch cached data
  const cachedAdded = await redis.exists(addedTripsKey);
  const cachedUpdates = await redis.exists(tripUpdateKey);

  if (cachedAdded && cachedUpdates) {
    console.log(
      `redis cache hit:  searching for trip ids: ${JSON.stringify(tripIds)}`
    );

    const addedTripRecords = await redis.hgetall(addedTripsKey);

    const addedTrips = Object.entries(addedTripRecords).map<
      [string, TripUpdate]
    >(([key, trip]) => [key, JSON.parse(trip)]);

    let tripUpdates: [string, TripUpdate][] = [];

    if (!!idArray && idArray.length) {
      const storedTrips = await redis.hmget(tripUpdateKey, ...idArray);
      const parsedTrips: TripUpdate[] = storedTrips.flatMap((val) =>
        val ? JSON.parse(val) : []
      );

      // tripUpdate keys are only set when tripId is valid
      tripUpdates = parsedTrips.map((tripUpdate) => [
        tripUpdate.trip.tripId!,
        tripUpdate,
      ]);
    }

    return res.status(200).send({ addedTrips, tripUpdates });
  }
  const response = await fetch(API_URL, {
    method: "GET",
    // Request headers
    headers: {
      "x-api-key": API_KEY as string,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }

  const json = await response.json();

  const data: GTFSResponse = camelcaseKeys(json, { deep: true });

  const allTripUpdatesMap = new Map<Trip["tripId"], string>();
  const addedTripsMap = new Map<Route["routeId"], string>();
  const requestedTripUpdates: [string, TripUpdate][] = [];
  const addedTrips: [string, TripUpdate][] = [];

  for (const { tripUpdate } of data.entity) {
    // this is the tripUpdate feed, it will not be undefined,
    // todo: update type defs for Zod
    if (!tripUpdate) continue;
    const { tripId } = tripUpdate.trip;
    if (tripId) {
      allTripUpdatesMap.set(tripId, JSON.stringify(tripUpdate));
    } else {
      const { routeId } = tripUpdate!.trip;
      addedTripsMap.set(routeId, JSON.stringify(tripUpdate));
      addedTrips.push([routeId, tripUpdate]);
    }
    if (typeof tripIds === "string" && tripId === tripIds) {
      requestedTripUpdates.push([tripId, tripUpdate!]);
    } else if (tripId && tripIds?.includes(tripId)) {
      requestedTripUpdates.push([tripId, tripUpdate!]);
    }
  }

  console.log(`redis cache miss, setting new trip updates`);

  const MAX_AGE = 60_000 * 2; // 2 minutes
  // const MAX_AGE = 60_000 * 8; // 8 minutes

  await redis.hmset(tripUpdateKey, allTripUpdatesMap);
  await redis.hmset(addedTripsKey, addedTripsMap);
  redis.pexpire(tripUpdateKey, MAX_AGE);
  redis.pexpire(addedTripsKey, MAX_AGE);

  return res
    .status(200)
    .json({ tripUpdates: requestedTripUpdates, addedTrips });
}

export default withErrorHandler(handler);
