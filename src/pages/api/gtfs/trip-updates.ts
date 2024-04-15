import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, TripUpdate } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { redisClient as redis } from "@/lib/redis/redisClient";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { ApiErrorResponse, ApiHandler } from "@/lib/FetchHelper";
import { retryAsync } from "ts-retry";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdates?format=json";

const BATCH_LIMIT = 500;

const REDIS_CACHE_EXPIRE_SECONDS = 120;

export type RealtimeTripUpdateResponse = {
  tripUpdates: [string, TripUpdate][];
  addedTrips: [string, TripUpdate][];
};

let isFetching = false;

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

  console.log("trip-updates called:", new Date().toLocaleString());

  const tripUpdateKey = "tripUpdates";
  const addedTripsKey = "addTrips";

  // try fetch cached data
  let cachedAdded = await redis.exists(addedTripsKey);
  let cachedUpdates = await redis.exists(tripUpdateKey);

  let idArray: string[] = [];

  if (tripIds?.includes(",")) {
    idArray = tripIds.split(",").map((tripId) => decodeURI(tripId));
  } else {
    idArray = !!tripIds ? [decodeURI(tripIds)] : [];
  }

  if (isFetching) {
    try {
      await retryAsync(
        async () => {
          let cachedAdded = await redis.exists(addedTripsKey);
          let cachedUpdates = await redis.exists(tripUpdateKey);
          return cachedUpdates || cachedAdded;
        },
        {
          delay: 100,
          maxTry: 5,
          until: (lastResult) => lastResult === 1,
        },
      );
    } catch (err) {}
  }

  if (cachedAdded && cachedUpdates) {
    console.log(`redis cache hit: searching for ${idArray.length} trip ids.`);

    let addedTrips: [string, TripUpdate][] = [];

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
    } else {
      const addedTripRecords = await redis.hgetall(addedTripsKey);
      addedTrips = Object.entries(addedTripRecords).map<[string, TripUpdate]>(
        ([key, trip]) => [key, JSON.parse(trip)],
      );
    }

    return res.status(StatusCodes.OK).json({ addedTrips, tripUpdates });
  }

  if (isFetching) {
    res.end();
    return;
  }
  console.log("redis cache miss, setting new trip updates");

  isFetching = true;

  const response = await fetch(API_URL, {
    method: "GET",
    // Request headers
    headers: {
      "x-api-key": API_KEY as string,
    },
  });

  isFetching = false;

  if (!response.ok) {
    console.error(
      `[trip-updates] error: Status: ${response.status}, StatusText: ${response.statusText}`,
    );
    if (response.status === StatusCodes.TOO_MANY_REQUESTS) {
      throw new ApiError(
        StatusCodes.TOO_MANY_REQUESTS,
        ReasonPhrases.TOO_MANY_REQUESTS,
      );
    }
    throw new ApiError(StatusCodes.BAD_GATEWAY, ReasonPhrases.BAD_GATEWAY);
  }

  const json = await response.json();

  const data: GTFSResponse = camelcaseKeys(json, { deep: true });

  console.log("Downloaded %s trip updates", data?.entity?.length);
  const requestedTripSet = tripIds ? new Set(idArray) : new Set();

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
      // only send added trips when no tripIds have been requested
      if (!idArray.length) {
        addedTrips.push([encodedKey, tripUpdate]);
      }
      tripUpdate.trip["tripId"] = encodedKey;
    }
    tripUpdates.set(tripUpdate.trip.tripId, JSON.stringify(tripUpdate));

    if (requestedTripSet.has(tripUpdate.trip.tripId)) {
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

  if (tripUpdates.size) {
    await redis.hmset(tripUpdateKey, tripUpdates);
  }
  if (addedTripsMap.size) {
    await redis.hmset(addedTripsKey, addedTripsMap);
  }

  // expire after 120 seconds
  redis.expire(tripUpdateKey, REDIS_CACHE_EXPIRE_SECONDS);
  redis.expire(addedTripsKey, REDIS_CACHE_EXPIRE_SECONDS);

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
