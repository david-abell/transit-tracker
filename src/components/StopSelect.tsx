import Select from "react-select";
import { Stop } from "@prisma/client";
import { useEffect, useState } from "react";

type Props = {
  handler: (stopId: string) => void;
  stopId: string | null;
  stopList?: Stop[];
  variant: "pickup";
};

function StopSelect({ stopList, handler, stopId }: Props) {
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
  const handleOptionValue = ({ stopId }: Stop) => stopId;

  const disabled = !stopList?.length;

  return (
    <Select
      isDisabled={disabled}
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
          : disabled
            ? ""
            : "Select a pickup stop or use the map"
      }
    ></Select>
  );
}

export default StopSelect;
