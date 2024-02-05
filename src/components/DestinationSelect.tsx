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
};

function DestinationSelect({ stopList, container }: Props) {
  const [destId, setDestId] = useQueryState(
    "destId",
    parseAsString.withDefault(""),
  );

  return (
    <Select
      onValueChange={(value) => setDestId(value)}
      value={destId}
      disabled={!stopList.length}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a destination" />
      </SelectTrigger>
      <SelectContent container={container?.current || undefined}>
        {stopList.flatMap(
          ([{ stopCode, stopName, stopId }, { arrivalTime }]) => {
            if (!stopName) return [];
            return (
              <SelectItem
                className="capitalize"
                value={stopId}
                key={"dest" + stopId + stopName + arrivalTime}
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

export default DestinationSelect;
