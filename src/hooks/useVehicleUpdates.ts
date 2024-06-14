import useSWR from "swr";

import { fetchHelper } from "@/lib/FetchHelper";
import { ApiError } from "next/dist/server/api-utils";
import {
  VehicleUpdatesResponse,
  NTAVehicleUpdate,
} from "@/pages/api/gtfs/vehicle-updates";
import { Route } from "@prisma/client";
import { useRef, useState, useSyncExternalStore } from "react";
import { vehicleStore } from "../stores/vehicleStore";

const API_URL = "/api/gtfs/vehicle-updates";

const revalidateOptions = {
  focusThrottleInterval: 10_000,
  dedupingInterval: 10_000,
};

type Point = { lat: number; lng: number };

export const MIN_ZOOM_FOR_REQUEST = 12;

function useVehicleUpdates({ lat, lng }: Point, radius: number, zoom: number) {
  const [storeTimestamp, setStoreTimestamp] = useState<string | null>(null);
  const prevZoom = useRef(0);

  const url =
    zoom > prevZoom.current || zoom < MIN_ZOOM_FOR_REQUEST
      ? null
      : `${API_URL}?${new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          rad: String(radius),
        })}`;

  prevZoom.current = zoom;

  const { data, error, isValidating, mutate } = useSWR<
    VehicleUpdatesResponse,
    ApiError
  >(url, fetchHelper, revalidateOptions);

  const vehicles = useSyncExternalStore(
    vehicleStore.subscribe,
    vehicleStore.getVehicles,
  );

  if (data) {
    if (data.timestamp !== storeTimestamp) {
      setStoreTimestamp(data.timestamp);
      vehicleStore.clear();
    }
    vehicleStore.add(data.vehicleUpdates);
  }

  return {
    error,
    isLoadingVehicleUpdates: isValidating,
    vehicleUpdates: [...vehicles.values()],
  };
}

export default useVehicleUpdates;
