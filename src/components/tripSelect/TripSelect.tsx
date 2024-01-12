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

import { Switch } from "@/components/ui/switch";

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
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const searchParams = useSearchParams();
  const selectedStopId = searchParams.get("stopId");

  const matchesLarge = useMediaQuery("(min-width: 768px)");

  const {
    routes: upComingRoutes,
    stopTimes: allStopTimes,
    trips: allTrips,
  } = useUpcoming(selectedStopId, selectedDateTime);

  const currentStopTimes = showAllRoutes ? allStopTimes : stopTimes;
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
    <div className="flex h-full w-full flex-col gap-4 text-start text-sm font-medium text-gray-900  dark:text-white ">
      {
        <form className="flex w-full flex-row items-center gap-5 bg-slate-50 text-lg dark:bg-slate-800">
          <label htmlFor="show-trips-checkbox">Show all routes</label>
          <Switch
            id="show-trips-checkbox"
            checked={showAllRoutes}
            onCheckedChange={() => setShowAllRoutes(!showAllRoutes)}
          />
        </form>
      }
      {
        <p
          className={`mt-0 w-full flex-1 bg-yellow-200 py-2 text-center font-medium dark:bg-yellow-700 dark:text-white
        ${hasRealtime || showAllRoutes ? "hidden" : ""}`}
        >
          {`Live data for ${selectedRoute?.routeShortName} not found`}
        </p>
      }

      <>
        <ul className="flex max-h-[26rem] max-w-full flex-col overflow-y-auto bg-gray-50 text-start [contain:paint] dark:bg-gray-800">
          {/* Column headers */}

          <li
            className={`sticky top-0 flex w-full justify-between gap-1 border-b-2 border-gray-400 bg-gray-50 py-2 pr-2 text-start
                 text-lg font-medium dark:bg-gray-800 md:gap-2 md:pr-4`}
          >
            {/* Route */}
            <span className="w-20 cursor-default md:w-28">Route</span>
            {/* Destination */}
            <span className="flex-1 cursor-default">Destination</span>
            {/* Scheduled */}
            <span
              className={`w-20 cursor-default text-right ${
                showAllRoutes || hasRealtime ? "hidden sm:inline-block" : ""
              }`}
            >
              Scheduled
            </span>

            {(showAllRoutes || hasRealtime) && (
              <>
                {/* Delay */}
                <span className={`w-20  cursor-default text-right`}>Delay</span>

                {/* Arriving */}
                <span className="w-20  cursor-default text-right">
                  {" "}
                  Arriving
                </span>
              </>
            )}
          </li>

          {/* Trip list */}
          {!!currentStopTimes &&
            !!currentStopTimes.length &&
            currentStopTimes.flatMap(
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
                  (showAllRoutes ? allTrips : tripsById).get(tripId) || {};

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
                  py-2 pr-2 text-start font-medium dark:border-gray-600 md:gap-2 md:pr-4
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
                          showAllRoutes || hasRealtime
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

                      {(showAllRoutes || hasRealtime) && (
                        <>
                          {/* Delay */}
                          <Time
                            time={formatDelay(
                              arrival?.delay || departure?.delay
                            )}
                            column="delay"
                            status={tripStatus}
                          />
                          {/* Arriving */}
                          <Time
                            time={delayedArrivalTime || departureTime}
                            column="arriving"
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
          <p className="w-full text-center text-xl font-medium">
            {showAllRoutes
              ? "No upcoming trips found"
              : selectedRoute
              ? "Selected route does not have any upcoming trips."
              : "No upcoming trips found. Try showing all routes instead."}
          </p>
        )}
      </>
    </div>
  );
}

export default TripSelect;
