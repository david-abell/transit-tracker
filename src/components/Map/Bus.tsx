"use-client";
import { Icon, LatLngTuple } from "leaflet";
import { LeafletTrackingMarker } from "react-leaflet-tracking-marker";
// import buslogo from "/public/bus_teardrop.svg";
import { useEffect, useState } from "react";
import { Arrival } from "@/hooks/useVehiclePosition";
import { Popup } from "react-leaflet";
import { formatDelay, getDelayedTime } from "@/lib/timeHelpers";

function Bus({
  position,
  rotationAngle,
  nextStop,
}: {
  nextStop: Arrival;
  position: LatLngTuple;
  rotationAngle: number;
}) {
  const [lat, lon] = position;
  const [prevPos, setPrevPos] = useState<LatLngTuple>([lat, lon]);
  const [prevAngle, setPrevAngle] = useState<number>(rotationAngle);

  useEffect(() => {
    if (prevPos[1] !== lon && prevPos[0] !== lat) setPrevPos([lat, lon]);
    if (prevAngle !== rotationAngle) setPrevAngle(rotationAngle);
  }, [lat, lon, prevPos, rotationAngle, prevAngle]);

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
        position={[lat, lon]}
        previousPosition={prevPos}
        duration={1000}
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
        position={[lat, lon]}
        previousPosition={prevPos}
        duration={1000}
        rotationAngle={0}
      >
        <Popup>
          <span>Next Stop: {nextStop.stop.stopCode}</span>
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
            <p className="text-lg !mt-0">
              <b
                className={`${isEarly ? "text-green-900" : "text-red-700 dark:text-red-500"}`}
              >
                {prettyDelay}
              </b>
              {isEarly ? " early" : " late"}
            </p>
          )}
        </Popup>
      </LeafletTrackingMarker>
    </>
  );
}

export default Bus;
