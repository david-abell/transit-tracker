import Papa from "papaparse";
import { createReadStream, existsSync } from "fs";
import consola from "consola";
import { clearLine, cursorTo } from "readline";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { basename, extname } from "path";
import { formatLine } from "./utils";
import { SnakeCaseModel } from "../snakeCaseModels";

const BATCH_SIZE = 32_000;
const MAX_TABLE_HEADER_COUNT = 12;

export async function importFile(filePath: string) {
  const extension = extname(filePath);
  const fileName = basename(filePath, extension);

  if (!existsSync(filePath)) {
    return;
  }

  if (extension !== ".txt") {
    throw new Error(
      `Expected .txt file extension for file ${filePath}, found extension ${extension}`,
    );
  }

  let totalLineCount = 0;
  let formattedLines: (string | number | null)[][] = [];

  consola.start(`Importing ${fileName}${extension}`);

  return new Promise((resolve, reject) => {
    Papa.parse<SnakeCaseModel>(createReadStream(filePath, "utf-8"), {
      header: true,
      skipEmptyLines: true,

      step: async function (results, parser) {
        totalLineCount++;

        formattedLines.push(formatLine(results.data));

        if (formattedLines.length >= BATCH_SIZE / MAX_TABLE_HEADER_COUNT) {
          // Don't log detailed progress when in CI
          if (process.stdout.isTTY) {
            clearLine(process.stdout, 1);
            cursorTo(process.stdout, 0);
            process.stdout.write(`Processing total records: ${totalLineCount}`);
          }

          parser.pause();

          await insertLines(formattedLines, fileName);
          formattedLines = [];

          parser.resume();
        }
      },
      complete: async function () {
        if (formattedLines.length) {
          await insertLines(formattedLines, fileName);
        }

        if (process.stdout.isTTY) {
          process.stdout.write("\r");
        }

        consola.success(
          `Processed ${totalLineCount} records from ${fileName}${extension}`,
        );
        resolve(null);
      },
      error(error) {
        consola.error(error.message);
        reject(error);
        process.exit(1);
      },
    });
  });
}

async function insertLines(
  formattedValues: (string | number | null)[][],
  filename: string,
) {
  const values = Prisma.join(
    formattedValues.map((row) => Prisma.sql`(${Prisma.join(row)})`),
  );

  switch (filename) {
    case "agency":
      await prisma.$queryRaw`
      INSERT into agency
      (agency_id, agency_name, agency_url, agency_timezone)
      VALUES
      ${values}`;
      break;

    case "calendar_dates":
      await prisma.$queryRaw`
      INSERT into calendar_date
      (id, service_id, date, exception_type)
      VALUES
      ${values}`;
      break;

    case "calendar":
      await prisma.$queryRaw`
      INSERT into calendar
      (service_id, monday, tuesday, wednesday, thursday, friday, saturday, sunday, start_date, end_date)
      VALUES
      ${values}`;
      break;

    case "routes":
      await prisma.$queryRaw`
      INSERT into route
      (route_id, agency_id, route_short_name, route_long_name, route_type)
      VALUES
      ${values}`;
      break;

    case "shapes":
      await prisma.$queryRaw`
      INSERT into shape
      (id, shape_id, shape_pt_lat, shape_pt_lon, shape_pt_sequence, shape_dist_traveled)
      VALUES
      ${values}`;
      break;

    case "stop_times":
      await prisma.$queryRaw`
      INSERT into stop_time
      (id, trip_id, arrival_time, arrival_timestamp, departure_time, departure_timestamp, stop_id, stop_sequence, stop_headsign, pickup_type, drop_off_type, timepoint)
      VALUES
      ${values}`;
      break;

    case "stops":
      await prisma.$queryRaw`
      INSERT into stop
      (stop_id, stop_code, stop_name, stop_lat, stop_lon)
      VALUES
      ${values}`;
      break;

    case "trips":
      await prisma.$queryRaw`
      INSERT into trip
      (route_id, service_id, trip_id, trip_headsign, trip_short_name, direction_id, block_id, shape_id)
      VALUES
      ${values}`;
      break;

    default:
      throw new Error(`Invalid file name: ${filename}`);
  }
}
