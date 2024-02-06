"use-client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import useRealtime from "@/hooks/useRealtime";
import MapComponent from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripModal from "@/components/tripModal/TripModal";
import DateTimeSelect from "@/components/DateTimeSelect";
import {
  formatDelay,
  getDelayedTime,
  initDateTimeValue,
} from "@/lib/timeHelpers";
import Modal from "@/components/Modal";

import useRouteId from "@/hooks/useRouteId";
import MainNav from "@/components/MainNav";
import { useElementSize, useMediaQuery, useWindowSize } from "usehooks-ts";
import SavedStops from "@/components/SavedStops";
import useStopId from "@/hooks/useStopId";

import { AlertCircle, Menu, MenuSquare } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useShape from "@/hooks/useShape";
import useStopTimes from "@/hooks/useStopTimes";
import useStops from "@/hooks/useStops";
import useWarmup from "@/hooks/useWarmup";
import useTrip from "@/hooks/useTrip";
import Footer from "@/components/Footer";
import StopSelect from "@/components/StopSelect";
import { Button } from "@/components/ui/button";
import { Stop, StopTime } from "@prisma/client";
import NavItem from "@/components/NavItem";
import GlobalAlert from "@/components/GlobalAlert";
import DestinationSelect, {
  StopAndStopTime,
} from "@/components/DestinationSelect";

const inter = Inter({ subsets: ["latin"] });

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
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSavedStops, setShowSavedStops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { height: windowHeight } = useWindowSize();
  const [navContainer, { height: navHeight }] =
    useElementSize<HTMLDivElement>();
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const navRef = useRef<HTMLDivElement>(null);

  // trigger database warmup with a cheap onetime query
  const { isLoading: isDBLoading, error: dbError } = useWarmup();

  // static schedule data
  const {
    route: selectedRoute,
    error: routeError,
    isLoading: isLoadingRoute,
  } = useRouteId(routeId);

  const {
    selectedStop,
    error: stopError,
    isLoading: isLoadingStop,
  } = useStopId(stopId);

  const {
    selectedStop: destinationStop,
    error: destinationError,
    isLoading: isLoadingDestination,
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
    isLoading: isLoadingRealTime,
    error: realTimeError,
  } = useRealtime(tripId);

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
    isDBLoading ||
    isLoadingDestination ||
    isLoadingRoute ||
    isLoadingStop ||
    isLoadingStops ||
    isLoadingStopTimes ||
    isLoadingTrip ||
    isLoadingShape ||
    isLoadingRealTime;

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

  const isLandingPageGreeting =
    !isDBLoading && !apiError && !routeId && !tripId && !stopId && !destId;

  // event handlers
  const handleSelectedTrip = (tripId: string, newRouteId?: string) => {
    setShowTripModal(false);
    const currentRouteId = routeId;
    setTripId(tripId);
    if (newRouteId && currentRouteId !== newRouteId) {
      setRouteId(newRouteId);
    }
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
            selectedRoute={selectedRoute}
            showMenu={showMobileMenu}
            setShowMenu={setShowMobileMenu}
            navRef={navRef}
          >
            <NavItem>
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
                setSelectedDateTime={setSelectedDateTime}
              />
            </NavItem>

            <NavItem>
              <Button
                className="lg:w-36 w-full"
                onClick={() => setShowSavedStops(true)}
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
                <span>Favourites</span>
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
          </MainNav>
        </div>
        <div className="relative">
          <MapComponent
            shape={shape}
            selectedDateTime={selectedDateTime}
            selectedStopId={stopId}
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
      >
        <TripModal
          handleSelectedTrip={handleSelectedTrip}
          selectedDateTime={selectedDateTime}
          selectedRoute={selectedRoute}
          selectedStopId={stopId}
        />
      </Modal>

      <SavedStops
        isOpen={showSavedStops}
        setIsOpen={setShowSavedStops}
        setShowTripModal={setShowTripModal}
      />

      {/* Errors and loading messages */}
      <GlobalAlert visible={isDBLoading || isLoading}>
        {isDBLoading
          ? "Database warming in progress 🔥🔥🔥"
          : isLoadingRealTime
            ? "Loading realtime data"
            : "Loading..."}
      </GlobalAlert>

      <GlobalAlert visible={!!apiError} variant="destructive">
        {apiError?.message || "An Unknown error occurred."}
      </GlobalAlert>

      <GlobalAlert visible={isLandingPageGreeting}>
        Ready to go! Use the menu to search for a bus name like{" "}
        <b>Ballycullen Road</b>, route number like <b>15</b> or a specific stop
        code like <b>4495</b>.
      </GlobalAlert>

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
