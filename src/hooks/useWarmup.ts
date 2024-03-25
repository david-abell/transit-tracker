import useSWR from "swr";

import { ApiError } from "next/dist/server/api-utils";
import { StopAPIResponse } from "@/pages/api/gtfs/static/stops/[stopId]";

function useWarmup() {
  const { error, isLoading } = useSWR<StopAPIResponse, ApiError>(
    "/api/gtfs/static/stops/8220B1351201",
  );

  return {
    error,
    isWarmingDB: isLoading,
  };
}

export default useWarmup;
