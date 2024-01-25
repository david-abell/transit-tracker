import {
  formatDelay,
  getDelayedTime,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Route, Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useState } from "react";
import { useInterval } from "usehooks-ts";

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
  // Rerender interval to arrival estimates
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 15000);

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
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto p-4 dark:border-gray-700 lg:max-w-7xl lg:px-10">
      <div className="rounded-lg bg-gray-50 p-4">
        <header className="flex flex-row justify-between overflow-hidden bg-gray-50 p-4 pt-0 text-center">
          {!!route && (
            <h3>
              {route.routeShortName} {route.routeLongName}
              {!!trip && <> towards {trip.tripHeadsign}</>}
            </h3>
          )}
          {pickupDelay ? <span>Delayed - {pickupDelay}</span> : "On time"}
        </header>
        <div className="grid-rows-[16rem 1fr] grid w-full grid-cols-1 overflow-hidden rounded-lg bg-gray-50 text-left text-sm text-gray-950 dark:bg-gray-700 dark:text-gray-50 lg:grid-cols-2">
          <div className="grid grid-cols-3 grid-rows-[minmax(0,_4rem)_1fr] gap-1">
            {/* Pickup Headers */}
            <div className="grid-rows-subgrid col-span-3 grid grid-cols-3 items-center gap-1  bg-gray-200 p-2 uppercase text-gray-950 dark:bg-gray-700 dark:text-gray-50">
              {/* <span className="col-span-2 p-2">Route</span> */}
              <span className="p-2">Journey start</span>
              <span className="p-2">Scheduled pickup</span>
              <span className="p-2">Realtime arrival</span>
            </div>

            {/* Pickup Data */}
            <div className="grid-rows-subgrid col-span-3 grid grid-cols-3 gap-1 whitespace-break-spaces border-b bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
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
            </div>
          </div>

          <div className="grid grid-cols-3 grid-rows-[minmax(0,_4rem)_1fr] gap-1">
            {/* Destination Headers */}
            <div className="grid-rows-subgrid col-span-3 grid grid-cols-3 items-center gap-1 bg-gray-200 p-2 uppercase text-gray-950 dark:bg-gray-700 dark:text-gray-50 ">
              <span className="p-2">Destination</span>
              <span className="p-2">Scheduled arrival</span>
              {/* <span className="p-2">Delay</span> */}
              <span className="p-2">Estimated arrival</span>
            </div>

            {/* Destination data */}
            <div className="grid-rows-subgrid col-span-3 grid grid-cols-3 gap-1 whitespace-break-spaces border-b bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
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
                  <time dateTime={dropOffArrivalTime}>
                    {dropOffArrivalTime}
                  </time>
                )}
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
      </div>
    </div>
  );
}

export default Footer;
