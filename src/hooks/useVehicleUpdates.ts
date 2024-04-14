import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { ApiError } from "next/dist/server/api-utils";
import { VehicleUpdatesResponse } from "@/pages/api/gtfs/vehicle-updates";
import useRoute from "./useRoute";

const API_URL = "/api/gtfs/vehicle-updates";

const revalidateOptions = {
  focusThrottleInterval: 10000,
  dedupingInterval: 30_000,
};

type Point = { lat: number; lng: number };

function useVehicleUpdates({ lat, lng }: Point, radius: number) {
  const url = `${API_URL}?${new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    rad: String(radius),
  })}`;

  const { data, error, isValidating, mutate } = useSWR<
    VehicleUpdatesResponse,
    ApiError
  >(url, fetchHelper, revalidateOptions);

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
