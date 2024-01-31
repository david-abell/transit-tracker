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
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useInterval, useLocalStorage } from "usehooks-ts";

import type { Stop, StopTime, Trip } from "@prisma/client";
import {
  formatDelay,
  getDelayedTime,
  isPastArrivalTime,
  parseDatetimeLocale,
} from "@/lib/timeHelpers";
import { stopMarkerIcon } from "./stopMarkerIcon";
import Bus from "./Bus";
import usePrevious from "@/hooks/usePrevious";
import isEqual from "fast-deep-equal";
import useVehiclePosition from "@/hooks/useVehiclePosition";
import { KeyedMutator } from "swr";
import { DateTime } from "luxon";
import useRealtime from "@/hooks/useRealtime";
import useStopId from "@/hooks/useStopId";
import { SavedStop } from "../SavedStops";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  height: number;
  selectedDateTime: string;
  tripId: string;
  handleSelectedStop: (stopId: string) => void;
  handleDestinationStop: (stopId: string) => void;
  shape: LatLngTuple[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  setShowSavedStops: Dispatch<SetStateAction<boolean>>;
  stops: Stop[] | undefined;
};

function MapContentLayer({
  handleSelectedStop,
  handleDestinationStop,
  height,
  selectedDateTime,
  stopTimesByStopId,
  setShowSavedStops,
  shape,
  stops,
  stopsById,
  tripId,
}: Props) {
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);

  const searchParams = useSearchParams();

  // query params state
  const selectedStopId = searchParams.get("stopId") || "";

  const stopIds = useMemo(() => {
    return stops ? stops.map(({ stopId }) => stopId) : [];
  }, [stops]);
  const previousStopIds = usePrevious(stopIds);

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  const addStopToSaved = (stopId: string, stopName: string | null) => {
    setSavedStops((prev) => {
      const stops = { ...prev };

      stops[stopId] = stopName || stopId;

      return stops;
    });
    setShowSavedStops(true);
  };

  const { selectedStop } = useStopId(selectedStopId);
  const selectedStoptime = stopTimesByStopId.get(selectedStopId);

  useEffect(() => {
    if (stopIds.length && isEqual(stopIds, previousStopIds)) {
      return;
    }
    if (stopIds.length) {
      const group = markerGroupRef.current;

      if (!group || !group.getBounds().isValid()) return;

      map.flyToBounds(group.getBounds());
    } else {
      const { stopLat, stopLon } = selectedStop || {};

      if (!stopLat || !stopLon) return;

      map.flyTo([stopLat, stopLon], 14);
    }
  }, [map, stopIds, previousStopIds, selectedStop]);

  useEffect(() => {
    if (map != null) {
      const mapContainer = map.getContainer();
      mapContainer.style.cssText = `height: ${height}px; width: 100%; position: relative;`;
      map.invalidateSize();
    }
  }, [map, height]);

  // Realtime state
  const { realtimeScheduledByTripId, addedTripStopTimes, realtimeAddedTrips } =
    useRealtime(tripId);

  const realtimeTrip = realtimeScheduledByTripId.get(tripId);
  const { stopTimeUpdate } = realtimeTrip || {};
  const lastStopTimeUpdate = stopTimeUpdate && stopTimeUpdate.at(-1);

  const isAddedTrip = realtimeTrip?.trip.scheduleRelationship === "ADDED";

  // const addedTripStops =
  //   isAddedTrip &&
  //   stopTimeUpdate?.flatMap(({ stopId }) => stopsById.get(stopId || "") || []);

  // Rerender interval to update live position and marker colors
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);

  const isToday = DateTime.now().hasSame(
    parseDatetimeLocale(selectedDateTime),
    "day",
  );

  const { vehiclePosition, bearing, vehicleError } = useVehiclePosition({
    stopTimesByStopId,
    shape,
    stopIds,
    stopsById,
    stopTimeUpdate: realtimeScheduledByTripId.get(tripId)?.stopTimeUpdate,
    options: { skip: !isToday || isAddedTrip },
  });

  const currentStops = stops
    ? stops
    : selectedStop
      ? [selectedStop]
      : undefined;

  return (
    <>
      <LayersControl>
        {/* Vehicle marker */}
        <LayersControl.Overlay name="Estimated Vehicle Position" checked>
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
            {currentStops &&
              currentStops.flatMap(
                ({ stopLat, stopLon, stopName, stopId, stopCode }) => {
                  if (!stopLat || !stopLon) {
                    return [];
                  }

                  const { arrivalTime, departureTime, stopSequence } =
                    stopTimesByStopId.get(stopId) ||
                    addedTripStopTimes.get(stopId) ||
                    {};

                  // When trip selected show only stops on that trip
                  if (tripId && !arrivalTime) return [];

                  const closestStopUpdate =
                    (stopTimeUpdate &&
                      stopTimeUpdate.find(
                        ({ stopId, stopSequence: realtimeSequence }) =>
                          stopId === selectedStopId ||
                          (stopSequence && realtimeSequence >= stopSequence),
                      )) ||
                    lastStopTimeUpdate;

                  // arrival delay is sometimes very wrong from realtime api exa. -1687598071
                  const { arrival, departure } = closestStopUpdate || {};

                  const delayedArrivalTime = getDelayedTime(
                    departureTime,
                    arrival?.delay || departure?.delay,
                  );

                  const prettyDelay = formatDelay(
                    arrival?.delay || departure?.delay,
                  );

                  const isValidDestination =
                    (selectedStoptime &&
                      stopSequence &&
                      selectedStoptime.stopSequence < stopSequence) ||
                    false;

                  return (
                    <Marker
                      key={stopId}
                      position={[stopLat, stopLon]}
                      icon={stopMarkerIcon({
                        isUpcoming:
                          !!arrivalTime &&
                          !isPastArrivalTime(
                            delayedArrivalTime || arrivalTime,
                            selectedDateTime,
                          ),
                        isTripSelected: !!tripId,
                        isCurrent: stopId === selectedStopId,
                      })}

                      // eventHandlers={{
                      //   click: () => handleSelectedStop(stopId),
                      // }}
                    >
                      <Popup>
                        <h3 className="text-lg font-bold">
                          <span className="text-sm font-normal">Stop </span>{" "}
                          <span className="text-sm font-normal">
                            {stopCode ?? stopId}
                          </span>
                          <br />
                          {stopName}
                        </h3>

                        {!!arrivalTime && (
                          <p className="!mb-0">
                            <strong>Scheduled arrival</strong>:
                            <span> {arrivalTime}</span>
                          </p>
                        )}
                        {!!tripId && !!realtimeTrip && !!delayedArrivalTime && (
                          <>
                            <p className="tooltip-schedule-change !mt-0">
                              <strong>Estimated arrival</strong>:{" "}
                              {delayedArrivalTime}
                            </p>
                            {!!prettyDelay && (
                              <p>
                                <strong>Delayed by: </strong>
                                <span className="text-red-900">
                                  {prettyDelay}
                                </span>
                              </p>
                            )}
                          </>
                        )}
                        <div className="flex flex-col gap-2 mt-2">
                          <Button onClick={() => handleSelectedStop(stopId)}>
                            Upcoming trips
                          </Button>
                          {!!selectedStopId && isValidDestination && (
                            <Button
                              onClick={() => handleDestinationStop(stopId)}
                            >
                              set Destination
                            </Button>
                          )}
                          <Button
                            onClick={() => addStopToSaved(stopId, stopName)}
                            className="flex flex-row justify-between gap-1"
                          >
                            <svg
                              aria-hidden="true"
                              className="inline-block h-5 w-5 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                            <span>save to favourites</span>
                            <svg
                              aria-hidden="true"
                              className="inline-block h-5 w-5 text-yellow-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                          </Button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                },
              )}
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
