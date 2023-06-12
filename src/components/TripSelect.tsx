import { getDelayedTime } from "@/lib/timeHelpers";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";
import { Dispatch, SetStateAction, useContext, useState } from "react";
import { DialogRefContext } from "./Modal";
import useUpcoming from "@/hooks/useUpcoming";
import { useSearchParams } from "next/navigation";

type Props = {
  handleSelectedTrip: (tripId: string, routeId?: string) => void;
  realtimeAddedByRouteId: Map<string, TripUpdate>;
  realtimeCanceledTripIds: Set<string>;
  realtimeRouteIds: Set<string>;
  realtimeScheduledByTripId: Map<string, TripUpdate>;
  selectedDateTime: string;
  selectedRoute: Route | undefined;
  stopTimes: StopTime[] | undefined;
  tripsById: Map<string, Trip>;
};

function TripSelect({
  handleSelectedTrip,
  realtimeCanceledTripIds,
  realtimeScheduledByTripId,
  realtimeRouteIds,
  selectedDateTime,
  selectedRoute,
  stopTimes = [],
  tripsById,
}: Props) {
  const { dialog } = useContext(DialogRefContext);
  const [showAllTrips, setShowAllTrips] = useState(false);
  const searchParams = useSearchParams();

  const {
    routes: upComingRoutes,
    stopTimes: allStopTimes,
    trips: allTrips,
  } = useUpcoming(searchParams.get("stopId") || "", selectedDateTime);

  const hasRealtime = selectedRoute
    ? realtimeRouteIds.has(selectedRoute.routeId)
    : false;

  const renderStopTimes = showAllTrips ? allStopTimes : stopTimes;
  const routes = upComingRoutes;

  if (selectedRoute && !routes.has(selectedRoute.routeId)) {
    routes.set(selectedRoute.routeId, selectedRoute);
  }

  // trap keyboard focus inside form for arrow and tab key input
  const handleKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!dialog) return;
    if (e.key !== "Escape") {
      trapKeyboardFocus(e, dialog);
    }
  };

  return (
    <>
      {!hasRealtime && !showAllTrips && (
        <p className="my-2.5 w-full flex-1 bg-red-100 px-2.5 py-0.5 text-center font-medium text-red-900 dark:bg-red-900 dark:text-red-200">
          No realtime data available
        </p>
      )}
      <div className="flex w-full flex-col rounded-lg border border-gray-200 bg-white text-start text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white ">
        <button
          className="text-md bg-blue-700 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          type="button"
          onClick={() => setShowAllTrips((prev) => !prev)}
          onKeyDown={handleKeydown}
        >
          {!showAllTrips
            ? "Show all upcoming trips"
            : `show only route ${selectedRoute?.routeShortName}`}
        </button>
        <label htmlFor="trip-select" className="sr-only">
          Pick a trip
        </label>
        <ul
          id="trip-select"
          className="flex h-[21rem] max-w-full flex-col overflow-y-auto text-start"
        >
          {/* Column headers */}
          <li
            className={`flex w-full justify-between gap-1 border-b-2 border-gray-400 py-2 pl-2 pr-4 font-medium 
                dark:border-gray-600 md:gap-2 md:px-4`}
          >
            {/* schedule headers */}
            <span className="w-20 cursor-default md:w-28">Route</span>
            <span className="flex-1 cursor-default">Destination</span>
            <span
              className={`w-16 cursor-default text-center md:w-28 ${
                hasRealtime ? "hidden md:inline-block" : ""
              }`}
            >
              Scheduled arrival
            </span>

            {/* realtime headers */}
            {hasRealtime && (
              <>
                <span className="w-14 cursor-default md:w-20"> Arrival</span>
                <span className="w-14 cursor-default text-right md:w-20">
                  {" "}
                  Delay
                </span>
              </>
            )}
          </li>

          {/* Trip list */}
          {!!renderStopTimes && renderStopTimes.length ? (
            renderStopTimes.flatMap(({ tripId, departureTime }) => {
              if (realtimeCanceledTripIds.has(tripId)) return [];

              const real = realtimeScheduledByTripId.get(tripId);
              const { stopTimeUpdate } = real || {};
              const [firstRealtime] = stopTimeUpdate || [];
              const { arrival, departure } = firstRealtime || {};
              const isDelayed =
                !!(arrival?.delay && arrival.delay > 0) ||
                !!(departure?.delay && departure.delay > 0);

              const isCanceled = realtimeCanceledTripIds.has(tripId);

              const { tripHeadsign = "", routeId } =
                (showAllTrips ? allTrips : tripsById).get(tripId) || {};
              const displayRoute = routeId ? routes.get(routeId)! : "";

              return (
                <li key={tripId}>
                  <button
                    type="button"
                    onClick={() => handleSelectedTrip(tripId, routeId)}
                    onKeyDown={handleKeydown}
                    className={`flex w-full cursor-pointer items-center justify-between gap-1 border-b border-gray-200 
                py-2 pl-2 pr-4 text-start font-medium hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 focus:outline-none
                focus:ring-2 focus:ring-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 
                dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500 md:gap-2 md:px-4`}
                  >
                    {/* schedule columns */}
                    <div className="w-20 font-bold md:w-28 md:text-lg">
                      <b>
                        {typeof displayRoute === "object"
                          ? displayRoute.routeShortName
                          : ""}
                      </b>
                    </div>
                    <span className="flex-1">
                      {/* {" towards  "} */}
                      {tripHeadsign}
                    </span>
                    <span
                      className={`w-16 md:w-28 ${
                        hasRealtime ? "hidden md:inline-block" : ""
                      }`}
                    >
                      {departureTime}
                    </span>

                    {/* realtime columns */}
                    {hasRealtime && (
                      <>
                        {/* Arrival */}
                        {isCanceled ? (
                          <span className="w-14 text-red-700 md:w-20">N/A</span>
                        ) : (
                          <span
                            className={`w-14 md:w-20 ${
                              isDelayed ? "text-yellow-900" : "text-green-700"
                            }`}
                          >
                            {getDelayedTime(departureTime, arrival?.delay) ||
                              getDelayedTime(departureTime, departure?.delay) ||
                              "on time"}
                          </span>
                        )}
                        {/* Delay */}
                        {isCanceled ? (
                          <span className="w-14 text-red-700 md:w-20">
                            Canceled
                          </span>
                        ) : (
                          <span
                            className={`w-14 text-right md:w-20 ${
                              isDelayed ? "text-yellow-900" : "text-green-700"
                            } `}
                          >
                            {arrival?.delay || departure?.delay || "on time"}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              );
            })
          ) : (
            <div role="status" className="animate-pulse text-center">
              <div className="mt-2 pb-4 text-xl">Loading trips...</div>
              <div className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></div>
              <div className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></div>
              <div className="h-7 bg-gray-200 dark:bg-gray-700"></div>
            </div>
          )}
        </ul>
      </div>
    </>
  );
}

export default TripSelect;
