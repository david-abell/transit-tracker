import useSWR from "swr";
import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { StopAPIResponse } from "@/pages/api/gtfs/static/stops/[stopId]";

function useStopId(stopId: string, destination = false) {
  const {
    data: selectedStop,
    error,
    isLoading,
  } = useSWR<StopAPIResponse, ApiError>(
    !!stopId ? [`/api/gtfs/static/stops/${stopId}`, destination] : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    error,
    isLoading,
    selectedStop,
  };
}

export default useStopId;
