import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, TripUpdate } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { createRedisInstance } from "@/lib/redis/createRedisInstance";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { ApiErrorResponse, ApiHandler } from "@/lib/FetchHelper";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdates?format=json";

// const UPSTASH_MAX_REQUEST_BYTES = 1048576;
// const TRIP_UPDATE_BYTES = 1127;

const BATCH_LIMIT = 800;

export type RealtimeTripUpdateResponse = {
  tripUpdates: [string, TripUpdate][];
  addedTrips: [string, TripUpdate][];
};

const handler: ApiHandler<RealtimeTripUpdateResponse> = async (
  req: NextApiRequest,
  res: NextApiResponse<RealtimeTripUpdateResponse | ApiErrorResponse>,
) => {
  const { tripIds } = req.query;

  if (Array.isArray(tripIds)) {
    // shouldn't happen
    console.error("Shouldn't happen: tripIds was an array...");
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  console.log("realtime called:", new Date().toLocaleString());

  const redis = createRedisInstance();

  const tripUpdateKey = "tripUpdates";
  const addedTripsKey = "addTrips";

  // try fetch cached data
  const cachedAdded = await redis.exists(addedTripsKey);
  const cachedUpdates = await redis.exists(tripUpdateKey);

  if (cachedAdded && cachedUpdates) {
    if (!tripIds) {
      console.error("No tripIds received");
      res.status(StatusCodes.BAD_REQUEST).end();
      return;
    }

    let idArray: string[] = [];

    if (tripIds.includes(",")) {
      idArray = tripIds.split(",").map((tripId) => decodeURI(tripId));
    } else {
      idArray = [tripIds];
    }
    console.log(`redis cache hit: searching for ${tripIds.length} trip ids.`);

    const addedTripRecords = await redis.hgetall(addedTripsKey);

    const addedTrips = Object.entries(addedTripRecords).map<
      [string, TripUpdate]
    >(([key, trip]) => [key, JSON.parse(trip)]);

    let tripUpdates: [string, TripUpdate][] = [];

    if (idArray.length) {
      const storedTrips = await redis.hmget(tripUpdateKey, ...idArray);
      const parsedTrips: TripUpdate[] = storedTrips.flatMap((val) =>
        val ? JSON.parse(val) : [],
      );

      tripUpdates = parsedTrips.map((tripUpdate) => [
        // When not defined, TripUpdate keys are set below when redis key is set
        tripUpdate.trip.tripId!,
        tripUpdate,
      ]);
    }

    return res.status(StatusCodes.OK).json({ addedTrips, tripUpdates });
  }

  console.log(`redis cache miss, setting new trip updates`);

  const response = await fetch(API_URL, {
    method: "GET",
    // Request headers
    headers: {
      "x-api-key": API_KEY as string,
    },
  });

  if (!response.ok) {
    console.error(
      `Realtime response error: Status: ${response.status}, StatusText: ${response.statusText}`,
    );
    throw new ApiError(StatusCodes.BAD_GATEWAY, ReasonPhrases.BAD_GATEWAY);
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
    tripUpdates.set(tripUpdate.trip.tripId, JSON.stringify(tripUpdate));

    if (tripIds?.includes(tripUpdate.trip.tripId)) {
      requestedTripUpdates.push([tripUpdate.trip.tripId, tripUpdate]);
    }

    // Upstash has an hmset size limit of 1048576 bytes. Batch updates to stay under this threshold.
    if (tripUpdates.size > BATCH_LIMIT) {
      await redis.hmset(tripUpdateKey, tripUpdates);
      tripUpdates.clear();
    }
    if (addedTripsMap.size > BATCH_LIMIT) {
      await redis.hmset(addedTripsKey, addedTripsMap);
      addedTripsMap.clear();
    }
  }

  await redis.hmset(tripUpdateKey, tripUpdates);
  await redis.hmset(addedTripsKey, addedTripsMap);

  // expire after 120 seconds
  redis.expire(tripUpdateKey, 120);
  redis.expire(addedTripsKey, 120);

  return res
    .status(200)
    .json({ tripUpdates: requestedTripUpdates, addedTrips });
};

export default withErrorHandler(handler);

function createTripKey(trip: TripUpdate["trip"]) {
  const { directionId, routeId, scheduleRelationship, startDate, startTime } =
    trip;

  return encodeURI(
    [scheduleRelationship, routeId, directionId, startDate, startTime].join(
      "-",
    ),
  );
}
