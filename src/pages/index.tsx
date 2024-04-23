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
  useElementSize,
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
  const [destId, setDestId] = useQueryState(
    "destId",
    parseAsString.withDefault("").withOptions({ history: "push" }),
  );

  // Query string helpers
  const removeQueryParams = useCallback(() => {
    setRouteId(null);
    setTripId(null);
    setStopId(null);
    setDestId(null);
  }, [setDestId, setRouteId, setStopId, setTripId]);

  // clear Destination stop on state change
  useEffect(() => {
    setDestId(null);
  }, [routeId, tripId, stopId, setDestId]);

  // user state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  const [savedStops, setSavedStops] = useLocalStorage<SavedStop>(
    "savedSTops",
    {},
  );

  // component visibility state
  const [mapCenter, setMapCenter] = useState<LatLngTuple>(INITIAL_LOCATION);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSavedStops, setShowSavedStops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNewUser, setShowNewUser] = useState(
    !(!!routeId || !!tripId || !!stopId || !!destId),
  );

  const { height: windowHeight } = useWindowSize();
  const [navContainer, { height: navHeight }] =
    useElementSize<HTMLDivElement>();
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
      if (!stop) return;
      orderedStops.push({ stop, stopTime });
    });

    return orderedStops;
  }, [stopId, stopTimes, stopsById]);

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
  const handleSelectedTrip: TripHandler = useCallback(
    ({ stopId, tripId, newRouteId, from }) => {
      setShowTripModal(false);
      if (newRouteId) {
        removeQueryParams();
        setRouteId((prev) => (prev !== newRouteId ? newRouteId : prev));
      }
      if (stopId) {
        setStopId(stopId);
      }
      setTripId(tripId);
      setMapCenter(from);
    },
    [removeQueryParams, setRouteId, setStopId, setTripId],
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

  const showFooter = useMemo(() => !!routeId, [routeId]);

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
                selectedRoute={selectedRoute}
                removeQueryParams={removeQueryParams}
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
                className="lg:w-36 w-full flex flex-row justify-between gap-2"
                onClick={() => setShowSavedStops(true)}
              >
                <span>Favourites </span>
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
              <Link
                href={"https://github.com/david-abell/transit-tracker/issues"}
                className="w-full text-primary hover:text-primary/90 hover:underline flex items-center gap-2 text-lg"
              >
                <Icon icon={"simple-icons:github"} className="inline-block" />{" "}
                Report an issue
              </Link>
            </NavItem>
          </MainNav>
        </div>
        <div className="relative">
          <MapContainer
            center={mapCenter}
            routesById={routesById}
            shape={shape}
            selectedDateTime={selectedDateTime}
            selectedStopId={stopId}
            selectedDestinationStopId={destId}
            showFooter={showFooter}
            stopTimes={stopTimes}
            stopTimesByStopId={stopTimesByStopId}
            setShowSavedStops={setShowSavedStops}
            stops={stops}
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
        setShowTripModal={setShowTripModal}
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

      {!!showFooter && (
        <Footer
          destination={destinationStop}
          route={selectedRoute}
          stop={selectedStop}
          stopTimes={stopTimes}
          trip={selectedTrip}
          tripUpdatesByTripId={tripUpdatesByTripId}
        />
      )}
    </main>
  );
}
