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
import { LatLngTuple } from "leaflet";
import { useLeafletContext } from "@react-leaflet/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import type { Stop, StopTime, Trip } from "@prisma/client";
import { getDelayedTime, isPastArrivalTime } from "@/lib/timeHelpers";
import { stopMarkerIcon } from "./stopMarkerIcon";
import Bus from "./Bus";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { getBearing, getVehiclePosition } from "./mapUtils";
import usePrevious from "@/hooks/usePrevious";
import isEqual from "fast-deep-equal";

type Props = {
  realtimeAddedByRouteId: Map<string, TripUpdate>;
  realtimeCanceledTripIds: Set<string>;
  realtimeRouteIds: Set<string>;
  realtimeScheduledByTripId: Map<string, TripUpdate>;
  selectedDateTime: string;
  selectedStopId: Stop["stopId"] | undefined;
  selectedTripId: Trip["tripId"];
  handleSelectedStop: (stopId: string) => void;
  shape: LatLngTuple[] | undefined;
  stopIds: string[];
  stopsById: Map<string, Stop>;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopTimesByStopId: Map<string, StopTime[]> | undefined;
  stopTimesByTripId: Map<string, StopTime[]> | undefined;
  tripsByDirection: Map<Trip["tripId"], Trip> | undefined;
  tripsById: Map<string, Trip>;
};

function MapContentLayer({
  realtimeAddedByRouteId,
  realtimeCanceledTripIds,
  realtimeScheduledByTripId,
  realtimeRouteIds,
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
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);

  const previousStopIds = usePrevious(stopIds);

  useEffect(() => {
    if (isEqual(stopIds, previousStopIds)) return;

    const group = markerGroupRef.current;
    if (!group || !group.getBounds().isValid()) return;

    map.fitBounds(group.getBounds());
  }, [map, stopIds, previousStopIds]);

  // Rerender interval to update live position and marker colors
  // disabled for dev ease
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  const realtimeTrip = realtimeScheduledByTripId.get(selectedTripId);

  const { stopTimeUpdate } = realtimeTrip || {};

  const stopUpdates =
    (stopTimeUpdate &&
      new Map<string, StopTimeUpdate>(
        [...stopTimeUpdate]
          .filter((update) => update.stopId != undefined)
          .map((update) => [update.stopId!, update])
      )) ||
    new Map<string, StopTimeUpdate>();

  const { vehiclePosition, bearing } =
    getVehiclePosition({
      selectedTripStopTimesById,
      shape,
      stopIds,
      stopsById,
      stopUpdates,
    }) || {};

  // const isDelayed =
  //   (arrival?.delay && arrival.delay > 0) ||
  //   (departure?.delay && departure.delay > 0);

  return (
    <>
      <LayersControl>
        {/* Vehicle marker */}
        <LayersControl.Overlay name="Vehicle Position" checked>
          <LayerGroup>
            {/* width required for icon not to be 0*0 px */}
            <Pane name="Bus" style={{ zIndex: 640, width: "2.5rem" }}>
              {!!vehiclePosition && !!bearing && (
                <Bus position={vehiclePosition} rotationAngle={bearing} />
              )}
            </Pane>
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Route stop markers */}
        <LayersControl.Overlay name="Stops" checked>
          <FeatureGroup ref={markerGroupRef}>
            {!!stopIds &&
              stopIds.flatMap((stopId) => {
                const { stopLat, stopLon, stopName } =
                  stopsById.get(stopId) || {};
                if (!stopLat || !stopLon) {
                  return [];
                }

                const { arrivalTime, departureTime } =
                  selectedTripStopTimesById.get(stopId) || {};

                const stopUpdate = stopUpdates?.get(stopId);
                const { arrival, departure } = stopUpdate || {};

                const adjustedArrival =
                  getDelayedTime(departureTime, arrival?.delay) ||
                  getDelayedTime(departureTime, departure?.delay);

                return (
                  <Marker
                    key={stopId}
                    position={[stopLat, stopLon]}
                    {...{
                      icon: stopMarkerIcon({
                        isUpcoming:
                          !!adjustedArrival &&
                          !isPastArrivalTime(adjustedArrival),
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
                    <Tooltip>
                      <strong>Stop Name:</strong> {stopName}
                      <br />
                      {!!arrivalTime && (
                        <>
                          <strong>Scheduled arrival</strong> @: {arrivalTime}
                        </>
                      )}
                      {!!selectedTripId &&
                        !!realtimeTrip &&
                        adjustedArrival !== arrivalTime && (
                          <>
                            <br />
                            <div className="tooltip-schedule-change">
                              <strong>Schdule change</strong>:{" "}
                              <span>{adjustedArrival}</span>
                            </div>
                          </>
                        )}
                    </Tooltip>
                  </Marker>
                );
              })}
          </FeatureGroup>
        </LayersControl.Overlay>

        {/* Trip line shape */}
        {!!shape && (
          <LayersControl.Overlay name="Route Path" checked>
            <Polyline pathOptions={{ color: "firebrick" }} positions={shape} />
          </LayersControl.Overlay>
        )}
      </LayersControl>
    </>
  );
}

export default MapContentLayer;
