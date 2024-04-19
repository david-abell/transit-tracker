import { Popup } from "react-leaflet";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { memo, useMemo } from "react";
import { StopTime } from "@prisma/client";
import LiveMarkerTooltip from "./LiveMarkerTooltip";
import { useQueryState } from "nuqs";
import { TripUpdate } from "@/types/realtime";
import { StopWithTimes } from "./MapContentLayer";
import { formatReadableDelay, getDelayedTime } from "@/lib/timeHelpers";

type Props = {
  handleDestinationStop: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string, showModal?: boolean) => void;
  realtimeTrip: TripUpdate | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  stopWithTimes: StopWithTimes;
};

const StopPopup = memo(function StopPopup({
  handleDestinationStop,
  handleSaveStop,
  handleSelectedStop,
  realtimeTrip,
  stopTimesByStopId,
  stopWithTimes,
}: Props) {
  const { stopId, stopCode, stopName } = stopWithTimes.stop;
  const [selectedStopId] = useQueryState("stopId", { history: "push" });

  const { arrivalTime, departureTime, stopSequence } =
    stopWithTimes.times?.at(0) || {};

  const closestStopUpdate =
    realtimeTrip?.stopTimeUpdate?.find(
      ({ stopId, stopSequence: realtimeSequence }) =>
        stopId === selectedStopId ||
        (stopSequence && realtimeSequence >= stopSequence),
    ) || realtimeTrip?.stopTimeUpdate?.at(-1);

  // arrival delay is sometimes very wrong from realtime api exa. -1687598071
  const { arrival, departure } = closestStopUpdate || {};

  const delayedArrivalTime = getDelayedTime(
    departureTime,
    arrival?.delay || departure?.delay,
  );

  const formattedDelay = formatReadableDelay(
    arrival?.delay || departure?.delay,
  );

  const isEarly = arrival?.delay
    ? arrival?.delay < 0
    : departure?.delay
      ? departure.delay < 0
      : false;

  const selectedStoptime = useMemo(
    () => selectedStopId && stopTimesByStopId.get(selectedStopId),
    [selectedStopId, stopTimesByStopId],
  );

  const isValidDestination =
    (selectedStoptime &&
      stopSequence &&
      selectedStoptime.stopSequence < stopSequence) ||
    false;

  const status = isEarly ? "early" : !!formattedDelay ? "late" : "default";

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
              <span className="text-green-700 dark:text-green-500">
                {formattedDelay}
              </span>{" "}
              early <LiveMarkerTooltip />
            </p>
          )}
          {!!formattedDelay && status === "late" && (
            <p className="text-lg">
              <span className="text-red-700 dark:text-red-500">
                {formattedDelay}
              </span>{" "}
              late <LiveMarkerTooltip />
            </p>
          )}
        </>
      )}
      <div className="flex flex-col gap-2 mt-4">
        <Button onClick={() => handleSelectedStop(stopId, false)}>
          Board here
        </Button>

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
          <Star fill="#facc15" color="#facc15" />
          <span>Favourite</span>
          <Star fill="#facc15" color="#facc15" />
        </Button>
      </div>
    </Popup>
  );
});

export default StopPopup;
