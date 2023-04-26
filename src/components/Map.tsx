import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet, { LatLngExpression } from "leaflet";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";

import type { Shape, Stop, StopTime, Trip } from "@prisma/client";

const greenIcon = new Leaflet.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Necessary because Leaflet uses northing-easting [[lat-lng]]
// while GeoJSON stores easting-northing [[long, lat]]
// const coordinates = Leaflet.GeoJSON.coordsToLatLngs(lineString);
type Props = {
  selectedStopId: Stop["stopId"] | undefined;
  setSelectedStopId: Dispatch<SetStateAction<string | undefined>>;
  shape: LatLngExpression[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimes: StopTime[] | undefined;
  tripsById: Map<string, Trip>;
};

function Map({
  stopTimes,
  tripsById,
  selectedStopId,
  setSelectedStopId,
  shape,
  stopsById,
}: Props) {
  // Fix leaflet icons not importing
  useEffect(() => {
    (async function init() {
      // @ts-ignore
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "leaflet/images/marker-icon-2x.png",
        iconUrl: "leaflet/images/marker-icon.png",
        shadowUrl: "leaflet/images/marker-shadow.png",
      });
    })();
  }, []);

  return (
    <MapContainer
      center={[51.9081690653422, -8.41944955885327]}
      zoom={13}
      className="relative h-[100vmin] w-[100max]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stopTimes?.map(({ stopId, arrivalTime, tripId }) => {
        const stop = stopsById.get(stopId);
        const { stopLat, stopLon, stopCode, stopName } = stop || {};

        const trip = tripsById.get(tripId);
        const { tripHeadsign } = trip || {};

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
            key={stopId + tripId}
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
              <strong>Arrival scheduled</strong> @: {arrivalTime}
              <br />
              <strong>Heading towards: </strong> {tripHeadsign}
              <div className="w-full">
                <button
                  onClick={() => setSelectedStopId(stopId)}
                  className="mx-auto block rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
                >
                  Start here
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
      {!!shape && (
        <Polyline pathOptions={{ color: "firebrick" }} positions={shape} />
      )}
    </MapContainer>
  );
}

export default Map;
