import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";
import { Route } from "@prisma/client";

type Options = {
  all?: boolean;
};

function useRoute(query: string, options?: Options) {
  const params = new URLSearchParams({
    q: query,
  });

  const {
    data: routes,
    error,
    isValidating,
  } = useSWR<RouteAPIResponse, ApiError>(
    !!query || options?.all ? [`/api/gtfs/static/route?${params}`] : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    error,
    isLoadingRoute: isValidating,
    routes: replaceRouteLongNameDashes(routes),
  };
}

export default useRoute;

export function replaceRouteLongNameDashes(
  routes: RouteAPIResponse | undefined,
): RouteAPIResponse | undefined {
  return routes?.map((route) => {
    return {
      ...route,
      routeLongName: route.routeLongName?.replaceAll("–", "-"),
    } as Route;
  });
}
