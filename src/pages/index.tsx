"use-client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
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

  // static schedule data
  const { route: selectedRoute } = useRouteId(routeId);
  const { selectedStop } = useStopId(stopId);

  const {
    selectedTripStopTimesById,
    stops,
    tripsById,
    shape,
    stopsById,
    stopTimesByStopId,
  } = useStatic({
    routeId,
    selectedDateTime,
    tripId,
  });

  // derived state
  const tripsAtSelectedStop = stopTimesByStopId?.get(stopId);

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

        <MapComponent
          shape={shape}
          selectedDateTime={selectedDateTime}
          selectedTripStopTimesById={selectedTripStopTimesById}
          setShowSavedStops={setShowSavedStops}
          stops={stops}
          stopsById={stopsById}
          handleSelectedStop={handleSelectedStop}
          tripId={tripId}
          height={windowHeight - navHeight}
        />
      </div>

      {/* Trip select modal */}
      <Modal
        isOpen={showTripModal}
        title={`${selectedStop ? selectedStop.stopName : ""}`}
        onClose={() => setShowTripModal(false)}
        onProceed={() => setShowTripModal(false)}
      >
        <TripSelect
          handleSelectedTrip={handleSelectedTrip}
          selectedDateTime={selectedDateTime}
          selectedRoute={selectedRoute}
          stopTimes={tripsAtSelectedStop}
          tripsById={tripsById}
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
