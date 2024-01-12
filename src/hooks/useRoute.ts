import useSWR from "swr";
import { Route } from "@prisma/client";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useRoute(routeName: string) {
  const {
    data: routes,
    error,
    isLoading,
  } = useSWR<Route[], ErrorWithCause>(
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
