import { Popup, useMap } from "react-leaflet";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { StopTime } from "@prisma/client";
import LiveMarkerTooltip from "./LiveMarkerTooltip";
import { useQueryState } from "nuqs";
import { TripUpdate } from "@/types/realtime";
import {
  formatReadableDelay,
  getDelayedTime,
  getDelayedTimeFromTripUpdate,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import LiveText from "../LiveText";
import { StopWithGroupedTimes } from "@/types/gtfsDerived";

type Props = {
  show: boolean;
  onDestinationChange: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  onPickupChange: (stopId: string, showModal?: boolean) => void;
  realtimeTrip: TripUpdate | undefined;
  setShowPopup: Dispatch<SetStateAction<boolean>>;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  stopWithTimes: StopWithGroupedTimes;
};

function StopPopup({
  show, // React doesn't rerender popup content without this Prop
  onDestinationChange,
  handleSaveStop,
  onPickupChange,
  realtimeTrip,
  setShowPopup,
  stopTimesByStopId,
  stopWithTimes,
}: Props) {
  const { stopId, stopCode, stopName } = useMemo(
    () => stopWithTimes.stop,
    [stopWithTimes.stop],
  );
  const [selectedStopId] = useQueryState("stopId", { history: "push" });
  const map = useMap();

  const { arrivalTime, stopSequence } =
    stopWithTimes.times?.at(0)?.stopTime || {};

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
      stopWithTimes.times?.at(0)?.stopTime,
      realtimeTrip,
    );

    if (!delayedArrivalTime || isPastArrivalTime(delayedArrivalTime)) return "";

    const arrivalSeconds = getDifferenceInSeconds(
      delayedArrivalTime ?? arrivalTime,
    );

    const delay = formatReadableDelay(arrivalSeconds);

    return delay ?? "";
  }, [arrivalTime, realtimeTrip, stopWithTimes.times]);

  const handlePickupStop = (stopId: string, showTripSelect: boolean = true) => {
    if (map && showTripSelect) {
      map.closePopup();
    }
    setShowPopup(false);
    onPickupChange(stopId, showTripSelect);
  };

  return (
    <Popup keepInView closeOnEscapeKey>
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
          onClick={() => handlePickupStop(stopId, false)}
          disabled={isPastThisStop}
        >
          Board here
        </Button>

        <Button onClick={() => handlePickupStop(stopId)}>View trips</Button>
        <Button
          onClick={() => onDestinationChange(stopId)}
          disabled={!isValidDestination}
        >
          set Destination
        </Button>
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
