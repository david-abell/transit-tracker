import { HelpCircle } from "lucide-react";
import Tooltip from "../Tooltip";

function LiveMarkerTooltip() {
  return (
    <Tooltip sideOffset={-100}>
      <h3 className="font-bold mt-8 mb-3">
        {" "}
        <HelpCircle className="text-green-700 dark:text-green-500 absolute inset-4" />
        How is this calculated?
      </h3>
      <p>
        This is the last known delay in seconds from the TFI live vehicle feed
        (updated every five minutes).
      </p>
      <br />
      <p>It should not be treated as 100% accurate.</p>
    </Tooltip>
  );
}

export default LiveMarkerTooltip;
