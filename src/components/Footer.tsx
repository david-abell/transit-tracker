import {
  formatReadableDelay,
  getDelayStatus,
  getDelayedTime,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { TripUpdate } from "@/types/realtime";
import { Route, Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useState } from "react";
import { useInterval } from "usehooks-ts";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import useStopId from "@/hooks/useStopId";

type Props = {
  destination?: Stop;
  route?: Route;
  stop?: Stop;
  trip?: Trip;
  stopTimes?: StopTime[];
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

const defaultSnapPoints = [0.03, 0.2, 0.4, 0.6, 0.86, 1];

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
  }, 1000);
  const [snapPoints, setSnapPoints] = useState(defaultSnapPoints);

  const [snap, setSnap] = useState<number | string | null>(
    defaultSnapPoints[0],
  );

  const lastStopId = useMemo(() => {
    if (!!destination) return "";

    return stopTimes?.at(-1)?.stopId ?? "";
  }, [destination, stopTimes]);

  const {
    selectedStop: lastStop,
    error: lastStopError,
    isLoadingStop: isLoadingLastStop,
  } = useStopId(lastStopId, true);

  const destinationStop = destination ?? lastStop;

  const pickupStopTime = stopTimes?.find(
    ({ stopId }) => stopId === stop?.stopId,
  );
  const dropOffStopTime =
    stopTimes?.find(({ stopId }) => stopId === destination?.stopId) ||
    stopTimes?.find(({ stopId }) => stopId === lastStop?.stopId);

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
    [tripUpdatesByTripId, trip],
  );

  const lastStopTimeUpdate = stopTimeUpdates?.at(-1);

  const pickupStopUpdate =
    (pickupStopSequence &&
      stopTimeUpdates?.find(
        ({ stopSequence }) => stopSequence >= pickupStopSequence,
      )) ||
    lastStopTimeUpdate;

  const realtimePickupArrivalTime = getDelayedTime(
    pickupDepartureTime,
    pickupStopUpdate?.arrival?.delay || pickupStopUpdate?.departure?.delay,
  );

  const pickupDelayStatus = getDelayStatus(pickupStopUpdate);

  const pickupDelay = formatReadableDelay(
    pickupStopUpdate?.arrival?.delay || pickupStopUpdate?.departure?.delay,
  );

  const dropOffStopUpdate =
    (dropOffStopSequence &&
      stopTimeUpdates?.find(
        ({ stopSequence }) => stopSequence >= dropOffStopSequence,
      )) ||
    lastStopTimeUpdate;

  const dropOffDelayStatus = getDelayStatus(dropOffStopUpdate);

  const dropOffDelay = formatReadableDelay(
    dropOffStopUpdate?.arrival?.delay || dropOffStopUpdate?.departure?.delay,
  );

  const realtimeDropOffArrivalTime = getDelayedTime(
    dropOffArrivalTime,
    dropOffStopUpdate?.arrival?.delay || dropOffStopUpdate?.departure?.delay,
  );

  const isPastPickup =
    !!pickupArrivalTime &&
    isPastArrivalTime(realtimePickupArrivalTime ?? pickupArrivalTime);

  const isPastDropOff =
    !!dropOffArrivalTime &&
    isPastArrivalTime(realtimeDropOffArrivalTime ?? dropOffArrivalTime);

  const liveTextArrivalTime = isPastPickup
    ? realtimeDropOffArrivalTime || dropOffArrivalTime
    : realtimePickupArrivalTime || pickupArrivalTime;

  const liveTextContent = liveTextArrivalTime
    ? formatReadableDelay(getDifferenceInSeconds(liveTextArrivalTime))
    : "";

  return (
    <Drawer
      open
      modal={false}
      dismissible={false}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      handleOnly
    >
      <DrawerContent className="lg:max-w-7xl mx-auto p-2 z-[2000]">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Selected route details</DrawerTitle>
          <div className="[&>svg]:h-[28px] [&>svg]:w-[28px] py-0 no-underline">
            {
              <div className="flex w-full flex-row content-center justify-between gap-2 md:gap-4 overflow-hidden px-2 text-left font-normal">
                <p>
                  {
                    <>
                      <span>Route </span>
                      <b>{route?.routeShortName ?? ""}</b>
                      <span className="max-lg:hidden">
                        {" "}
                        &#9830; {route?.routeLongName ?? "No route selected"}
                      </span>
                    </>
                  }

                  {!!trip && <> &#9830; heading towards {trip.tripHeadsign}</>}
                </p>

                {!!trip && !!stop && (
                  <p>
                    {isPastDropOff ? (
                      "Completed"
                    ) : isPastPickup ? (
                      <span>
                        Dropping off {dropOffDelayStatus} in{" "}
                        <span
                          className={`whitespace-nowrap ${
                            dropOffDelayStatus === "early"
                              ? "text-green-700 dark:text-green-500"
                              : dropOffDelayStatus === "late"
                                ? "text-red-700 dark:text-red-500"
                                : ""
                          }`}
                        >
                          {liveTextContent ?? ""}
                        </span>
                      </span>
                    ) : (
                      <span>
                        Picking up {pickupDelayStatus} in{" "}
                        <span
                          className={`whitespace-nowrap ${
                            dropOffDelayStatus === "early"
                              ? "text-green-700 dark:text-green-500"
                              : dropOffDelayStatus === "late"
                                ? "text-red-700 dark:text-red-500"
                                : ""
                          }`}
                        >
                          {liveTextContent ?? ""}
                        </span>
                      </span>
                    )}
                  </p>
                )}
              </div>
            }
          </div>
        </DrawerHeader>
        <div className="last:pb-0">
          <div className="grid-rows-[3rem 1fr] dark:bg-gray-700/90 mt-4 grid w-full grid-cols-1 overflow-hidden  rounded-lg text-left text-sm text-gray-950 dark:text-gray-50 lg:grid-cols-2">
            <div className="grid grid-cols-3 grid-rows-[minmax(0,_3rem)_1fr] gap-x-2">
              {/* Pickup Headers */}
              <div className="dark:bg-gray-700/90 col-span-3 grid grid-cols-3 grid-rows-subgrid items-center  gap-2 bg-gray-200/90 p-2 uppercase text-gray-950 dark:text-gray-50">
                {/* <span className="col-span-2 p-2">Route</span> */}
                <span>From</span>
                <span>Scheduled</span>
                <span>Realtime</span>
              </div>

              {/* Pickup Data */}
              <div className="dark:bg-gray-800/90 col-span-3 grid grid-cols-3 grid-rows-subgrid gap-2 whitespace-break-spaces bg-white/90 p-2  text-gray-900 dark:text-white">
                <span>
                  {!!stop?.stopId && (
                    <p>
                      <b>{stop.stopCode || stop.stopId || ""}</b>{" "}
                      {stop.stopName || stop.stopName || ""}
                    </p>
                  )}
                </span>
                <span>
                  {!!pickupArrivalTime && (
                    <time dateTime={pickupArrivalTime}>
                      {pickupArrivalTime}
                    </time>
                  )}
                </span>
                <span>
                  {!!realtimePickupArrivalTime && (
                    <>
                      {isPastPickup && "Arrived @ "}
                      <time dateTime={realtimePickupArrivalTime}>
                        {realtimePickupArrivalTime}
                      </time>
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 grid-rows-[minmax(0,_3rem)_1fr] gap-x-2">
              {/* Destination Headers */}
              <div className="dark:bg-gray-700/90 col-span-3 grid grid-cols-3 grid-rows-subgrid items-center gap-2 bg-gray-200/90 p-2 uppercase text-gray-950 dark:text-gray-50 ">
                <span>To</span>
                <span>Scheduled</span>
                {/* <span className="p-2">Delay</span> */}
                <span>Realtime</span>
              </div>

              {/* Destination data */}
              <div className="dark:bg-gray-800/90 col-span-3 grid grid-cols-3 grid-rows-subgrid gap-2 whitespace-break-spaces bg-white/90 p-2 text-gray-900 dark:text-white">
                <span>
                  {!!destinationStop && (
                    <p>
                      <b>
                        {destinationStop.stopCode ?? destinationStop.stopId}
                      </b>{" "}
                      {destinationStop.stopName}
                    </p>
                  )}
                </span>

                <span>
                  {!!dropOffArrivalTime && (
                    <time dateTime={dropOffArrivalTime}>
                      {dropOffArrivalTime}
                    </time>
                  )}
                </span>

                <span>
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
      </DrawerContent>
    </Drawer>
  );
}

export default Footer;
