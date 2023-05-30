import { getDelayedTime } from "@/lib/timeHelpers";
import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

type Props = {
  route: Route;
  routes: Map<string, Route>;
  stopTimes: StopTime[] | undefined;
  handleSelectedTrip: (tripId: string, routeId?: string) => void;
  tripsById: Map<string, Trip>;
  realtimeAddedByRouteId: Map<string, TripUpdate>;
  realtimeCanceledTripIds: Set<string>;
  realtimeRouteIds: Set<string>;
  realtimeScheduledByTripId: Map<string, TripUpdate>;
  showAllTrips: boolean;
  setShowAllTrips: Dispatch<SetStateAction<boolean>>;
};

function TripSelect({
  realtimeAddedByRouteId,
  realtimeCanceledTripIds,
  realtimeScheduledByTripId,
  realtimeRouteIds,
  route,
  routes,
  showAllTrips,
  setShowAllTrips,
  stopTimes = [],
  handleSelectedTrip,
  tripsById,
}: Props) {
  const hasRealtime = realtimeRouteIds.has(route.routeId);
  return (
    <div className="flex w-full flex-col rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      <button
        className="text-md bg-blue-700 px-5 py-2.5 text-center font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
        onClick={() => setShowAllTrips((prev) => !prev)}
      >
        {!showAllTrips
          ? "Show all upcoming trips"
          : `show only route ${route.routeShortName}`}
      </button>
      {!hasRealtime && !showAllTrips && (
        <span className="flex-1 rounded-t bg-red-100 px-2.5 py-0.5 text-center font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
          No realtime data available
        </span>
      )}
      <label htmlFor="trip-select" className="sr-only">
        Pick a trip
      </label>
      <ul
        id="trip-select"
        className="flex h-96 max-w-full flex-col overflow-y-scroll text-start"
      >
        {/* Column headers */}
        <li
          className={`grid ${
            hasRealtime ? "grid-cols-8" : "grid-cols-6"
          } w-full justify-between border-b-2 border-gray-400 px-4 
                py-2 font-medium dark:border-gray-600`}
        >
          {/* schedule headers */}
          <span className="cursor-default">Route</span>
          <span className="col-span-3 cursor-default">Destination</span>
          <span className="col-span-2 cursor-default"> Scheduled arrival</span>

          {/* realtime headers */}
          {hasRealtime && (
            <>
              <span className="cursor-default"> Arrival</span>
              <span className="cursor-default"> Delay</span>
            </>
          )}
        </li>

        {/* Trip list */}
        {!!stopTimes && stopTimes.length ? (
          stopTimes.flatMap(({ tripId, departureTime }) => {
            if (realtimeCanceledTripIds.has(tripId)) return [];
            const real = realtimeScheduledByTripId.get(tripId);
            const { stopTimeUpdate } = real || {};
            const [firstRealtime] = stopTimeUpdate || [];
            const { arrival, departure } = firstRealtime || {};
            const isDelayed =
              (arrival?.delay && arrival.delay > 0) ||
              (departure?.delay && departure.delay > 0);

            const { tripHeadsign = "", routeId } = tripsById.get(tripId) || {};
            const displayRoute =
              routeId && routes.has(routeId) ? routes.get(routeId)! : route;

            return (
              <li key={tripId}>
                <button
                  type="button"
                  onClick={() => handleSelectedTrip(tripId, routeId)}
                  className={`grid w-full cursor-pointer justify-between gap-2 border-b border-gray-200 px-4 
                py-2 text-start font-medium hover:bg-gray-100 hover:text-blue-700 
                focus:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700 
                dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500 ${
                  hasRealtime ? "grid-cols-8" : "grid-cols-6"
                }`}
                >
                  {/* schedule columns */}
                  <span className="text-lg">
                    <b>{displayRoute?.routeShortName}</b>
                  </span>
                  <span className="col-span-3">
                    {" towards  "}
                    {tripHeadsign}
                  </span>
                  <span className="col-span-2">{departureTime}</span>

                  {/* realtime columns */}
                  {hasRealtime && (
                    <>
                      {/* Arrival */}
                      <span
                        className={`${
                          isDelayed ? "text-red-700" : "text-green-700"
                        }`}
                      >
                        {getDelayedTime(departureTime, arrival?.delay) ||
                          getDelayedTime(departureTime, departure?.delay) ||
                          "on time"}
                      </span>
                      {/* Delay */}
                      <span
                        className={`${
                          isDelayed ? "text-red-700" : "text-green-700"
                        } `}
                      >
                        {arrival?.delay || departure?.delay || "on time"}
                      </span>
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
  );
}

export default TripSelect;
