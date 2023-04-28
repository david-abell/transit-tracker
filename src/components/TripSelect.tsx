import { StopTime } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";

type Props = {
  stopStopTimes: StopTime[] | undefined;
  setSelectedTripId: Dispatch<SetStateAction<string>>;
};

function TripSelect({ stopStopTimes = [], setSelectedTripId }: Props) {
  if (stopStopTimes.length >= 2) {
    return (
      <div>
        <label htmlFor="trip-select">
          Pick a trip
          <select
            className="w-24"
            onChange={({ currentTarget }) =>
              setSelectedTripId(currentTarget.value)
            }
            id="trip-select"
          >
            {stopStopTimes.map(({ tripId, departureTime }) => (
              <option value={tripId} key={tripId}>
                {tripId}: {departureTime}
              </option>
            ))}
          </select>
        </label>
      </div>
    );
  }

  return (
    <div>
      <span>Selected trip:</span>
      <span>{stopStopTimes?.[0]?.tripId || ""}</span>
    </div>
  );
}

export default TripSelect;
