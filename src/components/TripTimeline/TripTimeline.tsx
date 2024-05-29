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
import { useMemo, useRef, MouseEvent, useCallback } from "react";
import type { ValidStop } from "../Map/MapContentLayer";
import { LatLngTuple } from "leaflet";
import { Button } from "../ui/button";
import LiveText from "../LiveText";

type Props = {
  handleMapCenter: (latLon: LatLngTuple) => void;
  selectedStop?: Stop;
  stopsById?: Map<string, Stop>;
  stopTimes?: StopTime[];
  trip?: Trip;
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

type StopWithStopTime = { stop: ValidStop; stopTime: StopTime };

function TripTimeline({
  handleMapCenter,
  selectedStop,
  stopsById,
  stopTimes,
  tripUpdatesByTripId,
  trip,
}: Props) {
  const timelineRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: MouseEvent<HTMLUListElement>) => {
    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: MouseEvent<HTMLButtonElement>, stop: ValidStop) => {
    const { x, y } = pointer.current;
    if (Math.abs(e.clientX - x) < 10 && Math.abs(e.clientY - y) < 10) {
      e.stopPropagation();
      handleMapCenter([stop.stopLat, stop.stopLon]);
    }
  };

  const tripUpdate = useMemo(
    () => trip && tripUpdatesByTripId.get(trip?.tripId),
    [tripUpdatesByTripId, trip],
  );

  const stopList: StopWithStopTime[] = useMemo(() => {
    const stops: StopWithStopTime[] = [];

    if (stopTimes?.length && stopsById) {
      for (const stopTime of stopTimes) {
        const stop = stopsById.get(stopTime.stopId);
        if (!stop || stop?.stopLat === null || stop?.stopLon === null) continue;
        stops.push({
          stop: stop as ValidStop,
          stopTime,
        });
      }
    }

    return stops;
  }, [stopTimes, stopsById]);

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

  return (
    <Timeline
      className="max-h-full"
      ref={timelineRef}
      onMouseDown={handleMouseDown}
    >
      {stopList.map(({ stop, stopTime }, index) => {
        const { departureTime, stopSequence: currentSequence } = stopTime;
        const stopUpdate = tripUpdate?.stopTimeUpdate?.find(
          ({ stopSequence }) => stopSequence >= currentSequence,
        );

        const realtimeDepartureTime = getDelayedTime(
          departureTime,
          stopUpdate?.departure?.delay || stopUpdate?.arrival?.delay,
        );

        const isPastStop =
          !!departureTime &&
          isPastArrivalTime(realtimeDepartureTime ?? departureTime);

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
