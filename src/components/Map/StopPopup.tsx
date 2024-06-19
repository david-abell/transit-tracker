import { Popup, useMap } from "react-leaflet";
import { Button } from "../ui/button";
import { Star } from "lucide-react";
import { Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { StopTime } from "@prisma/client";
import LiveMarkerTooltip from "./LiveMarkerTooltip";
import { useQueryState } from "nuqs";
import {
  formatReadableDelay,
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
  setShowPopup: Dispatch<SetStateAction<boolean>>;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  stopWithTimes: StopWithGroupedTimes;
  isLast: boolean;
};

function StopPopup({
  isLast,
  show, // React doesn't rerender popup content without this Prop
  onDestinationChange,
  handleSaveStop,
  onPickupChange,
  setShowPopup,
  stopTimesByStopId,
  stopWithTimes,
}: Props) {
  const { stopId, stopCode, stopName } = useMemo(
    () => stopWithTimes.stop,
    [stopWithTimes.stop],
  );
  const [pickupStopId] = useQueryState("stopId", { history: "push" });
  const map = useMap();

  const nextGroupedTimes = stopWithTimes.times?.find(
    ({ stopTime }) =>
      !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  );

  const { arrivalTime, stopSequence } = nextGroupedTimes?.stopTime || {};

  const { arrival, departure } = nextGroupedTimes?.stopTimeUpdate || {};

  const formattedDelay = formatReadableDelay(
    arrival?.delay || departure?.delay,
  );

  const isEarly = arrival?.delay
    ? arrival?.delay < 0
    : departure?.delay
      ? departure.delay < 0
      : false;

  const selectedStoptime = useMemo(
    () => pickupStopId && stopTimesByStopId.get(pickupStopId),
    [pickupStopId, stopTimesByStopId],
  );

  const isValidDestination =
    (selectedStoptime &&
      stopSequence &&
      selectedStoptime.stopSequence < stopSequence) ||
    false;

  const status = isEarly ? "early" : !!formattedDelay ? "late" : "default";
  const liveTextColor =
    status === "late" ? "alert" : status === "early" ? "info" : "default";

  const isPastThisStop = arrivalTime ? isPastArrivalTime(arrivalTime) : false;

  const handleArrivalCountdown = useCallback(() => {
    const arrivalTime = stopWithTimes.times?.find(
      ({ stopTime }) =>
        !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
    )?.stopTime?.arrivalTime;

    if (!arrivalTime || isPastArrivalTime(arrivalTime)) return "";

    const arrivalSeconds = getDifferenceInSeconds(arrivalTime);

    const delay = formatReadableDelay(arrivalSeconds);

    return delay ?? "";
  }, [stopWithTimes.times]);

  const handlePickupStop = (stopId: string, showTripSelect: boolean = true) => {
    if (map && showTripSelect) {
      map.closePopup();
    }
    setShowPopup(false);
    onPickupChange(stopId, showTripSelect);
  };

  return (
    <Popup keepInView closeOnEscapeKey>
      <div className="[&_p]:!mb-1 [&_p]:!mt-1 [&_b]:!mt-1">
        <p className="!mb-1">Stop {stopCode ?? stopId}</p>
        <h3 className="text-lg font-bold">{stopName}</h3>
        {!!arrivalTime && (
          <p>
            <b>Arriving</b>: {arrivalTime}
          </p>
        )}

        {!!arrivalTime && !isPastThisStop && (
          <p className="font-bold">
            <LiveText
              content={handleArrivalCountdown}
              color={liveTextColor}
              tooltip="marker"
            />
          </p>
        )}

        {!!arrivalTime && !isPastThisStop && (
          <>
            {!!formattedDelay && status === "early" && (
              <p>
                <span className="text-green-700 dark:text-green-500">
                  {formattedDelay}
                </span>{" "}
                early <LiveMarkerTooltip />
              </p>
            )}
          </>
        )}

        <div className="flex flex-col gap-2 mt-1">
          <Button
            onClick={() => handlePickupStop(stopId, false)}
            disabled={isPastThisStop || isLast}
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
      </div>
    </Popup>
  );
}

export default StopPopup;
