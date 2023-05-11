import { Icon, LatLngTuple } from "leaflet";
import { LeafletTrackingMarker } from "react-leaflet-tracking-marker";
// import buslogo from "/public/bus_teardrop.svg";
import { useEffect, useState } from "react";

function Bus({
  position,
  rotationAngle,
}: {
  position: { lat: number; lon: number };
  rotationAngle: number;
}) {
  const { lat, lon } = position;
  const [prevPos, setPrevPos] = useState<LatLngTuple>([lat, lon]);

  useEffect(() => {
    if (prevPos[1] !== lon && prevPos[0] !== lat) setPrevPos([lat, lon]);
  }, [lat, lon, prevPos]);

  return (
    <>
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/bus_teardrop.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        }
        position={[lat, lon]}
        previousPosition={prevPos}
        duration={1000}
        rotationAngle={rotationAngle}
        rotationOrigin="center"
      />
      <LeafletTrackingMarker
        icon={
          new Icon({
            iconUrl: "/bus.svg",
            shadowUrl: "",
            iconSize: [60, 60],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        }
        position={[lat, lon]}
        previousPosition={prevPos}
        duration={1000}
        rotationAngle={0}
      />
    </>
  );
}

export default Bus;