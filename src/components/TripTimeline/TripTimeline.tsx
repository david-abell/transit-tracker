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

  const [showBeforePickup, setShowBeforePickup] = useState(true);

  const handleMouseDown = (e: MouseEvent<HTMLUListElement>) => {
    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (
    e: MouseEvent<HTMLButtonElement>,
    stop?: ValidStop,
  ) => {
    const { x, y } = pointer.current;
    if (Math.abs(e.clientX - x) < 10 && Math.abs(e.clientY - y) < 10) {
      e.stopPropagation();
      if (stop) {
        handleMapCenter([stop.stopLat, stop.stopLon]);
      } else {
        setShowBeforePickup((prev) => !prev);
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

  const pickupSequence = useMemo(
    () =>
      stopList.find(({ stopTime }) => stopTime.stopId === pickupStop?.stopId)
        ?.stopTime.stopSequence,
    [pickupStop?.stopId, stopList],
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

  const beforePickupCount = pickupIndex > 3 ? pickupIndex - 1 : 0;

  if (!trip) return null;

  return (
    <Timeline
      className="max-h-full"
      ref={timelineRef}
      onMouseDown={handleMouseDown}
    >
      {stopList.flatMap(({ stop, stopTime }, index) => {
        const { departureTime, stopSequence } = stopTime;
        const isCollapsible =
          beforePickupCount > 0 && index > 1 && index < pickupIndex;

        if (showBeforePickup) {
          if (isCollapsible) return [];
          if (index === 1) {
            return (
              <TimelineItem
                status="done"
                key={"timeline" + stopTime.stopId + stopTime.stopSequence}
              >
                <TimelineHeading className="whitespace-nowrap w-full flex flex-row gap-2 items-center">
                  <button type="button" onClick={(e) => handleMouseUp(e)}>
                    <span className="sr-only">Show </span>
                    {beforePickupCount} stops hidden...
                  </button>
                </TimelineHeading>
                <TimelineDot status="done" />
                {index !== stopList.length - 1 && <TimelineLine done={true} />}
              </TimelineItem>
            );
          }
        }

        const isPastStop = !!departureTime && isPastArrivalTime(departureTime);

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
              {isCollapsible && !showBeforePickup && (
                <button
                  type="button"
                  onClick={(e) => handleMouseUp(e)}
                  className="underline"
                >
                  ... hide {beforePickupCount} completed stops
                </button>
              )}
            </TimelineHeading>
            <TimelineDot status={isPastStop ? "done" : "default"} />
            {index !== stopList.length - 1 && (
              <TimelineLine done={isPastStop} />
            )}
            <TimelineContent className="py-2 gap-1 flex flex-col">
              <p>Scheduled: {departureTime}</p>
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
