import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useStopId(stopId: string) {
  const { data: selectedStop } = useSWR<Stop>(
    () => (!!stopId ? `/api/gtfs/static/stops/${stopId}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    selectedStop,
  };
}

export default useStopId;
