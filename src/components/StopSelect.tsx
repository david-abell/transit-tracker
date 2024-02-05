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
import { RefObject } from "react";

type PickupVariantProps = {
  stopList: Stop[];
  container?: RefObject<HTMLElement>;
  variant: "pickup";
};

type DropoffVariantProps = {
  stopList: [Stop, StopTime][];
  container?: RefObject<HTMLElement>;
  variant: "dropoff";
};

type Props = (PickupVariantProps | DropoffVariantProps) & {
  handler: (stopId: string) => void;
};

const QUERY_KEY = {
  pickup: "stopId",
  dropoff: "destId",
} as const;

const PLACEHOLDER_TEXT = {
  pickup: "Select a pickup stop or use the map",
  dropoff: "Select a destination stop or use the map",
} as const;

function StopSelect({
  stopList,
  container,
  variant = "pickup",
  handler,
}: Props) {
  const queryKey = QUERY_KEY[variant];
  const [stopId] = useQueryState(queryKey, parseAsString.withDefault(""));

  return (
    <Select onValueChange={handler} value={stopId} disabled={!stopList.length}>
      <SelectTrigger>
        <SelectValue placeholder={PLACEHOLDER_TEXT[variant]} />
      </SelectTrigger>
      <SelectContent container={container?.current || undefined}>
        {variant === "pickup"
          ? (stopList as Stop[]).flatMap(({ stopCode, stopName, stopId }) => {
              if (!stopName) return [];
              return (
                <SelectItem
                  className="capitalize"
                  value={stopId}
                  key={variant + stopId + stopName}
                >
                  {stopCode ?? stopId}: {stopName}
                </SelectItem>
              );
            })
          : (stopList as [Stop, StopTime][]).flatMap(
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
