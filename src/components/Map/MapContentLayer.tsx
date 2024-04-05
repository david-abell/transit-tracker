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
  useCallback,
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
import { Button } from "@/components/ui/button";
import { Position } from "@turf/helpers";
import MarkerClusterGroup from "./MarkerClusterGroup";
import StopMarker from "./StopMarker";
import StopPopup from "./StopPopup";

type ValidStop = Stop & {
  stopLat: NonNullable<Stop["stopLat"]>;
  stopLon: NonNullable<Stop["stopLon"]>;
};
type StopWithTimes = { stop: ValidStop; times?: StopTime[] };

type Props = {
  height: number;
  selectedDateTime: string;
  tripId: string | null;
  handleSelectedStop: (stopId: string) => void;
  handleDestinationStop: (stopId: string) => void;
  shape: Position[] | undefined;
  stopsById: Map<string, Stop>;
  stopTimes: StopTime[] | undefined;
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  selectedStopId: string | null;
  selectedDestinationStopId: string | null;
  setShowSavedStops: Dispatch<SetStateAction<boolean>>;
  stops: Stop[] | undefined;
};

function MapContentLayer({
  handleSelectedStop,
  handleDestinationStop,
  height,
  selectedDateTime,
  stopTimes,
  stopTimesByStopId,
  setShowSavedStops,
  shape,
  stops,
  stopsById,
  selectedStopId,
  selectedDestinationStopId,
  tripId,
}: Props) {
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);

  const stopIds = useMemo(() => {
    return stops ? stops.map(({ stopId }) => stopId) : [];
  }, [stops]);

  const previousStopIds = usePrevious(stopIds);

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  const handleSaveStop = useCallback(
    (stopId: string, stopName: string | null) => {
      setSavedStops((prev) => {
        const stops = { ...prev };

        stops[stopId] = stopName || stopId;

        return stops;
      });
      setShowSavedStops(true);
    },
    [setSavedStops, setShowSavedStops],
  );

  const { selectedStop } = useStopId(selectedStopId);

  const selectedStoptime = useMemo(
    () => selectedStopId && stopTimesByStopId.get(selectedStopId),
    [selectedStopId, stopTimesByStopId],
  );

  useEffect(() => {
    // if (map != null && !stopIds.length && !selectedStop) {
    //   map.locate({ setView: true, maxZoom: 16 });
    // }
    if (stopIds.length && isEqual(stopIds, previousStopIds)) {
      return;
    }
    if (stopIds.length) {
      const group = markerGroupRef.current;

      if (!group || !group.getBounds().isValid()) return;
      console.log("flying to group");

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

  // useEffect(() => {
  //   if (map != null) {
  //     map.locate({ setView: true, maxZoom: 16 });
  //   }
  // }, [map]);

  // Realtime state
  const { realtimeScheduledByTripId, addedTripStopTimes, realtimeAddedTrips } =
    useRealtime(tripId);

  const realtimeTrip = useMemo(
    () => !!tripId && realtimeScheduledByTripId.get(tripId),
    [realtimeScheduledByTripId, tripId],
  );
  const { stopTimeUpdate } = realtimeTrip || {};
  const lastStopTimeUpdate = stopTimeUpdate && stopTimeUpdate.at(-1);

  // const isAddedTrip = useMemo(
  //   () =>
  //     !!realtimeTrip
  //       ? realtimeTrip.trip.scheduleRelationship === "ADDED"
  //       : false,
  //   [realtimeTrip],
  // );

  // const addedTripStops =
  //   isAddedTrip &&
  //   stopTimeUpdate?.flatMap(({ stopId }) => stopsById.get(stopId || "") || []);

  // Rerender interval to update live position and marker colors
  // const [count, setCount] = useState<number>(0);
  // useInterval(() => {
  //   setCount(count + 1);
  // }, 2000);

  const isToday = useMemo(
    () => DateTime.now().hasSame(parseDatetimeLocale(selectedDateTime), "day"),
    [selectedDateTime],
  );

  // Some stops are visited twice
  // don't render them twice if no trip Selected
  const stopList: StopWithTimes[] = useMemo(() => {
    const orderedStops: Map<string, StopWithTimes> = new Map();

    if (stopTimes?.length) {
      for (const stopTime of stopTimes) {
        const stop = stopsById.get(stopTime.stopId);
        if (!stop || stop?.stopLat === null || stop?.stopLon === null) continue;

        if (orderedStops.has(stopTime.stopId)) {
          const { stop, times } = orderedStops.get(stopTime.stopId)!;
          orderedStops.set(stopTime.stopId, {
            stop: stop as ValidStop,
            times: times?.concat(stopTime),
          });
        } else {
          orderedStops.set(stopTime.stopId, {
            stop: stop as ValidStop,
            times: [stopTime],
          });
        }
      }

      return [...orderedStops.values()];
    }

    if (stops?.length) {
      const orderedStops: Map<string, StopWithTimes> = new Map();

      for (const stop of stops) {
        if (
          !orderedStops.has(stop.stopId) &&
          stop.stopLat !== null &&
          stop.stopLon !== null
        ) {
          orderedStops.set(stop.stopId, { stop: stop as ValidStop });
        }
      }

      return [...orderedStops.values()];
    }

    if (
      selectedStop &&
      selectedStop.stopLat !== null &&
      selectedStop.stopLon !== null
    ) {
      return [{ stop: selectedStop as ValidStop }];
    }

    return [];
  }, [selectedStop, stopTimes, stops, stopsById]);

  return (
    <LayersControl>
      {/* Vehicle marker */}
      <LayersControl.Overlay name="Estimated Vehicle Position" checked>
        <LayerGroup>
          {/* width required for icon not to be 0*0 px */}
          <Pane name="Bus" style={{ zIndex: 640, width: "2.5rem" }}>
            <Bus
              realtimeScheduledByTripId={realtimeScheduledByTripId}
              shape={shape}
              stopIds={stopIds}
              tripId={tripId}
              stopTimesByStopId={stopTimesByStopId}
              stopsById={stopsById}
              show={!isToday}
            />
          </Pane>
        </LayerGroup>
      </LayersControl.Overlay>

      {/* Route stop markers */}
      <LayersControl.Overlay name="Stops" checked>
        <FeatureGroup ref={markerGroupRef}>
          <MarkerClusterGroup>
            {stopList.map(({ stop, times }) => {
              const { stopLat, stopLon, stopName, stopId, stopCode } = stop;

              const { arrivalTime, departureTime, stopSequence } =
                times?.at(0) || {};

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

              const isEarly = arrival?.delay
                ? arrival?.delay < 0
                : departure?.delay
                  ? departure.delay < 0
                  : false;

              const isValidDestination =
                (selectedStoptime &&
                  stopSequence &&
                  selectedStoptime.stopSequence < stopSequence) ||
                false;

              return (
                <StopMarker
                  key={"mm" + stopId + stopSequence}
                  stopLat={stopLat}
                  stopLon={stopLon}
                  stopId={stopId}
                  stopSequence={stopSequence}
                >
                  <StopPopup
                    arrivalTime={arrivalTime ?? ""}
                    delayedArrivalTime={delayedArrivalTime}
                    formattedDelay={prettyDelay}
                    handleDestinationStop={handleDestinationStop}
                    handleSaveStop={handleSaveStop}
                    handleSelectedStop={handleSelectedStop}
                    isValidDestination={isValidDestination}
                    status={
                      isEarly ? "early" : !!prettyDelay ? "late" : "default"
                    }
                    stop={stop}
                  />
                </StopMarker>
              );
            })}
          </MarkerClusterGroup>
        </FeatureGroup>
      </LayersControl.Overlay>

      {/* Trip line shape */}
      {!!shape && (
        <LayersControl.Overlay name="Route Path" checked>
          <Polyline
            pathOptions={{ color: "firebrick" }}
            positions={shape as LatLngTuple[]}
            interactive={false}
          />
        </LayersControl.Overlay>
      )}
    </LayersControl>
  );
}

export default MapContentLayer;
