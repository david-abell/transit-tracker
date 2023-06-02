import { GTFSResponse, TripUpdate } from "@/types/realtime";
import useSWR from "swr";
import camelcaseKeys from "camelcase-keys";
import { GTFSResponseSchema } from "@/types/realtime.schema";

import { fetchHelper } from "@/lib/FetchHelper";

const API_URL = "/api/gtfs/realtime/";

type RealtimeByRouteId = Array<[string, TripUpdate]>;
type RealtimeByTripId = [string, TripUpdate][];
type RealtimeTripIds = string[];
type RealtimeRouteIds = string[];

type DataByRelationship = [
  RealtimeByRouteId,
  RealtimeByTripId,
  RealtimeTripIds,
  RealtimeRouteIds
];

// Api limited to 1 call per minute
// test revalidate only at 5 minute intervals
const revalidateOptions = {
  focusThrottleInterval: 300000,
  dedupingInterval: 300000,
};
// Api limited to 1 call per minute
// const revalidateOptions = {
//   focusThrottleInterval: 60000,
//   dedupingInterval: 60000,
// };

function useRealtime() {
  const { data, error, isLoading, mutate } = useSWR<GTFSResponse>(
    API_URL,
    fetchHelper,
    revalidateOptions
  );

  const keyCasedData = data && camelcaseKeys(data, { deep: true });

  const parsedData = keyCasedData && GTFSResponseSchema.safeParse(keyCasedData);
  // console.log(JSON.stringify(err.errors, null, 2));

  let realtimeByTripId: DataByRelationship = [[], [], [], []];

  if (parsedData?.success) {
    realtimeByTripId = parsedData.data.entity
      .filter(({ tripUpdate }) => tripUpdate !== undefined)
      .reduce<DataByRelationship>(
        (acc, { tripUpdate }) => {
          const [added, scheduled, canceled, routes] = acc;
          const { scheduleRelationship, tripId, routeId } = tripUpdate!.trip;
          switch (scheduleRelationship) {
            case "ADDED":
              added.push([routeId, tripUpdate!]);
            case "CANCELED":
              canceled.push(tripId!);
            case "SCHEDULED":
              scheduled.push([tripId!, tripUpdate!]);
            default:
              routes.push(routeId);
              return acc;
          }
        },
        [[], [], [], []]
      );
  }

  const [added, scheduled, canceled, routes] = realtimeByTripId || [
    [],
    [],
    [],
    [],
  ];

  const realtimeAddedByRouteId = new Map<string, TripUpdate>([...added]);
  const realtimeCanceledTripIds = new Set<string>([
    ...canceled.filter((id) => !!id),
  ]);
  const realtimeRouteIds = new Set<string>([...routes.filter((id) => !!id)]);
  const realtimeScheduledByTripId = new Map<string, TripUpdate>([...scheduled]);

  return {
    realtimeAddedByRouteId,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeRouteIds,
    realtimeIsLoading: isLoading,
    realtimeIsError: error || (!isLoading && !parsedData?.success),
    invalidateRealtime: mutate,
  };
}

export default useRealtime;
