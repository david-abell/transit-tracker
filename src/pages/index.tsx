"use-client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import MapComponent from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripSelect from "@/components/TripSelect";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";
import Modal from "@/components/Modal";
import { useRouter } from "next/router";
import useRouteId from "@/hooks/useRouteId";
import { useSearchParams } from "next/navigation";
import MainNav from "@/components/MainNav";
import { useElementSize, useWindowSize } from "usehooks-ts";

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

  const { height: windowHeight } = useWindowSize();
  const [NavRef, { height: navHeight }] = useElementSize();

  // realtime transit data
  const {
    realtimeAddedByRouteId,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    invalidateRealtime,
  } = useRealtime();

  // static schedule data
  const { route: selectedRoute } = useRouteId(routeId);

  const {
    selectedTripStopTimesById,
    stops,
    trips,
    tripsById,
    shape,
    stopsById,
    stopTimesByStopId,
    stopTimesByTripId,
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
          <MainNav selectedRoute={selectedRoute}>
            <DateTimeSelect
              selectedDateTime={selectedDateTime}
              setSelectedDateTime={setSelectedDateTime}
            />
            <SearchInput selectedRoute={selectedRoute} />
            <button
              className={`md:text-md flex-1 rounded-md border border-blue-700 bg-blue-700 
              p-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none 
              focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 md:flex-none`}
              onClick={handleShowAllStops}
              disabled={!routeId}
            >
              Show all stops
            </button>
          </MainNav>
        </div>
        <MapComponent
          invalidateRealtime={invalidateRealtime}
          // realtimeAddedByRouteId={realtimeAddedByRouteId}
          // realtimeCanceledTripIds={realtimeCanceledTripIds}
          // realtimeRouteIds={realtimeRouteIds}
          realtimeScheduledByTripId={realtimeScheduledByTripId}
          shape={shape}
          selectedDateTime={selectedDateTime}
          selectedTripStopTimesById={selectedTripStopTimesById}
          stops={stops}
          stopsById={stopsById}
          selectedStopId={stopId}
          handleSelectedStop={handleSelectedStop}
          tripId={tripId}
          height={windowHeight - navHeight}
        />
      </div>

      {/* Trip select modal */}
      <Modal
        isOpen={showTripModal}
        title={`${
          stopsById.has(stopId) ? stopsById.get(stopId)?.stopName : ""
        }`}
        onClose={() => setShowTripModal(false)}
        onProceed={() => setShowTripModal(false)}
      >
        <TripSelect
          handleSelectedTrip={handleSelectedTrip}
          realtimeAddedByRouteId={realtimeAddedByRouteId}
          realtimeCanceledTripIds={realtimeCanceledTripIds}
          realtimeRouteIds={realtimeRouteIds}
          realtimeScheduledByTripId={realtimeScheduledByTripId}
          selectedDateTime={selectedDateTime}
          selectedRoute={selectedRoute}
          stopTimes={tripsAtSelectedStop}
          tripsById={tripsById}
        />
      </Modal>
    </main>
  );
}
