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
import { retryAsync } from "ts-retry";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/Vehicles?format=json";

const REDIS_CACHE_EXPIRE_SECONDS = 120;

type GeoRecord = [string, number, number];
const DISTANCE_OPTIONS = { units: "kilometers" } as const;
const REDIS_DISTANCE_UNIT = "KM";

let isFetching = false;
const GEO_RECORDS_KEY = "vehicleGeo";

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
    console.error("Shouldn't happen: lat or lng was an array...");
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  console.log("Vehicle updates called:", new Date().toLocaleString());

  // try fetch cached data
  let geoRecords = await redis.exists(GEO_RECORDS_KEY);

  if (isFetching) {
    try {
      await retryAsync(
        async () => {
          geoRecords = await redis.exists(GEO_RECORDS_KEY);
          return geoRecords;
        },
        {
          delay: 250,
          maxTry: 5,
          until: (lastResult) => lastResult === 1,
        },
      );
    } catch (err) {
      if (err instanceof Error) console.error(err.message);
    }
  }

  if (geoRecords) {
    const vehicleRecords = await redis.georadius(
      GEO_RECORDS_KEY,
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

  if (isFetching) {
    throw new ApiError(StatusCodes.LOCKED, ReasonPhrases.LOCKED);
  }

  isFetching = true;

  console.log("redis cache miss, setting new vehicle updates");

  const response = await fetch(API_URL, {
    method: "GET",
    headers: {
      "x-api-key": API_KEY as string,
    },
  });

  isFetching = false;

  if (!response.ok) {
    console.error(
      `[vehicle-updates] response error: Status: ${response.status}, StatusText: ${response.statusText}`,
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

  console.log("Downloaded %s vehicle updates", data?.entity?.length);

  const vehiclesWithinRadius: NTAVehicleUpdate[] = [];

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

    await redis.geoadd(
      GEO_RECORDS_KEY,
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
  }

  // expire after 120 seconds
  redis.expire(GEO_RECORDS_KEY, REDIS_CACHE_EXPIRE_SECONDS);

  return res.status(200).json({ vehicleUpdates: vehiclesWithinRadius });
};

export default withErrorHandler(handler);
