"use-client";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useMemo, useState } from "react";
import useRealtime from "@/hooks/useRealtime";
import useStatic from "@/hooks/useStatic";
import { Route, Trip } from "@prisma/client";
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
import useUpcoming from "@/hooks/useUpcoming";
import { useElementSize, useWindowSize } from "usehooks-ts";

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

  // Query string helpers
  const removeQueryParams = (param: string | string[]) => {
    const queries = router.query;
    if (Array.isArray(param)) {
      param.forEach((el) => delete queries[el]);
    } else {
      delete queries[param];
    }
    return router.push({ query: queries }, undefined, { shallow: false });
  };

  const setQueryParams = (
    queries: Record<string, string | boolean>,
    path = "/"
  ) => {
    const previous = router.query;
    return router.push({
      pathname: path,
      query: { ...previous, ...queries },
    });
  };

  // user input state
  const [selectedDateTime, setSelectedDateTime] = useState(initDateTimeValue());

  // component visibility state
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showAllTrips, setShowAllTrips] = useState(false);

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

  const selectedRouteAsMap: Map<string, Route> = new Map();

  if (selectedRoute) {
    selectedRouteAsMap.set(selectedRoute.routeId, selectedRoute);
  } else {
    selectedRouteAsMap.set(defaultRoute.routeId, defaultRoute);
  }

  const upcomingAtStop = useUpcoming(stopId, selectedDateTime);

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
  let stopIdsByDirection: string[] = [];

  // check if selected route present and sync direction to correct stops
  if (stopTimesZeroByTripId?.has(tripId) && stopTimesZeroByStopId) {
    stopIdsByDirection = [...stopTimesZeroByStopId.keys()];
    if (reverseRoute) {
      removeQueryParams("reverseRoute");
    }
  } else if (stopTimesOneByTripId?.has(tripId) && stopTimesOneByStopId) {
    stopIdsByDirection = [...stopTimesOneByStopId.keys()];
    if (!reverseRoute) {
      setQueryParams({ reverseRoute: true });
    }
    // if no selected route, just display first or second stop group
  } else if (!reverseRoute && stopTimesZeroByStopId) {
    stopIdsByDirection = [...stopTimesZeroByStopId.keys()];
  } else if (stopTimesOneByStopId) {
    stopIdsByDirection = [...stopTimesOneByStopId.keys()];
    // if no selected direction, show all stops
  } else {
    stopIdsByDirection = [...stopsById.keys()];
  }

  const tripsAtSelectedStop = !reverseRoute
    ? stopTimesZeroByStopId?.get(stopId)
    : stopTimesOneByStopId?.get(stopId);

  const [directionZeroTripsById, directionOneTripsById] = useMemo(
    () =>
      trips?.length
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
        : [],
    [trips]
  );

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

  const handleChangeDirection = () => {
    const directionReversed = reverseRoute;
    if (directionReversed) {
      removeQueryParams(["tripId", "stopId", "reverseRoute"]);
    } else {
      removeQueryParams(["tripId", "stopId"]).then(() =>
        setQueryParams({ reverseRoute: true })
      );
    }
  };

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-between bg-gray-50 text-slate-950 dark:bg-slate-700 dark:text-white">
      <div className="relative w-full">
        <div ref={NavRef}>
          <MainNav selectedRoute={selectedRoute} reverseRoute={!!reverseRoute}>
            <DateTimeSelect
              selectedDateTime={selectedDateTime}
              setSelectedDateTime={setSelectedDateTime}
            />
            <SearchInput selectedRoute={selectedRoute} />
            <button
              className="md:text-md flex-1 rounded-md border border-blue-700 bg-blue-700 
              p-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none 
              focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 md:flex-none"
              onClick={handleChangeDirection}
            >
              Change travel direction
            </button>
          </MainNav>
        </div>

        <MapComponent
          invalidateRealtime={invalidateRealtime}
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
          height={windowHeight - navHeight}
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
        title={`Upcoming Trips ${
          stopsById.has(stopId) ? "@ " + stopsById.get(stopId)?.stopName : ""
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
          route={selectedRoute || defaultRoute}
          routes={showAllTrips ? upcomingAtStop.routes : selectedRouteAsMap}
          setShowAllTrips={setShowAllTrips}
          showAllTrips={showAllTrips}
          stopTimes={
            showAllTrips ? upcomingAtStop.stopTimes : tripsAtSelectedStop
          }
          tripsById={showAllTrips ? upcomingAtStop.trips : tripsById}
        />
      </Modal>
    </main>
  );
}
