import {
  Timeline,
  TimelineContent,
  TimelineDot,
  TimelineHeading,
  TimelineItem,
  TimelineLine,
} from "@/components/ui/timeline";
import { getDelayedTime, isPastArrivalTime } from "@/lib/timeHelpers";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useRef } from "react";
import type { ValidStop } from "../Map/MapContentLayer";
import { useResizeObserver } from "usehooks-ts";

type Props = {
  selectedStop?: Stop;
  stopsById?: Map<string, Stop>;
  stopTimes?: StopTime[];
  trip?: Trip;
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

type StopWithStopTime = { stop: ValidStop; stopTime: StopTime };

function TripTimeline({
  selectedStop,
  stopsById,
  stopTimes,
  tripUpdatesByTripId,
  trip,
}: Props) {
  const timelineRef = useRef(null);

  const stopTimeUpdates = useMemo(
    () => trip && tripUpdatesByTripId.get(trip?.tripId)?.stopTimeUpdate,
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

  return (
    <Timeline className="max-h-full" ref={timelineRef}>
      {stopList.map(({ stop, stopTime }, index) => {
        const { departureTime, stopSequence: currentSequence } = stopTime;

        const stopUpdate = stopTimeUpdates?.find(
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
            <TimelineHeading>
              {stop.stopCode}: {stop.stopName}
            </TimelineHeading>
            <TimelineDot status={isPastStop ? "done" : "default"} />
            {index !== stopList.length - 1 && (
              <TimelineLine done={isPastStop} />
            )}
            <TimelineContent>
              {!!realtimeDepartureTime && (
                <p>Realtime: {realtimeDepartureTime}</p>
              )}
              <p>Scheduled: {departureTime}</p>
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}

export default TripTimeline;
