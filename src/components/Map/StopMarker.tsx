import { Marker } from "react-leaflet";
import { stopMarkerIcon } from "./stopMarkerIcon";
import { ReactNode, useRef, useState } from "react";
import isEqual from "react-fast-compare";
import { TripUpdate } from "@/types/realtime";
import { StopTime } from "@prisma/client";
import StopPopup from "./StopPopup";
import { StopWithGroupedTimes } from "@/types/gtfsDerived";

type Props = {
  animate?: boolean;
  big?: boolean;
  children?: ReactNode;
  isPast?: boolean;
  handleDestinationStop: (stopId: string) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string, showModal?: boolean) => void;
  stopWithTimes: StopWithGroupedTimes;
  realtimeTrip: TripUpdate | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
};

function StopMarker({
  big,
  children,
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
        setShowPopup={setShowPopup}
        stopTimesByStopId={stopTimesByStopId}
        onDestinationChange={handleDestinationStop}
        handleSaveStop={handleSaveStop}
        onPickupChange={handleSelectedStop}
      />
      {children}
    </Marker>
  );
}

export default StopMarker;
