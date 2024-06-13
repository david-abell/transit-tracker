import {
  formatReadableDelay,
  getArrivalCountdownText,
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
import LiveText, { LiveTextColor } from "./LiveText";

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

  const stopTimeUpdates = useMemo(
    () => trip && tripUpdatesByTripId.get(trip?.tripId)?.stopTimeUpdate,
    [tripUpdatesByTripId, trip],
  );

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

  const pickupStop = useMemo(
    () => stopList.find(({ stop }) => stop.stopId === stopId),
    [stopId, stopList],
  );
  const dropOffStop = useMemo(
    () =>
      stopList.find(({ stop }) => stop.stopId === destId) ?? stopList.at(-1),
    [destId, stopList],
  );
  const nextStop = stopList.find(
    ({ stopTime }) =>
      !!stopTime.arrivalTime && !isPastArrivalTime(stopTime.arrivalTime),
  );

  const isPastDropOff = dropOffStop && !nextStop;

  const handleDelayStatus = useCallback(
    (
      pickup: StopAndStopTime | undefined,
      dropOff: StopAndStopTime | undefined,
      next: StopAndStopTime | undefined,
    ) => {
      if (!pickup || !dropOff || !next) return "";

      const lastUpdate = stopTimeUpdates?.at(-1);
      if (!stopTimeUpdates || !lastUpdate) return "";
      if (lastUpdate.scheduleRelationship === "CANCELED") return "Canceled";

      const currentSequence = next.stopTime.stopSequence;

      if (currentSequence < pickup.stopTime.stopSequence) {
        const stopUpdate =
          stopTimeUpdates?.find(
            ({ stopSequence }) => stopSequence >= pickup.stopTime.stopSequence,
          ) || lastUpdate;

        return `Pickup up ${getDelayStatus(stopUpdate)}`;
      } else if (currentSequence < dropOff.stopTime.stopSequence) {
        const stopUpdate =
          stopTimeUpdates?.find(
            ({ stopSequence }) => stopSequence >= dropOff.stopTime.stopSequence,
          ) || lastUpdate;

        return `Dropping off ${getDelayStatus(stopUpdate)}`;
      } else {
        return "completed";
      }
    },
    [stopTimeUpdates],
  );

  const handleStatusColor = useCallback(
    (textContent: string): LiveTextColor => {
      if (textContent.toLowerCase().includes("canceled")) return "alert";
      if (textContent.toLowerCase().includes("late")) return "caution";
      if (textContent.toLowerCase().includes("early")) return "info";
      return "default";
    },
    [],
  );

  const handleTripCountdown = useCallback(
    (
      pickup: StopAndStopTime | undefined,
      dropOff: StopAndStopTime | undefined,
      next: StopAndStopTime | undefined,
    ) => {
      if (!pickup || !dropOff || !next || !stopTimeUpdates) return "";

      const currentSequence = next.stopTime.stopSequence;

      if (currentSequence < pickup.stopTime.stopSequence) {
        return getArrivalCountdownText(pickup.stopTime);
      } else if (currentSequence < dropOff.stopTime.stopSequence) {
        return getArrivalCountdownText(dropOff.stopTime);
      } else {
        return "";
      }
    },
    [stopTimeUpdates],
  );

  const handleArrivalCountdown = useCallback(
    (stopTime: StopTime) => getArrivalCountdownText(stopTime),
    [],
  );

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
              <div className="flex w-full content-center justify-between gap-2 md:gap-4 overflow-hidden px-2 text-left font-normal">
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
                      {dropOffStop?.stop.stopName || trip.tripHeadsign}
                    </>
                  )}
                </h3>

                {/* Live trip status */}
                <div className="flex gap-2">
                  <LiveText
                    content={() =>
                      handleDelayStatus(pickupStop, dropOffStop, nextStop)
                    }
                    colorFn={handleStatusColor}
                  />
                  <LiveText
                    content={() =>
                      handleTripCountdown(pickupStop, dropOffStop, nextStop)
                    }
                  />
                </div>
              </div>
            }
          </div>

          {/* Next Stop */}
          {!!nextStop && !isPastDropOff && (
            <div>
              <p className="font-bold">Next Stop:</p>
              <div className="flex flex-row justify-between">
                <p>
                  <b>{nextStop.stop.stopCode ?? nextStop.stop.stopId}</b> -{" "}
                  {nextStop.stop.stopName}{" "}
                </p>
                <p>
                  <LiveText
                    content={() => handleArrivalCountdown(nextStop.stopTime)}
                    color="info"
                  />
                </p>
              </div>
            </div>
          )}
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
            destinationId={dropOffStop?.stop.stopId ?? null}
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
