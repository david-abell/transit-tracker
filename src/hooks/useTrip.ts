import useSWR from "swr";
import { Trip } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { TripIdAPIResponse } from "@/pages/api/gtfs/static/trips/[tripId]";

function useTrip(tripId: string) {
  const {
    data: selectedTrip,
    error,
    isLoading,
  } = useSWR<TripIdAPIResponse, ApiError>(
    !!tripId ? [`/api/gtfs/static/trips/${tripId}`] : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    tripError: error,
    isLoadingTrip: isLoading,
    selectedTrip,
  };
}

export default useTrip;
