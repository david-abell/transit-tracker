"use-client";
import { Icon, LatLngTuple } from "leaflet";
import { LeafletTrackingMarker } from "react-leaflet-tracking-marker";
// import buslogo from "/public/bus_teardrop.svg";
import { useEffect, useState } from "react";
import { Arrival } from "@/hooks/useVehiclePosition";
import { Popup } from "react-leaflet";

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
          <p>
            <b>Next Stop: </b>
            {nextStop.stop.stopName ?? ""}
          </p>
          <p>
            <b>Scheduled arrival: </b> {nextStop.arrivalTime}
          </p>
          {nextStop.delayedArrivalTime && (
            <p>
              <b>Arriving: </b>
              {nextStop.delayedArrivalTime}
            </p>
          )}
        </Popup>
      </LeafletTrackingMarker>
    </>
  );
}

export default Bus;
