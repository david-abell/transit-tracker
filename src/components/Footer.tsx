import {
  formatReadableDelay,
  getDelayStatus,
  getDelayedTime,
  getDifferenceInSeconds,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { StopTimeUpdate, TripUpdate } from "@/types/realtime";
import { Route, Stop, StopTime, Trip } from "@prisma/client";
import { useCallback, useMemo, useState } from "react";
import { useInterval } from "usehooks-ts";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import useStopId from "@/hooks/useStopId";
import TripTimeline from "./TripTimeline/TripTimeline";
import { LatLngTuple } from "leaflet";
import { StopAndStopTime } from "./DestinationSelect";
import { parseAsString, useQueryState } from "nuqs";
import StopModal from "./StopModal";
import { ValidStop } from "./Map/MapContentLayer";
import {
  getAdjustedStopTimes,
  getOrderedStops,
  getStopsToDestination,
  getStopsWithStopTimes,
  getUpcomingOrderedStops,
  isValidStop,
} from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type Props = {
  destination?: Stop;
  destinationStops: StopAndStopTime[];
  handleDestinationStop: (stopId: string) => void;
  handleMapCenter: (latLon: LatLngTuple) => void;
  handleSelectedStop: (stopId: string, showModal?: boolean) => void;
  route?: Route;
  stop?: Stop;
  stops: Stop[] | undefined;
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
  destination,
  destinationStops,
  handleDestinationStop,
  handleSelectedStop,
  handleMapCenter,
  trip,
  stop,
  stops,
  route,
  stopsById,
  stopTimes,
  tripUpdatesByTripId,
}: Props) {
  // Rerender interval to arrival estimates
  const [count, setCount] = useState<number>(0);
  useInterval(() => {
    setCount(count + 1);
  }, 1000);
  const [snapPoints, setSnapPoints] =
    useState<(string | number)[]>(defaultSnapPoints);

  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const onCloseSelectDialog = useCallback(() => setShowSelectDialog(false), []);

  const [snap, setSnap] = useState<number | string>(defaultSnapPoints[0]);

  const [stopId, setStopId] = useQueryState("stopId", { history: "push" });
  const [destId, setDestId] = useQueryState(
    "destId",
    parseAsString.withDefault("").withOptions({ history: "push" }),
  );
  const [tripId, setTripId] = useQueryState("tripId", { history: "push" });

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

  // const pickupDelay = formatReadableDelay(
  //   pickupStopUpdate?.arrival?.delay || pickupStopUpdate?.departure?.delay,
  // );

  const dropOffStopUpdate =
    (dropOffStopSequence &&
      stopTimeUpdates?.find(
        ({ stopSequence }) => stopSequence >= dropOffStopSequence,
      )) ||
    lastStopTimeUpdate;

  const dropOffDelayStatus = getDelayStatus(dropOffStopUpdate);

  // const dropOffDelay = formatReadableDelay(
  //   dropOffStopUpdate?.arrival?.delay || dropOffStopUpdate?.departure?.delay,
  // );

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

  const adjustedStopTimes = useMemo(
    () => getAdjustedStopTimes(stopTimes, stopTimeUpdates),
    [stopTimeUpdates, stopTimes],
  );

  const orderdStops = useMemo(
    () => getUpcomingOrderedStops(adjustedStopTimes, stopsById),
    [adjustedStopTimes, stopsById],
  );

  const stopList = useMemo(
    () => getStopsWithStopTimes(stopsById, stopTimes, destId),
    [destId, stopTimes, stopsById],
  );

  const validDestinationStops: ValidStop[] = useMemo(
    () =>
      destinationStops
        ?.map(({ stop }) => stop)
        .filter((stop): stop is ValidStop => isValidStop(stop)),
    [destinationStops],
  );

  // const currentStop = stopList.findIndex(
  //   ({ stopTime }) =>
  //     !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  // );

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
      <DrawerContent className="lg:max-w-7xl mx-auto z-[2000] px-6">
        <DrawerHeader>
          <DrawerTitle className="sr-only">Selected route details</DrawerTitle>
          <div className="[&>svg]:h-[28px] [&>svg]:w-[28px] no-underline">
            {
              <div className="flex w-full flex-col content-center justify-between gap-2 md:gap-4 overflow-hidden px-2 text-left font-normal">
                <h3 className="flex flex-wrap content-center gap-2 ">
                  {
                    <>
                      <b>{route?.routeShortName ?? ""}</b>
                      <span className="max-lg:hidden">
                        {" "}
                        &#9830; {route?.routeLongName ?? "No route selected"}
                      </span>
                    </>
                  }

                  {!!trip && (
                    <>
                      {" "}
                      <ArrowRight className="inline-block" />{" "}
                      {destinationStop?.stopName || trip.tripHeadsign}
                    </>
                  )}
                </h3>

                {!!trip && !!stop && destId && (
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
        {!stopId ? (
          <>
            <Button onClick={() => setShowSelectDialog(true)}>
              Select pickup stop
            </Button>
            <StopModal
              closeHandler={onCloseSelectDialog}
              optionHandler={handleSelectedStop}
              title="Select a pickup stop"
              open={showSelectDialog}
              stops={orderdStops}
            />
          </>
        ) : !destId ? (
          <>
            <Button onClick={() => setShowSelectDialog(true)}>
              Select destination
            </Button>{" "}
            <StopModal
              closeHandler={onCloseSelectDialog}
              optionHandler={handleDestinationStop}
              title="Select a destination"
              open={showSelectDialog}
              stops={validDestinationStops}
            />
          </>
        ) : (
          <TripTimeline
            destinationId={destinationStop?.stopId ?? null}
            handleMapCenter={handleMapCenter}
            pickupStop={stop}
            stopList={stopList}
            trip={trip}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

export default Footer;
