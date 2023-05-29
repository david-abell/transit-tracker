import type { NextApiRequest, NextApiResponse } from "next";

import { GTFSResponse } from "@/types/realtime";
import withErrorHandler from "@/lib/withErrorHandler";
import { ApiError } from "next/dist/server/api-utils";
const API_KEY = process.env.NTA_REALTIME_API_KEY;

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  console.log("realtime called:", new Date().toLocaleString());
  const response = await fetch(
    "https://api.nationaltransport.ie/gtfsr/v2/gtfsr?format=json",
    {
      method: "GET",
      // Request headers
      headers: {
        "x-api-key": API_KEY as string,
      },
    }
  );
  if (!response.ok) {
    throw new ApiError(response.status, response.statusText);
  }
  const data = await response.json();
  res.status(200).json(data);
}

export default withErrorHandler(handler);
