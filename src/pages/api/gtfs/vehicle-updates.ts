import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, RealTimeTrip } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { redisClient as redis } from "@/lib/redis/redisClient";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { ApiErrorResponse, ApiHandler } from "@/lib/FetchHelper";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json";

// const UPSTASH_MAX_REQUEST_BYTES = 1048576;
// const TRIP_UPDATE_BYTE_size = 1442;

const BATCH_LIMIT = 700;

const REDIS_CACHE_EXPIRE_SECONDS = 120;

type TripId = string;

export type NTAVehicleUpdate = {
  trip: RealTimeTrip;
  position: {
    latitude: 53.2185326;
    longitude: -6.86348486;
  };
  timestamp: string;
  vehicle: {
    id: string;
  };
};

export type VehicleUpdatesResponse = {
  vehicleUpdates: NTAVehicleUpdate[];
};

const updateSample = {
  id: "V2",
  vehicle: {
    trip: {
      trip_id: "3946_424",
      start_time: "13:53:00",
      start_date: "20240411",
      schedule_relationship: "SCHEDULED",
      route_id: "3946_63139",
      direction_id: 1,
    },
    position: {
      latitude: 53.2185326,
      longitude: -6.86348486,
    },
    timestamp: "1712840847",
    vehicle: {
      id: "4",
    },
  },
};

const handler: ApiHandler<VehicleUpdatesResponse> = async (
  req: NextApiRequest,
  res: NextApiResponse<VehicleUpdatesResponse | ApiErrorResponse>,
) => {
  // const { tripIds } = req.query;

  // if (Array.isArray(tripIds)) {
  //   // shouldn't happen
  //   console.error("Shouldn't happen: tripIds was an array...");
  //   res.status(StatusCodes.BAD_REQUEST).end();
  //   return;
  // }

  console.log("Vehicle updates called:", new Date().toLocaleString());

  const vehicleUpdatesKey = "vehicleUpdates";
  // const addedTripsKey = "addTrips";

  // try fetch cached data
  const cachedUpdates = await redis.exists(vehicleUpdatesKey);

  // let idArray: string[] = [];

  if (cachedUpdates) {
    // console.log(`redis cache hit: searching for ${idArray.length} trip ids.`);

    const vehicleRecords = await redis.hgetall(vehicleUpdatesKey);

    const vehicleUpdates = Object.values(vehicleRecords).map<NTAVehicleUpdate>(
      (vehicleUpdate) => JSON.parse(vehicleUpdate),
    );

    return res.status(StatusCodes.OK).json({ vehicleUpdates });
  }

  console.log("redis cache miss, setting new vehicle updates");

  const response = await fetch(API_URL, {
    method: "GET",
    // Request headers
    headers: {
      "x-api-key": API_KEY as string,
    },
  });

  if (!response.ok) {
    console.error(
      `[vehicle-updates] response error: Status: ${response.status}, StatusText: ${response.statusText}`,
    );
    throw new ApiError(StatusCodes.BAD_GATEWAY, ReasonPhrases.BAD_GATEWAY);
  }

  const json = await response.json();

  const data: GTFSResponse = camelcaseKeys(json, { deep: true });

  console.log("Downloaded %s vehicle updates", data?.entity?.length);

  const batchedUpdates = new Map<string, string>();
  // const addedTripsMap = new Map<string, string>();
  const vehicleUpdates: NTAVehicleUpdate[] = [];
  // const addedTrips: [string, TripUpdate][] = [];

  for (const { vehicle } of data.entity) {
    // this is the tripUpdate feed, it will not be undefined,
    if (!vehicle) continue;

    // const encodedKey = createTripKey(vehicle.trip);

    if (!vehicle.trip?.tripId) {
      //just in case this is invalid
      continue;
      // addedTripsMap.set(encodedKey, JSON.stringify(vehicle));
      // addedTrips.push([encodedKey, vehicle]);
      // vehicle.trip["tripId"] = encodedKey;
    }
    batchedUpdates.set(vehicle.trip.tripId, JSON.stringify(vehicle));
    vehicleUpdates.push(
      // NTA Vehicle update does not fully match GTFS spec
      vehicle as unknown as NTAVehicleUpdate,
    );

    // Upstash has an hmset size limit of 1048576 bytes. Batch updates to stay under this threshold.
    if (batchedUpdates.size > BATCH_LIMIT) {
      await redis.hmset(vehicleUpdatesKey, batchedUpdates);
      batchedUpdates.clear();
    }
  }

  if (batchedUpdates.size) {
    await redis.hmset(vehicleUpdatesKey, batchedUpdates);
  }

  // expire after 120 seconds
  redis.expire(vehicleUpdatesKey, REDIS_CACHE_EXPIRE_SECONDS);

  return res.status(200).json({ vehicleUpdates });
};

export default withErrorHandler(handler);

// function createTripKey(trip: TripUpdate["trip"]) {
//   const { directionId, routeId, scheduleRelationship, startDate, startTime } =
//     trip;

//   return encodeURI(
//     [scheduleRelationship, routeId, directionId, startDate, startTime].join(
//       "-",
//     ),
//   );
// }
