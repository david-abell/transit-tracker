import useSWR from "swr";
import { Route } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "./useStatic";

function useRouteId(routeId: string) {
  const { data } = useSWR<Route>(
    () => (!!routeId ? `/api/gtfs/static/route/${routeId}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    route: data,
  };
}

export default useRouteId;
