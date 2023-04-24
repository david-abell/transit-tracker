import useSWR from "swr";
import { useState } from "react";
import { Route, Shape, StopTime, Trip } from "@prisma/client";

import { StaticAPIResponse } from "@/pages/api/gtfs/static/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";

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

type Props = {
  routeQuery?: string;
  tripId?: string;
  shapeId?: string;
};

function useStatic({ routeQuery, tripId, shapeId }: Props) {
  const { data: staticData } = useSWR<StaticAPIResponse>(
    () =>
      !!routeQuery
        ? `/api/gtfs/static/static?${new URLSearchParams({
            shortName: routeQuery,
          })}`
        : null,
    fetcher
  );

  const { route, stops, trips } = staticData || {};

  const { data: stopTimes } = useSWR<StopTime[]>(
    () =>
      !!tripId
        ? `/api/gtfs/static/stop-times/?${encodeURIComponent(tripId)}}`
        : null,
    fetcher
  );

  const { data: shape } = useSWR<ShapeAPIResponse>(
    () =>
      !!shapeId
        ? `/api/gtfs/static/shape?${new URLSearchParams({
            shapeId,
          })}`
        : null,
    fetcher
  );

  return {
    route,
    shape,
    stops,
    trips,
    stopTimes,
  };
}

export default useStatic;
