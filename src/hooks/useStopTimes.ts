import useSWR from "swr";
import { StopTime } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useStopTimes(tripId: string | null) {
  const {
    data: stopTimes,
    isValidating,
    error,
  } = useSWR<StopTime[], ApiError>(
    !!tripId && tripId
      ? [`/api/gtfs/static/stop-times/${tripId}`, tripId]
      : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  const stopTimesByStopId: Map<StopTime["stopId"], StopTime> = stopTimes
    ? new Map(
        stopTimes.map((data) => {
          const { stopId } = data;
          return [stopId, data];
        }),
      )
    : new Map();

  return {
    stopTimesError: error,
    isLoadingStopTimes: isValidating,
    stopTimesByStopId,
    stopTimes,
  };
}

export default useStopTimes;
