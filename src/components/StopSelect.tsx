import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stop, StopTime } from "@prisma/client";
import { useQueryState, parseAsString } from "nuqs";
import { RefObject, useEffect, useRef } from "react";

type Props = {
  stopList: [Stop, StopTime][];
  container?: RefObject<HTMLElement>;
  variant?: "pickup" | "dropoff";
};

const QUERY_KEY = {
  pickup: "stopId",
  dropoff: "destId",
} as const;

const PLACEHOLDER_TEXT = {
  pickup: "Select a pickup stop.",
  dropoff: "Select a destination stop.",
} as const;

function StopSelect({ stopList, container, variant = "dropoff" }: Props) {
  const queryKey = QUERY_KEY[variant];
  const [stopId, setStopId] = useQueryState(
    queryKey,
    parseAsString.withDefault(""),
  );

  return (
    <Select
      onValueChange={(value) => setStopId(value)}
      value={stopId}
      disabled={!stopList.length}
    >
      <SelectTrigger>
        <SelectValue placeholder={PLACEHOLDER_TEXT[variant]} />
      </SelectTrigger>
      <SelectContent container={container?.current || undefined}>
        {stopList.flatMap(
          ([{ stopCode, stopName, stopId }, { arrivalTime }]) => {
            if (!stopName) return [];
            return (
              <SelectItem
                className="capitalize"
                value={stopId}
                key={variant + stopId + stopName + arrivalTime}
              >
                {stopCode ?? stopId}: {stopName} -{" "}
                <span>{arrivalTime ?? ""}</span>
              </SelectItem>
            );
          },
        )}
      </SelectContent>
    </Select>
  );
}

export default StopSelect;
