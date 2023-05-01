"use-client";

import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  FeatureGroup,
} from "react-leaflet";
import { LatLngExpression, Icon } from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
// import "leaflet/dist/leaflet.css";

import TileLayerWrapper from "./TileLayerWrapper";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";

import type { Shape, Stop, StopTime, Trip } from "@prisma/client";

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
  stopsById: Map<string, Stop>;
  stopTimes: StopTime[] | undefined;
  stopTimesByStopId: Map<string, StopTime[]> | undefined;
  tripsById: Map<string, Trip>;
};

function DynamicMap({
  selectedStopId,
  selectedTripId,
  handleSelectedStop,
  shape,
  stopsById,
  stopTimes,
  stopTimesByStopId,
  tripsById,
}: Props) {
  const context = useLeafletContext();
  const markerGroupRef = useRef<L.FeatureGroup>(null);
  // const { markers } = props;

  useEffect(() => {
    const { map } = context;
    const group = markerGroupRef.current; //get leaflet.markercluster instance

    if (!group) return;
    map.fitBounds(group.getBounds()); //zoom to cover visible markers
  }, [context]);

  return (
    <TileLayerWrapper>
      <FeatureGroup ref={markerGroupRef}>
        {!!stopTimesByStopId &&
          [...stopTimesByStopId?.entries()].map(([stopId, stopTimes]) => {
            // get first stopTime data
            const [{ arrivalTime, tripId }] = stopTimes;

            const stop = stopsById.get(stopId);
            const { stopLat, stopLon, stopCode, stopName } = stop || {};

            // const trip = tripsById.get(tripId);
            // const { tripHeadsign } = trip || {};

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
                key={stopId + tripId + selectedTripId}
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
    </TileLayerWrapper>
  );
}

export default DynamicMap;
function useLeaflet() {
  throw new Error("Function not implemented.");
}
