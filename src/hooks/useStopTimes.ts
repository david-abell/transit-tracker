import useSWR from "swr";
import { StopTime } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useStopTimes(tripId: string) {
  const {
    data: stopTimes,
    isLoading,
    error,
  } = useSWR<StopTime[], ApiError>(
    () =>
      !!tripId && tripId
        ? [`/api/gtfs/static/stop-times/${tripId}`, tripId]
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const stopTimesByTripId: Map<StopTime["tripId"], StopTime> = stopTimes
    ? new Map(
        stopTimes.map((data) => {
          const { stopId } = data;
          return [stopId, data];
        })
      )
    : new Map();

  return {
    stopTimesError: error,
    isLoadingStopTimes: isLoading,
    stopTimesByTripId,
  };
}

export default useStopTimes;
