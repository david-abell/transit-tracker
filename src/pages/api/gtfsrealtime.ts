import type { NextApiRequest, NextApiResponse } from "next";
import type { GTFSRealtime } from "gtfs-types";

import gtfsRealtime from "../../testdata/gtfsrealtime.json";

export type GTFSResponse = typeof gtfsRealtime;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  res.status(200).json(gtfsRealtime);
}
