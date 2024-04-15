import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { SingleRouteAPIResponse } from "@/pages/api/gtfs/static/route/[routeId]";

function useRouteId(routeId: string | null) {
  const url = `/api/gtfs/static/route/${routeId}`;

  const { data, error, isValidating } = useSWR<
    SingleRouteAPIResponse,
    ApiError
  >(
    () => (!!routeId ? [url, routeId] : null),
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    error,
    isLoadingRoute: isValidating,
    route: data
      ? ({
          ...data,
          routeLongName: data.routeLongName?.replaceAll("–", "-"),
        } as SingleRouteAPIResponse)
      : undefined,
  };
}

export default useRouteId;
