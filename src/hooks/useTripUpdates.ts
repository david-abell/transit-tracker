import { Time, TripUpdate } from "@/types/realtime";
import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { RealtimeTripUpdateResponse } from "@/pages/api/gtfs/trip-updates";
import { formatSecondsAsTimeString } from "@/lib/timeHelpers";
import { StopTime } from "@prisma/client";
import { ApiError } from "next/dist/server/api-utils";

const API_URL = "/api/gtfs/trip-updates";

const revalidateOptions = {
  focusThrottleInterval: 10_000,
  dedupingInterval: 10_000,
};

type AddedStopTime = Pick<
  StopTime,
  "arrivalTime" | "departureTime" | "stopSequence"
>;

function useTripUpdates(tripIds?: string | string[] | null) {
  const params = !!tripIds
    ? `?${new URLSearchParams({
        tripIds: encodeURI(tripIds.toString()),
      })}`
    : "";

  const { data, error, isValidating, mutate } = useSWR<
    RealtimeTripUpdateResponse,
    ApiError
  >(`${API_URL}${params}`, fetchHelper, revalidateOptions);

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
            ],
          ),
      )
    : new Map();

  return {
    addedTripStopTimes,
    error,
    isLoadingRealtime: isValidating,
    realtimeAddedTrips,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    invalidateRealtime: mutate,
  };
}

export default useTripUpdates;

function createAddedStopTime(
  arrival: Time | undefined,
  departure: Time | undefined,
  stopSequence: number,
): AddedStopTime {
  const arrivalTime = formatSecondsAsTimeString(arrival?.time);
  const departureTime = formatSecondsAsTimeString(departure?.time);

  return {
    arrivalTime,
    departureTime,
    stopSequence,
  };
}
