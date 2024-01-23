import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useStopId(stopId: string, destination = false) {
  const {
    data: selectedStop,
    error,
    isLoading,
  } = useSWR<Stop, ApiError>(
    !!stopId ? [`/api/gtfs/static/stops/${stopId}`, destination] : null,
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    error,
    isLoading,
    selectedStop,
  };
}

export default useStopId;
