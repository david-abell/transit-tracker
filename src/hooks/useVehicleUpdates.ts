import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { ApiError } from "next/dist/server/api-utils";
import {
  VehicleUpdatesResponse,
  NTAVehicleUpdate,
} from "@/pages/api/gtfs/vehicle-updates";
import { Route } from "@prisma/client";
import { useSyncExternalStore } from "react";
import { vehicleStore } from "../stores/vehicleStore";

const API_URL = "/api/gtfs/vehicle-updates";

const revalidateOptions = {
  focusThrottleInterval: 30_000,
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

  const vehicles = useSyncExternalStore(
    vehicleStore.subscribe,
    vehicleStore.getVehicles,
  );

  if (data) {
    vehicleStore.add(data.vehicleUpdates);
  }

  return {
    error,
    isLoadingVehicleUpdates: isValidating,
    vehicleUpdates: [...vehicles.values()],
  };
}

export default useVehicleUpdates;
