"use-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import useTripUpdates from "@/hooks/useTripUpdates";
import SearchInput from "@/components/SearchInput";
import TripModal from "@/components/tripModal/TripModal";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";
import Modal from "@/components/Modal";

import useRouteId from "@/hooks/useRouteId";
import MainNav from "@/components/MainNav";
import {
  useResizeObserver,
  useLocalStorage,
  useMediaQuery,
  useWindowSize,
} from "usehooks-ts";
import SavedStops, { SavedStop } from "@/components/SavedStops";
import useStopId from "@/hooks/useStopId";

import { Star } from "lucide-react";
import { Icon } from "@iconify/react";

import useShape from "@/hooks/useShape";
import useStopTimes from "@/hooks/useStopTimes";
import useStops from "@/hooks/useStops";
import useWarmup from "@/hooks/useWarmup";
import useTrip from "@/hooks/useTrip";
import Footer from "@/components/Footer";
import StopSelect from "@/components/StopSelect";
import { Button } from "@/components/ui/button";
import NavItem from "@/components/NavItem";
import GlobalAlert from "@/components/GlobalAlert";
import DestinationSelect, {
  StopAndStopTime,
} from "@/components/DestinationSelect";
import NewUserPrompt from "@/components/NewUserPrompt";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LatLngExpression, LatLngTuple } from "leaflet";
import useRoute from "@/hooks/useRoute";
import Changelog from "@/components/changelog/Changelog";
import {
  getAdjustedStopTimes,
  getOrderedStops,
  getStopsWithStopTimes,
  isValidStop,
} from "@/lib/utils";
import usePrevious from "@/hooks/usePrevious";
import {
  StopWithGroupedTimes,
  ValidStop,
} from "@/components/Map/MapContentLayer";

const MapContainer = dynamic(() => import("../components/Map"), {
  ssr: false,
});

const INITIAL_LOCATION: LatLngTuple = [53.3477999659065, -6.25849647173381];

export type TripHandler = ({
  stopId,
  tripId,
  newRouteId,
  from,
}: {
  stopId?: string;
  tripId: string;
  newRouteId?: string | undefined;
  from: LatLngTuple;
}) => void;

