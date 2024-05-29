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
import TripTimeline from "./TripTimeline/TripTimeline";
import { LatLngTuple } from "leaflet";

type Props = {
  destination?: Stop;
  handleMapCenter: (latLon: LatLngTuple) => void;
  route?: Route;
  stop?: Stop;
  stopsById: Map<string, Stop>;
  trip?: Trip;
  stopTimes?: StopTime[];
  tripUpdatesByTripId: Map<string, TripUpdate>;
};

const defaultSnapPoints = ["30px"];

for (let i = 5; i <= 100; i += 5) {
  defaultSnapPoints.push(`${i}%`);
}

function Footer({
  handleMapCenter,
  trip,
  stop,
  route,
  stopsById,
  stopTimes,
  destination,
  tripUpdatesByTripId,
}: Props) {
  // Rerender interval to arrival estimates
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);
  const [snapPoints, setSnapPoints] =
    useState<(string | number)[]>(defaultSnapPoints);

  const [snap, setSnap] = useState<number | string>(defaultSnapPoints[0]);

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
      onOpenChange={() => {
        setSnap(snap);
      }}
      snap={snap}
      setSnap={setSnap}
    >
      <DrawerTitle />
      <DrawerContent className="lg:max-w-7xl mx-auto z-[2000]">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Selected route details</DrawerTitle>
          <div className="[&>svg]:h-[28px] [&>svg]:w-[28px] no-underline">
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
        <TripTimeline
          handleMapCenter={handleMapCenter}
          stopsById={stopsById}
          selectedStop={stop}
          stopTimes={stopTimes}
          trip={trip}
          tripUpdatesByTripId={tripUpdatesByTripId}
        />
      </DrawerContent>
    </Drawer>
  );
}

export default Footer;
