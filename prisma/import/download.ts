import { consola } from "consola";
import { writeFile, appendFile, mkdir } from "fs/promises";
import AdmZip from "adm-zip";
import { readLastLine } from "./utils";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { clearLine, cursorTo } from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AGENCY_URL =
  "https://www.transportforireland.ie/transitData/Data/GTFS_All.zip";

const LOG_FILE_NAME = "last_modified_LOG.txt";

const LOG_PATH = join(__dirname, LOG_FILE_NAME);

export async function downloadFiles(dirName: string) {
  consola.start(`Downloading GTFS from ${AGENCY_URL}`);

  try {
    let prevLastModified;

    // Check log history
    if (existsSync(LOG_PATH)) {
      prevLastModified = await readLastLine(LOG_PATH);
    } else {
      consola.info("No log file found, creating new log file");
      await writeFile(LOG_PATH, "");
    }

    // Check for download directory
    if (!existsSync(dirName)) {
      await mkdir(dirName, { recursive: true });
    }

    const response = await fetch(AGENCY_URL, {
      method: "GET",
    });

    if (response.status !== 200) {
      throw new Error("Couldn’t download files");
    }

    const lastModified = response.headers.get("last-modified");
    const contentLength = response.headers.get("content-length");
    const contentLengthInMb = bytesToMb(contentLength);

    if (prevLastModified === lastModified) {
      consola.warn(`Files have not changed since ${lastModified}`);
      process.exit(0);
    }

    const reader = response.body?.getReader();

    let receivedLength = 0;
    const chunks = [];

    if (!reader) {
      throw new Error("Response body could not be read.");
    }

    if (process.stdout.isTTY) {
      process.stdout.write("\r");
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (process.stdout.isTTY) {
          process.stdout.write("\r");
        }
        break;
      }

      receivedLength += value.length;
      chunks.push(value);

      // Don't log detailed progress when in CI
      if (process.stdout.isTTY) {
        clearLine(process.stdout, 1);
        cursorTo(process.stdout, 0);
        process.stdout.write(
          `Received ${bytesToMb(receivedLength)} of ${contentLengthInMb}`
        );
      }
    }

    const allChunks = new Uint8Array(receivedLength);
    let position = 0;

    for (const chunk of chunks) {
      allChunks.set(chunk, position);
      position += chunk.length;
    }

    consola.success(`Download of ${contentLengthInMb} successful.`);

    // Extract zip files and write to temp folder
    const zipped = new AdmZip(Buffer.from(allChunks));
    let fileCount = 0;

    for (const file of zipped.getEntries()) {
      const { entryName } = file;

      consola.info(`Extracting ${entryName} to ${dirName}/${entryName}`);

      await writeFile(`${dirName}/${entryName}`, file.getData());

      fileCount += 1;
    }

    if (lastModified && lastModified.length) {
      await appendFile(LOG_PATH, `${lastModified}\n`);
    }

    consola.success(`Finished writing ${fileCount} files.`);
    consola.info(`Agency files last modified on: ${lastModified}`);
  } catch (error) {
    if (error instanceof Error) {
      consola.error(new Error(error.message));
    }
    process.exit(1);
  }
}

function bytesToMb(value: string | number | null) {
  return `${(Number(value) / (1024 * 1024)).toFixed(2)} MB`;
}
