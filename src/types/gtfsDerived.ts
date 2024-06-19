import { Stop, StopTime } from "@prisma/client";
import { StopTimeUpdate } from "./realtime";

export type ValidStop = Stop & {
  stopLat: NonNullable<Stop["stopLat"]>;
  stopLon: NonNullable<Stop["stopLon"]>;
};
export type GroupedTimes = {
  stopTime: StopTime;
  stopTimeUpdate?: StopTimeUpdate;
};
export type StopWithGroupedTimes = { stop: ValidStop; times?: GroupedTimes[] };
export type StopAndStopTime = {
  stop: Stop;
  stopTime: StopTime;
};
export type StopTimeAndUpdate = {
  stopTime: StopTime;
  stopTimeUpdate?: StopTimeUpdate;
};
