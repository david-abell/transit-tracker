import { Popup } from "react-leaflet";
import { useMemo } from "react";
import { Icon } from "leaflet";
import { NTAVehicleUpdate } from "@/pages/api/gtfs/vehicle-updates";
import { Route } from "@prisma/client";
import LiveText from "../LiveText";
import { timeSinceLastVehicleUpdate } from "@/lib/timeHelpers";
import { Button } from "../ui/button";
import { TripHandler } from "@/pages";
import DotOrSVG from "./DotOrSVG";

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

  if (!route || !route.routeShortName || !route.routeLongName) return null;

  const { routeShortName, routeLongName } = route;
  const color = scheduleRelationship === "ADDED" ? "red" : "green";
  const { latitude, longitude } = vehicle.position;
  const names = routeLongName?.split("-");
  const destination = directionId ? names[0] : names.toReversed()[0];
  return (
    <DotOrSVG
      position={[latitude, longitude]}
      color={color}
      textContent={routeShortName}
      zoom={zoom}
    >
      <Popup interactive className="gps-bus-popup !max-w-60 !text-wrap">
        <p>
          <b>{routeShortName}</b> to {destination}
        </p>
        <p className="whitespace-nowrap">
          <LiveText
            content={() => timeSinceLastVehicleUpdate(vehicle.timestamp)}
            delayInSeconds={10}
          />{" "}
          ago
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
