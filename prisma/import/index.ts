import { consola } from "consola";
import { temporaryDirectory } from "tempy";
import { exec } from "child_process";
import { downloadFiles } from "./download";
import { importFile } from "./importFile";
import { prisma } from "@/lib/db";

const FILE_IMPORT_ORDER = [
  "agency.txt",
  "calendar.txt",
  "calendar_dates.txt",
  "routes.txt",
  "shapes.txt",
  "trips.txt",
  "stops.txt",
  "stop_times.txt",
];

async function main() {
  const downloadDir = temporaryDirectory();
  await downloadFiles(downloadDir);
  await prepareFreshDB();

  const t0 = performance.now();

  console.profile();
  for (const file of FILE_IMPORT_ORDER) {
    await importFile(`${downloadDir}/${file}`);
  }

  await prisma.$queryRaw`vacuum;`;

  const t1 = performance.now();
  consola.info(`Importing files took ${(t1 - t0) / 1000} seconds.`);
  console.profileEnd();
}

async function prepareFreshDB() {
  try {
    await new Promise((resolve, reject) => {
      consola.info("Resetting database tables...");
      exec("npx prisma db push --force-reset", (error, stdout, stderr) => {
        if (error || stderr) {
          consola.error(`Database reset failed: ${error?.message || stderr}`);
          reject(error);
        } else {
          consola.success("Database reset successful.");
          resolve(stdout);
        }
      });
    });

    // Setting SQLite PRAGMA significantly speeds up inserts
    await prisma.$queryRaw`PRAGMA journal_mode = OFF`;
    await prisma.$queryRaw`PRAGMA synchronous = OFF`;
    await prisma.$queryRaw`PRAGMA cache_size = 1000000`;
    await prisma.$queryRaw`PRAGMA locking_mode = EXCLUSIVE`;
    await prisma.$queryRaw`PRAGMA temp_store = MEMORY`;
  } catch (error) {
    if (error instanceof Error) {
      consola.error(error.message);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
