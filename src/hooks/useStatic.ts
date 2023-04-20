import useSWR from "swr";
import { useState } from "react";
import { Routes, Trips } from "@prisma/client";

import { RouteAPIResponse } from "@/pages/api/gtfs/static/route";
import { TripAPIResponse } from "@/pages/api/gtfs/static/trip";

const fetcher = async (input: RequestInfo, init: RequestInit) => {
  try {
    const response = await fetch(input, init);
    if (!response.ok)
      throw new Error("An error occurred while fetching the data.");
    return response.json();
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
  }
};

const API_URL = "/api/gtfs/static/route";

type Props = {
  route?: string;
  tripId?: string;
};

function useStatic({ route }: Props) {
  const routeParams = route ? new URLSearchParams({ shortName: route }) : "";

  const { data: routes } = useSWR<RouteAPIResponse>(
    () => (!!route ? `/api/gtfs/static/route?${routeParams}` : null),
    fetcher
  );

  const tripParams = routes
    ? new URLSearchParams({ routeId: routes.routeId })
    : "";

  const { data: trips } = useSWR<TripAPIResponse>(
    () => (!!routes ? `/api/gtfs/static/trip?${tripParams}` : null),
    fetcher
  );

  return {
    routes,
    trips,
  };
}

export default useStatic;
