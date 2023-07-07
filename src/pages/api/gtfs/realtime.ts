import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, TripUpdate } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { createRedisInstance } from "@/lib/redis/createRedisInstance";
import camelcaseKeys from "camelcase-keys";

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

  if (Array.isArray(tripIds)) {
    return res.end();
  }

  const idArray = !!tripIds
    ? tripIds.split(",").map((tripId) => decodeURI(tripId))
    : undefined;

  console.log("realtime called:", new Date().toLocaleString());

  const redis = createRedisInstance();

  try {
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

      if (Array.isArray(idArray) && idArray.length) {
        const storedTrips = await redis.hmget(tripUpdateKey, ...idArray);
        const parsedTrips: TripUpdate[] = storedTrips.flatMap((val) =>
          val ? JSON.parse(val) : []
        );

        tripUpdates = parsedTrips.map((tripUpdate) => [
          // When not defined, TripUpdate keys are set below when redis key is set
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
      console.warn(
        `Realtime response error: Status: ${response.status}, StatusText: ${response.statusText}`
      );
      throw new ApiError(response.status, response.statusText);
    }

    const json = await response.json();

    const data: GTFSResponse = camelcaseKeys(json, { deep: true });

    const tripUpdates = new Map<string, string>();
    const addedTripsMap = new Map<string, string>();
    const requestedTripUpdates: [string, TripUpdate][] = [];
    const addedTrips: [string, TripUpdate][] = [];

    for (const { tripUpdate } of data.entity) {
      // this is the tripUpdate feed, it will not be undefined,
      // todo: update type defs for Zod
      if (!tripUpdate) continue;

      const encodedKey = createTripKey(tripUpdate.trip);

      // Trips with scheduleRelationship === "ADDED" don't have a defined tripId
      // Set it here
      if (!tripUpdate.trip.tripId) {
        addedTripsMap.set(encodedKey, JSON.stringify(tripUpdate));
        addedTrips.push([encodedKey, tripUpdate]);
        tripUpdate.trip["tripId"] = encodedKey;
      }
      console.log(tripUpdate.trip.tripId);
      tripUpdates.set(tripUpdate.trip.tripId, JSON.stringify(tripUpdate));

      if (tripIds?.includes(tripUpdate.trip.tripId)) {
        requestedTripUpdates.push([tripUpdate.trip.tripId, tripUpdate]);
      }
    }

    console.log(`redis cache miss, setting new trip updates`);

    const MAX_AGE = 60_000 * 3; // 2 minutes
    // const MAX_AGE = 60_000 * 8; // 8 minutes

    await redis.hmset(tripUpdateKey, tripUpdates);
    await redis.hmset(addedTripsKey, addedTripsMap);
    redis.pexpire(tripUpdateKey, MAX_AGE);
    redis.pexpire(addedTripsKey, MAX_AGE);

    return res
      .status(200)
      .json({ tripUpdates: requestedTripUpdates, addedTrips });
  } catch (err) {
    if (err instanceof Error) {
      throw new ApiError(500, "Server error while getting realtime data");
    }
  }
}

export default withErrorHandler(handler);

function createTripKey(trip: TripUpdate["trip"]) {
  const { directionId, routeId, scheduleRelationship, startDate, startTime } =
    trip;

  return encodeURI(
    [scheduleRelationship, routeId, directionId, startDate, startTime].join("-")
  );
}
