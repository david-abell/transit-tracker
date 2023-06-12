"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { ReactNode } from "react";

function TileLayerWrapper({ children }: { children: ReactNode }) {
  return (
    <MapContainer
      center={[51.9081690653422, -8.41944955885327]}
      zoom={13}
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
