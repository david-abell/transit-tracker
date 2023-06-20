import useSWR from "swr";
import { Route } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";

function useRoute(routeName: string) {
  const { data: routes } = useSWR<Route[]>(
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
    routes,
  };
}

export default useRoute;
