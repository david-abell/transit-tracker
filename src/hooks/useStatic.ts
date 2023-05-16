import useSWR from "swr";
import { StopTime, Trip } from "@prisma/client";

import { StaticAPIResponse } from "@/pages/api/gtfs/static/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";

import { fetchHelper } from "@/lib/FetchHelper";
import { TripAPIResponse } from "@/pages/api/gtfs/static/trips";
import { StopTimesApiResponse } from "@/pages/api/gtfs/static/stop-times";

type Props = {
  routeId: string;
  selectedDateTime: string;
  selectedTripId: string;
};

const skipRevalidationOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

function useStatic({ routeId, selectedDateTime, selectedTripId }: Props) {
  const { data: stops } = useSWR<StaticAPIResponse>(
    () =>
      !!routeId
        ? `/api/gtfs/static/static?${new URLSearchParams({
            routeId,
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const { data: trips } = useSWR<TripAPIResponse>(
    () =>
      !!routeId
        ? `/api/gtfs/static/trips?${new URLSearchParams({
            routeId,
            dateTime: selectedDateTime,
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const tripsById: Map<string, Trip> =
    trips && trips.length
      ? new Map(
          trips.map((data) => {
            const { tripId } = data;
            return [tripId, data];
          })
        )
      : new Map();

  const stopsById = new Map(
    stops?.map((data) => {
      const { stopId } = data;
      return [stopId, data];
    })
  );

  const { data: stopTimes } = useSWR<StopTimesApiResponse>(
    () =>
      !!routeId && selectedDateTime
        ? [
            `/api/gtfs/static/stop-times?${new URLSearchParams({
              routeId,
              dateTime: selectedDateTime,
            })}`,
            routeId,
            selectedDateTime,
          ]
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const { stopTimesZero, stopTimesOne } = stopTimes || {};

  const stopTimesZeroByTripId: Map<string, StopTime[]> | undefined =
    stopTimesOne &&
    stopTimesZero?.reduce((acc, val) => {
      const { tripId } = val;
      if (acc.has(tripId)) {
        acc.set(tripId, acc.get(tripId).concat(val));
      } else {
        acc.set(tripId, [val]);
      }
      return acc;
    }, new Map());

  const stopTimesOneByTripId: Map<string, StopTime[]> | undefined =
    stopTimesOne &&
    stopTimesOne?.reduce((acc, val) => {
      const { tripId } = val;
      if (acc.has(tripId)) {
        acc.set(tripId, acc.get(tripId).concat(val));
      } else {
        acc.set(tripId, [val]);
      }
      return acc;
    }, new Map());

  const stopTimesZeroByStopId: Map<string, StopTime[]> | undefined =
    stopTimesZero &&
    stopTimesZero?.reduce((acc, val) => {
      const { stopId } = val;
      if (acc.has(stopId)) {
        acc.set(stopId, acc.get(stopId).concat(val));
      } else {
        acc.set(stopId, [val]);
      }
      return acc;
    }, new Map());

  const stopTimesOneByStopId: Map<string, StopTime[]> | undefined =
    stopTimesOne &&
    stopTimesOne?.reduce((acc, val) => {
      const { stopId } = val;
      if (acc.has(stopId)) {
        acc.set(stopId, acc.get(stopId).concat(val));
      } else {
        acc.set(stopId, [val]);
      }
      return acc;
    }, new Map());

  const shapeId = selectedTripId && tripsById?.get(selectedTripId)?.shapeId;

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

  const { data: selectedTripStopTimes } = useSWR<StopTime[]>(
    () =>
      !!selectedTripId && selectedTripId
        ? [`/api/gtfs/static/stop-times/${selectedTripId}`, selectedTripId]
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const selectedTripStopTimesById: Map<StopTime["tripId"], StopTime> =
    selectedTripStopTimes
      ? new Map(
          selectedTripStopTimes.map((data) => {
            const { stopId } = data;
            return [stopId, data];
          })
        )
      : new Map();

  return {
    selectedTripStopTimesById,
    shape,
    stops,
    trips,
    tripsById,
    stopTimesZero,
    stopTimesOne,
    stopTimesZeroByStopId,
    stopTimesOneByStopId,
    stopTimesZeroByTripId,
    stopTimesOneByTripId,
    stopsById,
  };
}

export default useStatic;
