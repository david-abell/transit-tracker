import {
  getDelayedTime,
  getPercentageToArrival,
  isPastArrivalTime,
} from "@/lib/timeHelpers";
import { Stop, StopTime } from "@prisma/client";
import lineSlice from "@turf/line-slice";
import lineChunk from "@turf/line-chunk";
import { LatLngTuple } from "leaflet";
import { StopTimeUpdate } from "@/types/realtime";
/* 
‘L’ be the longitude,
‘θ’ be latitude,
‘β‘ be Bearing.

Bearing from point A to B, can be calculated as,

β = atan2(X,Y),

where, X and Y are two quantities and can be calculated as:

X = cos θb * sin ∆L
Y = cos θa * sin θb – sin θa * cos θb * cos ∆L 

Formula from https://www.igismap.com/formula-to-find-bearing-or-heading-angle-between-two-points-latitude-longitude/
*/

function toRadians(degree: number) {
  return (degree * Math.PI) / 180;
}

function toDegrees(radian: number) {
  return (radian * 180) / Math.PI;
}

export function getBearing(
  cooridinateStart: LatLngTuple,
  cooridinateEnd: LatLngTuple
) {
  const latStart = toRadians(cooridinateStart[0]);
  const latEnd = toRadians(cooridinateEnd[0]);
  const lonStart = toRadians(cooridinateStart[1]);
  const lonEnd = toRadians(cooridinateEnd[1]);

  const deltaLon = lonEnd - lonStart;

  const y = Math.cos(latEnd) * Math.sin(deltaLon);

  const x =
    Math.cos(latStart) * Math.sin(latEnd) -
    Math.sin(latStart) * Math.cos(latEnd) * Math.cos(deltaLon);

  const bearing = toDegrees(Math.atan2(y, x));

  return bearing >= 180 ? bearing - 360 : bearing;
}

type Arrival = {
  arrivalTime: string;
  coordinates: {
    stopLat: number;
    stopLon: number;
  };
};

export function getVehiclePosition({
  stopIds,
  shape,
  selectedTripStopTimesById,
  stopsById,
  stopUpdates,
}: {
  stopIds: string[];
  shape: LatLngTuple[] | undefined;
  selectedTripStopTimesById: Map<StopTime["tripId"], StopTime>;
  stopsById: Map<string, Stop>;
  stopUpdates: Map<string, StopTimeUpdate>;
}) {
  if (!shape || shape.length < 1) return undefined;

  const arrivals = stopIds.flatMap<Arrival>((stopId) => {
    const { stopLat, stopLon } = stopsById.get(stopId) || {};
    if (!stopLat || !stopLon) {
      return [];
    }
    const { arrivalTime } = selectedTripStopTimesById.get(stopId) || {};
    if (!arrivalTime) {
      return [];
    }
    const stopUpdate = stopUpdates?.get(stopId);
    const { arrival: realtimeArrival } = stopUpdate || {};

    return {
      arrivalTime: realtimeArrival?.delay
        ? getDelayedTime(arrivalTime, realtimeArrival.delay)
        : arrivalTime,
      coordinates: { stopLat, stopLon },
    };
  });

  if (!arrivals.length) return undefined;

  const nextStopIndex =
    arrivals.length &&
    arrivals.findIndex(({ arrivalTime }) => !isPastArrivalTime(arrivalTime));

  const lastStop =
    nextStopIndex > 0 ? arrivals[nextStopIndex - 1] : arrivals[0];

  const nextStop = arrivals[nextStopIndex];

  if (!lastStop || !nextStop) return undefined;

  const bearing = getBearing(
    [lastStop.coordinates.stopLat, lastStop.coordinates.stopLon],
    [nextStop.coordinates.stopLat, nextStop.coordinates.stopLon]
  );

  const sliced = lineSlice(
    [nextStop.coordinates.stopLat, nextStop.coordinates.stopLon],
    [lastStop.coordinates.stopLat, lastStop.coordinates.stopLon],
    { type: "LineString", coordinates: shape }
  );

  const chunks = lineChunk(sliced, 20, { units: "meters" });

  const nextShapeSlice = chunks.features
    .flatMap(({ geometry }) => geometry.coordinates)
    .reverse();

  const slicePercentage = getPercentageToArrival(
    lastStop.arrivalTime,
    nextStop?.arrivalTime
  );

  const sliceIndex =
    nextShapeSlice.length > 0
      ? Math.floor((nextShapeSlice.length - 1) * slicePercentage)
      : 0;

  const vehiclePosition = nextShapeSlice[sliceIndex];

  return { vehiclePosition: vehiclePosition as LatLngTuple, bearing };
}
