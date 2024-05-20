"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import MapContentLayer from "./MapContentLayer";
import "leaflet-edgebuffer";

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

interface Props extends MapContentLayerProps {
  center: LatLngTuple;
}

// leaflet-edgebuffer has no type definition. Declare it's options here.
declare module "react-leaflet" {
  export interface TileLayerProps {
    edgeBufferTiles: number;
  }
}

export const MAP_DEFAULT_ZOOM = 15;

function Map({ center, ...props }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={8}
      className={`relative h-full w-[100max]`}
      zoomSnap={0.5}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
        detectRetina
        edgeBufferTiles={3}
        keepBuffer={6}
        updateWhenIdle={false}
        maxNativeZoom={20}
        maxZoom={20}
      />
      <MapContentLayer center={center} {...props} />
    </MapContainer>
  );
}

export default Map;
