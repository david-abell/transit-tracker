import useSWR from "swr";
import { Route, Shape, StopTime, Trip } from "@prisma/client";
import { format } from "date-fns";

import { StaticAPIResponse } from "@/pages/api/gtfs/static/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";
import StopId from "@/pages/api/gtfs/static/stop-times/[stopId]";
import { dateToStopTimeString } from "@/lib/timeHelpers";

type FetchHelper = (args: RequestInfo[]) => Promise<any>;

const fetcher: FetchHelper = async (args: RequestInfo[]) => {
  const url = Array.isArray(args) ? args[0] : args;
  console.log("fetcher:", args, url);
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error("An error occurred while fetching the data.");
    return response.json();
  } catch (error) {
    if (error instanceof Error) console.log(error.message);
  }
};

type Props = {
  routeQuery?: string;
  // shapeId?: string;
  dateTime?: Date;
  selectedTripId: string;
};

function useStatic({ routeQuery, dateTime, selectedTripId }: Props) {
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
        ? [
            `/api/gtfs/static/stop-times?${new URLSearchParams({
              routeId: route.routeId,
              departureTime: dateToStopTimeString(dateTime),
              utc: dateTime.toISOString(),
            })}`,
            route,
            dateTime.toDateString(),
          ]
        : null,
    fetcher
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
  console.log("shapeId:", shapeId);

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
    fetcher
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
