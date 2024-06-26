"use-client";

import { MapContainer, TileLayer } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import MapContentLayer from "./MapContentLayer";
import "leaflet-edgebuffer";

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

interface Props extends MapContentLayerProps {
  mapCenter: LatLngTuple;
}

// leaflet-edgebuffer has no type definition. Declare it's options here.
declare module "react-leaflet" {
  export interface TileLayerProps {
    edgeBufferTiles: number;
  }
}

export const MAP_DEFAULT_ZOOM = 15;
export const MAX_MAP_ZOOM = 18;

function Map({ mapCenter, ...props }: Props) {
  return (
    <MapContainer
      center={mapCenter}
      zoom={MAP_DEFAULT_ZOOM}
      minZoom={8}
      maxZoom={MAX_MAP_ZOOM}
      className={`relative h-full w-[100max]`}
      zoomSnap={0.5}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
        detectRetina
        edgeBufferTiles={3}
        keepBuffer={6}
        updateWhenIdle={false}
        maxNativeZoom={MAX_MAP_ZOOM}
        maxZoom={MAX_MAP_ZOOM}
        crossOrigin="anonymous"
      />
      <MapContentLayer mapCenter={mapCenter} {...props} />
    </MapContainer>
  );
}

export default Map;
