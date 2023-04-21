import type { NextApiRequest, NextApiResponse } from "next";

import gtfsRealtime from "@/testdata/gtfsrealtime2.json";
import { GTFSResponse } from "@/types/realtime";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  res.status(200).json(gtfsRealtime as GTFSResponse);
}
