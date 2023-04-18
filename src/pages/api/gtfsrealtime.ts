import type { NextApiRequest, NextApiResponse } from "next";
import type { GTFSRealtime } from "gtfs-types";

// export type GTFSResponse = typeof gtfsRealtime;

export type GTFSRealtimeResponse = GTFSRealtime["response"];

import gtfsRealtime from "@/testdata/gtfsrealtime2.json";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSRealtimeResponse>
) {
  res.status(200).json(gtfsRealtime as GTFSRealtimeResponse);
}
