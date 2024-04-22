import { HelpCircle } from "lucide-react";
import Tooltip from "../Tooltip";

// Next.js throws an error when this is imported from the server api file realtime.ts
const REDIS_CACHE_EXPIRE_SECONDS = 120;

function LiveMarkerTooltip() {
  return (
    <Tooltip sideOffset={-100}>
      <h3 className="font-bold mt-8 mb-3">
        <HelpCircle className="text-green-700 dark:text-green-500 absolute inset-4" />
        How is this calculated?
      </h3>
      <p>
        {`the last known delay in seconds from the TFI live vehicle feed.
          [updated every ${REDIS_CACHE_EXPIRE_SECONDS / 60} minutes]`}
      </p>
      <br />
      <p>It should not be treated as 100% accurate.</p>
    </Tooltip>
  );
}

export default LiveMarkerTooltip;
