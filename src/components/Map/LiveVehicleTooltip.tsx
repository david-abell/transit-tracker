import { HelpCircle } from "lucide-react";
import Tooltip from "../Tooltip";

// Next.js throws an error when this is imported from the server api file realtime.ts
const REDIS_CACHE_EXPIRE_SECONDS = 120;

function LiveTooltip() {
  return (
    <Tooltip sideOffset={-100}>
      <h3 className="font-bold mt-8 mb-3">
        {" "}
        <HelpCircle className="text-green-700 dark:text-green-500 absolute inset-4" />
        How is this vehicle position calculated?
      </h3>
      <p>This estimate is a combination of:</p>
      <ul className="list-disc [&>li]:ml-6 [&>*:first-child]:pt-2 [&>*:last-child]:mb-2">
        <li>the vehicle&apos;s scheduled position.</li>
        <li>
          {`the last known delay in seconds from the TFI live vehicle feed.
          [updated every ${REDIS_CACHE_EXPIRE_SECONDS / 60} minutes]`}
        </li>
      </ul>
      <p>It does not include:</p>
      <ul className="list-disc [&>li]:ml-6 [&>*:first-child]:pt-2 [&>*:last-child]:mb-2">
        <li>Traffic congestion, construction, or signals.</li>
        <li>Whether the vehicle is currently moving or stationary.</li>
      </ul>
    </Tooltip>
  );
}

export default LiveTooltip;
