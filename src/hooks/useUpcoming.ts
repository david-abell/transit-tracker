import useSWR from "swr";
import { Route, Trip } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "./useStatic";
import { TripsByStopIdAPIResponse } from "@/pages/api/gtfs/static/upcoming";

function useTrips(stopId: string, selectedDateTime: string, page = 0) {
  const { data } = useSWR<TripsByStopIdAPIResponse>(
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
    routes,
    trips,
    stopTimes,
  };
}

export default useTrips;
