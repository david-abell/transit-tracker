import { TripUpdate } from "@/types/realtime";
import useSWR from "swr";
import camelcaseKeys from "camelcase-keys";

import { fetchHelper } from "@/lib/FetchHelper";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/realtime";

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

function useRealtime(tripIds: string | string[] = "") {
  const { data, error, isLoading, mutate } = useSWR<RealtimeTripUpdateResponse>(
    () =>
      !!tripIds
        ? [
            `${API_URL}?${new URLSearchParams({
              tripIds: tripIds.toString(),
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
    for (const [routeId] of addedTrips) {
      realtimeRouteIds.add(routeId);
    }
  }

  const realtimeAddedByRouteId = addedTrips
    ? new Map<string, TripUpdate>([...addedTrips])
    : new Map<string, TripUpdate>();

  const realtimeScheduledByTripId = tripUpdates
    ? new Map<string, TripUpdate>([...tripUpdates])
    : new Map<string, TripUpdate>();

  return {
    realtimeAddedByRouteId,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    realtimeIsLoading: isLoading,
    realtimeIsError: error,
    invalidateRealtime: mutate,
  };
}

export default useRealtime;
