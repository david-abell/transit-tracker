import Select from "react-select";
import { Stop, StopTime } from "@prisma/client";
import { useEffect, useState } from "react";

export type StopAndStopTime = { stop: Stop; stopTime: StopTime };

type Props = {
  handler: (stopId: string) => void;
  stopId: string | null;
  stopList: StopAndStopTime[];
};

function DestinationSelect({ stopList, handler, stopId }: Props) {
  const [selectedOption, setSelectedOption] = useState<StopAndStopTime | null>(
    null,
  );

  useEffect(() => {
    const newSelection = stopList?.find(({ stop }) => stop.stopId === stopId);

    if (newSelection && stopId && selectedOption?.stop.stopId !== stopId) {
      setSelectedOption(newSelection);
    }

    if (!newSelection) {
      setSelectedOption(null);
    }
  }, [selectedOption, stopId, stopList]);

  const handleChange = (option: StopAndStopTime | null) => {
    if (option) {
      setSelectedOption(option);
      handler(option.stop.stopId);
    }
  };

  const handleOptionLabel = ({ stop, stopTime }: StopAndStopTime) => {
    const { stopCode, stopId, stopName } = stop;
    const { arrivalTime } = stopTime;

    return `${stopCode || stopId}: ${stopName ?? "Unnamed stop"} - ${arrivalTime ?? ""}`;
  };
  const handleOptionValue = ({ stop }: StopAndStopTime) => stop.stopId;

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
      className="z-[1200] min-w-[8rem] w-full [isDisabled]:cursor-not-allowed"
      placeholder={
        selectedOption
          ? selectedOption.stop.stopName || "Unnamed stops"
          : disabled
            ? ""
            : "Select a destination stop or use the map"
      }
    ></Select>
  );
}

export default DestinationSelect;
