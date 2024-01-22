"use-client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import MapComponent from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripSelect from "@/components/tripSelect/TripSelect";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";
import Modal from "@/components/Modal";
import { useRouter } from "next/router";
import useRouteId from "@/hooks/useRouteId";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { useElementSize, useWindowSize } from "usehooks-ts";
import SavedStops from "@/components/SavedStops";
import useStopId from "@/hooks/useStopId";

import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useShape from "@/hooks/useShape";
import useStopTimes from "@/hooks/useStopTimes";
import useStops from "@/hooks/useStops";
import useWarmup from "@/hooks/useWarmup";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // query params state
  const routeId = searchParams.get("routeId") || "";
  const tripId = searchParams.get("tripId") || "";
  const stopId = searchParams.get("stopId") || "";

  // Query string helpers
  const removeQueryParams = useCallback(
    (param: string | string[]) => {
      const queries = router.query;
      if (Array.isArray(param)) {
        param.forEach((el) => delete queries[el]);
      } else {
        delete queries[param];
      }
      return router.push({ query: queries }, undefined, { shallow: false });
    },
    [router]
  );

  const setQueryParams = useCallback(
    (queries: Record<string, string | boolean>, path = "/") => {
      const previous = router.query;
      return router.push({
        pathname: path,
        query: { ...previous, ...queries },
      });
    },
    [router]
  );

  // user input state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  // component visibility state
  const [showTripModal, setShowTripModal] = useState(false);
  const [showSavedStops, setShowSavedStops] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const { height: windowHeight } = useWindowSize();
  const [NavRef, { height: navHeight }] = useElementSize();

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

  const { stops, stopsById, isLoadingStops, stopsError } = useStops({
    routeId,
  });

  const { stopTimesByTripId, isLoadingStopTimes, stopTimesError } =
    useStopTimes(tripId);

  const { shape, shapeError, isShapeLoading } = useShape(tripId);

  // derived state
  const isLoading =
    isDBLoading ||
    isLoadingRoute ||
    isLoadingStop ||
    isLoadingStops ||
    isLoadingStopTimes ||
    isShapeLoading;

  const apiError =
    dbError ||
    routeError ||
    stopError ||
    stopsError ||
    stopTimesError ||
    shapeError;

  // event handlers
  const handleSelectedTrip = (tripId: string, newRouteId?: string) => {
    setShowTripModal(false);
    const currentRouteId = routeId;
    if (newRouteId && currentRouteId !== newRouteId) {
      setQueryParams({ tripId, routeId: newRouteId });
    } else {
      setQueryParams({ tripId });
    }
  };

  const handleSelectedStop = (stopId: string) => {
    setQueryParams({ stopId }).then(() => setShowTripModal(true));
  };

  const handleShowAllStops = () => {
    removeQueryParams(["tripId", "stopId"]);
  };

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-between bg-gray-50 text-slate-950 dark:bg-gray-800 dark:text-white">
      <div className="relative w-full">
        <div ref={NavRef}>
          <MainNav
            selectedRoute={selectedRoute}
            showMenu={showMobileMenu}
            setShowMenu={setShowMobileMenu}
          >
            <DateTimeSelect
              selectedDateTime={selectedDateTime}
              setSelectedDateTime={setSelectedDateTime}
            />

            {!showMobileMenu && (
              <SearchInput selectedRoute={selectedRoute} className="w-full" />
            )}

            <button
              className={`md:text-md w-full rounded-md  border border-blue-700 bg-blue-700 p-2.5 
              text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 
              focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 lg:w-auto lg:flex-none`}
              onClick={handleShowAllStops}
              disabled={!routeId}
            >
              Show all stops
            </button>

            <button
              className={`md:text-md flex w-full  flex-row items-center justify-center gap-1 rounded-md border border-blue-700 
              bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4
              focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 lg:w-auto lg:flex-none`}
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
              <span>Favorite stops</span>
            </button>
          </MainNav>
        </div>
        <div className="relative">
          {/* Errors and loading messages */}
          {isLoading ? (
            <Alert className="pointer-events-none absolute bottom-4 left-1/2 z-[9999] w-max max-w-full -translate-x-1/2 border-gray-400 bg-blue-50/70 dark:border-gray-50 dark:bg-gray-800/70">
              <AlertCircle className="h-4 w-4" />
              {/* <AlertTitle className="bg-transparent">Error</AlertTitle> */}
              <AlertDescription className="bg-transparent">
                {isDBLoading
                  ? "Database 🔥warming🔥 in progress"
                  : "Loading..."}
              </AlertDescription>
            </Alert>
          ) : !!apiError ? (
            <Alert
              variant="destructive"
              className="pointer-events-none absolute bottom-4 left-1/2 z-[9999] w-max max-w-full -translate-x-1/2 border-gray-400 bg-gray-50/70 dark:border-gray-50 dark:bg-gray-800/70"
            >
              <AlertCircle className="h-4 w-4" />
              {/* <AlertTitle className="bg-transparent">Error</AlertTitle> */}
              <AlertDescription className="bg-transparent">
                {apiError.message}
              </AlertDescription>
            </Alert>
          ) : (
            ""
          )}

          <MapComponent
            shape={shape}
            selectedDateTime={selectedDateTime}
            stopTimesByTripId={stopTimesByTripId}
            setShowSavedStops={setShowSavedStops}
            stops={stops}
            stopsById={stopsById}
            handleSelectedStop={handleSelectedStop}
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
        <TripSelect
          handleSelectedTrip={handleSelectedTrip}
          selectedDateTime={selectedDateTime}
          selectedRoute={selectedRoute}
        />
      </Modal>

      <SavedStops
        isOpen={showSavedStops}
        setIsOpen={setShowSavedStops}
        setShowTripModal={setShowTripModal}
      />
    </main>
  );
}
