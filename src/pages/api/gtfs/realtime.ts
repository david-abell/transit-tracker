import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;
import { createRedisInstance } from "@/lib/redis/createRedisInstance";

const API_URL =
  "https://api.nationaltransport.ie/gtfsr/v2/TripUpdates?format=json";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  console.log("realtime called:", new Date().toLocaleString());

  const redis = createRedisInstance();
  const key = "realtime-trip-updates";

  // try fetch cached data
  const cached = redis ? await redis?.get(key) : undefined;

  // if cached, we're good!
  if (cached) {
    console.log(`redis cache hit for: ${key}`);
    res.status(200).send(cached as unknown as GTFSResponse);
    return;
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

  const data = await response.json();

  console.log(`redis cache miss, setting new data to: ${key}`);

  const MAX_AGE = 60_000 * 60; // 1 hour
  const EXPIRY_MS = `PX`; // milliseconds
  await redis?.set(key, JSON.stringify(data), EXPIRY_MS, MAX_AGE);

  res.status(200).json(data);
}

export default withErrorHandler(handler);
