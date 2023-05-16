import type { NextApiRequest, NextApiResponse } from "next";

import gtfsRealtime from "@/testdata/gtfsrealtime2.json";
import { GTFSResponse } from "@/types/realtime";

const API_KEY = process.env.NTA_REALTIME_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  try {
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
      throw new Error(`statusText: ${response.statusText}`);
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    if (err instanceof Error) {
      console.error("api error", err);
    }
  }
}
