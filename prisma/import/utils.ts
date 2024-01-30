// Modified from https://stackoverflow.com/questions/15256290/read-the-last-line-of-a-csv-file-and-extract-one-value

import { open } from "fs/promises";
import { CastingFunction } from "csv-parse/.";
import { SnakeCaseModel } from "../snakeCaseModels";

export async function readLastLine(logPath: string) {
  const newLineCharacters = ["\n", "\r"];
  let line = "";
  const chunkSize = 200; // How many characters to read from the end of file
  let fileHandle;
  let stat;
  try {
    fileHandle = await open(logPath, "r");

    stat = await fileHandle.stat();
    const buf = Buffer.alloc(chunkSize < stat.size ? chunkSize : stat.size);
    const len = buf.length;
    const readLength = stat.size - len;
    const { buffer } = await fileHandle.read(buf, 0, len, readLength);

    for (let i = len - 1; i > -1; i--) {
      const isEndOfLine =
        newLineCharacters.indexOf(String.fromCharCode(buffer[i])) >= 0;
      const isCtrl = buffer[i] < 0x20; // 0-31 are ASCII control characters
      if (isEndOfLine && line.length > 0) {
        break;
      } else if (!isCtrl && !isEndOfLine) {
        line = String.fromCharCode(buffer[i]) + line;
      }
    }
  } catch (err) {
    if (err instanceof Error)
      console.error(
        `Couldn't get previous last modified date for ${logPath} ${err?.message}`,
      );
    throw new Error();
  } finally {
    await fileHandle?.close();
  }

  return line;
}

export function calculateSecondsFromMidnight(time: string | null | undefined) {
  if (!time) return null;

  const split = time.split(":").map((d) => Number.parseInt(d, 10));

  if (
    split.length !== 3 ||
    split[0] === undefined ||
    split[1] === undefined ||
    split[2] === undefined
  ) {
    return null;
  }

  return split[0] * 3600 + split[1] * 60 + split[2];
}

export function padLeadingZeros(time: string | null) {
  if (!time) return null;
  const split = time.split(":").map((d) => String(Number(d)).padStart(2, "0"));
  if (
    split.length !== 3 ||
    split[0] === undefined ||
    split[1] === undefined ||
    split[2] === undefined
  ) {
    return null;
  }

  return split.join(":");
}

export const castCsvValues: CastingFunction = (value, context) => {
  switch (context.column) {
    case "monday":
    case "tuesday":
    case "wednesday":
    case "thursday":
    case "friday":
    case "saturday":
    case "sunday":
    case "start_date":
    case "end_date":
    case "date":
    case "exception_type":
    case "route_type":
    case "shape_pt_lat":
    case "shape_pt_lon":
    case "shape_dist_traveled":
    case "stop_sequence":
    case "pickup_type":
    case "drop_off_type":
    case "timepoint":
    case "stop_lat":
    case "stop_lon":
    case "direction_id":
      return Number(value);

    default:
      return value;
  }
};

function castColumnValue(key: string, value: string | number | null) {
  switch (key) {
    case "monday":
    case "tuesday":
    case "wednesday":
    case "thursday":
    case "friday":
    case "saturday":
    case "sunday":
    case "start_date":
    case "end_date":
    case "date":
    case "exception_type":
    case "route_type":
    case "shape_pt_lat":
    case "shape_pt_lon":
    case "shape_dist_traveled":
    case "stop_sequence":
    case "pickup_type":
    case "drop_off_type":
    case "timepoint":
    case "stop_lat":
    case "stop_lon":
    case "direction_id":
      return Number(value);

    default:
      return value;
  }
}

export function formatLine(
  csvRecord: SnakeCaseModel,
): (string | number | null)[] {
  for (let [key, value] of Object.entries(csvRecord)) {
    value = castColumnValue(key, value);
  }
  if ("agency_name" in csvRecord) {
    return [
      csvRecord.agency_id || null,
      csvRecord.agency_name,
      csvRecord.agency_url,
      csvRecord.agency_timezone,
    ];
  }

  if ("monday" in csvRecord) {
    return [
      csvRecord.service_id,
      csvRecord.monday,
      csvRecord.tuesday,
      csvRecord.wednesday,
      csvRecord.thursday,
      csvRecord.friday,
      csvRecord.saturday,
      csvRecord.sunday,
      csvRecord.start_date,
      csvRecord.end_date,
    ];
  }

  if ("date" in csvRecord) {
    return [
      null,
      csvRecord.service_id,
      csvRecord.date,
      csvRecord.exception_type,
    ];
  }

  if ("route_short_name" in csvRecord) {
    return [
      csvRecord.route_id,
      csvRecord.agency_id || null,
      csvRecord.route_short_name || null,
      csvRecord.route_long_name || null,
      csvRecord.route_type,
    ];
  }

  if ("shape_pt_lat" in csvRecord) {
    return [
      null,
      csvRecord.shape_id,
      csvRecord.shape_pt_lat,
      csvRecord.shape_pt_lon,
      csvRecord.shape_pt_sequence,
      csvRecord.shape_dist_traveled || null,
    ];
  }

  if ("arrival_time" in csvRecord) {
    csvRecord.arrival_time = padLeadingZeros(csvRecord.arrival_time);
    csvRecord.departure_time = padLeadingZeros(csvRecord.departure_time);

    csvRecord.arrival_timestamp = calculateSecondsFromMidnight(
      csvRecord.arrival_time,
    );

    csvRecord.departure_timestamp = calculateSecondsFromMidnight(
      csvRecord.departure_time,
    );

    return [
      null,
      csvRecord.trip_id,
      csvRecord.arrival_time || null,
      csvRecord.arrival_timestamp,
      csvRecord.departure_time || null,
      csvRecord.departure_timestamp,
      csvRecord.stop_id,
      csvRecord.stop_sequence,
      csvRecord.stop_headsign || null,
      csvRecord.pickup_type || null,
      csvRecord.drop_off_type || null,
      csvRecord.timepoint || null,
    ];
  }

  if ("stop_code" in csvRecord) {
    return [
      csvRecord.stop_id,
      csvRecord.stop_code || null,
      csvRecord.stop_name || null,
      csvRecord.stop_lat || null,
      csvRecord.stop_lon || null,
    ];
  }

  if ("trip_headsign" in csvRecord) {
    return [
      // null,
      csvRecord.route_id,
      csvRecord.service_id,
      csvRecord.trip_id,
      csvRecord.trip_headsign || null,
      csvRecord.trip_short_name || null,
      csvRecord.direction_id || null,
      csvRecord.block_id || null,
      csvRecord.shape_id || null,
    ];
  }

  throw new Error(`Parsing failed for record ${JSON.stringify(csvRecord)}`);
}
