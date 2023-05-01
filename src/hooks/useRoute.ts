import useSWR from "swr";
import { Route } from "@prisma/client";

import { fetchHelper } from "@/lib/FetchHelper";

function useRoute(routeName: string) {
  const { data: routes } = useSWR<Route[]>(
    () =>
      !!routeName
        ? `/api/gtfs/static/route?${new URLSearchParams({
            routeName,
          })}`
        : null,
    fetchHelper
  );

  console.log(routes);

  return {
    routes,
  };
}

export default useRoute;
