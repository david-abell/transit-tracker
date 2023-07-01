"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { ReactNode } from "react";

function TileLayerWrapper({ children }: { children: ReactNode }) {
  return (
    <MapContainer
      center={[53.7798, -7.3055]}
      zoom={7}
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
