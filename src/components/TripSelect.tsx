import { Route, StopTime, Trip } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

type Props = {
  route: Route;
  stopStopTimes: StopTime[] | undefined;
  handleSelectedTrip: (tripId: string) => void;
  tripsById: Map<string, Trip>;
};

function TripSelect({
  route,
  stopStopTimes = [],
  handleSelectedTrip,
  tripsById,
}: Props) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      <label htmlFor="trip-select" className="sr-only">
        Pick a trip
      </label>
      <ul
        id="trip-select"
        className="flex max-h-96 max-w-full flex-col overflow-y-scroll"
      >
        {stopStopTimes.map(({ tripId, departureTime }) => (
          <li value={tripId} key={tripId}>
            <button
              type="button"
              onClick={() => handleSelectedTrip(tripId)}
              className="flex w-full cursor-pointer justify-between border-b border-gray-200 px-4 py-2 
                text-left font-medium hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-700 dark:border-gray-600 
                dark:hover:bg-gray-600 dark:hover:text-white dark:focus:text-white dark:focus:ring-gray-500"
            >
              <span>
                Route <b>{route?.routeShortName}</b>
                {" towards "}
                {tripsById.get(tripId)?.tripHeadsign}
              </span>
              <span>
                {" Scheduled arrival - "}
                {departureTime}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TripSelect;
