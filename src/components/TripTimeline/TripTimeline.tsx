import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";
import {
  formatReadableDelay,
  getDelayedTime,
  getDelayedTimeFromTripUpdate,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { TripUpdate } from "@/types/realtime";
import { Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useRef, MouseEvent, useCallback, useState } from "react";
import type { ValidStop } from "../Map/MapContentLayer";
import { LatLngTuple } from "leaflet";
import { Button } from "../ui/button";
import LiveText from "../LiveText";
import { StopAndStopTime } from "../DestinationSelect";
import { getStopsWithStopTimes } from "@/lib/utils";

type Props = {
  destinationId: string | null;
  destinationStops: StopAndStopTime[];
  handleDestinationStop: (stopId: string) => void;
  handleMapCenter: (latLon: LatLngTuple) => void;
  pickupStop: Stop | undefined;
  stopsById: Map<string, Stop>;
  stopTimes?: StopTime[];
  trip?: Trip;
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

type StopWithStopTime = { stop: ValidStop; stopTime: StopTime };

const MIN_TO_COLLAPSE = 3;

function TripTimeline({
  destinationId,
  destinationStops,
  handleDestinationStop,
  handleMapCenter,
  pickupStop,
  stopsById,
  stopTimes,
  tripUpdatesByTripId,
  trip,
}: Props) {
  const timelineRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const [showBeforeStops, setShowBeforeStops] = useState(false);
  const [showBetweenStops, setShowBetweenStops] = useState(false);

  const handleMouseDown = (e: MouseEvent<HTMLUListElement>) => {
    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (
    e: MouseEvent<HTMLButtonElement>,
    stop: ValidStop,
    toggle?: "toggleBefore" | "toggleBetween",
  ) => {
    const { x, y } = pointer.current;
    if (Math.abs(e.clientX - x) < 10 && Math.abs(e.clientY - y) < 10) {
      e.stopPropagation();
      if (toggle === "toggleBefore") {
        setShowBeforeStops((prev) => !prev);
      } else if (toggle === "toggleBetween") {
        setShowBetweenStops((prev) => !prev);
      } else {
        handleMapCenter([stop.stopLat, stop.stopLon]);
      }
    }
  };

  const tripUpdate = useMemo(
    () => trip && tripUpdatesByTripId.get(trip?.tripId),
    [tripUpdatesByTripId, trip],
  );

  const stopList = useMemo(
    () => getStopsWithStopTimes(stopsById, stopTimes, destinationId),
    [destinationId, stopTimes, stopsById],
  );

  const handleArrivalCountdown = useCallback(
    (stopTime: StopTime) => {
      const delayedArrivalTime = getDelayedTimeFromTripUpdate(
        stopTime,
        tripUpdate,
      );

      if (!delayedArrivalTime || isPastArrivalTime(delayedArrivalTime))
        return "";

      const arrivalSeconds = getDifferenceInSeconds(
        delayedArrivalTime ?? stopTime.arrivalTime,
      );

      const delay = formatReadableDelay(arrivalSeconds);

      return delay ?? "";
    },
    [tripUpdate],
  );

  const pickupIndex = useMemo(
    () =>
      pickupStop?.stopId
        ? stopList.findIndex(
            ({ stopTime }) => stopTime.stopId === pickupStop.stopId,
          )
        : -1,
    [pickupStop?.stopId, stopList],
  );

  if (!trip) return null;

  const currentStopIndex = stopList.findIndex(
    ({ stopTime }) =>
      !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  );

  const destinationIndex = stopList.findIndex(
    ({ stopTime }) => !!destinationId && stopTime.stopId === destinationId,
  );

  const beforeCollapseCount = pickupIndex;
  const betweenCollapseCount =
    destinationIndex > pickupIndex ? destinationIndex - pickupIndex - 1 : 0;

  return (
    <Timeline
      className="max-h-full"
      ref={timelineRef}
      onMouseDown={handleMouseDown}
    >
      {stopList.flatMap(({ stop, stopTime }, index) => {
        const { arrivalTime } = stopTime;
        const isPastStop = index <= currentStopIndex;
        const isBefore = index < pickupIndex;
        const isBetween = index > pickupIndex && index < destinationIndex;
        const isCollapsible =
          (beforeCollapseCount >= MIN_TO_COLLAPSE && isBefore) ||
          (betweenCollapseCount >= MIN_TO_COLLAPSE && isBetween);

        if (!showBeforeStops) {
          if (index === 0 && index !== pickupIndex) {
            return (
              <TimelineItem
                status="done"
                key={"timeline" + stopTime.stopId + stopTime.stopSequence}
              >
                <TimelineHeading className="whitespace-nowrap w-full flex flex-row gap-2 items-center">
                  <button
                    type="button"
                    onClick={(e) => handleMouseUp(e, stop, "toggleBefore")}
                  >
                    <span className="sr-only">Show </span>
                    {beforeCollapseCount} stops on route hidden...
                  </button>
                </TimelineHeading>
                <TimelineDot status="done" />
                {index !== stopList.length - 1 && <TimelineLine done={true} />}
              </TimelineItem>
            );
          }
          if (isBefore) return [];
        }
        if (!showBetweenStops) {
          if (index === pickupIndex + 1) {
            return (
              <TimelineItem
                status="done"
                key={"timeline" + stopTime.stopId + stopTime.stopSequence}
              >
                <TimelineHeading className="whitespace-nowrap w-full flex flex-row gap-2 items-center">
                  <button
                    type="button"
                    onClick={(e) => handleMouseUp(e, stop, "toggleBetween")}
                  >
                    <span className="sr-only">Show </span>
                    {betweenCollapseCount} more stops...
                  </button>
                </TimelineHeading>
                <TimelineDot status="done" />
                {index !== stopList.length - 1 && <TimelineLine done={true} />}
              </TimelineItem>
            );
          }
          if (isBetween) return [];
        }

        return (
          <TimelineItem
            status={isPastStop ? "done" : "default"}
            key={"timeline" + stopTime.stopId + stopTime.stopSequence}
          >
            <TimelineHeading className="whitespace-nowrap w-full flex flex-row gap-2 items-center">
              {stop.stopCode}: {stop.stopName}{" "}
              {!isPastStop && (
                <LiveText
                  content={() => handleArrivalCountdown(stopTime)}
                  color="info"
                  contentBefore=" - "
                />
              )}
              {isCollapsible && (
                <button
                  type="button"
                  onClick={(e) =>
                    handleMouseUp(
                      e,
                      stop,
                      isBefore ? "toggleBefore" : "toggleBetween",
                    )
                  }
                  className="underline"
                >
                  ... hide{" "}
                  {isBefore ? beforeCollapseCount : betweenCollapseCount} stops
                </button>
              )}
            </TimelineHeading>
            <TimelineDot status={isPastStop ? "done" : "default"} />
            {index !== stopList.length - 1 && (
              <TimelineLine done={isPastStop} />
            )}
            <TimelineContent className="py-2 gap-1 flex flex-col">
              <p>Scheduled: {arrivalTime}</p>
              <Button type="button" onClick={(e) => handleMouseUp(e, stop)}>
                Show<span className="sr-only">stop {stop.stopCode}</span>
                &nbsp;on map
              </Button>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

export default TripTimeline;
