import type { NextApiRequest, NextApiResponse } from "next";

import gtfsRealtime from "@/testdata/gtfsrealtime2.json";
export type GTFSResponse = {
  header: {
    timestamp: number;
    gtfs_realtime_version: string;
    incrementality: number;
  };
  entity: Entity[];
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<GTFSResponse>
) {
  res.status(200).json(gtfsRealtime as GTFSResponse);
}

// stop time update in realtime types is not defined as array...
// copy pasted below for dirty fix

declare interface Time {
  delay: number;
  time: number;
  uncertainty: number;
}

interface RealTimeTrip {
  trip_id: string;
  start_time: string;
  start_date: string;
  schedule_relationship: number;
  route_id: string;
  direction_id: number;
}

export const enum Occupancy {
  EMPTY,
  MANY_SEATS_AVAILABLE,
  FEW_SEATS_AVAILABLE,
  STANDING_ROOM_ONLY,
  CRUSHED_STANDING_ROOM_ONLY,
  FULL,
  NOT_ACCEPTING_PASSENGERS,
  UNKNOWN = -1,
}

export interface VehicleUpdate {
  trip: RealTimeTrip;
  position?: {
    latitude: number;
    longitude: number;
    bearing: string;
    odometer: number;
    speed: number;
  };
  occupancy_status?: Occupancy;
  vehicle: Vehicle;
  timestamp: number;
}

interface Vehicle {
  id: string;
  label: string;
  license_plate: string;
}

interface StopTimeUpdate {
  stop_sequence: number;
  arrival?: Time;
  departure?: Time;
  stop_id: string;
  schedule_relationship: number;
}

export interface TripUpdateHacked {
  trip: RealTimeTrip;
  stop_time_update?: StopTimeUpdate[];
  vehicle: Vehicle;
  timestamp: number;
  delay: number;
}

export interface Entity {
  id: string;
  trip_update?: TripUpdateHacked;
  vehicle?: VehicleUpdate;
  is_deleted: boolean;
}
