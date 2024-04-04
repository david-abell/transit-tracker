"use-client";
import { Icon, LatLngTuple } from "leaflet";
import { LeafletTrackingMarker } from "react-leaflet-tracking-marker";
import { useEffect, useMemo, useState } from "react";
import useVehiclePosition from "@/hooks/useVehiclePosition";
import { Popup } from "react-leaflet";
import {
  formatDelay,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { useInterval } from "usehooks-ts";
import { Stop, StopTime } from "@prisma/client";
import { Position } from "@turf/helpers";
import { TripUpdate } from "@/types/realtime";

type Props = {
  realtimeScheduledByTripId: Map<string, TripUpdate>;
  shape: Position[] | undefined;
  stopIds: string[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  tripId: string | null;
  show: boolean;
};

function Bus({
  realtimeScheduledByTripId,
  shape,
  stopIds,
  stopsById,
  stopTimesByStopId,
  tripId,
  show,
}: Props) {
  const stopTimeUpdate = useMemo(() => {
    return tripId
      ? realtimeScheduledByTripId.get(tripId)?.stopTimeUpdate
      : undefined;
  }, [realtimeScheduledByTripId, tripId]);

  const { vehiclePosition, bearing, vehicleError, nextStop } =
    useVehiclePosition({
      stopTimesByStopId,
      shape,
      stopIds,
      stopsById,
      stopTimeUpdate,
      options: { skip: show },
    });

  const [prevPos, setPrevPos] = useState<LatLngTuple>([0, 0]);
  const [prevAngle, setPrevAngle] = useState<number>(bearing ?? 0);
  const [arrivingIn, setArrivingIn] = useState("");

  useEffect(() => {
    if (vehicleError) return;

    if (prevPos[1] !== vehiclePosition[1] && prevPos[0] !== vehiclePosition[0])
      setPrevPos(vehiclePosition);
    if (prevAngle !== bearing) setPrevAngle(bearing);
  }, [prevPos, prevAngle, vehiclePosition, vehicleError, bearing]);

  useInterval(
    () => {
      if (!nextStop) return;
      if (
        isPastArrivalTime(nextStop.delayedArrivalTime ?? nextStop.arrivalTime)
      )
        return;

      const arrivalSeconds = getDifferenceInSeconds(
        nextStop.delayedArrivalTime ?? nextStop.arrivalTime,
      );
      // Your custom logic here
      setArrivingIn(formatDelay(arrivalSeconds, true) ?? "");
    },
    // Delay in milliseconds or null to stop it
    1000,
  );

  if (vehicleError) return null;

  const prettyDelay = formatDelay(
    nextStop.stopUpdate?.arrival?.delay ||
      nextStop.stopUpdate?.departure?.delay,
  );

  const isEarly = nextStop.stopUpdate?.arrival?.delay
    ? nextStop.stopUpdate?.arrival?.delay < 0
    : nextStop.stopUpdate?.departure?.delay
      ? nextStop.stopUpdate?.departure.delay < 0
      : false;

  return (
    <>
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/bus_teardrop.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [30, 30],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        }
        position={vehiclePosition}
        previousPosition={prevPos}
        duration={500}
        rotationAngle={prevAngle}
        rotationOrigin="center"
        interactive={false}
      />
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/bus.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [30, 30],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        }
        position={vehiclePosition}
        previousPosition={prevPos}
        duration={500}
        rotationAngle={0}
      >
        <Popup>
          <p>Next Stop: {nextStop.stop.stopCode}</p>
          <h3 className="text-lg font-bold !mt-0">
            {nextStop.stop.stopName ?? ""}
          </h3>
          <p>
            <b>Scheduled arrival: </b> {nextStop.arrivalTime}
          </p>
          {nextStop.delayedArrivalTime && (
            <p>
              <b>Arriving: </b> {nextStop.delayedArrivalTime}
            </p>
          )}
          {prettyDelay && (
            <p>
              <b
                className={`${isEarly ? "text-green-900" : "text-red-700 dark:text-red-500"}`}
              >
                {prettyDelay}
              </b>
              {isEarly ? " early" : " late"}
            </p>
          )}

          <p className="text-lg !mt-0">
            Arrival estimate{" "}
            <b
              className={`${isEarly ? "text-green-900 dark:text-green-500" : "text-red-700 dark:text-red-500"}`}
            >
              {arrivingIn}
            </b>
          </p>
        </Popup>
      </LeafletTrackingMarker>
    </>
  );
}

export default Bus;
