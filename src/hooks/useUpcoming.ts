import useSWR from "swr";
import { Route, Trip } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { UpcomingTripsAPIResponse } from "@/pages/api/gtfs/static/upcoming";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useTrips(stopId: string | null, selectedDateTime: string, page = 0) {
  const { data, error, isLoading } = useSWR<UpcomingTripsAPIResponse, ApiError>(
    !!stopId
      ? [
          `/api/gtfs/static/upcoming?${new URLSearchParams({
            stopId,
            dateTime: selectedDateTime,
            page: String(page),
          })}`,
        ]
      : null,
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    error,
    isLoading,
    upcomingTrips: data?.upcomingTrips,
  };
}

export default useTrips;
