import { HelpCircle } from "lucide-react";
import Tooltip from "../Tooltip";

function LiveTooltip() {
  return (
    <Tooltip sideOffset={-100}>
      <h3 className="font-bold mt-8 mb-3">
        {" "}
        <HelpCircle className="text-green-700 dark:text-green-500 absolute inset-4" />
        How is this vehicle position calculated?
      </h3>
      <p>This estimate is a combination of</p>
      <ul className="list-disc [&>li]:ml-6 [&>*:first-child]:pt-2 [&>*:last-child]:mb-2">
        <li>The vehicle&apos;s scheduled position.</li>
        <li>
          The last known delay in seconds from the TFI live vehicle feed.
          (updated every five minutes)
        </li>
      </ul>
      <p>It should not be treated as 100% accurate.</p>
    </Tooltip>
  );
}

export default LiveTooltip;
