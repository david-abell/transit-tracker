import { Marker, Popup } from "react-leaflet";
import { Button } from "../ui/button";
import { stopMarkerIcon } from "./stopMarkerIcon";
import { isPastArrivalTime } from "@/lib/timeHelpers";
import { ReactNode, memo } from "react";
import isEqual from "react-fast-compare";

type Props = {
  animate?: boolean;
  big?: boolean;
  children?: ReactNode;
  stopLat: number;
  stopLon: number;
  stopId: string;
  stopSequence: number | undefined;
};
const StopMarker = memo(function StopMarker({
  big,
  children,
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
        isUpcoming: true,
        isTripSelected: false,
        isCurrent: !!big,
      })}
    >
      {children}
    </Marker>
  );
}, isEqual);

export default StopMarker;