import useSWR from "swr";
import { Route } from "@prisma/client";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useRouteId(routeId: string) {
  const { data, error, isLoading } = useSWR<Route, ErrorWithCause>(
    () => (!!routeId ? `/api/gtfs/static/route/${routeId}` : null),
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    error,
    isLoading,
    route: data,
  };
}

export default useRouteId;
