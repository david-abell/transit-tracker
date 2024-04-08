"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import MapContentLayer from "./MapContentLayer";

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

interface Props extends MapContentLayerProps {
  center: LatLngExpression;
}

function Map({ center, ...props }: Props) {
  return (
    <MapContainer
      center={center}
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

export default Map;
