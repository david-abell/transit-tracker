import { GTFSResponse, TripUpdate } from "@/types/realtime";
import useSWR from "swr";
import camelcaseKeys from "camelcase-keys";
import { GTFSResponseSchema } from "@/types/realtime.schema";

import { fetchHelper } from "@/lib/FetchHelper";

const API_URL = "/api/gtfs/realtime/";

function useRealtime() {
  const { data, error, isLoading } = useSWR<GTFSResponse>(API_URL, fetchHelper);

  const keyCasedData = data && camelcaseKeys(data, { deep: true });

  const parsedData = keyCasedData && GTFSResponseSchema.safeParse(keyCasedData);
  // console.log(JSON.stringify(err.errors, null, 2));

  // const tripsByTripId =
  //   parsedData &&
  //   new Map(
  //     parsedData.entity
  //       .filter(({ tripUpdate }) => tripUpdate)
  //       .map(({ tripUpdate }) => {
  //         const tripId = tripUpdate?.trip.tripId;
  //         return [tripId, tripUpdate];
  //       })
  //   );

  // const tripsByRouteId = new Map<string, TripUpdate[]>();

  // if (parsedData?.entity) {
  //   for (const { tripUpdate: tripUpdate } of parsedData.entity) {
  //     if (!tripUpdate) {
  //       continue;
  //     }
  //     const routeId = tripUpdate?.trip.routeId!;

  //     if (tripsByRouteId.has(routeId)) {
  //       const newEntry = tripsByRouteId.get(routeId)!.concat(tripUpdate);
  //       tripsByRouteId.set(routeId, newEntry);
  //     } else {
  //       tripsByRouteId.set(routeId, [tripUpdate]);
  //     }
  //   }
  // }

  return {
    realtimeTripsByTripId: parsedData?.success ? parsedData.data : undefined,
    // realtimeTripsByRouteId: tripsByRouteId,
    realtimeIsLoading: isLoading,
    realtimeIsError: error || (!isLoading && !parsedData?.success),
  };
}

export default useRealtime;
