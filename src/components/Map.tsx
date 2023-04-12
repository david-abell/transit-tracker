"use-client";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { GeoJSON } from "leaflet";

import { lineString } from "./lineString";

// Necessary because Leaflet uses northing-easting [[lat-lng]]
// while GeoJSON stores easting-northing [[long, lat]]

const coordinates = GeoJSON.coordsToLatLngs(lineString);

function Map() {
  return (
    <div>
      <MapContainer
        center={[51.9081690653422, -8.41944955885327]}
        zoom={13}
        className="relative h-[100vmin] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[51.9081690653422, -8.41944955885327]}>
          <Popup>
            A pretty CSS3 popup. <br /> Easily customizable.
          </Popup>
        </Marker>
        <Polyline
          pathOptions={{ color: "firebrick" }}
          positions={coordinates}
        />
      </MapContainer>
    </div>
  );
}

export default Map;
