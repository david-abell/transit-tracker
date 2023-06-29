import { formatDelay, getDelayedTime } from "@/lib/timeHelpers";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";
import { useContext, useState } from "react";
import { DialogRefContext } from "./Modal";
import useUpcoming from "@/hooks/useUpcoming";
import { useSearchParams } from "next/navigation";
import useRealtime from "@/hooks/useRealtime";
import { useMediaQuery } from "usehooks-ts";

type Props = {
  handleSelectedTrip: (tripId: string, routeId?: string) => void;
  selectedDateTime: string;
  selectedRoute: Route | undefined;
  stopTimes: StopTime[] | undefined;
  tripsById: Map<string, Trip>;
};

function TripSelect({
  handleSelectedTrip,
  selectedDateTime,
  selectedRoute,
  stopTimes = [],
  tripsById,
}: Props) {
  const { dialog } = useContext(DialogRefContext);
  const [isShowAllTrips, setIsShowAllTrips] = useState(false);
  const searchParams = useSearchParams();
  const selectedStopId = searchParams.get("stopId");

  const matchesMedium = useMediaQuery("(min-width: 768px)");
  const showAllTrips = isShowAllTrips || !selectedRoute;

  const {
    routes: upComingRoutes,
    stopTimes: allStopTimes,
    trips: allTrips,
  } = useUpcoming(selectedStopId, selectedDateTime);

  const currentStopTimes = showAllTrips ? allStopTimes : stopTimes;
  const tripIds = currentStopTimes?.map(({ tripId }) => tripId);

  const {
    realtimeAddedByRouteId,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    realtimeCanceledTripIds,
  } = useRealtime(tripIds);

  if (selectedRoute && !upComingRoutes.has(selectedRoute.routeId)) {
    upComingRoutes.set(selectedRoute.routeId, selectedRoute);
  }

  const hasRealtime =
    !!selectedRoute && realtimeRouteIds.has(selectedRoute.routeId);

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
          className={`text-md px-5 py-2.5 text-center font-medium text-white ${
            !selectedRoute
              ? "cursor-not-allowed bg-blue-400 dark:bg-blue-500"
              : "bg-blue-700 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus-visible:ring-blue-800"
          }`}
          type="button"
          onClick={() => setIsShowAllTrips((prev) => !prev)}
          onKeyDown={handleKeydown}
          disabled={!selectedRoute}
        >
          {showAllTrips && !!selectedRoute
            ? `show only route ${selectedRoute?.routeShortName}`
            : !showAllTrips
            ? "Show all upcoming trips"
            : "No route selected"}
        </button>
        <label htmlFor="trip-select" className="sr-only">
          Pick a trip
        </label>
        <div
          id="trip-select"
          className="flex h-[21rem] max-w-full flex-col text-start"
        >
          {/* Column headers */}
          <div
            className={`flex w-full justify-between gap-1 border-b-2 border-gray-400 py-2 pl-2 pr-4 font-medium dark:border-gray-600 
                md:gap-2 md:px-4 md:pr-10`}
          >
            {/* schedule headers */}
            <span className="w-20 cursor-default md:w-28">Route</span>
            <span className="flex-1 cursor-default">Destination</span>
            <span
              className={`w-16 cursor-default text-center md:w-28 ${
                showAllTrips || hasRealtime ? "hidden md:inline-block" : ""
              }`}
            >
              Scheduled arrival
            </span>

            {/* realtime headers */}
            {(showAllTrips || hasRealtime) && (
              <>
                <span className="w-14 cursor-default md:w-20"> Arrival</span>
                <span className="w-14 cursor-default text-right md:w-20">
                  Delay
                </span>
              </>
            )}
          </div>
          {/* Trip list */}
          {!!currentStopTimes && !!currentStopTimes.length && (
            <ul className="flex h-[21rem] max-w-full flex-col overflow-y-auto text-start">
              {currentStopTimes.flatMap(
                ({ tripId, departureTime, stopSequence, arrivalTime }) => {
                  const { stopTimeUpdate } =
                    realtimeScheduledByTripId.get(tripId) || {};

                  const closestStopUpdate =
                    (stopTimeUpdate &&
                      stopTimeUpdate.find(
                        ({ stopId, stopSequence: realtimeSequence }) =>
                          stopId === selectedStopId ||
                          (stopSequence && realtimeSequence >= stopSequence)
                      )) ||
                    stopTimeUpdate?.at(-1);

                  const { arrival, departure } = closestStopUpdate || {};

                  // arrival delay is sometimes very wrong from realtime api exa. -1687598071

                  const delayedArrivalTime = getDelayedTime(
                    departureTime,
                    arrival?.delay || departure?.delay
                  );

                  const isCanceled = realtimeCanceledTripIds.has(tripId);

                  const isEarly =
                    !isCanceled &&
                    (!!(arrival?.delay && arrival.delay < -60) ||
                      !!(departure?.delay && departure.delay < -60));

                  const isDelayed =
                    !isCanceled &&
                    (!!(arrival?.delay && arrival.delay > 60) ||
                      !!(departure?.delay && departure.delay > 60));

                  const isOnTime = !isCanceled && !isEarly && !isDelayed;

                  const { tripHeadsign = "", routeId } =
                    (showAllTrips ? allTrips : tripsById).get(tripId) || {};

                  const displayRoute = routeId
                    ? upComingRoutes.get(routeId)!
                    : "";

                  return (
                    <li key={tripId}>
                      <button
                        type="button"
                        onClick={() => handleSelectedTrip(tripId, routeId)}
                        onKeyDown={handleKeydown}
                        disabled={isCanceled}
                        className={`flex w-full items-center justify-between gap-1 border-b border-gray-200 
                  py-2 pl-2 pr-4 text-start font-medium dark:border-gray-600 md:gap-2 md:px-4
                  ${
                    isCanceled
                      ? "cursor-not-allowed"
                      : `cursor-pointer hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-blue-700 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500`
                  }`}
                      >
                        {/* schedule columns */}
                        <div className="w-20 font-bold md:w-28 md:text-lg">
                          <b>
                            {typeof displayRoute === "object"
                              ? displayRoute.routeShortName
                              : ""}
                          </b>
                        </div>

                        {/* towards */}
                        <span className="flex-1">{tripHeadsign}</span>
                        <span
                          className={`w-16 md:w-28 ${
                            hasRealtime ? "hidden md:inline-block" : ""
                          }`}
                        >
                          {departureTime}
                        </span>

                        {/* realtime columns */}
                        {(showAllTrips || hasRealtime) && (
                          <>
                            {/* Arrival */}
                            {isEarly && (
                              <span className="w-14 text-green-700 md:w-20">
                                {delayedArrivalTime || departureTime}
                              </span>
                            )}
                            {isOnTime && (
                              <span className="w-14 md:w-20">
                                {matchesMedium ? "on time" : arrivalTime}
                              </span>
                            )}
                            {isDelayed && (
                              <span className="w-14 text-red-700 md:w-20">
                                {delayedArrivalTime || departureTime}
                              </span>
                            )}
                            {isCanceled && (
                              <span className="w-14 text-red-700 line-through md:w-20">
                                {departureTime}
                              </span>
                            )}

                            {/* Delay */}
                            {isEarly && (
                              <span className="w-14 text-right text-green-700 md:w-20">
                                {formatDelay(
                                  arrival?.delay || departure?.delay
                                )}
                              </span>
                            )}
                            {isOnTime && (
                              <span className="w-14 text-right md:w-20">
                                on time
                              </span>
                            )}
                            {isDelayed && (
                              <span className="w-14 text-right text-red-700 md:w-20">
                                {formatDelay(
                                  arrival?.delay || departure?.delay
                                )}
                              </span>
                            )}
                            {isCanceled && (
                              <span className="w-14 text-red-700 md:w-20">
                                Canceled
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                }
              )}
            </ul>
          )}

          {/* loading placeholders */}
          {!currentStopTimes && (
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

          {/* No trips found */}
          {!!currentStopTimes && currentStopTimes.length === 0 && (
            <p className="flex-1px-2.5 my-2.5 w-full py-0.5 text-center font-medium">
              No upcoming trips found
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default TripSelect;
