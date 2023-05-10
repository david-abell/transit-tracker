"use-client";

import {
  Marker,
  Polyline,
  Popup,
  FeatureGroup,
  useMap,
  Tooltip,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { useEffect, useRef } from "react";

import type { Stop, StopTime, Trip } from "@prisma/client";
import { markerIcon } from "./markerIcon";
import { isPastArrivalTime } from "@/lib/timeHelpers";
import { stopMarkerIcon } from "./stopMarkerIcon";

type Props = {
  selectedDateTime: string;
  selectedStopId: Stop["stopId"] | undefined;
  selectedTripId: Trip["tripId"];
  handleSelectedStop: (stopId: string) => void;
  shape: LatLngExpression[] | undefined;
  stopIds: string[];
  stopsById: Map<string, Stop>;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopTimesByStopId: Map<string, StopTime[]> | undefined;
  stopTimesByTripId: Map<string, StopTime[]> | undefined;
  tripsByDirection: Map<Trip["tripId"], Trip> | undefined;
  tripsById: Map<string, Trip>;
};

function MapContentLayer({
  selectedDateTime,
  selectedStopId,
  selectedTripId,
  handleSelectedStop,
  shape,
  stopIds,
  stopsById,
  selectedTripStopTimesById,
  stopTimesByStopId,
  stopTimesByTripId,
  tripsByDirection,
  tripsById,
}: Props) {
  const context = useLeafletContext();
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);
  useEffect(() => {
    const group = markerGroupRef.current;
    if (!group || !group.getBounds().isValid()) return;

    map.fitBounds(group.getBounds());
  }, [context, stopTimesByStopId, map]);

  return (
    <>
      <FeatureGroup ref={markerGroupRef}>
        {!!stopIds &&
          stopIds.map((stopId) => {
            const { stopLat, stopLon, stopName } = stopsById.get(stopId) || {};
            if (!stopLat || !stopLon) {
              return [];
            }

            const { arrivalTime } = selectedTripStopTimesById.get(stopId) || {};

            return (
              <Marker
                key={stopId}
                position={[stopLat, stopLon]}
                {...{
                  icon: stopMarkerIcon(
                    !!arrivalTime && !isPastArrivalTime(arrivalTime)
                  ),
                }}
                eventHandlers={{
                  click: () => {
                    handleSelectedStop(stopId);
                  },
                }}
              >
                <Tooltip className="rounded-lg">
                  <strong>Stop Name:</strong> {stopName}
                  <br />
                  {!!arrivalTime && (
                    <>
                      <strong>Scheduled arrival</strong> @: {arrivalTime}
                    </>
                  )}
                </Tooltip>
              </Marker>
            );
          })}
      </FeatureGroup>

      {!!shape && (
        <Polyline pathOptions={{ color: "firebrick" }} positions={shape} />
      )}
    </>
  );
}

export default MapContentLayer;
