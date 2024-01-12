import useSWR from "swr";
import { Stop } from "@prisma/client";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useStopId(stopId: string) {
  const {
    data: selectedStop,
    error,
    isLoading,
  } = useSWR<Stop, ErrorWithCause>(
    () => (!!stopId ? `/api/gtfs/static/stops/${stopId}` : null),
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
