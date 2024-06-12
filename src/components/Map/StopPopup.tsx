import { Popup } from "react-leaflet";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { useCallback, useMemo } from "react";
import { StopTime } from "@prisma/client";
import LiveMarkerTooltip from "./LiveMarkerTooltip";
import { useQueryState } from "nuqs";
import { TripUpdate } from "@/types/realtime";
import { StopWithTimes } from "./MapContentLayer";
import {
  formatReadableDelay,
  getDelayedTime,
  getDelayedTimeFromTripUpdate,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import LiveText from "../LiveText";

type Props = {
  show: boolean;
  handleDestinationStop: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string, showModal?: boolean) => void;
  realtimeTrip: TripUpdate | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  stopWithTimes: StopWithTimes;
};

function StopPopup({
  show, // React doesn't rerender popup content without this Prop
  handleDestinationStop,
  handleSaveStop,
  handleSelectedStop,
  realtimeTrip,
  stopTimesByStopId,
  stopWithTimes,
}: Props) {
  const { stopId, stopCode, stopName } = stopWithTimes.stop;
  const [selectedStopId] = useQueryState("stopId", { history: "push" });

  const { arrivalTime, stopSequence } = stopWithTimes.times?.at(0) || {};

  const thisStopUpdate = realtimeTrip?.stopTimeUpdate?.find(
    ({ stopId: thisId }) => stopId === thisId,
  );

  const { arrival: activeArrivalUpdate, departure: activeDepartureUpdate } =
    thisStopUpdate ?? realtimeTrip?.stopTimeUpdate?.at(-1) ?? {};

  const delayedArrivalTime = getDelayedTime(
    arrivalTime,
    activeArrivalUpdate?.delay || activeDepartureUpdate?.delay,
  );

  const formattedDelay = formatReadableDelay(
    activeArrivalUpdate?.delay || activeDepartureUpdate?.delay,
  );

  const isEarly = activeArrivalUpdate?.delay
    ? activeArrivalUpdate?.delay < 0
    : activeDepartureUpdate?.delay
      ? activeDepartureUpdate.delay < 0
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
  const liveTextColor =
    status === "late" ? "alert" : status === "early" ? "info" : "default";

  const hasArrivalTime = !!arrivalTime;

  const isPastThisStop = delayedArrivalTime
    ? isPastArrivalTime(delayedArrivalTime)
    : arrivalTime
      ? isPastArrivalTime(arrivalTime)
      : false;

  const handleArrivalCountdown = useCallback(() => {
    const delayedArrivalTime = getDelayedTimeFromTripUpdate(
      stopWithTimes.times?.at(0),
      realtimeTrip,
    );

    if (!delayedArrivalTime || isPastArrivalTime(delayedArrivalTime)) return "";

    const arrivalSeconds = getDifferenceInSeconds(
      delayedArrivalTime ?? arrivalTime,
    );

    const delay = formatReadableDelay(arrivalSeconds);

    return delay ?? "";
  }, [arrivalTime, realtimeTrip, stopWithTimes.times]);

  return (
    <Popup>
      <p>Stop {stopCode ?? stopId}</p>
      <h3 className="text-lg font-bold">{stopName}</h3>
      {!!arrivalTime && (
        <p className="!mb-0">
          <b>Scheduled arrival</b>: {arrivalTime}
        </p>
      )}

      {hasArrivalTime && !isPastThisStop && (
        <p className="font-bold">
          <LiveText
            content={handleArrivalCountdown}
            color={liveTextColor}
            tooltip="marker"
          />
        </p>
      )}

      {hasArrivalTime && !isPastThisStop && (
        <>
          {!!formattedDelay && status === "early" && (
            <p className="!mt-2 !mb-2">
              <span className="text-green-700 dark:text-green-500">
                {formattedDelay}
              </span>{" "}
              early <LiveMarkerTooltip />
            </p>
          )}
          {!!formattedDelay && status === "late" && (
            <p className="!mt-2 !mb-2">
              <span className="text-red-700 dark:text-red-500">
                {formattedDelay}
              </span>{" "}
              late <LiveMarkerTooltip />
            </p>
          )}
        </>
      )}

      <div className="flex flex-col gap-2 mt-4">
        <Button
          onClick={() => handleSelectedStop(stopId, false)}
          disabled={isPastThisStop}
        >
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
}

export default StopPopup;
