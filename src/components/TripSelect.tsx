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
  if (stopStopTimes.length >= 2) {
    return (
      <div>
        <label htmlFor="trip-select">
          Pick a trip
          <select
            className="w-36"
            onChange={({ currentTarget }) =>
              setSelectedTripId(currentTarget.value)
            }
            id="trip-select"
          >
            {stopStopTimes.map(({ tripId, departureTime }) => (
              <option value={tripId} key={tripId}>
                {tripsById.get(tripId)?.tripHeadsign}: {departureTime}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div>
      <span>Selected trip: </span>
      <span>
        {tripsById.get(stopStopTimes?.[0]?.tripId)?.tripHeadsign || ""}
      </span>
    </div>
  );
}

export default TripSelect;
