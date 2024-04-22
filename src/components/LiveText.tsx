import { useState } from "react";
import { useInterval } from "usehooks-ts";
import LiveMarkerTooltip from "./Map/LiveMarkerTooltip";
import LiveVehicleTooltip from "./Map/LiveVehicleTooltip";
import { cn } from "@/lib/utils";

export type LiveTextColor = "alert" | "caution" | "info" | "default";

type Props = {
  className?: string;
  content: string | (() => string);
  contentBefore?: string;
  contentAfter?: string;
  color?: LiveTextColor;
  delayInSeconds?: number;
  tooltip?: "marker" | "vehicle";
};

const colors = {
  alert: "text-red-700 dark:text-red-500",
  caution: "text-yellow-700 dark:text-yellow-500",
  info: "text-green-700 dark:text-green-500",
  default: "",
};

function LiveText({
  className = "",
  content,
  contentBefore,
  contentAfter = "",
  color = "default",
  delayInSeconds = 1,
  tooltip,
}: Props) {
  const [textContent, setTextContent] = useState(
    typeof content === "string" ? content : content(),
  );

  useInterval(() => {
    setTextContent(typeof content === "string" ? content : content());
  }, delayInSeconds * 1000);
  return (
    <span className={cn(className, "whitespace-nowrap text-lg ")}>
      {!!contentBefore && <span>{contentBefore} </span>}
      <span className={cn("font-bold", colors[color])}>{textContent}</span>
      <span>{contentAfter} </span>
      {textContent && tooltip === "marker" && <LiveMarkerTooltip />}
      {textContent && tooltip === "vehicle" && <LiveVehicleTooltip />}
    </span>
  );
}

export default LiveText;
