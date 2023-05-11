"use-client";

import {
  Marker,
  Polyline,
  FeatureGroup,
  useMap,
  Tooltip,
  LayersControl,
  Pane,
  LayerGroup,
} from "react-leaflet";
import { LatLngExpression } from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import type { Stop, StopTime, Trip } from "@prisma/client";
import { isPastArrivalTime } from "@/lib/timeHelpers";
import { stopMarkerIcon } from "./stopMarkerIcon";
import Bus from "./Bus";

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
  const vehicleRef = useRef<L.Marker>(null);
  const [rotationAngle, setRotationAngle] = useState(0);

  useEffect(() => {
    const group = markerGroupRef.current;
    if (!group || !group.getBounds().isValid()) return;

    map.fitBounds(group.getBounds());
  }, [context, stopTimesByStopId, map]);

  // Rerender interval to update live position and marker colors
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  useInterval(() => {
    setRotationAngle((prev) => prev + 1);
  }, 30);

  return (
    <>
      <LayersControl>
        <LayersControl.Overlay name="Vehicle Position" checked>
          <LayerGroup>
            {/* width required for icon not to be 0*0 px */}
            <Pane name="Bus" style={{ zIndex: 1000, width: "4rem" }}>
              <Bus
                position={{ lat: 51.9, lon: -8.49 }}
                rotationAngle={rotationAngle}
              />
            </Pane>
          </LayerGroup>
        </LayersControl.Overlay>
        <LayersControl.Overlay name="Stops" checked>
          <FeatureGroup ref={markerGroupRef}>
            {!!stopIds &&
              stopIds.map((stopId) => {
                const { stopLat, stopLon, stopName } =
                  stopsById.get(stopId) || {};
                if (!stopLat || !stopLon) {
                  return [];
                }

                const { arrivalTime } =
                  selectedTripStopTimesById.get(stopId) || {};

                return (
                  <Marker
                    key={stopId}
                    position={[stopLat, stopLon]}
                    {...{
                      icon: stopMarkerIcon({
                        isUpcoming:
                          !!arrivalTime && !isPastArrivalTime(arrivalTime),
                        isTripSelected: !!selectedTripId,
                        isCurrent: stopId === selectedStopId,
                      }),
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
        </LayersControl.Overlay>
      </LayersControl>

      {!!shape && (
        <Polyline pathOptions={{ color: "firebrick" }} positions={shape} />
      )}
    </>
  );
}

export default MapContentLayer;
