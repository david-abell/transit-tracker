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
  Popup,
} from "react-leaflet";
import { LatLngTuple } from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInterval } from "usehooks-ts";

import type { Stop, StopTime, Trip } from "@prisma/client";
import {
  getDelayedTime,
  isPastArrivalTime,
  parseDatetimeLocale,
} from "@/lib/timeHelpers";
import { stopMarkerIcon } from "./stopMarkerIcon";
import Bus from "./Bus";
import { StopTimeUpdate } from "@/types/realtime";
import usePrevious from "@/hooks/usePrevious";
import isEqual from "fast-deep-equal";
import useVehiclePosition from "@/hooks/useVehiclePosition";
import { KeyedMutator } from "swr";
import { DateTime } from "luxon";
import useRealtime from "@/hooks/useRealtime";

type Props = {
  height: number;
  selectedDateTime: string;
  selectedStopId: Stop["stopId"] | undefined;
  tripId: Trip["tripId"];
  handleSelectedStop: (stopId: string) => void;
  shape: LatLngTuple[] | undefined;
  stopsById: Map<string, Stop>;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stops: Stop[] | undefined;
};

function MapContentLayer({
  handleSelectedStop,
  height,
  selectedDateTime,
  selectedStopId,
  selectedTripStopTimesById,
  shape,
  stops,
  stopsById,
  tripId,
}: Props) {
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);

  const stopIds = useMemo(() => {
    return stops ? stops.map(({ stopId }) => stopId) : [];
  }, [stops]);
  const previousStopIds = usePrevious(stopIds);

  useEffect(() => {
    if (!stopIds || !stopIds.length || isEqual(stopIds, previousStopIds)) {
      return;
    }

    const group = markerGroupRef.current;
    if (!group || !group.getBounds().isValid()) return;

    map.flyTo(group.getBounds().getCenter(), map.getZoom());
  }, [map, stopIds, previousStopIds, selectedStopId]);

  useEffect(() => {
    if (map != null) {
      const mapContainer = map.getContainer();
      mapContainer.style.cssText = `height: ${height}px; width: 100%; position: relative;`;
      map.invalidateSize();
    }
  }, [map, height]);

  const { realtimeScheduledByTripId } = useRealtime(tripId);

  // Rerender interval to update live position and marker colors
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  const realtimeTrip = realtimeScheduledByTripId.get(tripId);

  const { stopTimeUpdate } = realtimeTrip || {};

  const stopUpdates =
    (stopTimeUpdate &&
      new Map<string, StopTimeUpdate>(
        [...stopTimeUpdate]
          .filter((update) => update.stopId != undefined)
          .map((update) => [update.stopId!, update])
      )) ||
    new Map<string, StopTimeUpdate>();

  const isToday = DateTime.now().hasSame(
    parseDatetimeLocale(selectedDateTime),
    "day"
  );

  const { vehiclePosition, bearing, vehicleError } = useVehiclePosition({
    selectedTripStopTimesById,
    shape,
    stopIds,
    stopsById,
    stopUpdates,
    options: { skip: !isToday },
  });

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
              {!vehicleError && (
                <Bus position={vehiclePosition} rotationAngle={bearing} />
              )}
            </Pane>
          </LayerGroup>
        </LayersControl.Overlay>

        {/* Route stop markers */}
        <LayersControl.Overlay name="Stops" checked>
          <FeatureGroup ref={markerGroupRef}>
            {!!stops &&
              stops.flatMap(({ stopLat, stopLon, stopName, stopId }) => {
                // const { stopLat, stopLon, stopName } =
                //   stopsById.get(stopId) || {};
                if (!stopLat || !stopLon) {
                  return [];
                }

                const { arrivalTime, departureTime, stopSequence } =
                  selectedTripStopTimesById.get(stopId) || {};

                if (tripId && !arrivalTime) {
                  return [];
                }

                const stopUpdate = stopUpdates?.get(stopId);
                const { arrival, departure } = stopUpdate || {};

                const delayedArrivalTime = getDelayedTime(
                  departureTime,
                  arrival?.delay || departure?.delay
                );

                return (
                  <Marker
                    key={stopId}
                    position={[stopLat, stopLon]}
                    icon={stopMarkerIcon({
                      isUpcoming:
                        !!arrivalTime &&
                        !isPastArrivalTime(
                          delayedArrivalTime || arrivalTime,
                          selectedDateTime
                        ),
                      isTripSelected: !!tripId,
                      isCurrent: stopId === selectedStopId,
                    })}

                    // eventHandlers={{
                    //   click: () => handleSelectedStop(stopId),
                    // }}
                  >
                    <Popup>
                      <strong>Stop Name:</strong> {stopName}
                      <br />
                      <strong>Stop Id:</strong> {stopId}
                      <br />
                      <strong>Stop Sequence:</strong> {stopSequence}
                      <br />
                      {!!arrivalTime && (
                        <>
                          <strong>Scheduled arrival</strong> @: {arrivalTime}
                        </>
                      )}
                      {!!tripId && !!realtimeTrip && !!delayedArrivalTime && (
                        <>
                          <br />
                          <div className="tooltip-schedule-change">
                            <strong>Schedule change</strong>:{" "}
                            <span>{delayedArrivalTime}</span>
                          </div>
                        </>
                      )}
                      <br />
                      <button
                        type="button"
                        onClick={() => handleSelectedStop(stopId)}
                        className="mx-auto my-2 block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800
                         focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700
                          dark:focus:ring-blue-800"
                      >
                        View trips
                      </button>
                    </Popup>
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
