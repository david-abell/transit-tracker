import { Popup } from "react-leaflet";
import { useCallback, useMemo, useState } from "react";
import { NTAVehicleUpdate } from "@/pages/api/gtfs/vehicle-updates";
import { Route } from "@prisma/client";
import LiveText from "../LiveText";
import {
  secondsSinceVehicleUpdate,
  timeSinceLastVehicleUpdate,
} from "@/lib/timeHelpers";
import { Button } from "../ui/button";
import { TripHandler } from "@/pages";
import DotOrSVG from "./DotOrSVG";
import { useInterval } from "usehooks-ts";

type Props = {
  handleTrip: TripHandler;
  routesById: Map<string, Route>;
  vehicle: NTAVehicleUpdate;
  zoom: number;
};

function GPSGhost({ handleTrip, routesById, vehicle, zoom }: Props) {
  const {
    directionId,
    scheduleRelationship,
    startDate,
    startTime,
    tripId,
    routeId,
  } = vehicle.trip;
  const route = useMemo(() => routesById.get(routeId), [routeId, routesById]);

  const [colorScaleValue, setColorScaleValue] = useState(
    getScaledColor(vehicle.timestamp),
  );

  useInterval(() => {
    if (vehicle.timestamp) {
      setColorScaleValue(getScaledColor(vehicle.timestamp));
    }
  }, 5_000);

  const handleContentUpdate = useCallback(() => {
    const time = timeSinceLastVehicleUpdate(vehicle.timestamp);
    if (!time) {
      console.log(vehicle.timestamp);
      return "";
    }
    return time + " ago";
  }, [vehicle.timestamp]);

  if (!route || !route.routeShortName || !route.routeLongName) return null;

  const { routeShortName, routeLongName } = route;
  const { latitude, longitude } = vehicle.position;
  const names = routeLongName?.split("-");
  const destination = directionId ? names[0] : names.toReversed()[0];

  return (
    <DotOrSVG
      position={[latitude, longitude]}
      color={colorScaleValue}
      textContent={routeShortName}
      zoom={zoom}
    >
      <Popup interactive className="gps-bus-popup !max-w-60 !text-wrap">
        <p>
          <b>{routeShortName}</b> to {destination}
        </p>
        <p className="whitespace-nowrap">
          <LiveText content={handleContentUpdate} delayInSeconds={1} />
        </p>
        {scheduleRelationship === "ADDED" && (
          <p className="pb-2">
            This vehicle schedule has changed and its current trip cannot yet be
            predicted. It could be replacing a canceled trip or passing a
            delayed bus.
          </p>
        )}

        <Button
          className="w-auto mx-auto block"
          disabled={scheduleRelationship === "ADDED"}
          onClick={() =>
            handleTrip({
              tripId: tripId || "",
              newRouteId: routeId,
              from: [latitude, longitude],
            })
          }
        >
          Select bus
        </Button>
      </Popup>
    </DotOrSVG>
  );
}

export default GPSGhost;

const MAX_SCALE_SECONDS = 420;

// use rgb since no encoding is necessary when creating svg url string
const COLORS = [
  "rgb(6, 156, 86)",
  "rgb(255, 195, 14)",
  "rgb(255, 152, 14)",
  "rgb(255, 110, 37)",
  "rgb(211, 33, 44)",
  "rgb(138, 4, 153)",
  "black",
];

function getScaledColor(vehicleTimestamp: string) {
  const seconds = secondsSinceVehicleUpdate(vehicleTimestamp);
  const colorIndex = Math.floor(
    COLORS.length *
      (Math.min(seconds || 0, MAX_SCALE_SECONDS - 1) / MAX_SCALE_SECONDS),
  );

  return COLORS[colorIndex];
}
