"use-client";

import { Marker, Polyline, Popup, FeatureGroup, useMap } from "react-leaflet";
import { LatLngExpression, Icon } from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { useEffect, useRef } from "react";

import type { Stop, StopTime, Trip } from "@prisma/client";

const greenIcon = new Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Props = {
  selectedStopId: Stop["stopId"] | undefined;
  selectedTripId: Trip["tripId"];
  handleSelectedStop: (stopId: string) => void;
  shape: LatLngExpression[] | undefined;
  stops: Stop[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimes: StopTime[] | undefined;
  stopTimesByStopId: Map<string, StopTime[]> | undefined;
  tripsById: Map<string, Trip>;
};

function MapContentLayer({
  selectedStopId,
  selectedTripId,
  handleSelectedStop,
  shape,
  stops,
  stopsById,
  stopTimes,
  stopTimesByStopId,
  tripsById,
}: Props) {
  const context = useLeafletContext();
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);
  useEffect(() => {
    const group = markerGroupRef.current;
    if (!group || !group.getBounds().isValid()) return;

    map.fitBounds(group.getBounds());
  }, [context, stopTimesByStopId, map]);

  return (
    <>
      <FeatureGroup ref={markerGroupRef}>
        {!!stops &&
          stops.flatMap(({ stopId, stopLat, stopLon, stopCode, stopName }) => {
            if (!stopLat || !stopLon) {
              return [];
            }

            // set icons this way...

            // let iconUrl = "/images/tree-marker-icon.png";
            // let iconRetinaUrl = "/images/tree-marker-icon-2x.png";

            // if ( santaWasHere ) {
            //   iconUrl = '/images/gift-marker-icon.png';
            //   iconRetinaUrl = '/images/gift-marker-icon-2x.png';
            // }

            return (
              <Marker
                key={stopId + selectedTripId}
                position={[stopLat, stopLon]}
                // Set Icon color for current stop
                {...(stopId === selectedStopId ? { icon: greenIcon } : {})}
                // icon={greenIcon}
              >
                <Popup>
                  <strong>Stop Name:</strong> {stopName}
                  <br />
                  <strong>Stop Code: {stopCode}</strong>
                  <br />
                  <strong>Stop Id: {stopId}</strong>
                  <br />
                  {/* <strong>Arrival scheduled</strong> @: {arrivalTime}
                <br /> */}
                  {/* <strong>Heading towards: </strong> {tripHeadsign} */}
                  <div className="w-full">
                    <button
                      onClick={() => handleSelectedStop(stopId)}
                      className="mx-auto block rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                      type="button"
                    >
                      Start here
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </FeatureGroup>

      {!!shape && (
        <Polyline pathOptions={{ color: "firebrick" }} positions={shape} />
      )}
    </>
  );
}

export default MapContentLayer;
