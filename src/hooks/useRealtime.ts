import { Time, TripUpdate } from "@/types/realtime";
import useSWR from "swr";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";
import { formatSecondsAsTimeString } from "@/lib/timeHelpers";
import { StopTime } from "@prisma/client";

const API_URL = "/api/gtfs/realtime";

// Api limited to 1 call per minute
// test revalidate only at 5 minute intervals
// const revalidateOptions = {
//   focusThrottleInterval: 300000,
//   dedupingInterval: 300000,
// };
// Api limited to 1 call per minute
const revalidateOptions = {
  focusThrottleInterval: 10000,
  dedupingInterval: 10000,
};

type AddedStopTime = Pick<
  StopTime,
  "arrivalTime" | "departureTime" | "stopSequence"
>;

function useRealtime(tripIds: string | string[] | undefined) {
  const { data, error, isLoading, mutate } = useSWR<
    RealtimeTripUpdateResponse,
    ErrorWithCause
  >(
    () =>
      !!tripIds && tripIds.length
        ? [
            `${API_URL}?${new URLSearchParams({
              tripIds: encodeURI(tripIds.toString()),
            })}`,
            tripIds,
          ]
        : null,
    fetchHelper,
    revalidateOptions
  );

  const { addedTrips, tripUpdates } = data || {};

  const realtimeCanceledTripIds = new Set<string>();
  const realtimeRouteIds = new Set<string>();

  if (tripUpdates) {
    for (const [tripId, tripUpdate] of tripUpdates) {
      const { scheduleRelationship } = tripUpdate.trip;
      if (scheduleRelationship === "CANCELED") {
        realtimeCanceledTripIds.add(tripId);
      }
      realtimeRouteIds.add(tripUpdate.trip.routeId);
    }
  }

  if (addedTrips) {
    for (const [key, addedTrip] of addedTrips) {
      const { routeId } = addedTrip.trip;
      realtimeRouteIds.add(routeId);
    }
  }

  const realtimeAddedTrips = addedTrips
    ? new Map<string, TripUpdate>([...addedTrips])
    : new Map<string, TripUpdate>();

  const realtimeScheduledByTripId = tripUpdates
    ? new Map<string, TripUpdate>([...tripUpdates])
    : new Map<string, TripUpdate>();

  const isRequestedTripAdded =
    typeof tripIds === "string" && !!tripIds && tripIds.split(",").length === 1;

  const addedTripStopTimes: Map<string, AddedStopTime> = isRequestedTripAdded
    ? new Map(
        realtimeScheduledByTripId
          .get(tripIds)
          ?.stopTimeUpdate?.map(
            ({ arrival, departure, stopId, stopSequence }) => [
              stopId,
              createAddedStopTime(arrival, departure, stopSequence),
            ]
          )
      )
    : new Map();

  return {
    addedTripStopTimes,
    error,
    isLoading,
    realtimeAddedTrips,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    invalidateRealtime: mutate,
  };
}

export default useRealtime;

function createAddedStopTime(
  arrival: Time | undefined,
  departure: Time | undefined,
  stopSequence: number
): AddedStopTime {
  const arrivalTime = formatSecondsAsTimeString(arrival?.time);
  const departureTime = formatSecondsAsTimeString(departure?.time);

  return {
    arrivalTime,
    departureTime,
    stopSequence,
  };
}
