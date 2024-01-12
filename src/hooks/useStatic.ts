import useSWR from "swr";
import { StopTime, Trip } from "@prisma/client";

import { StaticAPIResponse } from "@/pages/api/gtfs/static";
import { ShapeAPIResponse } from "@/pages/api/gtfs/static/shape";

import { ErrorWithCause, fetchHelper } from "@/lib/FetchHelper";
import { skipRevalidationOptions } from "@/lib/api/static/consts";
import { RouteStopsAPIResponse } from "@/pages/api/gtfs/static/route-stops";

type Props = {
  routeId: string;
  selectedDateTime: string;
  tripId: string;
};

function useStatic({ routeId, selectedDateTime, tripId }: Props) {
  const {
    data: stops,
    isLoading: isLoadingStops,
    error: stopsError,
  } = useSWR<RouteStopsAPIResponse, ErrorWithCause>(
    () =>
      !!routeId
        ? `/api/gtfs/static/route-stops?${new URLSearchParams({
            routeId,
          })}`
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const {
    data: staticData,
    isLoading: isLoadingStaticData,
    error: staticDataError,
  } = useSWR<StaticAPIResponse, ErrorWithCause>(
    () =>
      !!routeId && selectedDateTime
        ? [
            `/api/gtfs/static?${new URLSearchParams({
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

  const { trips, stopTimes } = staticData || {};

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

  // const stopTimesByTripId: Map<string, StopTime[]> | undefined =
  //   stopTimes &&
  //   stopTimes?.reduce((acc, val) => {
  //     const { tripId } = val;
  //     if (acc.has(tripId)) {
  //       acc.set(tripId, acc.get(tripId).concat(val));
  //     } else {
  //       acc.set(tripId, [val]);
  //     }
  //     return acc;
  //   }, new Map());

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

  const shapeId = tripId && tripsById?.get(tripId)?.shapeId;

  const {
    data: shape,
    isLoading: isLoadingShape,
    error: shapeError,
  } = useSWR<ShapeAPIResponse, ErrorWithCause>(
    () =>
      !!shapeId && tripId
        ? [
            `/api/gtfs/static/shape?${new URLSearchParams({
              shapeId,
            })}`,
            shapeId,
            tripId,
          ]
        : null,
    fetchHelper,
    skipRevalidationOptions
  );

  const {
    data: selectedTripStopTimes,
    isLoading: isLoadingSelectedTripStopTimes,
    error: selectedTripStopTimesError,
  } = useSWR<StopTime[], ErrorWithCause>(
    () =>
      !!tripId && tripId
        ? [`/api/gtfs/static/stop-times/${tripId}`, tripId]
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

  const error =
    stopsError || staticDataError || shapeError || selectedTripStopTimesError;

  const isLoading =
    isLoadingStops ||
    isLoadingStaticData ||
    isLoadingShape ||
    isLoadingSelectedTripStopTimes;

  return {
    error,
    isLoading,
    selectedTripStopTimesById,
    shape,
    stops,
    tripsById,
    stopTimesByStopId,
    stopsById,
  };
}

export default useStatic;
