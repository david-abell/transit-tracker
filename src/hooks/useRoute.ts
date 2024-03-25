import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";

function useRoute(routeName: string) {
  const {
    data: routes,
    error,
    isValidating,
  } = useSWR<RouteAPIResponse, ApiError>(
    !!routeName
      ? [
          `/api/gtfs/static/route?${new URLSearchParams({
            routeName,
          })}`,
        ]
      : null,
    fetchHelper,
    skipRevalidationOptions,
  );

  return {
    error,
    isLoadingRoute: isValidating,
    routes,
  };
}

export default useRoute;
