"use-client";

import { MapContainer, TileLayer, useMap } from "react-leaflet";
import Leaflet from "leaflet";
import { ReactNode, useEffect } from "react";

function TileLayerWrapper({ children }: { children: ReactNode }) {
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
      {children}
    </MapContainer>
  );
}

export default TileLayerWrapper;
