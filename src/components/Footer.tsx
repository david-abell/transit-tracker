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
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto p-4 dark:border-gray-700 lg:px-10">
      <div className="w-full text-left text-sm">
        <div className="grid grid-cols-9 gap-1 rounded-t-lg bg-gray-50 p-2 uppercase text-gray-950 dark:bg-gray-700 dark:text-gray-50">
          <span className="col-span-2 p-2">Route</span>
          <span className="p-2">Journey start</span>
          <span className="p-2">Scheduled pickup</span>
          <span className="p-2">Realtime arrival</span>
          <span className="p-2">Destination</span>
          <span className="p-2">Scheduled arrival</span>
          <span className="p-2">Delay</span>
          <span className="p-2">Realtime arrival</span>
        </div>
        <div className="grid grid-cols-9 gap-1 whitespace-break-spaces rounded-b-lg border-b bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
          <span className="col-span-2 flex-1 px-2 py-4">
            {!!route && (
              <p>
                <b>{route.routeShortName}</b> {route.routeLongName}
                {!!trip && <> towards {trip.tripHeadsign}</>}
              </p>
            )}
          </span>
          <span className="px-2 py-4">
            {!!stop && (
              <p>
                <b>{stop.stopCode ?? stop.stopId}</b> {stop.stopName}
              </p>
            )}
          </span>
          <span className="px-2 py-4">
            {!!pickupArrivalTime && (
              <time dateTime={pickupArrivalTime}>{pickupArrivalTime}</time>
            )}
          </span>
          <span className="px-2 py-4">
            {!!realtimePickupArrivalTime && (
              <>
                {isPastPickup && "Departed @ "}
                <time dateTime={realtimePickupArrivalTime}>
                  {realtimePickupArrivalTime}
                </time>
              </>
            )}
          </span>
          <span className="px-2 py-4">
            {!!destination && (
              <p>
                <b>{destination.stopCode ?? destination.stopId}</b>{" "}
                {destination.stopName}
              </p>
            )}
          </span>
          <span className="px-2 py-4">
            {!!dropOffArrivalTime && (
              <time dateTime={dropOffArrivalTime}>{dropOffArrivalTime}</time>
            )}
          </span>
          <span className="px-2 py-4">
            {pickupDelay && <span>{pickupDelay}</span>}
          </span>
          <span className="px-2 py-4">
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
          </span>
        </div>
      </div>
    </div>
  );
}

export default Footer;
