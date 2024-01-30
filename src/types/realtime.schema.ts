import { z } from "zod";

export const occupancySchema = z.enum([
  "EMPTY",
  "MANY_SEATS_AVAILABLE",
  "FEW_SEATS_AVAILABLE",
  "STANDING_ROOM_ONLY",
  "CRUSHED_STANDING_ROOM_ONLY",
  "FULL",
  "NOT_ACCEPTING_PASSENGERS",
  "NO_DATA_AVAILABLE",
  "NOT_BOARDABLE",
]);

export const congestionSchema = z.enum([
  "UNKNOWN_CONGESTION_LEVEL",
  "RUNNING_SMOOTHLY",
  "STOP_AND_GO",
  "CONGESTION",
  "SEVERE_CONGESTION",
]);

export const scheduleRelationshipSchema = z.enum([
  "ADDED",
  "CANCELED",
  "DELETED",
  "DUPLICATED",
  "NO_DATA",
  "SCHEDULED",
  "SKIPPED",
  "UNSCHEDULED",
]);

export const timeSchema = z.object({
  uncertainty: z.coerce.number().optional(),
  delay: z.coerce.number().optional(),
  time: z.coerce.number().optional(),
});

export const realTimeTripSchema = z.object({
  tripId: z.string().optional(),
  startTime: z.string(),
  startDate: z.string(),
  scheduleRelationship: scheduleRelationshipSchema,
  routeId: z.string(),
  directionId: z.number(),
});

export const vehicleSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  licensePlate: z.string().optional(),
});

export const stopTimeUpdateSchema = z.object({
  stopSequence: z.number(),
  arrival: timeSchema.optional(),
  departure: timeSchema.optional(),
  // should not be optional...
  stopId: z.string().optional(),
  scheduleRelationship: scheduleRelationshipSchema.optional(),
});

export const tripUpdateSchema = z.object({
  trip: realTimeTripSchema,
  stopTimeUpdate: z.array(stopTimeUpdateSchema).optional(),
  vehicle: vehicleSchema.optional(),
  timestamp: z.coerce.number(),
  delay: z.number().optional(),
});

export const vehicleUpdateSchema = z.object({
  trip: realTimeTripSchema,
  position: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      bearing: z.string(),
      odometer: z.number(),
      speed: z.number(),
    })
    .optional(),
  occupancyStatus: occupancySchema.optional(),
  vehicle: vehicleSchema,
  timestamp: z.number(),
});

export const activePeriodSchema = z.object({
  start: z.number().optional(),
  end: z.number().optional(),
});

export const tripDescriptorSchema = z.object({
  tripId: z.string(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

export const informedEntityRouteSchema = z.object({
  agencyTd: z.string().optional(),
  routeTd: z.string().optional(),
  routeType: z.number().optional(),
});

export const informedEntityTripSchema = z.object({
  agencyId: z.string().optional(),
  trip: tripDescriptorSchema.optional(),
});

export const informedEntityStopSchema = z.object({
  agencyId: z.string().optional(),
  stopId: z.string().optional(),
});

export const causeSchema = z.enum([
  "UNKNOWN_CAUSE",
  "OTHER_CAUSE",
  "TECHNICAL_PROBLEM",
  "STRIKE",
  "DEMONSTRATION",
  "ACCIDENT",
  "HOLIDAY",
  "WEATHER",
  "MAINTENANCE",
  "CONSTRUCTION",
  "POLICE_ACTIVITY",
  "MEDICAL_EMERGENCY",
]);

export const effectSchema = z.enum([
  "NO_SERVICE",
  "REDUCED_SERVICE",
  "SIGNIFICANT_DELAYS",
  "DETOUR",
  "ADDITIONAL_SERVICE",
  "MODIFIED_SERVICE",
  "OTHER_EFFECT",
  "UNKNOWN_EFFECT",
  "STOP_MOVED",
]);

export const translatedStringSchema = z.object({
  text: z.string(),
  language: z.string(),
});

export const alertSchema = z.object({
  activePeriod: activePeriodSchema,
  informedEntity: z.array(
    z.union([
      informedEntityRouteSchema,
      informedEntityTripSchema,
      informedEntityStopSchema,
    ]),
  ),
  cause: causeSchema,
  effect: effectSchema,
  url: z.string(),
  translatedString: translatedStringSchema,
});

export const entitySchema = z.object({
  id: z.string(),
  isDeleted: z.boolean().optional(),
  tripUpdate: tripUpdateSchema.optional(),
  vehicle: vehicleUpdateSchema.optional(),
  alert: alertSchema.optional(),
});

export const GTFSResponseSchema = z.object({
  header: z.object({
    timestamp: z.coerce.number(),
    gtfsRealtimeVersion: z.string(),
    incrementality: z.string(),
  }),
  entity: z.array(entitySchema),
});

export const GTFSRealtimeSchema = z.object({
  status: z.string(),
  response: GTFSResponseSchema,
});
