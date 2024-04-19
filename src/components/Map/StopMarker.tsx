import { Marker } from "react-leaflet";
import { stopMarkerIcon } from "./stopMarkerIcon";
import { useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { TripUpdate } from "@/types/realtime";
import { StopWithTimes } from "./MapContentLayer";
import { StopTime } from "@prisma/client";
import StopPopup from "./StopPopup";

type Props = {
  animate?: boolean;
  big?: boolean;
  isPast?: boolean;
  handleDestinationStop: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string, showModal?: boolean) => void;
  stopWithTimes: StopWithTimes;
  realtimeTrip: TripUpdate | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
};

function StopMarker({
  big,
  isPast,
  handleDestinationStop,
  handleSaveStop,
  handleSelectedStop,
  realtimeTrip,
  stopWithTimes,
  stopTimesByStopId,
  animate,
}: Props) {
  // showPopup is required for React to properly rerender the popup content
  const [showPopup, setShowPopup] = useState(false);
  const ref = useRef<L.Marker<L.Popup>>(null);

  return (
    <Marker
      ref={ref}
      interactive
      position={[stopWithTimes.stop.stopLat, stopWithTimes.stop.stopLon]}
      eventHandlers={{
        popupopen() {
          setShowPopup(true);
        },
        popupclose() {
          setShowPopup(false);
        },
      }}
      icon={stopMarkerIcon({
        animate: animate,
        isPast: isPast ?? false,
        big: !!big,
      })}
    >
      <StopPopup
        show={showPopup}
        stopWithTimes={stopWithTimes}
        realtimeTrip={realtimeTrip}
        stopTimesByStopId={stopTimesByStopId}
        handleDestinationStop={handleDestinationStop}
        handleSaveStop={handleSaveStop}
        handleSelectedStop={handleSelectedStop}
      />
    </Marker>
  );
}

export default StopMarker;
