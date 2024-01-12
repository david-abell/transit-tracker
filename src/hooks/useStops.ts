import useSWR from "swr";
import { Stop } from "@prisma/client";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useStops(stopQuery: string) {
  const {
    data: stops,
    error,
    isLoading,
  } = useSWR<Stop[], ErrorWithCause>(
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
