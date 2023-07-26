// from gtfs-types https://github.com/k-yle/gtfs-types

export type Occupancy =
  | "EMPTY"
  | "MANY_SEATS_AVAILABLE"
  | "FEW_SEATS_AVAILABLE"
  | "STANDING_ROOM_ONLY"
  | "CRUSHED_STANDING_ROOM_ONLY"
  | "FULL"
  | "NOT_ACCEPTING_PASSENGERS"
  | "NO_DATA_AVAILABLE"
  | "NOT_BOARDABLE";

export type Congestion =
  | "UNKNOWN_CONGESTION_LEVEL"
  | "RUNNING_SMOOTHLY"
  | "STOP_AND_GO"
  | "CONGESTION"
  | "SEVERE_CONGESTION";

export type ScheduleRelationship =
  | "ADDED"
  | "CANCELED"
  | "DELETED"
  | "DUPLICATED"
  | "NO_DATA"
  | "SCHEDULED"
  | "SKIPPED"
  | "UNSCHEDULED";

export interface Time {
  time?: number;
  delay?: number;
  uncertainty?: number;
}

export interface RealTimeTrip {
  // @tripId - undefined when scheduleRelationship == "ADDED"
  tripId?: string;
  startTime: string;
  startDate: string;
  scheduleRelationship: ScheduleRelationship;
  routeId: string;
  directionId: number;
}

export interface Vehicle {
  id: string;
  label?: string;
  licensePlate?: string;
}

export interface StopTimeUpdate {
  stopSequence: number;
  arrival?: Time;
  departure?: Time;
  // @stopId - undefined when scheduledRelationship == "SKIPPED"
  stopId?: string;
  // @scheduleRelationship - undefined when Trip.scheduledRelationship == "ADDED" | "CANCELED"
  scheduleRelationship?: ScheduleRelationship;
}

export interface TripUpdate {
  trip: RealTimeTrip;
  stopTimeUpdate?: StopTimeUpdate[];
  vehicle?: Vehicle;
  timestamp: number;
  delay?: number;
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
  occupancyStatus?: Occupancy;
  vehicle: Vehicle;
  timestamp: number;
}

export type Entity = {
  id: string;
  isDeleted?: boolean;
  tripUpdate?: TripUpdate;
  vehicle?: VehicleUpdate;
  alert?: Alert;
};

export interface ActivePeriod {
  start?: number;
  end?: number;
}

export interface TripDescriptor {
  tripId: string;
  startTime?: string;
  endTime?: string;
}

export interface InformedEntityRoute {
  agencyTd?: string;
  routeTd?: string;
  routeType?: number;
}

export interface InformedEntityTrip {
  agencyId?: string;
  trip?: TripDescriptor;
}

export interface InformedEntityStop {
  agencyId?: string;
  stopId?: string;
}

export type Cause =
  | "UNKNOWN_CAUSE"
  | "OTHER_CAUSE"
  | "TECHNICAL_PROBLEM"
  | "STRIKE"
  | "DEMONSTRATION"
  | "ACCIDENT"
  | "HOLIDAY"
  | "WEATHER"
  | "MAINTENANCE"
  | "CONSTRUCTION"
  | "POLICE_ACTIVITY"
  | "MEDICAL_EMERGENCY";

export type Effect =
  | "NO_SERVICE"
  | "REDUCED_SERVICE"
  | "SIGNIFICANT_DELAYS"
  | "DETOUR"
  | "ADDITIONAL_SERVICE"
  | "MODIFIED_SERVICE"
  | "OTHER_EFFECT"
  | "UNKNOWN_EFFECT"
  | "STOP_MOVED";

export interface TranslatedString {
  text: string;
  language: string;
}

export interface Alert {
  activePeriod: ActivePeriod;
  informedEntity: Array<
    InformedEntityRoute | InformedEntityTrip | InformedEntityStop
  >;
  cause: Cause;
  effect: Effect;
  url: string;
  translatedString: TranslatedString;
}

export interface GTFSResponse {
  header: {
    timestamp: number;
    gtfsRealtimeVersion: string;
    incrementality: string;
  };
  entity: Entity[];
}

export interface GTFSRealtime {
  status: string;
  response: GTFSResponse;
}
