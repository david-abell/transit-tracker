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
