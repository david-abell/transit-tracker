import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useStops(stopQuery: string) {
  const {
    data: stops,
    error,
    isLoading,
  } = useSWR<Stop[], ApiError>(
    () =>
      !!stopQuery
        ? `/api/gtfs/static/stops?${new URLSearchParams({
            stopQuery,
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    error,
    isLoading,
    stops,
  };
}

export default useStops;
