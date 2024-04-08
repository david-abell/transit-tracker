"use-client";

import MapContentLayer from "./MapContentLayer";
import TileLayerWrapper from ".";

type MapContentLayerProps = React.ComponentProps<typeof MapContentLayer>;

function DynamicMap(props: MapContentLayerProps) {
  return (
    <TileLayerWrapper>
      <MapContentLayer {...props} />
    </TileLayerWrapper>
  );
}

export default DynamicMap;
