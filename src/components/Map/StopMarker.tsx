import { Marker } from "react-leaflet";
import { stopMarkerIcon } from "./stopMarkerIcon";
import { memo } from "react";
import isEqual from "react-fast-compare";
import { TripUpdate } from "@/types/realtime";
import { StopWithTimes } from "./MapContentLayer";
import { StopTime } from "@prisma/client";
import StopPopup from "./StopPopup";

type Props = {
  animate?: boolean;
  big?: boolean;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string) => void;
  handleDestinationStop: (stopId: string) => void;
  isPast?: boolean;
  realtimeTrip: TripUpdate | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  stopWithTimes: StopWithTimes;
};
const StopMarker = memo(function StopMarker({
  big,
  handleDestinationStop,
  handleSelectedStop,
  isPast,
  realtimeTrip,
  handleSaveStop,
  stopTimesByStopId,
  stopWithTimes,
  animate,
}: Props) {
  return (
    <Marker
      position={[stopWithTimes.stop.stopLat, stopWithTimes.stop.stopLon]}
      icon={stopMarkerIcon({
        animate: animate,
        isPast: isPast ?? false,
        big: !!big,
      })}
    >
      <StopPopup
        handleDestinationStop={handleDestinationStop}
        handleSaveStop={handleSaveStop}
        handleSelectedStop={handleSelectedStop}
        realtimeTrip={realtimeTrip}
        stopTimesByStopId={stopTimesByStopId}
        stopWithTimes={stopWithTimes}
      />
    </Marker>
  );
}, isEqual);

export default StopMarker;
