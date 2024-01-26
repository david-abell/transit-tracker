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
    isLoading: isLoadingLastStop,
  } = useStopId(lastStopId, true);

  const displayStop = destination ?? lastStop;

  const pickupStopTime = stopTimes?.find(
    ({ stopId }) => stopId === stop?.stopId
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
    [tripUpdatesByTripId, trip]
  );

  const tripStatus = getTripStatus(
    trip,
    stopTimes,
    stopTimeUpdates,
    stop?.stopId,
    destination?.stopId
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

  const pickupDelayStatus = getDelayStatus(closestPickupStopUpdate);

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

  const dropOffDelayStatus = getDelayStatus(closestDropOffStopUpdate);

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
    <div className="absolute bottom-0 z-[1000] mx-auto min-h-[6rem] w-full overflow-x-auto p-4 lg:max-w-7xl lg:px-10">
      <div className="rounded-lg bg-gray-50 p-4 text-slate-950 dark:bg-gray-800 dark:text-white">
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className="[&>svg]:h-[28px] [&>svg]:w-[28px] py-0 no-underline">
              {
                <div className="flex w-full flex-row content-center justify-between gap-4 overflow-hidden pl-2 pr-4 text-left font-normal">
                  <span>
                    {route?.routeShortName ? (
                      <b>{route.routeShortName} </b>
                    ) : (
                      "No route selected"
                    )}
                    <span className="max-lg:hidden">
                      {route?.routeLongName ?? ""}
                    </span>
                    {!!trip && <> - towards {trip.tripHeadsign}</>}
                  </span>
                  <span>Status: {tripStatus}</span>
                  <span>
                    {pickupDelayStatus ? pickupDelayStatus + ": " : ""}
                    {pickupDelay ?? ""}
                  </span>
                </div>
              }
            </AccordionTrigger>
            <AccordionContent className="last:pb-0">
              <div className="grid-rows-[3rem 1fr] mt-4 grid w-full grid-cols-1 overflow-hidden rounded-lg bg-gray-50 text-left text-sm text-gray-950 dark:bg-gray-700 dark:text-gray-50 lg:grid-cols-2">
                <div className="grid grid-cols-3 grid-rows-[minmax(0,_3rem)_1fr] gap-x-2">
                  {/* Pickup Headers */}
                  <div className="col-span-3 grid grid-cols-3 grid-rows-subgrid items-center gap-2  bg-gray-200 p-2 uppercase text-gray-950 dark:bg-gray-700 dark:text-gray-50">
                    {/* <span className="col-span-2 p-2">Route</span> */}
                    <span>Journey start</span>
                    <span>Scheduled</span>
                    <span>Realtime</span>
                  </div>

                  {/* Pickup Data */}
                  <div className="col-span-3 grid grid-cols-3 grid-rows-subgrid gap-2 whitespace-break-spaces bg-white p-2 text-gray-900  dark:bg-gray-800 dark:text-white">
                    <span>
                      {!!displayStop && (
                        <p>
                          <b>
                            {displayStop.stopCode || displayStop.stopId || ""}
                          </b>{" "}
                          {displayStop.stopName || displayStop.stopName || ""}
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
                  <div className="col-span-3 grid grid-cols-3 grid-rows-subgrid items-center gap-2 bg-gray-200 p-2 uppercase text-gray-950 dark:bg-gray-700 dark:text-gray-50 ">
                    <span>Destination</span>
                    <span>Scheduled</span>
                    {/* <span className="p-2">Delay</span> */}
                    <span>Realtime</span>
                  </div>

                  {/* Destination data */}
                  <div className="col-span-3 grid grid-cols-3 grid-rows-subgrid gap-2 whitespace-break-spaces bg-white p-2 text-gray-900 dark:bg-gray-800 dark:text-white">
                    <span>
                      {!!displayStop && (
                        <p>
                          <b>{displayStop.stopCode ?? displayStop.stopId}</b>{" "}
                          {displayStop.stopName}
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
