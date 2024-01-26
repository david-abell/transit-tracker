import useSWR from "swr";
import { Trip } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useTrip(tripId: string) {
  const {
    data: selectedTrip,
    error,
    isLoading,
  } = useSWR<Trip, ApiError>(
    () => (!!tripId ? `/api/gtfs/static/trips/${tripId}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    tripError: error,
    isLoadingTrip: isLoading,
    selectedTrip,
  };
}

export default useTrip;
