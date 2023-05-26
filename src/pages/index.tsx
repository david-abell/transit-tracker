import Image from "next/image";
import { Inter } from "next/font/google";
import { useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Trip } from "@prisma/client";
import MapComponent from "@/components/Map";
import SearchInput from "@/components/SearchInput";
import TripSelect from "@/components/TripSelect";
import DateTimeSelect from "@/components/DateTimeSelect";
import { initDateTimeValue } from "@/lib/timeHelpers";
import Modal from "@/components/Modal";
import { useRouter } from "next/router";
import useRouteId from "@/hooks/useRouteId";
import { useSearchParams } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const defaultRoute = {
  routeId: "3249_46339",
  agencyId: "7778020",
  routeShortName: "208",
  routeLongName: "Lotabeg - Bishopstown - Curraheen",
  routeType: 3,
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // query params state
  const routeId = searchParams.get("routeId") || defaultRoute.routeId;
  const tripId = searchParams.get("tripId") || "";
  const stopId = searchParams.get("stopId") || "";
  const reverseRoute = searchParams.get("reverseRoute");

  // user input state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  // component visibility state
  const [showRouteControls, setShowRouteControls] = useState(true);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);

  // realtime transit data
  const {
    realtimeAddedByRouteId,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
  } = useRealtime();

  // static schedule data
  const { route: selectedRoute } = useRouteId(routeId);

  const {
    selectedTripStopTimesById,
    stops,
    trips,
    tripsById,
    stopTimesZero,
    stopTimesOne,
    shape,
    stopsById,
    stopTimesZeroByStopId,
    stopTimesOneByStopId,
    stopTimesZeroByTripId,
    stopTimesOneByTripId,
  } = useStatic({
    routeId,
    selectedDateTime,
    tripId,
  });

  // derived state
  const directionalRouteName =
    selectedRoute && !reverseRoute
      ? selectedRoute.routeLongName
      : selectedRoute
      ? selectedRoute.routeLongName?.split("-").reverse().join("-")
      : "Select a travel route";

  let stopIdsByDirection: string[] = [];

  if (!reverseRoute && stopTimesZeroByStopId) {
    stopIdsByDirection = [...stopTimesZeroByStopId.keys()];
  } else if (stopTimesOneByStopId) {
    stopIdsByDirection = [...stopTimesOneByStopId.keys()];
  }

  const tripsAtSelectedStop = !reverseRoute
    ? stopTimesZeroByStopId?.get(stopId)
    : stopTimesOneByStopId?.get(stopId);

  const [directionZeroTripsById, directionOneTripsById] = trips?.length
    ? trips.reduce<[Map<Trip["tripId"], Trip>, Map<string, Trip>]>(
        (acc, trip) => {
          const { directionId } = trip;
          let [directionZero, directionOne] = acc;

          if (directionId === 0) {
            directionZero.set(trip.tripId, trip);
          } else {
            directionOne.set(trip.tripId, trip);
          }
          return acc;
        },
        [new Map(), new Map()]
      )
    : [];

  // delete Query string helper
  const removeQueryParam = (param: string) => {
    const updatedQuery = router.query;
    delete updatedQuery[param];

    router.push({ query: updatedQuery }, undefined, { shallow: true });
  };

  // event handlers
  const handleSelectedTrip = (tripId: string) => {
    setShowTripModal(false);
    const queries = router.query;
    router.push({ pathname: "/", query: { ...queries, tripId } });
  };

  const handleSelectedStop = (stopId: string) => {
    const queries = router.query;
    router.push({
      pathname: "/",
      query: { ...queries, stopId: stopId },
    });

    setShowTripModal(() => true);
  };

  const handleChangeDirection = () => {
    removeQueryParam("tripId");
    removeQueryParam("stopId");
    if (reverseRoute) {
      removeQueryParam("reverseRoute");
    } else {
      const queries = router.query;
      router.push({
        pathname: "/",
        query: { ...queries, reverseRoute: true },
      });
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-between">
      <div className="relative w-full">
        {/* <h1>H1 Title</h1> */}

        {/* Floating Route info and controls */}
        <div className="md: absolute left-1/2 top-10 z-[2000] w-64 -translate-x-1/2 transform rounded-lg border bg-gray-50 p-4 text-center md:w-96 md:p-6">
          <div className="relative">
            {/* toggle for route controls */}
            <div className="absolute right-0 top-0">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  value=""
                  className="peer sr-only"
                  onChange={() => setShowRouteControls((prev) => !prev)}
                  checked={showRouteControls}
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-500 after:absolute after:left-[2px] after:top-0.5 after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"></div>
                <span className="sr-only ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Toggle route controls
                </span>
              </label>
            </div>

            {/* Route info */}
            <div>
              <h2 className="pb-2.5 text-lg font-medium md:text-2xl">
                Route {selectedRoute?.routeShortName}:
              </h2>
              <p className="text-lg font-medium">{directionalRouteName}</p>
            </div>

            {/* Route controls */}
            {showRouteControls && (
              <>
                <div className="flex flex-col gap-2.5 pt-2.5">
                  <button
                    className="md:text-md w-full rounded-md
              border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={() => setShowRouteModal(true)}
                  >
                    Change travel route & time
                  </button>
                  <button
                    className="md:text-md w-full rounded-md
              border border-blue-700 bg-blue-700 p-2.5 text-sm font-medium text-white hover:bg-blue-800 
              focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    onClick={handleChangeDirection}
                  >
                    Change travel direction
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <MapComponent
          realtimeAddedByRouteId={realtimeAddedByRouteId}
          realtimeCanceledTripIds={realtimeCanceledTripIds}
          realtimeRouteIds={realtimeRouteIds}
          realtimeScheduledByTripId={realtimeScheduledByTripId}
          shape={shape}
          stopIds={stopIdsByDirection}
          selectedDateTime={selectedDateTime}
          selectedTripStopTimesById={selectedTripStopTimesById}
          stopsById={stopsById}
          tripsById={tripsById}
          selectedStopId={stopId}
          handleSelectedStop={handleSelectedStop}
          tripId={tripId}
          stopTimesByStopId={
            !reverseRoute ? stopTimesZeroByStopId : stopTimesOneByStopId
          }
          stopTimesByTripId={
            !reverseRoute ? stopTimesZeroByTripId : stopTimesOneByTripId
          }
          tripsByDirection={
            !reverseRoute ? directionZeroTripsById : directionOneTripsById
          }
        />
      </div>

      {/* Route and Date/Time select Modal */}
      <Modal
        isOpen={showRouteModal}
        title="Plan your trip"
        onClose={() => setShowRouteModal(false)}
        onProceed={() => setShowRouteModal(false)}
      >
        <DateTimeSelect
          setSelectedDateTime={setSelectedDateTime}
          selectedDateTime={selectedDateTime}
        />
        <SearchInput selectedRoute={selectedRoute} />
      </Modal>

      {/* Trip select modal */}
      <Modal
        isOpen={showTripModal}
        title="Choose a trip"
        onClose={() => setShowTripModal(false)}
        onProceed={() => setShowTripModal(false)}
      >
        <TripSelect
          route={selectedRoute || defaultRoute}
          handleSelectedTrip={handleSelectedTrip}
          stopTimes={tripsAtSelectedStop}
          tripsById={tripsById}
          realtimeAddedByRouteId={realtimeAddedByRouteId}
          realtimeCanceledTripIds={realtimeCanceledTripIds}
          realtimeRouteIds={realtimeRouteIds}
          realtimeScheduledByTripId={realtimeScheduledByTripId}
        />
      </Modal>
    </main>
  );
}
