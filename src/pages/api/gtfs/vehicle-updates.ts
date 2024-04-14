import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse, RealTimeTrip } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { redisClient as redis } from "@/lib/redis/redisClient";
import camelcaseKeys from "camelcase-keys";

import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { ApiErrorResponse, ApiHandler } from "@/lib/FetchHelper";
import { point } from "@turf/helpers";
import distance from "@turf/distance";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json";

// const UPSTASH_MAX_REQUEST_BYTES = 1048576;
// const TRIP_UPDATE_BYTE_size = 1442;

const BATCH_LIMIT = 700;

const REDIS_CACHE_EXPIRE_SECONDS = 360;
// const REDIS_CACHE_EXPIRE_SECONDS = 120;

type TripId = string;

type GeoRecord = [string, number, number];
const DISTANCE_OPTIONS = { units: "kilometers" } as const;
const REDIS_DISTANCE_UNIT = "KM";

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

// const updateExample = {
//   id: "V2",
//   vehicle: {
//     trip: {
//       trip_id: "3946_424",
//       start_time: "13:53:00",
//       start_date: "20240411",
//       schedule_relationship: "SCHEDULED",
//       route_id: "3946_63139",
//       direction_id: 1,
//     },
//     position: {
//       latitude: 53.2185326,
//       longitude: -6.86348486,
//     },
//     timestamp: "1712840847",
//     vehicle: {
//       id: "4",
//     },
//   },
// };

const handler: ApiHandler<VehicleUpdatesResponse> = async (
  req: NextApiRequest,
  res: NextApiResponse<VehicleUpdatesResponse | ApiErrorResponse>,
) => {
  const { lat, lng, rad } = req.query;

  if (
    typeof lat !== "string" ||
    typeof lng !== "string" ||
    typeof rad !== "string"
  ) {
    // shouldn't happen
    console.error("Shouldn't happen: lat or long was an array...");
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  console.log("Vehicle updates called:", new Date().toLocaleString());

  const geoRecordsKey = "vehicleGeo";
  const vehicleTripsKey = "vehicleTrips";

  // try fetch cached data
  const geoRecords = await redis.exists(geoRecordsKey);

  // let idArray: string[] = [];

  if (geoRecords) {
    const vehicleRecords = await redis.georadius(
      geoRecordsKey,
      lng,
      lat,
      Number(rad) / 2,
      REDIS_DISTANCE_UNIT,
    );

    const vehicleUpdates = vehicleRecords.map<NTAVehicleUpdate>((record) =>
      JSON.parse(record as string),
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

  // const batchedVehicleTrips = new Map<string, string>();
  const vehiclesWithinRadius: NTAVehicleUpdate[] = [];
  // const addedTrips: [string, TripUpdate][] = [];

  const mapCenter = point([Number(lat), Number(lng)]);

  for (const { vehicle } of data.entity) {
    // this is the vehicle feed, it will not be undefined,
    if (!vehicle) continue;

    if (
      !vehicle.trip?.tripId ||
      !vehicle.position?.latitude ||
      !vehicle.position.longitude
    ) {
      //just in case this is invalid
      continue;
    }
    // batchedVehicleTrips.set(vehicle.trip.tripId, JSON.stringify(vehicle));

    await redis.geoadd(
      geoRecordsKey,
      vehicle.position.longitude,
      vehicle.position.latitude,
      JSON.stringify(vehicle),
    );

    const to = point([vehicle.position.latitude, vehicle.position.longitude]);

    const distanceFromCenter = distance(mapCenter, to, DISTANCE_OPTIONS);

    if (distanceFromCenter <= Number(rad) / 2) {
      vehiclesWithinRadius.push(
        // NTA Vehicle update does not fully match GTFS spec
        vehicle as unknown as NTAVehicleUpdate,
      );
    }

    // Upstash has an hmset size limit of 1048576 bytes. Batch updates to stay under this threshold.
    // if (batchedVehicleTrips.size > BATCH_LIMIT) {
    //   await redis.hmset(vehicleTripsKey, batchedVehicleTrips);
    //   batchedVehicleTrips.clear();
    // }
  }

  // if (batchedVehicleTrips.size) {
  //   // Adds the specified geospatial items (longitude, latitude, name)
  //   await redis.hmset(vehicleTripsKey, batchedVehicleTrips);
  // }

  // expire after 120 seconds
  redis.expire(vehicleTripsKey, REDIS_CACHE_EXPIRE_SECONDS);
  redis.expire(geoRecordsKey, REDIS_CACHE_EXPIRE_SECONDS);

  return res.status(200).json({ vehicleUpdates: vehiclesWithinRadius });
};

export default withErrorHandler(handler);
