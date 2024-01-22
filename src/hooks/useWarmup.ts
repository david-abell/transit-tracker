import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { ApiError } from "next/dist/server/api-utils";

function useWarmup() {
  const { error, isLoading } = useSWR<Stop, ApiError>(
    "/api/gtfs/static/stops/8220B1351201",
    fetchHelper,
    {}
  );

  return {
    error,
    isLoading,
  };
}

export default useWarmup;
