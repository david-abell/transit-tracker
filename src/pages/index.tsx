"use-client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import useRealtime from "@/hooks/useRealtime";
import SearchInput from "@/components/SearchInput";
import TripModal from "@/components/tripModal/TripModal";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";
import Modal from "@/components/Modal";

import useRouteId from "@/hooks/useRouteId";
import MainNav from "@/components/MainNav";
import { useElementSize, useMediaQuery, useWindowSize } from "usehooks-ts";
import SavedStops from "@/components/SavedStops";
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
import { LatLngExpression } from "leaflet";

const Map = dynamic(() => import("../components/Map"), {
  ssr: false,
});

const INITIAL_LOCATION: LatLngExpression = [
  53.3477999659065, -6.25849647173381,
];

export default function Home() {
  // query params state
  const [routeId, setRouteId] = useQueryState("routeId");
  const [tripId, setTripId] = useQueryState("tripId");
  const [stopId, setStopId] = useQueryState("stopId");
  const [destId, setDestId] = useQueryState(
    "destId",
    parseAsString.withDefault(""),
  );

  // Query string helpers
  const removeQueryParams = () => {
    setRouteId(null);
    setTripId(null);
    setStopId(null);
    setDestId(null);
  };

  // clear Destination stop on state change
  useEffect(() => {
    setDestId(null);
  }, [routeId, tripId, stopId, setDestId]);

  // user input state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  // component visibility state
  const [mapCenter, setMapCenter] =
    useState<LatLngExpression>(INITIAL_LOCATION);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSavedStops, setShowSavedStops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    realtimeScheduledByTripId: tripUpdatesByTripId,
    isLoadingRealtime,
    error: realTimeError,
  } = useRealtime(tripId);

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

  const isNewUser =
    !isWarmingDB && !apiError && !routeId && !tripId && !stopId && !destId;

  // event handlers
  const handleSelectedTrip = ({
    tripId,
    newRouteId,
    from,
  }: {
    tripId: string;
    newRouteId?: string;
    from: LatLngExpression;
  }) => {
    setShowTripModal(false);
    const currentRouteId = routeId;
    setTripId(tripId);
    if (newRouteId && currentRouteId !== newRouteId) {
      setRouteId(newRouteId);
    }
    setMapCenter(from);
  };

  const handleSelectedStop = useCallback(
    (stopId: string) => {
      setStopId(stopId);

      setShowTripModal(true);
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
                Report an
              </Link>
            </NavItem>
          </MainNav>
        </div>
        <div className="relative">
          <Map
            center={mapCenter}
            shape={shape}
            selectedDateTime={selectedDateTime}
            selectedStopId={stopId}
            selectedDestinationStopId={destId}
            stopTimes={stopTimes}
            stopTimesByStopId={stopTimesByStopId}
            setShowSavedStops={setShowSavedStops}
            stops={stops}
            stopsById={stopsById}
            handleSelectedStop={handleSelectedStop}
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
          handleTimeChange={onTimeChange}
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
        <NewUserPrompt
          isMobile={isMobile}
          visible={isNewUser}
          setShowMenu={setShowMobileMenu}
          showMenu={showMobileMenu}
        />
      )}

      <Footer
        destination={destinationStop}
        route={selectedRoute}
        stop={selectedStop}
        stopTimes={stopTimes}
        trip={selectedTrip}
        tripUpdatesByTripId={tripUpdatesByTripId}
      />
    </main>
  );
}
