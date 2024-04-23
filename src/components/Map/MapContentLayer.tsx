"use-client";

import {
  Polyline,
  FeatureGroup,
  useMap,
  LayersControl,
  LayerGroup,
  Pane,
  useMapEvents,
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

import type { Route, Stop, StopTime } from "@prisma/client";
import { parseDatetimeLocale } from "@/lib/timeHelpers";
import Bus from "./Bus";
import usePrevious from "@/hooks/usePrevious";
import isEqual from "react-fast-compare";
import { DateTime } from "luxon";
import useTripUpdates from "@/hooks/useTripUpdates";
import useStopId from "@/hooks/useStopId";
import { Position } from "@turf/helpers";
import MarkerClusterGroup from "./MarkerClusterGroup";
import StopMarker from "./StopMarker";
import useVehicleUpdates from "@/hooks/useVehicleUpdates";
import { TripHandler } from "@/pages";
import L from "leaflet";
import GPSGhost from "./GPSGhost";
import { MAP_DEFAULT_ZOOM } from ".";
import UserLocation from "./UserLocation";

export type ValidStop = Stop & {
  stopLat: NonNullable<Stop["stopLat"]>;
  stopLon: NonNullable<Stop["stopLon"]>;
};
export type StopWithTimes = { stop: ValidStop; times?: StopTime[] };

type Props = {
  height: number;
  selectedDateTime: string;
  tripId: string | null;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string) => void;
  handleSelectedTrip: TripHandler;
  handleDestinationStop: (stopId: string) => void;
  center: LatLngTuple;
  routesById: Map<string, Route>;
  shape: Position[] | undefined;
  showFooter: boolean;
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
  handleSelectedTrip,
  handleDestinationStop,
  height,
  center,
  routesById,
  selectedDateTime,
  handleSaveStop,
  stopTimes,
  stopTimesByStopId,
  setShowSavedStops,
  shape,
  showFooter,
  stops,
  stopsById,
  selectedStopId,
  selectedDestinationStopId,
  tripId,
}: Props) {
  const map = useMap();
  const markerGroupRef = useRef<L.FeatureGroup>(null);

  const getWidthHeightInKM = useCallback(() => {
    const bounds = map.getBounds();

    const width =
      map.distance(bounds.getNorthWest(), bounds.getNorthEast()) / 1000;
    const height =
      map.distance(bounds.getNorthWest(), bounds.getSouthWest()) / 1000;

    return (width + height) / 2;
  }, [map]);

  const [mapCenter, setMapCenter] = useState({
    lat: center[0],
    lng: center[1],
  });

  const [mapKM, setMapKM] = useState(getWidthHeightInKM());
  const [zoomLevel, setZoomLevel] = useState(MAP_DEFAULT_ZOOM);

  const mapEvents = useMapEvents({
    moveend() {
      const { lat, lng } = mapEvents.getCenter();
      setMapCenter({ lat, lng });
    },
    zoomend() {
      setMapKM(getWidthHeightInKM());
      setZoomLevel(map.getZoom());
    },
  });

  const stopIds = useMemo(() => {
    return stops ? stops.map(({ stopId }) => stopId) : [];
  }, [stops]);

  const previousStopIds = usePrevious(stopIds);
  const prevCenter = usePrevious(center);

  const { selectedStop } = useStopId(selectedStopId);

  // Set map center location on new route selection
  useEffect(() => {
    if (!stopIds.length) return;

    const group = markerGroupRef.current;

    if (prevCenter !== center && !isEqual(stopIds, previousStopIds)) {
      if (group?.getBounds().isValid()) {
        map.flyToBounds(group.getBounds());
      } else {
        map.setView(center);
      }
    } else if (!isEqual(stopIds, previousStopIds)) {
      if (group?.getBounds().isValid()) {
        map.flyToBounds(group.getBounds());
      }
    }
  }, [center, map, prevCenter, previousStopIds, stopIds]);

  // Set map dimensions onload/onresize
  useEffect(() => {
    if (map != null) {
      const mapContainer = map.getContainer();
      mapContainer.style.cssText = `height: ${height}px; width: 100%; position: relative;`;
      const center = map.getCenter();
      const zoom = map.getZoom();
      map.invalidateSize();
      map.setView(center, zoom);
      setMapKM(getWidthHeightInKM());
    }
  }, [map, height, getWidthHeightInKM]);

  // Realtime state
  const { realtimeScheduledByTripId, addedTripStopTimes } =
    useTripUpdates(tripId);

  const { vehicleUpdates } = useVehicleUpdates(mapCenter, mapKM, zoomLevel);

  const realtimeTrip = useMemo(
    () => (!!tripId ? realtimeScheduledByTripId.get(tripId) : undefined),
    [realtimeScheduledByTripId, tripId],
  );
  // const { stopTimeUpdate } = realtimeTrip || {};

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

    return [];
  }, [stopTimes, stops, stopsById]);

  const singleStop: StopWithTimes[] = useMemo(() => {
    if (
      selectedStop &&
      selectedStop.stopLat !== null &&
      selectedStop.stopLon !== null
    ) {
      return [{ stop: selectedStop as ValidStop }];
    }
    return [];
  }, [selectedStop]);

  return (
    <LayersControl>
      {/* Vehicle marker */}
      <LayersControl.Overlay name="Estimated Vehicle Position" checked>
        <LayerGroup>
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

      <LayersControl.Overlay name="Nearby buses" checked>
        <FeatureGroup>
          {!!vehicleUpdates.length &&
            vehicleUpdates
              .filter((v) => Boolean(v.trip.tripId))
              .map((vehicle) => (
                <GPSGhost
                  key={
                    "gps" +
                    vehicle.vehicle.id +
                    vehicle.position.latitude +
                    vehicle.position.longitude
                  }
                  vehicle={vehicle}
                  routesById={routesById}
                  zoom={zoomLevel}
                  handleTrip={handleSelectedTrip}
                />
              ))}
        </FeatureGroup>
      </LayersControl.Overlay>

      {/* Route stop markers */}
      <LayersControl.Overlay name="Stops" checked>
        <FeatureGroup ref={markerGroupRef}>
          <MarkerClusterGroup maxClusterRadius={60}>
            {(stopList.length ? stopList : singleStop).map((stopWithTimes) => {
              return (
                <StopMarker
                  key={"mm" + stopWithTimes.stop.stopId}
                  stopWithTimes={stopWithTimes}
                  handleDestinationStop={handleDestinationStop}
                  handleSaveStop={handleSaveStop}
                  handleSelectedStop={handleSelectedStop}
                  realtimeTrip={realtimeTrip}
                  stopTimesByStopId={stopTimesByStopId}
                ></StopMarker>
              );
            })}
          </MarkerClusterGroup>
        </FeatureGroup>
      </LayersControl.Overlay>

      {/* User Location dot */}
      <UserLocation className={showFooter ? "!mb-24" : ""} />

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
