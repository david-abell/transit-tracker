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

  let arrivalText = "";

  if (!!pickupArrivalTime && isPastArrivalTime(pickupArrivalTime)) {
    arrivalText = "Departed @ " + pickupArrivalTime;
  } else if (!!pickupArrivalTime) {
    arrivalText = pickupArrivalTime;
  }

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
    !!dropOffArrivalTime && isPastArrivalTime(dropOffArrivalTime);

  const isPastDropOff =
    !!pickupArrivalTime && isPastArrivalTime(pickupArrivalTime);

  return (
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto bg-gray-50 p-4 dark:border-gray-700 lg:px-10">
      <table className="w-full table-auto text-left text-sm text-gray-500 dark:text-gray-400">
        <thead className="bg-gray-50 uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th className="p-2">Route</th>
            {/* <th className="p-2">Heading towards</th> */}
            <th className="p-2">Pickup stop</th>
            <th className="p-2">Scheduled pickup</th>
            <th className="p-2">Realtime pickup</th>
            <th className="p-2">Drop-off stop</th>
            <th className="p-2">Scheduled drop-off</th>
            <th className="p-2">Delay</th>
            <th className="p-2">Realtime drop-off</th>
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
              {!!pickupStopTime?.arrivalTime &&
                (isPastPickup ? (
                  <p className="whitespace-break-spaces">
                    <span>Departed @ </span>
                    <time dateTime={pickupStopTime.arrivalTime}>
                      {pickupStopTime.arrivalTime}
                    </time>
                  </p>
                ) : (
                  <time dateTime={pickupStopTime.arrivalTime}>
                    {pickupStopTime.arrivalTime}
                  </time>
                ))}
            </td>
            <td className="px-2 py-4">
              {isPastPickup ? (
                arrivalText
              ) : (
                <time dateTime={arrivalText}>{arrivalText}</time>
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
              {!!dropOffStopTime?.arrivalTime && (
                <time dateTime={dropOffStopTime.arrivalTime}>
                  {dropOffStopTime.arrivalTime}
                </time>
              )}
            </td>
            <td className="px-2 py-4">
              {pickupDelay && <span>{pickupDelay}</span>}
            </td>
            <td className="px-2 py-4">
              <>
                {isPastDropOff && "Arrived @ "}
                {!!realtimeDropOffArrivalTime && (
                  <time dateTime={realtimeDropOffArrivalTime}>
                    {realtimeDropOffArrivalTime}
                  </time>
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
