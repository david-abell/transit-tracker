import Select, {
  ActionMeta,
  OnChangeValue,
  SelectInstance,
  SingleValue,
} from "react-select";
import { Stop, StopTime } from "@prisma/client";
import { useQueryState, parseAsString } from "nuqs";
import { RefObject, useEffect, useState } from "react";

type PickupVariantProps = {
  stopList: Stop[] | undefined;
  variant: "pickup";
};

type DropoffVariantProps = {
  stopList: [Stop, StopTime][] | undefined;
  variant: "dropoff";
};

type Props = {
  handler: (stopId: string) => void;
  stopId: string | null;
  stopList?: Stop[];
  variant: "pickup";
};

const QUERY_KEY = {
  pickup: "stopId",
  dropoff: "destId",
} as const;

const PLACEHOLDER_TEXT = {
  pickup: "Select a pickup stop or use the map",
  dropoff: "Select a destination stop or use the map",
} as const;

function StopSelect({ stopList, variant = "pickup", handler, stopId }: Props) {
  const queryKey = QUERY_KEY[variant];
  const [selectedOption, setSelectedOption] = useState<Stop | null>(null);

  useEffect(() => {
    const newId = stopList?.find((stop) => stop.stopId === stopId);

    if (!newId) {
      setSelectedOption(null);
    } else {
      if (stopId && selectedOption?.stopId !== stopId) {
        setSelectedOption(newId);
      }
    }
  }, [selectedOption, stopId, stopList]);

  const handleChange = (option: Stop | null) => {
    if (option) {
      setSelectedOption(option);
      handler(option.stopId);
    }
  };

  const handleOptionLabel = ({ stopCode, stopId, stopName }: Stop) => {
    return `${stopCode || stopId}: ${stopName ?? "Un-named stop"}`;
  };
  const handleOptionValue = ({ stopCode, stopId, stopName }: Stop) => stopId;

  return (
    <Select
      defaultValue={null}
      value={selectedOption}
      onChange={handleChange}
      options={stopList}
      getOptionLabel={handleOptionLabel}
      getOptionValue={handleOptionValue}
      className="z-[1200] min-w-[8rem] w-full"
      placeholder={
        selectedOption
          ? selectedOption.stopName || "Unnamed stops"
          : "Select a pickup stop or use the map"
      }
    >
      {/* <SelectTrigger>
        <SelectValue placeholder={PLACEHOLDER_TEXT[variant]} />
      </SelectTrigger> */}
      {/* <SelectContent container={container?.current || undefined}> */}
      {/* {variant === "pickup"
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
            )} */}
      {/* </SelectContent> */}
    </Select>
  );
}

export default StopSelect;
