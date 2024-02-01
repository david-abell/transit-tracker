import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { SingleRouteAPIResponse } from "@/pages/api/gtfs/static/route/[routeId]";

function useRouteId(routeId: string | null) {
  const url = `/api/gtfs/static/route/${routeId}`;

  const { data, error, isLoading } = useSWR<SingleRouteAPIResponse, ApiError>(
    () => (!!routeId ? [url, routeId] : null),
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    error,
    isLoading,
    route: data,
  };
}

export default useRouteId;
