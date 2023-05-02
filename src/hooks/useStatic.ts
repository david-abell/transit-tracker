import useSWR from "swr";
import { Route, Shape, StopTime, Trip } from "@prisma/client";

import { StaticAPIResponse } from "@/pages/api/gtfs/static/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";
import StopId from "@/pages/api/gtfs/static/stop-times/[stopId]";

import { fetchHelper } from "@/lib/FetchHelper";

type Props = {
  selectedRoute: string;
  selectedDateTime: string;
  selectedTripId: string;
};

function useStatic({ selectedRoute, selectedDateTime, selectedTripId }: Props) {
  const { data: staticData } = useSWR<StaticAPIResponse>(
    () =>
      !!selectedRoute
        ? `/api/gtfs/static/static?${new URLSearchParams({
            routeId: selectedRoute,
          })}`
        : null,
    fetchHelper
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
      !!route && selectedDateTime
        ? [
            `/api/gtfs/static/stop-times?${new URLSearchParams({
              routeId: route.routeId,
              dateTime: selectedDateTime,
            })}`,
            route,
            selectedDateTime,
          ]
        : null,
    fetchHelper
  );

  const stopTimesByTripId: Map<string, StopTime[]> | undefined =
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

  const stopTimesByStopId: Map<string, StopTime[]> | undefined =
    stopTimes &&
    stopTimes?.reduce((acc, val) => {
      const { stopId } = val;
      if (acc.has(stopId)) {
        acc.set(stopId, acc.get(stopId).concat(val));
      } else {
        acc.set(stopId, [val]);
      }
      return acc;
    }, new Map());

  const shapeId = selectedTripId && tripsById.get(selectedTripId)?.shapeId;

  const { data: shape } = useSWR<ShapeAPIResponse>(
    () =>
      !!shapeId && selectedTripId
        ? [
            `/api/gtfs/static/shape?${new URLSearchParams({
              shapeId,
            })}`,
            shapeId,
            selectedTripId,
          ]
        : null,
    fetchHelper
  );

  return {
    route,
    shape,
    stops,
    trips,
    tripsById,
    stopTimes,
    stopTimesByStopId,
    stopTimesByTripId,
    stopsById,
  };
}

export default useStatic;