export default function Home() {
  // query params state
  const [routeId, setRouteId] = useQueryState("routeId", { history: "push" });
  const [tripId, setTripId] = useQueryState("tripId", { history: "push" });
  const [stopId, setStopId] = useQueryState("stopId", { history: "push" });
  const [destId, setDestId] = useQueryState("destId", { history: "push" });

  const prevTrip = usePrevious(tripId);
  const prevRoute = usePrevious(routeId);

  // clear Destination stop on route and trip change
  useEffect(() => {
    if (
      (prevTrip && prevTrip !== tripId) ||
      (prevRoute && prevRoute !== routeId)
    ) {
      setDestId(null);
    }
  }, [prevRoute, prevTrip, routeId, setDestId, tripId]);

  // Query string helpers
  const removeQueryParams = useCallback(() => {
    setRouteId(null);
    setTripId(null);
    setStopId(null);
    setDestId(null);
  }, [setDestId, setRouteId, setStopId, setTripId]);

  // user state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  // component visibility state
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(INITIAL_LOCATION);
  const [requestMapCenter, setRequestMapCenter] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSavedStops, setShowSavedStops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNewUser, setShowNewUser] = useState(
    !(!!routeId || !!tripId || !!stopId || !!destId),
  );
  const [showChangelog, setShowChangelog] = useState(false);

  const { height: windowHeight } = useWindowSize();
  const navContainer = useRef<HTMLDivElement>(null);
  const { height: navHeight = 0 } = useResizeObserver<HTMLDivElement>({
    ref: navContainer,
  });
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const navRef = useRef<HTMLDivElement>(null);

  // trigger database warmup with a cheap onetime query
  const { isWarmingDB, error: dbError } = useWarmup();

  // static schedule data
  const {
    route: selectedRoute,
    error: routeError,
    isLoadingRoute,
  } = useRouteId(routeId);

  const { routes } = useRoute("", { all: true });

  const routesById = useMemo(
    () => new Map(routes?.map((route) => [route.routeId, route])),
    [routes],
  );

  const { selectedStop, error: stopError, isLoadingStop } = useStopId(stopId);

  // useEffect(() => {
  //   if (!selectedStop) return;
  //   const { stopLat, stopLon } = selectedStop;
  //   if (!stopLat || !stopLon) return;
  //   setMapCenter([stopLat, stopLon]);
  // }, [selectedStop]);

  const {
    selectedStop: destinationStop,
    error: destinationError,
    isLoadingStop: isLoadingDestination,
  } = useStopId(destId, true);

  const { selectedTrip, isLoadingTrip, tripError } = useTrip(tripId);

  const { stops, stopsById, isLoadingStops, stopsError } = useStops({
    routeId,
  });

  const { stopTimes, stopTimesByStopId, isLoadingStopTimes, stopTimesError } =
    useStopTimes(tripId);

  const { shape, shapeError, isLoadingShape } = useShape(tripId);

  // Realtime state

  const {
    realtimeAddedTrips,
    realtimeScheduledByTripId: tripUpdatesByTripId,
    isLoadingRealtime,
    error: realTimeError,
  } = useTripUpdates(tripId ?? "");

  const [isChildApiLoading, setIsChildApiLoading] = useState(false);

  const onApiLoading = useCallback(
    (val: boolean) => setIsChildApiLoading(val),
    [setIsChildApiLoading],
  );

  const onTimeChange = useCallback(
    (e?: React.ChangeEvent<HTMLInputElement>) => {
      if (e?.target?.value) {
        setSelectedDateTime(e.target.value);
      } else {
        const now = initDateTimeValue();
        setSelectedDateTime(now);
      }
    },
    [],
  );

  // derived state
  const stopTimeUpdates = useMemo(
    () =>
      selectedTrip &&
      tripUpdatesByTripId.get(selectedTrip?.tripId)?.stopTimeUpdate,
    [tripUpdatesByTripId, selectedTrip],
  );

  const adjustedStopTimes = useMemo(
    () => getAdjustedStopTimes(stopTimes, stopTimeUpdates),
    [stopTimeUpdates, stopTimes],
  );

  const stopsWithTimes: StopWithGroupedTimes[] = useMemo(() => {
    const orderedStops: Map<string, StopWithGroupedTimes> = new Map();

    if (adjustedStopTimes?.length) {
      for (const stopTime of adjustedStopTimes) {
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
      const orderedStops: Map<string, StopWithGroupedTimes> = new Map();

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
  }, [adjustedStopTimes, stops, stopsById]);

  const destinationStops: StopAndStopTime[] = useMemo(() => {
    if (!stopTimes?.length || !stopId) return [];

    const selectedStopIndex = stopTimes?.findIndex(
      (time) => time.stopId === stopId,
    );

    if (selectedStopIndex === -1 || selectedStopIndex >= stopTimes.length)
      return [];

    const times = stopTimes.slice(selectedStopIndex + 1);

    const orderedStops: StopAndStopTime[] = [];

    times?.forEach((stopTime) => {
      const stop = stopsById.get(stopTime.stopId);
      if (!stop || !isValidStop(stop)) return;
      orderedStops.push({ stop, stopTime });
    });

    return orderedStops;
  }, [stopId, stopTimes, stopsById]);

  // const orderdStops = useMemo(
  //   () => getOrderedStops(adjustedStopTimes, stopsById),
  //   [adjustedStopTimes, stopsById],
  // );

  // const stopList = useMemo(
  //   () => getStopsWithStopTimes(stopsById, adjustedStopTimes, destId),
  //   [adjustedStopTimes, destId, stopsById],
  // );

  // const validDestinationStops: ValidStop[] = useMemo(
  //   () =>
  //     destinationStops
  //       ?.map(({ stop }) => stop)
  //       .filter((stop): stop is ValidStop => isValidStop(stop)),
  //   [destinationStops],
  // );

  const isLoading =
    isWarmingDB ||
    isLoadingDestination ||
    isLoadingRoute ||
    isLoadingStop ||
    isLoadingStops ||
    isLoadingStopTimes ||
    isLoadingTrip ||
    isLoadingShape ||
    isLoadingRealtime ||
    isChildApiLoading;

  const apiError =
    dbError ||
    destinationError ||
    routeError ||
    tripError ||
    stopError ||
    stopsError ||
    stopTimesError ||
    shapeError ||
    realTimeError;

  if (realTimeError) console.error({ realTimeError });

  const isNewUser =
    !isWarmingDB && !apiError && !routeId && !tripId && !stopId && !destId;

  // event handlers

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

  const handleSelectedRoute = useCallback(
    (routeId: string) => {
      removeQueryParams();
      setRouteId((prev) => {
        if (prev !== routeId) {
          removeQueryParams();
          return routeId;
        }
        return prev;
      });
    },
    [removeQueryParams, setRouteId],
  );

  const handleSelectedTrip: TripHandler = useCallback(
    ({ stopId, tripId, newRouteId, from }) => {
      setShowTripModal(false);
      if (newRouteId) {
        setRouteId((prev) => {
          if (prev !== newRouteId) {
            removeQueryParams();
            return newRouteId;
          }
          return prev;
        });
      }
      let isNewTrip = false;
      setTripId((prev) => {
        if (prev !== tripId) {
          setDestId(null);
          return tripId;
        }
        return prev;
      });
      // setMapCenter(from);
      if (stopId) {
        setStopId(stopId);
      } else if (isNewTrip) {
        setStopId(null);
      }
    },
    [removeQueryParams, setDestId, setRouteId, setStopId, setTripId],
  );

  const handleSelectedStop = useCallback(
    (stopId: string, showModal: boolean = true) => {
      setStopId(stopId);

      if (showModal) {
        setShowTripModal(true);
      }
    },
    [setStopId],
  );

  const handleSelectStopAndClear = useCallback(
    (stopId: string) => {
      removeQueryParams();
      handleSelectedStop(stopId);
      setShowSavedStops(false);
      setShowTripModal(true);
      setRequestMapCenter(true);
    },
    [handleSelectedStop, removeQueryParams],
  );

  const handleDestinationStop = useCallback(
    (stopId: string) => {
      setDestId(stopId);
    },
    [setDestId],
  );

  const handleShowAllStops = () => {
    setTripId(null);
    setStopId(null);
    setDestId(null);
  };

  const handleMapCenter = useCallback(
    (latLon: LatLngTuple, requestCenter: boolean = false) => {
      setMapCenter(latLon);
      setRequestMapCenter(requestCenter);
    },
    [],
  );

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-between text-slate-950 dark:text-white">
      <div className="relative w-full">
        <div ref={navContainer}>
          <MainNav
            isAnimating={isNewUser}
            selectedRoute={selectedRoute}
            showMenu={showMobileMenu}
            setShowMenu={setShowMobileMenu}
            navRef={navRef}
          >
            <NavItem
              className={
                isNewUser
                  ? "attention-pulse focus-within:animate-none rounded-sm"
                  : ""
              }
            >
              <SearchInput
                handleSelectedRoute={handleSelectedRoute}
                selectedRoute={selectedRoute}
                setStopId={handleSelectedStop}
              />
            </NavItem>

            <NavItem>
              <StopSelect
                stopList={stops}
                variant="pickup"
                handler={handleSelectedStop}
                stopId={stopId}
              />
            </NavItem>

            <NavItem>
              <DestinationSelect
                stopId={destId}
                stopList={destinationStops}
                handler={handleDestinationStop}
              />
            </NavItem>

            <NavItem>
              <DateTimeSelect
                selectedDateTime={selectedDateTime}
                handleTimeChange={onTimeChange}
              />
            </NavItem>

            <NavItem>
              <Button
                className="lg:w-36 w-full flex flex-row"
                onClick={() => setShowSavedStops(true)}
              >
                <span className="pr-2">Favourites </span>
                <Star fill="#facc15" color="#facc15" />
              </Button>
            </NavItem>

            <NavItem>
              <Button
                onClick={handleShowAllStops}
                disabled={!routeId}
                className="lg:w-36 w-full"
              >
                Show all stops
              </Button>
            </NavItem>

            <NavItem>
              <Button onClick={() => setShowChangelog(true)} className="w-full">
                Changelog
              </Button>
            </NavItem>

            <NavItem>
              <Link
                href={"https://github.com/david-abell/transit-tracker/issues"}
                className="w-full"
              >
                Report an issue
                <Icon
                  icon={"simple-icons:github"}
                  className="inline-block ml-2"
                />
              </Link>
            </NavItem>
          </MainNav>
        </div>
        <div className="relative">
          <MapContainer
            mapCenter={mapCenter}
            handleMapCenter={handleMapCenter}
            requestMapCenter={requestMapCenter}
            setRequestMapCenter={setRequestMapCenter}
            routesById={routesById}
            shape={shape}
            selectedDateTime={selectedDateTime}
            selectedStop={selectedStop}
            stopTimesByStopId={stopTimesByStopId}
            stops={stops}
            stopsWithTimes={stopsWithTimes}
            stopsById={stopsById}
            handleSaveStop={handleSaveStop}
            handleSelectedStop={handleSelectedStop}
            handleSelectedTrip={handleSelectedTrip}
            handleDestinationStop={handleDestinationStop}
            tripId={tripId}
            height={windowHeight - navHeight}
          />
        </div>
      </div>

      {/* Trip select modal */}
      <Modal
        isOpen={showTripModal}
        title={`${selectedStop ? selectedStop.stopName : ""}`}
        onClose={() => setShowTripModal(false)}
        onOptional={() => onTimeChange()}
        onOptionalText="Refresh"
      >
        <TripModal
          handleSelectedTrip={handleSelectedTrip}
          selectedDateTime={selectedDateTime}
          selectedRoute={selectedRoute}
          selectedStop={selectedStop}
          handleApiLoading={onApiLoading}
        />
      </Modal>

      <SavedStops
        isOpen={showSavedStops}
        setIsOpen={setShowSavedStops}
        handleSelectStopAndClear={handleSelectStopAndClear}
      />

      {/* Errors and loading messages */}
      {isWarmingDB || isLoading ? (
        <GlobalAlert visible={isWarmingDB || isLoading}>
          {isWarmingDB
            ? "Database warming in progress 🔥🔥🔥"
            : isLoadingRealtime
              ? "Loading realtime data"
              : "Loading..."}
        </GlobalAlert>
      ) : apiError ? (
        <GlobalAlert visible={!!apiError} variant="destructive">
          {apiError?.message || "An Unknown error occurred."}
        </GlobalAlert>
      ) : (
        ""
      )}

      {showNewUser && (
        <NewUserPrompt
          isMobile={isMobile}
          visible={isNewUser}
          setShowMenu={setShowMobileMenu}
          setShowNewUser={setShowNewUser}
          showMenu={showMobileMenu}
        />
      )}

      <Changelog show={showChangelog} setShow={setShowChangelog} />

      <Footer
        destination={destinationStop}
        destinationStops={destinationStops}
        handleDestinationStop={handleDestinationStop}
        handleMapCenter={handleMapCenter}
        handleSelectedStop={handleSelectedStop}
        route={selectedRoute}
        stop={selectedStop}
        stops={stops}
        stopsById={stopsById}
        stopTimes={stopTimes}
        trip={selectedTrip}
        tripUpdatesByTripId={tripUpdatesByTripId}
      />
    </main>
  );
}
