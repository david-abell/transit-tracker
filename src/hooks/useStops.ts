import useSWR from "swr";
import { Stop } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useStops(stopQuery: string) {
  const { data: stops } = useSWR<Stop[]>(
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
    stops,
  };
}

export default useStops;
