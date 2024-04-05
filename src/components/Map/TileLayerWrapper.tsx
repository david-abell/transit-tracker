"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { ReactNode } from "react";
import { LatLngExpression } from "leaflet";

//Stop 135351, Eden Quay, Dublin
const INITIAL_LOCATION: LatLngExpression = [
  53.3477999659065, -6.25849647173381,
];

function TileLayerWrapper({ children }: { children: ReactNode }) {
  return (
    <MapContainer
      center={INITIAL_LOCATION}
      zoom={12}
      minZoom={8}
      className={`relative h-full w-[100max]`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      {children}
    </MapContainer>
  );
}

export default TileLayerWrapper;
