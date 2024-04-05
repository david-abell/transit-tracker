import {
  formatDelay,
  getDelayStatus,
  getDelayedTime,
  getTripStatus,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Route, Stop, StopTime, Trip } from "@prisma/client";
import { useMemo, useState } from "react";
import { useInterval } from "usehooks-ts";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import useStopId from "@/hooks/useStopId";

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

  const closestPickupStopUpdate =
    (pickupStopSequence &&
      stopTimeUpdates?.find(
        ({ stopId: stopTimeStopId, stopSequence }) =>
          stop?.stopId === stopTimeStopId ||
          (destination && stopSequence >= pickupStopSequence),
      )) ||
    lastStopTimeUpdate;

  const realtimePickupArrivalTime = getDelayedTime(
    pickupDepartureTime,
    closestPickupStopUpdate?.arrival?.delay ||
      closestPickupStopUpdate?.departure?.delay,
  );

  const pickupDelayStatus = getDelayStatus(closestPickupStopUpdate);

  const pickupDelay = formatDelay(
    closestPickupStopUpdate?.arrival?.delay ||
      closestPickupStopUpdate?.departure?.delay,
  );

  const closestDropOffStopUpdate =
    (dropOffStopSequence &&
      stopTimeUpdates?.find(
        ({ stopId: stopTimeStopId, stopSequence }) =>
          destination?.stopId === stopTimeStopId ||
          (pickupStopSequence && stopSequence >= dropOffStopSequence),
      )) ||
    lastStopTimeUpdate;

  const dropOffDelayStatus = getDelayStatus(closestDropOffStopUpdate);

  const dropOffDelay = formatDelay(
    closestDropOffStopUpdate?.arrival?.delay ||
      closestDropOffStopUpdate?.departure?.delay,
  );

  const realtimeDropOffArrivalTime = getDelayedTime(
    dropOffArrivalTime,
    closestDropOffStopUpdate?.arrival?.delay ||
      closestDropOffStopUpdate?.departure?.delay,
  );

  const isPastPickup =
    !!pickupArrivalTime &&
    isPastArrivalTime(realtimePickupArrivalTime ?? pickupArrivalTime);

  const isPastDropOff =
    !!dropOffArrivalTime &&
    isPastArrivalTime(realtimeDropOffArrivalTime ?? dropOffArrivalTime);

  const tripStatus = getTripStatus(
    trip,
    stopTimes,
    stopTimeUpdates,
    stop?.stopId,
    destination?.stopId,
  );

  return (
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto p-4 lg:max-w-7xl lg:px-10">
      <div className="rounded-lg bg-background/90 p-4">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="[&>svg]:h-[28px] [&>svg]:w-[28px] py-0 no-underline">
              {
                <div className="flex w-full flex-row content-center justify-between gap-4 overflow-hidden pl-2 pr-4 text-left font-normal">
                  <p>
                    {!!route ? (
                      <>
                        <span>Route </span>
                        <b>{route.routeShortName ?? ""}</b>
                        <span className="max-lg:hidden">
                          {" "}
                          &#9830; {route?.routeLongName ?? ""}
                        </span>
                      </>
                    ) : (
                      "No route selected"
                    )}

                    {!!trip && (
                      <> &#9830; heading towards {trip.tripHeadsign}</>
                    )}
                  </p>

                  {tripStatus === "completed" ? (
                    "Completed"
                  ) : isPastPickup ? (
                    <p>
                      <span
                        className={
                          tripStatus === "early"
                            ? "text-green-700"
                            : tripStatus === "delayed"
                              ? "text-red-700 dark:text-red-500"
                              : ""
                        }
                      >
                        {dropOffDelay ?? ""} {dropOffDelayStatus || tripStatus}
                      </span>{" "}
                      to {destinationStop?.stopName}
                    </p>
                  ) : (
                    <p>
                      <span
                        className={
                          tripStatus === "early"
                            ? "text-green-700"
                            : tripStatus === "delayed"
                              ? "text-red-700 dark:text-red-500"
                              : ""
                        }
                      >
                        {pickupDelay ?? ""} {pickupDelayStatus || tripStatus}
                      </span>{" "}
                      to {destinationStop?.stopName}
                    </p>
                  )}
                </div>
              }
            </AccordionTrigger>
            <AccordionContent className="last:pb-0">
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
                          {isPastPickup && "Departed @ "}
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

export default Footer;
