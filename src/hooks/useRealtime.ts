import { GTFSResponse, TripUpdate } from "@/types/realtime";
import useSWR from "swr";
import camelcaseKeys from "camelcase-keys";
import { GTFSResponseSchema } from "@/types/realtime.schema";

import { fetchHelper } from "@/lib/FetchHelper";

const API_URL = "/api/gtfs/realtime/";

type RealtimeByRouteId = Array<[string, TripUpdate]>;
type RealtimeByTripId = [string, TripUpdate][];
type RealtimeTripIds = string[];

type DataByRelationship = [
  RealtimeByRouteId,
  RealtimeTripIds,
  RealtimeByTripId
];

function useRealtime() {
  const { data, error, isLoading } = useSWR<GTFSResponse>(API_URL, fetchHelper);

  const keyCasedData = data && camelcaseKeys(data, { deep: true });

  const parsedData = keyCasedData && GTFSResponseSchema.safeParse(keyCasedData);
  // console.log(JSON.stringify(err.errors, null, 2));

  let realtimeByTripId: DataByRelationship = [[], [], []];

  if (parsedData?.success) {
    realtimeByTripId = parsedData.data.entity
      .filter(({ tripUpdate }) => tripUpdate !== undefined)
      .reduce<DataByRelationship>(
        (acc, { tripUpdate }) => {
          const [added, canceled, scheduled] = acc;
          const { scheduleRelationship, tripId, routeId } = tripUpdate!.trip;
          switch (scheduleRelationship) {
            case "ADDED":
              added.push([routeId, tripUpdate!]);
              return acc;
            case "CANCELED":
              canceled.push(tripId!);
              return acc;
            case "SCHEDULED":
              scheduled.push([tripId!, tripUpdate!]);
              return acc;
            default:
              return acc;
          }
        },
        [[], [], []]
      );
  }

  const [added, canceled, scheduled] = realtimeByTripId || [[], [], []];

  const realtimeAddedByRouteId = new Map<string, TripUpdate>([...added]);
  const realtimeCanceledTripIds = new Set<string>([...canceled]);
  const realtimeScheduledByTripId = new Map<string, TripUpdate>([...scheduled]);

  return {
    realtimeAddedByRouteId,
    realtimeCanceledTripIds,
    realtimeScheduledByTripId,
    realtimeIsLoading: isLoading,
    realtimeIsError: error || (!isLoading && !parsedData?.success),
  };
}

export default useRealtime;
