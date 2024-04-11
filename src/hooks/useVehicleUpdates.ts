import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { ApiError } from "next/dist/server/api-utils";
import { VehicleUpdatesResponse } from "@/pages/api/gtfs/vehicle-updates";
import useRoute from "./useRoute";

const API_URL = "/api/gtfs/vehicle-updates";

// Api limited to 1 call per minute
// test revalidate only at 5 minute intervals
// const revalidateOptions = {
//   focusThrottleInterval: 300000,
//   dedupingInterval: 300000,
// };
// Api limited to 1 call per minute
const revalidateOptions = {
  focusThrottleInterval: 10000,
  dedupingInterval: 10000,
};

function useVehicleUpdates() {
  const { data, error, isValidating, mutate } = useSWR<
    VehicleUpdatesResponse,
    ApiError
  >(API_URL, fetchHelper, revalidateOptions);

  const { routes } = useRoute("", { all: true });

  const routeMap = new Map(routes?.map((route) => [route.routeId, route]));

  const vehiclesWithRoutes = data?.vehicleUpdates.flatMap((vehicle) => {
    const { routeId } = vehicle.trip;

    const route = routeMap.get(routeId);
    if (!route) return [];

    return { route, vehicle };
  });

  return {
    error,
    isLoadingVehicleUpdates: isValidating,
    vehicleUpdates: vehiclesWithRoutes,
  };
}

export default useVehicleUpdates;
