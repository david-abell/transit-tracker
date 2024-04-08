"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { ReactNode } from "react";
import { LatLngExpression } from "leaflet";
import MapContentLayer from "./MapContentLayer";
import dynamic from "next/dynamic";

//Stop 135351, Eden Quay, Dublin
const INITIAL_LOCATION: LatLngExpression = [
  53.3477999659065, -6.25849647173381,
];

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

type Props = MapContentLayerProps;

function TileLayerWrapper({ ...props }: Props) {
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
      <MapContentLayer {...props} />
    </MapContainer>
  );
}

export default TileLayerWrapper;
