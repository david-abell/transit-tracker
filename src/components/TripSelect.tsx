import { TripUpdate } from "@/types/realtime";
import { Route, StopTime, Trip } from "@prisma/client";

type Props = {
  route: Route;
  stopTimes: StopTime[] | undefined;
  handleSelectedTrip: (tripId: string) => void;
  tripsById: Map<string, Trip>;
  realtimeAddedByRouteId: Map<string, TripUpdate>;
  realtimeCanceledTripIds: Set<string>;
  realtimeRouteIds: Set<string>;
  realtimeScheduledByTripId: Map<string, TripUpdate>;
};

function TripSelect({
  realtimeAddedByRouteId,
  realtimeCanceledTripIds,
  realtimeScheduledByTripId,
  realtimeRouteIds,
  route,
  stopTimes = [],
  handleSelectedTrip,
  tripsById,
}: Props) {
  const hasRealtime = realtimeRouteIds.has(route.routeId);
  return (
    <div className="flex w-full flex-col rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      {!hasRealtime && (
        <span className="flex-1 rounded-t bg-red-100 px-2.5 py-0.5 text-center font-medium text-red-800 dark:bg-red-900 dark:text-red-300">
          No realtime data available
        </span>
      )}
      <label htmlFor="trip-select" className="sr-only">
        Pick a trip
      </label>
      <ul
        id="trip-select"
        className="flex max-h-96 max-w-full flex-col overflow-y-scroll text-start"
      >
        <li
          className="flex w-full justify-between border-b-2 border-gray-400 px-4 
                py-2 font-medium dark:border-gray-600"
        >
          <span className="flex-1  cursor-default">Route & Destination</span>
          <span className="flex-1 cursor-default"> Scheduled arrival</span>
        </li>
        {!!stopTimes &&
          stopTimes.flatMap(({ tripId, departureTime }) => {
            if (realtimeCanceledTripIds.has(tripId)) return [];
            const real = realtimeScheduledByTripId.get(tripId);
            console.log("real", tripId, real);
            return (
              <li value={tripId} key={tripId}>
                <button
                  type="button"
                  onClick={() => handleSelectedTrip(tripId)}
                  className="flex w-full cursor-pointer justify-between border-b border-gray-200 px-4 py-2 
                text-start font-medium hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-700 dark:border-gray-600 
                dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500"
                >
                  <span className="flex-1">
                    <b className="text-lg">{route?.routeShortName}</b>
                    {" towards "}
                    {tripsById.get(tripId)?.tripHeadsign}
                  </span>
                  <span className="flex-1">{departureTime}</span>
                </button>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default TripSelect;
