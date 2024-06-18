import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";
import { getArrivalCountdownText, isPastArrivalTime } from "@/lib/timeHelpers";
import { Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useRef, MouseEvent, useCallback, useState } from "react";
import { LatLngTuple } from "leaflet";
import { Button } from "../ui/button";
import LiveText from "../LiveText";
import { StopAndStopTime } from "../DestinationSelect";
import { cn } from "@/lib/utils";

type Props = {
  destinationId: string | null;
  handleMapCenter: (latLon: LatLngTuple, requestCenter?: boolean) => void;
  pickupStop: Stop | undefined;
  stopList: StopAndStopTime[];
  trip?: Trip;
};

const MIN_TO_COLLAPSE = 3;

function TripTimeline({
  destinationId,
  handleMapCenter,
  pickupStop,
  stopList,
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
    stop: Stop,
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
        if (stop.stopLat && stop.stopLon)
          handleMapCenter([stop.stopLat, stop.stopLon], true);
      }
    }
  };

  const handleArrivalCountdown = useCallback(
    (stopTime: StopTime) => getArrivalCountdownText(stopTime),
    [],
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

  let currentStopIndex = stopList.findIndex(
    ({ stopTime }) =>
      !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  );

  if (currentStopIndex === -1) {
    currentStopIndex = stopList.length - 1;
  }

  const isPastPickup = currentStopIndex > pickupIndex;

  const destinationIndex = stopList.findIndex(
    ({ stopTime }) => !!destinationId && stopTime.stopId === destinationId,
  );

  const isCompleted = currentStopIndex >= destinationIndex;

  const beforeCollapseCount = isPastPickup ? pickupIndex + 1 : pickupIndex;
  const betweenCollapseCount =
    destinationIndex > pickupIndex ? destinationIndex - pickupIndex - 1 : 0;
  const beforeCurrentCount =
    currentStopIndex < pickupIndex
      ? pickupIndex - currentStopIndex
      : pickupIndex;

  return (
    <Timeline
      className="max-h-full"
      ref={timelineRef}
      onMouseDown={handleMouseDown}
    >
      {stopList.flatMap(({ stop, stopTime }, index) => {
        const { arrivalTime } = stopTime;
        const isPastStop = index < currentStopIndex;
        const isBefore =
          index < pickupIndex || (index === pickupIndex && isPastPickup);
        const isBetween = index > pickupIndex && index < destinationIndex;
        const isCollapsible =
          (beforeCollapseCount >= MIN_TO_COLLAPSE && isBefore) ||
          (betweenCollapseCount >= MIN_TO_COLLAPSE && isBetween);

        if (!showBeforeStops) {
          if (index === 0) {
            return (
              <TimelineItem
                status={isPastPickup ? "done" : "default"}
                key={"timeline" + stopTime.stopId + stopTime.stopSequence}
              >
                <TimelineContent>
                  <button
                    type="button"
                    onClick={(e) => handleMouseUp(e, stop, "toggleBefore")}
                  >
                    <span className="sr-only">Show </span>
                    {beforeCurrentCount} more stops
                    {!isPastPickup ? " before pickup" : ""}...
                  </button>
                </TimelineContent>
                <TimelineDot status="done" />
                {index !== stopList.length - 1 && <TimelineLine done={true} />}
              </TimelineItem>
            );
          }
          if (isBefore || (index === pickupIndex && isPastPickup)) return [];
        }
        if (!showBetweenStops) {
          if (index === pickupIndex + 1 && index !== destinationIndex) {
            return (
              <TimelineItem
                status={isCompleted ? "done" : "default"}
                key={"timeline" + stopTime.stopId + stopTime.stopSequence}
              >
                <TimelineContent>
                  <button
                    type="button"
                    onClick={(e) => handleMouseUp(e, stop, "toggleBetween")}
                  >
                    <span className="sr-only">Show </span>
                    {betweenCollapseCount} more stops...
                  </button>
                </TimelineContent>
                <TimelineDot status={isCompleted ? "done" : "default"} />
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
            <TimelineHeading className="whitespace-nowrap w-full flex flex-row gap-2 items-center justify-between">
              {stop.stopCode}: {stop.stopName}{" "}
              {!isPastStop && (
                <LiveText
                  content={() => handleArrivalCountdown(stopTime)}
                  color="info"
                />
              )}
            </TimelineHeading>
            <TimelineDot status={isPastStop ? "done" : "default"} />
            {index !== stopList.length - 1 && (
              <TimelineLine done={isPastStop} />
            )}
            <TimelineContent className={cn("py-2 gap-1 flex flex-col")}>
              <p>
                {isPastStop || isCompleted ? "Arrived" : "Arriving"}:{" "}
                {arrivalTime}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={(e) => handleMouseUp(e, stop)}
                  variant={isCollapsible ? "secondary" : "default"}
                >
                  Show<span className="sr-only">stop {stop.stopCode}</span>
                  &nbsp;on map
                </Button>
                {isCollapsible && (
                  <Button
                    onClick={(e) =>
                      handleMouseUp(
                        e,
                        stop,
                        isBefore ? "toggleBefore" : "toggleBetween",
                      )
                    }
                    variant={isCollapsible ? "outline" : "default"}
                    className="underline"
                  >
                    ... hide{" "}
                    {isBefore ? beforeCollapseCount : betweenCollapseCount}{" "}
                    stops
                  </Button>
                )}
              </div>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

export default TripTimeline;
