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
import rhumbDistance from "@turf/rhumb-distance";
import { point } from "@turf/helpers";
import equal from "fast-deep-equal/es6";
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
  stopSequence: number;
};

let stopSequenceCounter: number = -1;
let prevStopTimes: Map<StopTime["tripId"], StopTime>;

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

  const arrivals = stopIds
    .flatMap<Arrival>((stopId) => {
      const { stopLat, stopLon } = stopsById.get(stopId) || {};
      if (!stopLat || !stopLon) {
        return [];
      }
      const { arrivalTime, stopSequence } =
        selectedTripStopTimesById.get(stopId) || {};
      if (!arrivalTime || !stopSequence) {
        return [];
      }
      const stopUpdate = stopUpdates?.get(stopId);
      const { arrival: realtimeArrival } = stopUpdate || {};

      return {
        arrivalTime: realtimeArrival?.delay
          ? getDelayedTime(arrivalTime, realtimeArrival.delay)
          : arrivalTime,
        coordinates: { stopLat, stopLon },
        stopSequence,
      };
    })
    .sort((a, b) => a.stopSequence - b.stopSequence);

  if (arrivals.length < 2) return undefined;

  let isNewTrip = false;

  if (!equal(prevStopTimes, selectedTripStopTimesById)) {
    prevStopTimes = selectedTripStopTimesById;
    isNewTrip = true;
  }

  let nextStopIndex = isNewTrip
    ? arrivals.findIndex(({ arrivalTime }) => !isPastArrivalTime(arrivalTime))
    : arrivals.findIndex(
        ({ stopSequence }) => stopSequence === stopSequenceCounter
      );

  if (nextStopIndex === -1) {
    return undefined;
  }

  if (nextStopIndex === 0) {
    nextStopIndex = 1;
  }

  if (isNewTrip) {
    stopSequenceCounter = nextStopIndex;
  }

  const lastStop = arrivals[nextStopIndex - 1];

  const nextStop = arrivals[nextStopIndex];

  if (!lastStop || !nextStop) return undefined;

  const sliced = lineSlice(
    [nextStop.coordinates.stopLat, nextStop.coordinates.stopLon],
    [lastStop.coordinates.stopLat, lastStop.coordinates.stopLon],
    { type: "LineString", coordinates: shape }
  );

  const chunks = lineChunk(sliced, 20, { units: "meters" });

  const nextShapeSlice = chunks.features.flatMap(
    ({ geometry }) => geometry.coordinates
  );

  // Check if slice is correct direction of travel
  const nextStopPoint = point([
    nextStop.coordinates.stopLat,
    nextStop.coordinates.stopLon,
  ]);
  const sliceStart = nextShapeSlice.at(0);
  const sliceEnd = nextShapeSlice.at(-1);

  const sliceStartDistance =
    sliceStart && rhumbDistance(sliceStart, nextStopPoint);
  const sliceEndDistance = sliceEnd && rhumbDistance(sliceEnd, nextStopPoint);
  if (
    sliceStartDistance &&
    sliceEndDistance &&
    sliceStartDistance > sliceEndDistance
  ) {
    nextShapeSlice.reverse();
  }

  const slicePercentage = getPercentageToArrival(
    lastStop.arrivalTime,
    nextStop.arrivalTime
  );

  const sliceIndex =
    nextShapeSlice.length > 0
      ? Math.floor((nextShapeSlice.length - 1) * slicePercentage)
      : 0;

  const vehiclePosition = nextShapeSlice[sliceIndex];

  const nextPosition = nextShapeSlice.at(-1) || vehiclePosition;

  const bearing = getBearing(
    nextPosition as LatLngTuple,
    vehiclePosition as LatLngTuple
  );

  if (sliceIndex <= 0) {
    stopSequenceCounter = stopSequenceCounter + 1;
  }

  return { vehiclePosition: vehiclePosition as LatLngTuple, bearing };
}
