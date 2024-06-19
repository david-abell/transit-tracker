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
import { hasSameDay } from "@/lib/timeHelpers";
import Bus from "./Bus";
import usePrevious from "@/hooks/usePrevious";
import isEqual from "react-fast-compare";
import useTripUpdates from "@/hooks/useTripUpdates";
import useStopId from "@/hooks/useStopId";
import { Position } from "@turf/helpers";
import MarkerClusterGroup from "./MarkerClusterGroup";
import StopMarker from "./StopMarker";
import useVehicleUpdates from "@/hooks/useVehicleUpdates";
import { TripHandler } from "@/pages";
import L from "leaflet";
import GPSGhost from "./GPSGhost";
import { MAP_DEFAULT_ZOOM, MAX_MAP_ZOOM } from ".";
import UserLocation from "./UserLocation";
import { StopWithGroupedTimes, ValidStop } from "@/types/gtfsDerived";

type Props = {
  height: number;
  selectedDateTime: string;
  tripId: string | null;
  mapCenter: LatLngTuple;
  handleMapCenter: (latLon: LatLngTuple, requestCenter?: boolean) => void;
  handleSaveStop: (stopId: string, stopName: string | null) => void;
  handleSelectedStop: (stopId: string) => void;
  handleSelectedTrip: TripHandler;
  handleDestinationStop: (stopId: string) => void;
  routesById: Map<string, Route>;
  requestMapCenter: boolean;
  setRequestMapCenter: Dispatch<SetStateAction<boolean>>;
  shape: Position[] | undefined;
  stopsById: Map<string, Stop>;
  stopsWithTimes: StopWithGroupedTimes[];
  stopTimesByStopId: Map<StopTime["tripId"], StopTime>;
  selectedStop: Stop | undefined;
  stops: Stop[] | undefined;
};

