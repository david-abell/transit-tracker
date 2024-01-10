import {
  formatDelay,
  getDelayedTime,
  parseDatetimeLocale,
} from "@/lib/timeHelpers";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";
import { useContext, useState } from "react";
import { DialogRefContext } from "../Modal";
import useUpcoming from "@/hooks/useUpcoming";
import { useSearchParams } from "next/navigation";
import useRealtime from "@/hooks/useRealtime";
import { useMediaQuery } from "usehooks-ts";
import { DateTime } from "luxon";
import Time from "./Time";

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

  const matchesLarge = useMediaQuery("(min-width: 768px)");
  const showAllTrips = isShowAllTrips || !selectedRoute;

  const {
    routes: upComingRoutes,
    stopTimes: allStopTimes,
    trips: allTrips,
  } = useUpcoming(selectedStopId, selectedDateTime);

  const currentStopTimes = showAllTrips ? allStopTimes : stopTimes;
  const tripIds = currentStopTimes?.map(({ tripId }) => tripId);

  const {
    realtimeAddedTrips,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    realtimeCanceledTripIds,
  } = useRealtime(tripIds);

  if (selectedRoute && !upComingRoutes.has(selectedRoute.routeId)) {
    upComingRoutes.set(selectedRoute.routeId, selectedRoute);
  }

  const isToday = DateTime.now().hasSame(
    parseDatetimeLocale(selectedDateTime),
    "day"
  );

  const hasRealtime =
    isToday && !!selectedRoute && realtimeRouteIds.has(selectedRoute.routeId);

  // trap keyboard focus inside form for arrow and tab key input
  const handleKeydown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!dialog) return;
    if (e.key !== "Escape") {
      trapKeyboardFocus(e, dialog);
    }
  };

  return (
    <>
      {
        <p
          className={`mt-2 w-full flex-1 bg-yellow-200 px-2.5 py-0.5 text-center font-medium dark:bg-yellow-700 dark:text-white
        ${hasRealtime || showAllTrips ? "hidden" : ""}`}
        >
          {`Live data for ${selectedRoute?.routeShortName} not found`}
        </p>
      }
      <div className="flex w-full flex-col rounded-lg border border-gray-200 bg-white text-start text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white ">
        <button
          className={`text-md px-5 py-2.5 text-center font-medium text-white ${
            !selectedRoute
              ? "cursor-not-allowed bg-blue-400 dark:bg-blue-500"
              : "bg-blue-700 ring-inset hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus-visible:ring-blue-800"
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

        <div className="flex h-[21rem] max-w-full flex-col text-start [contain:paint]">
          {!!currentStopTimes && !!currentStopTimes.length && (
            <ul className="flex h-[21rem] max-w-full flex-col overflow-y-auto text-start">
              {/* Column headers */}

              <li
                className={`sticky top-0 flex w-full justify-between gap-1 border-b-2 border-gray-400 bg-gray-50 px-2 py-2 pl-2 text-start font-medium 
                dark:border-gray-600 dark:bg-gray-800 md:gap-2 md:px-4`}
              >
                {/* Route */}
                <span className="w-20 cursor-default md:w-28">Route</span>
                {/* Destination */}
                <span className="flex-1 cursor-default">Destination</span>
                {/* Scheduled */}
                <span
                  className={`w-16 cursor-default text-right md:w-20 ${
                    showAllTrips || hasRealtime ? "hidden sm:inline-block" : ""
                  }`}
                >
                  Scheduled
                </span>

                {(showAllTrips || hasRealtime) && (
                  <>
                    {/* Arriving */}
                    <span className="w-16  cursor-default text-right md:w-20">
                      {" "}
                      Arriving
                    </span>

                    {/* Delay */}
                    <span className={`w-16  cursor-default text-right md:w-20`}>
                      Delay
                    </span>
                  </>
                )}
              </li>

              {/* Trip list */}
              {currentStopTimes.flatMap(
                ({ tripId, departureTime, stopSequence }) => {
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
                    (!!(arrival?.delay && arrival.delay < -30) ||
                      !!(departure?.delay && departure.delay < -30));

                  const isDelayed =
                    !isCanceled &&
                    !isEarly &&
                    (!!(arrival?.delay && arrival.delay > 30) ||
                      !!(departure?.delay && departure.delay > 30));

                  const tripStatus = isCanceled
                    ? "canceled"
                    : isEarly
                    ? "early"
                    : isDelayed
                    ? "delayed"
                    : "ontime";

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
                  px-2 py-2 text-start font-medium dark:border-gray-600 md:gap-2 md:px-4
                  ${
                    isCanceled
                      ? "cursor-not-allowed"
                      : `cursor-pointer ring-inset hover:bg-gray-100 hover:text-blue-700 focus-visible:bg-gray-100 focus-visible:text-blue-700 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-blue-700 dark:hover:bg-gray-600 dark:hover:text-white dark:hover:ring-gray-500 dark:focus-visible:bg-gray-600 dark:focus-visible:text-white dark:focus-visible:ring-gray-500`
                  }`}
                      >
                        {/* Route Short Name */}
                        <b className="w-20 font-bold md:w-28 md:text-lg">
                          {typeof displayRoute === "object"
                            ? displayRoute.routeShortName
                            : ""}
                        </b>
                        {/* Destination */}
                        <span className="flex-1">{tripHeadsign}</span>
                        {/* Scheduled */}
                        <span
                          className={
                            showAllTrips || hasRealtime
                              ? "hidden sm:inline-block"
                              : ""
                          }
                        >
                          <Time
                            time={departureTime}
                            column="scheduled"
                            status={tripStatus}
                          />
                        </span>

                        {(showAllTrips || hasRealtime) && (
                          <>
                            {/* Arriving */}
                            <Time
                              time={delayedArrivalTime || departureTime}
                              column="arriving"
                              status={tripStatus}
                            />
                            {/* Delay */}
                            <Time
                              time={formatDelay(
                                arrival?.delay || departure?.delay
                              )}
                              column="delay"
                              status={tripStatus}
                            />
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
