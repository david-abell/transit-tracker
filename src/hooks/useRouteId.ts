import useSWR from "swr";
import { Route } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useRouteId(routeId: string) {
  const { data, error, isLoading } = useSWR<Route, ApiError>(
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
