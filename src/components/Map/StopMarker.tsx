import { Marker } from "react-leaflet";
import { stopMarkerIcon } from "./stopMarkerIcon";
import { ReactNode, memo } from "react";
import isEqual from "react-fast-compare";

type Props = {
  animate?: boolean;
  big?: boolean;
  children?: ReactNode;
  isPast?: boolean;
  stopLat: number;
  stopLon: number;
  stopId: string;
  stopSequence: number | undefined;
};
const StopMarker = memo(function StopMarker({
  big,
  children,
  isPast,
  stopLat,
  stopLon,
  stopId,
  stopSequence,
  animate,
}: Props) {
  return (
    <Marker
      key={"mm" + stopId + stopSequence}
      position={[stopLat, stopLon]}
      icon={stopMarkerIcon({
        animate: animate,
        isPast: isPast ?? false,
        big: !!big,
      })}
    >
      {children}
    </Marker>
  );
}, isEqual);

export default StopMarker;
