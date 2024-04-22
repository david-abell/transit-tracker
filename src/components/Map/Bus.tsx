"use-client";
import { Icon, LatLngTuple } from "leaflet";
import { LeafletTrackingMarker } from "react-leaflet-tracking-marker";
import { useCallback, useEffect, useMemo, useState } from "react";
import useVehiclePosition from "@/hooks/useVehiclePosition";
import { Popup } from "react-leaflet";
import {
  formatReadableDelay,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { Stop, StopTime } from "@prisma/client";
import { Position } from "@turf/helpers";
import { TripUpdate } from "@/types/realtime";
import LiveText, { LiveTextColor } from "../LiveText";

type Props = {
  realtimeScheduledByTripId: Map<string, TripUpdate>;
  shape: Position[] | undefined;
  stopIds: string[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  tripId: string | null;
  show: boolean;
};

const SVG_ANGLE_OFFSET = 225;

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

  useEffect(() => {
    if (vehicleError) return;

    if (prevPos[1] !== vehiclePosition[1] && prevPos[0] !== vehiclePosition[0])
      setPrevPos(vehiclePosition);
    if (prevAngle !== bearing) setPrevAngle(bearing);
  }, [prevPos, prevAngle, vehiclePosition, vehicleError, bearing]);

  const handleArrivalCountdown = useCallback(() => {
    if (
      !nextStop ||
      isPastArrivalTime(nextStop.delayedArrivalTime ?? nextStop.arrivalTime)
    )
      return "";

    const arrivalSeconds = getDifferenceInSeconds(
      nextStop.delayedArrivalTime ?? nextStop.arrivalTime,
    );

    return formatReadableDelay(arrivalSeconds) ?? "";
  }, [nextStop]);

  const handleDelayTextUpdate = useCallback(() => {
    return (
      formatReadableDelay(
        nextStop?.stopUpdate?.arrival?.delay ||
          nextStop?.stopUpdate?.departure?.delay,
      ) ?? ""
    );
  }, [nextStop]);

  if (vehicleError) return null;

  const arrivalDelay = nextStop?.stopUpdate?.arrival?.delay;
  const departureDelay = nextStop?.stopUpdate?.departure?.delay;

  const hasDelay =
    (typeof arrivalDelay === "number" && arrivalDelay !== 0) ||
    (typeof departureDelay === "number" && departureDelay !== 0);

  const isEarly =
    (typeof arrivalDelay === "number" && arrivalDelay < 0) ||
    (typeof departureDelay === "number" && departureDelay < 0);

  const liveTextColor: LiveTextColor = isEarly
    ? "info"
    : hasDelay
      ? "alert"
      : "default";

  return (
    <>
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/Aiga_teardrop.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [30, 30],
            popupAnchor: [1, -34],
          })
        }
        position={vehiclePosition}
        previousPosition={prevPos}
        duration={500}
        rotationAngle={prevAngle - SVG_ANGLE_OFFSET}
        rotationOrigin="center"
        interactive={false}
      />
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/Aiga_bus.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [30, 30],
            popupAnchor: [1, -34],
          })
        }
        position={vehiclePosition}
        previousPosition={prevPos}
        duration={500}
        rotationAngle={0}
      >
        <Popup>
          <b>Next Stop</b>
          <p className="!mb-0.5">{nextStop.stop.stopCode}</p>
          <h3 className="text-lg font-bold !my-0.5">
            {nextStop.stop.stopName ?? ""}
          </h3>

          <p className="!mt-1 !mb-0">
            <LiveText
              content={handleArrivalCountdown}
              color={liveTextColor}
              tooltip="vehicle"
            />
          </p>

          <p className="!mt-2 !mb-0">
            <b>Scheduled arrival: </b> {nextStop.arrivalTime}
          </p>
          {nextStop.delayedArrivalTime && (
            <span>
              <b>Arriving at </b> {nextStop.delayedArrivalTime}
            </span>
          )}
        </Popup>
      </LeafletTrackingMarker>
    </>
  );
}

export default Bus;
