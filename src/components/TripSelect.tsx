import { StopTime, Trip } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

type Props = {
  stopStopTimes: StopTime[] | undefined;
  setSelectedTripId: Dispatch<SetStateAction<string>>;
  tripsById: Map<string, Trip>;
};

function TripSelect({
  stopStopTimes = [],
  setSelectedTripId,
  tripsById,
}: Props) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
      <label htmlFor="trip-select" className="sr-only">
        Pick a trip
      </label>
      <ul id="trip-select" className="max-w-full">
        {stopStopTimes.map(({ tripId, departureTime }) => (
          <li value={tripId} key={tripId}>
            <button
              type="button"
              onClick={() => setSelectedTripId(tripId)}
              className="w-full cursor-pointer border-b border-gray-200 px-4 py-2 text-left font-medium 
                hover:bg-gray-100 hover:text-blue-700 focus:text-blue-700 focus:outline-none focus:ring-2 
                focus:ring-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white 
                dark:focus:text-white dark:focus:ring-gray-500"
            >
              {tripsById.get(tripId)?.tripHeadsign}: {departureTime}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TripSelect;
