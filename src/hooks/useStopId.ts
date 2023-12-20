import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useStop(stopId: string) {
  const { data: selectedStop } = useSWR<Stop>(
    () => (!!stopId ? `/api/gtfs/static/stops/${stopId}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    selectedStop,
  };
}

export default useStop;
