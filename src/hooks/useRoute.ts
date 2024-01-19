import useSWR from "swr";
import { Route } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { ApiError } from "next/dist/server/api-utils";

function useRoute(routeName: string) {
  const {
    data: routes,
    error,
    isLoading,
  } = useSWR<Route[], ApiError>(
    () =>
      !!routeName
        ? `/api/gtfs/static/route?${new URLSearchParams({
            routeName,
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  return {
    error,
    isLoading,
    routes,
  };
}

export default useRoute;
