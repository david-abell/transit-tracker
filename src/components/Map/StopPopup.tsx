import { Popup } from "react-leaflet";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { memo } from "react";
import { Stop } from "@prisma/client";
import { StopTimeUpdate } from "@/types/realtime";

type Props = {
  arrivalTime: string;
  delayedArrivalTime: string | null;
  formattedDelay: string | undefined;
  handleDestinationStop: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string) => void;
  isValidDestination: boolean;
  status?: "early" | "late" | "default";
  stop: Stop;
};

const StopPopup = memo(function StopPopup({
  arrivalTime,
  delayedArrivalTime,
  formattedDelay,
  handleDestinationStop,
  handleSaveStop,
  handleSelectedStop,
  isValidDestination,
  status = "default",
  stop,
}: Props) {
  const { stopId, stopCode, stopName } = stop;
  return (
    <Popup interactive>
      <p>Stop {stopCode}</p>
      <h3 className="text-lg font-bold">{stopName}</h3>
      {!!arrivalTime && (
        <p className="!mb-0">
          <b>Scheduled arrival</b>: {arrivalTime}
        </p>
      )}
      {status !== "default" && (
        <>
          <p className="tooltip-schedule-change !mt-0">
            <b>Estimated arrival</b>: {delayedArrivalTime ?? ""}
          </p>
          {!!formattedDelay && status === "early" && (
            <p className="text-lg">
              <span className="text-green-900">{formattedDelay}</span> early
            </p>
          )}
          {!!formattedDelay && status === "late" && (
            <p className="text-lg">
              <span className="text-red-700 dark:text-red-500">
                {formattedDelay}
              </span>{" "}
              late
            </p>
          )}
        </>
      )}
      <div className="flex flex-col gap-2 mt-4">
        <Button onClick={() => handleSelectedStop(stopId)}>View trips</Button>
        {isValidDestination && (
          <Button onClick={() => handleDestinationStop(stopId)}>
            set Destination
          </Button>
        )}
        <Button
          onClick={() => handleSaveStop(stopId, stopName)}
          className="flex flex-row justify-between gap-1"
        >
          <Star className="text-yellow-400" />
          <span>Favourite</span>
          <Star className="inline-block h-5 w-5 text-yellow-400" />
        </Button>
      </div>
    </Popup>
  );
});

export default StopPopup;
