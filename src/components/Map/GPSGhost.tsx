import { CircleMarker, Tooltip, Popup } from "react-leaflet";
import { memo } from "react";
import isEqual from "react-fast-compare";
import { Icon } from "leaflet";
import { NTAVehicleUpdate } from "@/pages/api/gtfs/vehicle-updates";
import { Route } from "@prisma/client";
import LiveText from "../LiveText";
import { timeSinceLastVehicleUpdate } from "@/lib/timeHelpers";
import { Button } from "../ui/button";
import { TripHandler } from "@/pages";

type Props = {
  handleTrip: TripHandler;
  routesById: Map<string, Route>;
  vehicle: NTAVehicleUpdate;
  zoom: number;
};

const GPSGhost = memo(function GPSGhost({
  handleTrip,
  routesById,
  vehicle,
  zoom,
}: Props) {
  const {
    directionId,
    scheduleRelationship,
    startDate,
    startTime,
    tripId,
    routeId,
  } = vehicle.trip;
  const route = routesById.get(routeId);

  if (!route || !route.routeShortName || !route.routeLongName) return [];

  const { routeShortName, routeLongName } = route;
  const color = scheduleRelationship === "ADDED" ? "red" : "green";
  const { latitude, longitude } = vehicle.position;
  const names = routeLongName?.split("-");
  const destination = directionId ? names[0] : names.toReversed()[0];
  return (
    <CircleMarker
      center={[latitude, longitude]}
      fill
      fillOpacity={100}
      fillColor={color}
      stroke={false}
      radius={5}
    >
      <Popup interactive>
        <p>
          <b>{routeShortName}</b> {routeLongName}
        </p>
        <p>Towards: {destination}</p>
        <p>
          <LiveText
            content={() => timeSinceLastVehicleUpdate(vehicle.timestamp)}
            delayInSeconds={10}
          />{" "}
          ago
        </p>
        {scheduleRelationship === "ADDED" && (
          <p>
            This vehicles schedule has been changed. It could be replacing a
            canceled trip or passing a delayed bus ahead of it.
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
          Select this trip
        </Button>
      </Popup>
      {zoom > 13 && (
        <Tooltip
          direction="right"
          permanent
          interactive
          className="!min-w-10 text-center"
        >
          <b>{routeShortName}</b>
        </Tooltip>
      )}
    </CircleMarker>
  );
}, isEqual);

export default GPSGhost;
