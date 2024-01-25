import {
  formatDelay,
  getDelayedTime,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Route, Stop, StopTime, Trip } from "@prisma/client";
import { useMemo } from "react";

type Props = {
  destination?: Stop;
  route?: Route;
  stop?: Stop;
  trip?: Trip;
  stopTimes?: StopTime[];
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

function Footer({
  trip,
  stop,
  route,
  stopTimes,
  destination,
  tripUpdatesByTripId,
}: Props) {
  const pickupStopTime = stopTimes?.find(
    ({ stopId }) => stopId === stop?.stopId
  );
  const dropOffStopTime = stopTimes?.find(
    ({ stopId }) => stopId === destination?.stopId
  );

  const {
    arrivalTime: pickupArrivalTime,
    departureTime: pickupDepartureTime,
    stopSequence: pickupStopSequence,
  } = pickupStopTime || {};

  const { arrivalTime: dropOffArrivalTime, stopSequence: dropOffStopSequence } =
    dropOffStopTime || {};

  // Realtime derived state
  const stopTimeUpdates = useMemo(
    () => trip && tripUpdatesByTripId.get(trip?.tripId)?.stopTimeUpdate,
    [tripUpdatesByTripId, trip]
  );

  const lastStopTimeUpdate = stopTimeUpdates?.at(-1);

  const closestPickupStopUpdate =
    (pickupStopSequence &&
      stopTimeUpdates?.find(
        ({ stopId: stopTimeStopId, stopSequence }) =>
          stop?.stopId === stopTimeStopId ||
          (destination && stopSequence >= pickupStopSequence)
      )) ||
    lastStopTimeUpdate;

  const realtimePickupArrivalTime = getDelayedTime(
    pickupDepartureTime,
    closestPickupStopUpdate?.arrival?.delay ||
      closestPickupStopUpdate?.departure?.delay
  );

  const pickupDelay = formatDelay(
    closestPickupStopUpdate?.arrival?.delay ||
      closestPickupStopUpdate?.departure?.delay
  );

  const closestDropOffStopUpdate =
    (dropOffStopSequence &&
      stopTimeUpdates?.find(
        ({ stopId: stopTimeStopId, stopSequence }) =>
          destination?.stopId === stopTimeStopId ||
          (pickupStopSequence && stopSequence >= dropOffStopSequence)
      )) ||
    lastStopTimeUpdate;

  const realtimeDropOffArrivalTime = getDelayedTime(
    dropOffArrivalTime,
    closestDropOffStopUpdate?.arrival?.delay ||
      closestDropOffStopUpdate?.departure?.delay
  );

  const isPastPickup =
    !!pickupArrivalTime &&
    isPastArrivalTime(realtimePickupArrivalTime ?? pickupArrivalTime);

  const isPastDropOff =
    !!dropOffArrivalTime &&
    isPastArrivalTime(realtimeDropOffArrivalTime ?? dropOffArrivalTime);

  return (
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto bg-gray-50 p-4 dark:border-gray-700 lg:px-10">
      <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="p-2">Route</th>
            {/* <th className="p-2">Heading towards</th> */}
            <th className="p-2">Journey start</th>
            <th className="p-2">Scheduled pickup</th>
            <th className="p-2">Realtime arrival</th>
            <th className="p-2">Destination</th>
            <th className="p-2">Scheduled arrival</th>
            <th className="p-2">Delay</th>
            <th className="p-2">Realtime arrival</th>
          </tr>
        </thead>
        <tbody>
          <tr className="whitespace-nowrap border-b bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            <td className="px-2 py-4">
              {!!route && (
                <p className="whitespace-break-spaces">
                  <b>{route.routeShortName}</b> {route.routeLongName}
                  {!!trip && <>towards {trip.tripHeadsign}</>}
                </p>
              )}
            </td>
            <td className="px-2 py-4">
              {!!stop && (
                <p className="whitespace-break-spaces">
                  <b>{stop.stopCode ?? stop.stopId}</b> {stop.stopName}
                </p>
              )}
            </td>
            <td className="px-2 py-4">
              {!!pickupArrivalTime && (
                <time dateTime={pickupArrivalTime}>{pickupArrivalTime}</time>
              )}
            </td>
            <td className="px-2 py-4">
              {!!realtimePickupArrivalTime && (
                <>
                  {isPastPickup && "Departed @ "}
                  <time dateTime={realtimePickupArrivalTime}>
                    {realtimePickupArrivalTime}
                  </time>
                </>
              )}
            </td>
            <td className="px-2 py-4">
              {!!destination && (
                <p className="whitespace-break-spaces">
                  <b>{destination.stopCode ?? destination.stopId}</b>{" "}
                  {destination.stopName}
                </p>
              )}
            </td>
            <td className="px-2 py-4">
              {!!dropOffArrivalTime && (
                <time dateTime={dropOffArrivalTime}>{dropOffArrivalTime}</time>
              )}
            </td>
            <td className="px-2 py-4">
              {pickupDelay && <span>{pickupDelay}</span>}
            </td>
            <td className="px-2 py-4">
              <>
                {!!realtimeDropOffArrivalTime && (
                  <>
                    {isPastDropOff && "Arrived @ "}
                    <time dateTime={realtimeDropOffArrivalTime}>
                      {realtimeDropOffArrivalTime}
                    </time>
                  </>
                )}
              </>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Footer;
