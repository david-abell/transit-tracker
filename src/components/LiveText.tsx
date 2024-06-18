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
  colorBefore?: boolean;
  contentAfter?: string;
  colorAfter?: boolean;
  color?: LiveTextColor;
  colorFn?: (textContent: string) => LiveTextColor;
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
  colorBefore = false,
  contentAfter = "",
  colorAfter = false,
  colorFn,
  color = "default",
  delayInSeconds = 1,
  tooltip,
}: Props) {
  const [textContent, setTextContent] = useState(
    typeof content === "string" ? content : content(),
  );

  const computedColor = colorFn ? colorFn(textContent) : color;

  useInterval(() => {
    setTextContent(typeof content === "string" ? content : content());
  }, delayInSeconds * 1000);

  if (!textContent) return null;

  return (
    <span
      className={cn(
        className,
        "whitespace-nowrap [&>span]:whitespace-nowrap text-lg inline-flex flex-row gap-1",
      )}
    >
      {!!contentBefore && (
        <span className={colorBefore ? colors[computedColor] : ""}>
          {contentBefore}{" "}
        </span>
      )}
      <span className={cn("font-bold", colors[computedColor])}>
        {textContent}
      </span>
      <span className={colorAfter ? colors[computedColor] : ""}>
        {contentAfter}{" "}
      </span>
      {textContent && tooltip === "marker" && (
        <span className="self-center [&>button]:flex">
          <LiveMarkerTooltip />
        </span>
      )}
      {textContent && tooltip === "vehicle" && (
        <span className="self-center [&>button]:flex">
          <LiveVehicleTooltip />
        </span>
      )}
    </span>
  );
}

export default LiveText;