function MapContentLayer({
  mapCenter,
  handleMapCenter,
  handleSelectedStop,
  handleSelectedTrip,
  handleDestinationStop,
  height,
  routesById,
  selectedDateTime,
  handleSaveStop,
  requestMapCenter,
  setRequestMapCenter,
  stopTimesByStopId,
  shape,
  stops,
  stopsWithTimes,
  stopsById,
  selectedStop,
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

  const [mapKM, setMapKM] = useState(getWidthHeightInKM());
  const [zoomLevel, setZoomLevel] = useState(MAP_DEFAULT_ZOOM);
  const prevCenter = usePrevious(mapCenter);
  const boundsRef = useRef<L.LatLngBounds | undefined>();
  const moveTimer = useRef<ReturnType<typeof setTimeout>>();
  const effectMoveTimer = useRef<ReturnType<typeof setTimeout>>();

  const mapEvents = useMapEvents({
    moveend() {
      const { lat, lng } = mapEvents.getCenter();
      function moveToCenter() {
        const { lat, lng } = mapEvents.getCenter();
        handleMapCenter([lat, lng], false);
      }

      if (!prevCenter) {
        if (moveTimer.current) {
          clearTimeout(moveTimer.current);
        }
        moveTimer.current = setTimeout(moveToCenter, 200);
        // handleMapCenter([lat, lng], false);
      } else {
        if (prevCenter[0] !== lat || prevCenter[1] !== lng) {
          if (moveTimer.current) {
            clearTimeout(moveTimer.current);
          }
          moveTimer.current = setTimeout(moveToCenter, 200);
          // handleMapCenter([lat, lng], false);
        }
      }
    },
    zoomend() {
      setMapKM(getWidthHeightInKM());
      setZoomLevel(Math.min(MAX_MAP_ZOOM, map.getZoom()));
    },
  });

  const stopIds = useMemo(() => {
    return stops ? stops.map(({ stopId }) => stopId) : [];
  }, [stops]);

  const previousStopIds = usePrevious(stopIds);

  // Center map on state updates
  useEffect(() => {
    const { stopLat, stopLon } = selectedStop || {};
    const isSelectStopCentered =
      !!stopLat &&
      !!stopLon &&
      (stopLat !== mapCenter[0] || stopLon !== mapCenter[1]);
    const group = markerGroupRef.current;
    const prevBounds = boundsRef.current;
    const bounds = group?.getBounds();
    let isNewBounds = false;

    if (bounds?.isValid()) {
      boundsRef.current = bounds;
      if (!prevBounds) {
        isNewBounds = true;
      } else if (prevBounds.isValid() && !bounds.equals(prevBounds)) {
        isNewBounds = true;
      }
    }

    const isNewCenter =
      mapCenter[0] !== prevCenter?.[0] || mapCenter[1] !== prevCenter?.[1];
    const isNewIds = !isEqual(stopIds, previousStopIds);
    const shouldNotMove =
      !isNewCenter &&
      !isNewBounds &&
      !requestMapCenter &&
      isSelectStopCentered &&
      !isNewIds;

    if (shouldNotMove) return;

    const isSameNorth =
      bounds?.isValid() &&
      bounds?.getNorthEast()?.equals(bounds?.getNorthWest());
    const isSameSouth =
      bounds?.isValid() &&
      bounds?.getSouthEast()?.equals(bounds?.getSouthWest());

    if (bounds?.isValid() && (isNewBounds || isNewIds)) {
      const boundsCenter = bounds.getCenter();
      if (isSameNorth && isSameSouth && !stopIds.length) {
        if (effectMoveTimer.current) {
          clearTimeout(effectMoveTimer.current);
        }
        effectMoveTimer.current = setTimeout(
          () => map.setView(boundsCenter, zoomLevel),
          300,
        );
      } else if (!isEqual(stopIds, previousStopIds)) {
        if (effectMoveTimer.current) {
          clearTimeout(effectMoveTimer.current);
        }
        effectMoveTimer.current = setTimeout(
          () => map.fitBounds(bounds, { maxZoom: MAX_MAP_ZOOM }),
          300,
        );
      }
    } else if (requestMapCenter) {
      setRequestMapCenter(false);
      if (effectMoveTimer.current) {
        clearTimeout(effectMoveTimer.current);
      }
      // Is selected stop centered
      if (
        !!stopLat &&
        !!stopLon &&
        (stopLat !== mapCenter[0] || stopLon !== mapCenter[1])
      ) {
        effectMoveTimer.current = setTimeout(
          () => map.setView([stopLat, stopLon], zoomLevel),
          300,
        );
      } else {
        effectMoveTimer.current = setTimeout(
          () => map.setView(mapCenter, zoomLevel),
          300,
        );
      }
    }
  }, [
    map,
    mapCenter,
    prevCenter,
    previousStopIds,
    requestMapCenter,
    selectedStop,
    setRequestMapCenter,
    stopIds,
    stopsWithTimes,
    zoomLevel,
  ]);

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

  const { vehicleUpdates } = useVehicleUpdates(
    { lat: mapCenter[0], lng: mapCenter[1] },
    mapKM,
    zoomLevel,
  );

  // const realtimeTrip = useMemo(
  //   () => (!!tripId ? realtimeScheduledByTripId.get(tripId) : undefined),
  //   [realtimeScheduledByTripId, tripId],
  // );
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
    () => hasSameDay(selectedDateTime),
    [selectedDateTime],
  );

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
            vehicleUpdates.map((vehicle) => (
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
          <MarkerClusterGroup
            maxClusterRadius={60}
            disableClusteringAtZoom={MAX_MAP_ZOOM - 2}
            spiderfyOnMaxZoom={false}
            zoomToBoundsOnClick
          >
            {!!stopsWithTimes.length &&
              stopsWithTimes.map((stopWithTimes, index) => {
                return (
                  <StopMarker
                    isLast={
                      stopsWithTimes.length > 1 &&
                      index === stopsWithTimes.length - 1
                    }
                    key={"mm" + stopWithTimes.stop.stopId}
                    stopWithTimes={stopWithTimes}
                    handleDestinationStop={handleDestinationStop}
                    handleSaveStop={handleSaveStop}
                    handleSelectedStop={handleSelectedStop}
                    stopTimesByStopId={stopTimesByStopId}
                  ></StopMarker>
                );
              })}
          </MarkerClusterGroup>
        </FeatureGroup>
      </LayersControl.Overlay>

      {/* User Location dot */}
      <UserLocation />

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
