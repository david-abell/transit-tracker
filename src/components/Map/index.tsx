"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import MapContentLayer from "./MapContentLayer";
import L from "leaflet";

export const canvasRenderer = L.canvas();

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

interface Props extends MapContentLayerProps {
  center: LatLngTuple;
}

export const MAP_DEFAULT_ZOOM = 13;

function Map({ center, ...props }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={8}
      className={`relative h-full w-[100max]`}
      preferCanvas
      renderer={canvasRenderer}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      <MapContentLayer center={center} {...props} />
    </MapContainer>
  );
}

export default Map;
