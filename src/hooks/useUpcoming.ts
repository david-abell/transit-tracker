import useSWR from "swr";
import { Route, Trip } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { TripsByStopIdAPIResponse } from "@/pages/api/gtfs/static/upcoming";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useTrips(stopId: string | null, selectedDateTime: string, page = 0) {
  const { data, error, isLoading } = useSWR<TripsByStopIdAPIResponse, ApiError>(
    () =>
      !!stopId
        ? `/api/gtfs/static/upcoming?${new URLSearchParams({
            stopId,
            dateTime: selectedDateTime,
            page: String(page),
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const { routes: routeData, stopTimes, trips: tripData } = data || {};

  const routes: Map<string, Route> =
    routeData && routeData.length
      ? new Map(
          routeData?.map((route) => {
            const { routeId } = route;
            return [routeId, route];
          })
        )
      : new Map();

  const trips: Map<string, Trip> =
    tripData && tripData.length
      ? new Map(
          tripData?.map((trip) => {
            const { tripId } = trip;
            return [tripId, trip];
          })
        )
      : new Map();

  return {
    error,
    isLoading,
    routes,
    trips,
    stopTimes,
  };
}

export default useTrips;
