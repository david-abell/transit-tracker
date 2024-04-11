import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";
import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";

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
    routes,
  };
}

export default useRoute;
