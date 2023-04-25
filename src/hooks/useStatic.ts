import useSWR from "swr";
import { useState } from "react";
import { Route, Shape, StopTime, Trip } from "@prisma/client";
import { format } from "date-fns";

import { StaticAPIResponse } from "@/pages/api/gtfs/static/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";
import StopId from "@/pages/api/gtfs/static/stop-times/[stopId]";
import { dateToStopTimeString } from "@/lib/timeHelpers";

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
  shapeId?: string;
  dateTime?: Date;
};

function useStatic({ routeQuery, shapeId, dateTime }: Props) {
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

  const tripsById = new Map(
    trips?.map((data) => {
      const { tripId } = data;
      return [tripId, data];
    })
  );

  const stopsById = new Map(
    stops?.map((data) => {
      const { stopId } = data;
      return [stopId, data];
    })
  );

  const { data: stopTimes } = useSWR<StopTime[]>(
    () =>
      !!route && dateTime
        ? `/api/gtfs/static/stop-times?${new URLSearchParams({
            routeId: route.routeId,
            departureTime: dateToStopTimeString(dateTime),
            utc: dateTime.toISOString(),
          })}`
        : null,
    fetcher
  );

  const stopTimesByTripId =
    stopTimes &&
    stopTimes?.reduce((acc, val) => {
      const { tripId } = val;
      if (acc.has(tripId)) {
        acc.set(tripId, acc.get(tripId).concat(val));
      } else {
        acc.set(tripId, [val]);
      }
      return acc;
    }, new Map());

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
    tripsById,
    stopTimes,
    stopTimesByTripId,
    stopsById,
  };
}

export default useStatic;
