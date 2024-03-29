import {
  formatDelay,
  getDelayedTime,
  isPastArrivalTime,
  parseDatetimeLocale,
} from "@/lib/timeHelpers";
import { trapKeyboardFocus } from "@/lib/trapKeyboardFocus";
import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";
import { useContext, useEffect, useState } from "react";
import { DialogRefContext } from "../Modal";
import useUpcoming from "@/hooks/useUpcoming";
import { useSearchParams } from "next/navigation";
import useRealtime from "@/hooks/useRealtime";
import { useMediaQuery } from "usehooks-ts";
import { DateTime } from "luxon";

import Time from "./Time";

import { Switch } from "@/components/ui/switch";
import TripList from "./TripList";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

type Props = {
  handleSelectedTrip: (tripId: string, routeId?: string) => void;
  handleTimeChange: (e?: React.ChangeEvent<HTMLInputElement>) => void;
  handleApiLoading: (val: boolean) => void;
  selectedDateTime: string;
  selectedRoute: Route | undefined;
  selectedStopId: string | null;
};

function TripModal({
  handleSelectedTrip,
  handleTimeChange,
  handleApiLoading,
  selectedDateTime,
  selectedRoute,
  selectedStopId,
}: Props) {
  const { dialog } = useContext(DialogRefContext);
  const [showAllRoutes, setShowAllRoutes] = useState(!selectedRoute);
  const [showCanceled, setShowCanceled] = useState(!selectedRoute);
  const [showDeparted, setShowDeparted] = useState(!selectedRoute);

  // const matchesLarge = useMediaQuery("(min-width: 768px)");

  const {
    isLoadingUpcoming,
    error: upcomingError,
    upcomingTrips,
  } = useUpcoming(selectedStopId, selectedDateTime);

  const trips = showAllRoutes
    ? upcomingTrips
    : upcomingTrips?.filter((trip) => trip.routeId === selectedRoute?.routeId);

  const tripIds = upcomingTrips?.map(({ tripId }) => tripId);

  const {
    error: realtimeError,
    isLoadingRealtime,
    realtimeAddedTrips,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    realtimeCanceledTripIds,
  } = useRealtime(tripIds);

  useEffect(() => {
    handleApiLoading(isLoadingRealtime || isLoadingUpcoming);
  }, [isLoadingRealtime, isLoadingUpcoming, handleApiLoading]);

  const isToday = DateTime.now().hasSame(
    parseDatetimeLocale(selectedDateTime),
    "day",
  );

  const hasRealtime =
    isToday && !!selectedRoute && realtimeRouteIds.has(selectedRoute.routeId);

  // Some trips have duplicate blockIds and arrival times and need to be skipped
  let duplicateTrips = new Set();

  return (
    <div className="flex h-full w-full flex-col gap-4 text-start text-sm font-medium text-gray-900  dark:text-white ">
      <TripList>
        {isLoadingUpcoming ? (
          <li role="status" className="animate-pulse text-center">
            <span className="mt-2 pb-4 text-xl">Loading trips...</span>
            <span className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></span>
            <span className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></span>
            <span className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></span>
            <span className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></span>
            <span className="mb-4 h-7 bg-gray-200 dark:bg-gray-700"></span>
            <span className="h-7 bg-gray-200 dark:bg-gray-700"></span>
          </li>
        ) : !!upcomingError ? (
          <li className="relative h-full w-full">
            <Alert
              variant="destructive"
              className="pointer-events-none absolute top-16 w-full -translate-y-1/2 border-gray-400 dark:border-gray-50"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Trips failed to load.</AlertTitle>
              <AlertDescription>{upcomingError.message}</AlertDescription>
            </Alert>
          </li>
        ) : !trips || trips.length === 0 ? (
          <>
            {/* No trips found */}

            <li className="w-full py-4 text-center text-xl font-medium">
              {showAllRoutes
                ? "No upcoming trips found"
                : selectedRoute
                  ? "No upcoming trips found. Try showing all routes instead."
                  : "No route selected. Try showing all routes instead."}
            </li>
          </>
        ) : (
          <>
            {trips.flatMap(
              ({
                arrivalTime,
                tripId,
                departureTime,
                stopSequence,
                tripHeadsign,
                routeId,
                blockId,
                routeShortName,
              }) => {
                if (blockId && duplicateTrips.has(blockId)) {
                  return [];
                }

                if (blockId) {
                  duplicateTrips.add(blockId);
                }

                const { stopTimeUpdate } =
                  realtimeScheduledByTripId.get(tripId) || {};

                const closestStopUpdate =
                  (stopTimeUpdate &&
                    stopTimeUpdate.find(
                      ({ stopId, stopSequence: realtimeSequence }) =>
                        stopId === selectedStopId ||
                        (stopSequence && realtimeSequence >= stopSequence),
                    )) ||
                  stopTimeUpdate?.at(-1);

                const { arrival, departure } = closestStopUpdate || {};

                // arrival delay is sometimes very wrong from realtime api exa. -1687598071

                const delayedArrivalTime = getDelayedTime(
                  departureTime,
                  arrival?.delay || departure?.delay,
                );

                const hasDeparted = isPastArrivalTime(
                  delayedArrivalTime ?? departureTime ?? arrivalTime ?? "",
                );

                if (!showDeparted && hasDeparted) {
                  return [];
                }

                const isCanceled = realtimeCanceledTripIds.has(tripId);

                if (!showCanceled && isCanceled) {
                  return [];
                }

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
                  : hasDeparted
                    ? "departed"
                    : isEarly
                      ? "early"
                      : isDelayed
                        ? "delayed"
                        : "ontime";

                return (
                  <li key={tripId + departureTime}>
                    <button
                      type="button"
                      onClick={() => handleSelectedTrip(tripId, routeId)}
                      disabled={isCanceled}
                      className={`flex w-full items-center justify-between gap-1 border-b border-gray-200 
                  py-2 pr-2 text-start font-medium dark:border-gray-600 md:gap-2 md:pr-4
                  ${
                    isCanceled
                      ? "cursor-not-allowed bg-red-50 dark:bg-red-950 hover:dark:bg-red-700"
                      : hasDeparted
                        ? "bg-yellow-100 dark:bg-yellow-700 hover:dark:bg-yellow-600"
                        : `cursor-pointer ring-inset hover:bg-gray-100 hover:text-blue-700 focus-visible:bg-gray-100 focus-visible:text-blue-700 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-blue-700 dark:hover:bg-gray-600 dark:hover:text-white dark:hover:ring-gray-500 dark:focus-visible:bg-gray-600 dark:focus-visible:text-white dark:focus-visible:ring-gray-500`
                  }`}
                    >
                      {/* Route Short Name */}
                      <b className="w-20 font-bold md:w-28 md:text-lg">
                        {routeShortName ?? ""}
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
                              arrival?.delay || departure?.delay,
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
              },
            )}
          </>
        )}
      </TripList>

      <form className="flex w-full flex-row items-center justify-start md:justify-center flex-wrap gap-2 md:gap-4 bg-slate-50 text-lg dark:bg-slate-800">
        <label htmlFor="show-trips-checkbox">All routes</label>
        <Switch
          id="show-trips-checkbox"
          checked={showAllRoutes}
          onCheckedChange={() => setShowAllRoutes(!showAllRoutes)}
        />
        <div className="flex flex-row gap-2 md:gap-4">
          <label htmlFor="show-trips-checkbox">Departed</label>
          <Switch
            id="show-departed-checkbox"
            checked={showDeparted}
            onCheckedChange={() => setShowDeparted((prev) => !prev)}
          />
          <label htmlFor="show-canceled-checkbox">Canceled</label>
          <Switch
            id="show-canceled-checkbox"
            checked={showCanceled}
            onCheckedChange={() => setShowCanceled((prev) => !prev)}
          />
        </div>
      </form>
    </div>
  );
}

export default TripModal;
