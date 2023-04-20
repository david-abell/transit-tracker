import { GTFSResponse } from "@/pages/api/gtfs/realtime";
import { TripUpdateHacked } from "@/pages/api/gtfs/realtime";
import useSWR, { Fetcher } from "swr";

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

const API_URL = "/api/gtfs/realtime/";

function useRealtime() {
  const { data, error, isLoading } = useSWR<GTFSResponse>(API_URL, fetcher);

  const tripsByTripId = new Map(
    data?.entity.map(({ trip_update: tripUpdate }) => {
      const tripId = tripUpdate?.trip.trip_id;
      return [tripId, tripUpdate];
    })
  );

  const tripsByRouteId = new Map<string, TripUpdateHacked[]>();

  if (data?.entity) {
    for (const { trip_update: tripUpdate } of data.entity) {
      if (!tripUpdate) {
        continue;
      }
      const routeId = tripUpdate?.trip.route_id!;

      if (tripsByRouteId.has(routeId)) {
        const newEntry = tripsByRouteId.get(routeId)!.concat(tripUpdate);
        tripsByRouteId.set(routeId, newEntry);
      } else {
        tripsByRouteId.set(routeId, [tripUpdate]);
      }
    }
  }

  return {
    tripsByTripId,
    tripsByRouteId,
    isLoading,
    isError: error,
  };
}

export default useRealtime;
