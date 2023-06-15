import Redis, { RedisOptions } from "ioredis";
import { configuration } from "./configuration";

function getRedisConfiguration() {
  return configuration.redis;
}

export function createRedisInstance(config = getRedisConfiguration()) {
  try {
    const options: RedisOptions = {
      enableAutoPipelining: true,
      family: 4,
      host: config.host || "127.0.0.1",
      lazyConnect: true,
      maxRetriesPerRequest: 0,
      port: 6379,
      showFriendlyErrorStack: true,
      retryStrategy: (times: number) => {
        if (times > 3) {
          throw new Error(
            `[Redis] Could not connect after ${times} attempts. ${JSON.stringify(
              options
            )}`
          );
        }

        return Math.min(times * 200, 1000);
      },
    };

    // if (config.port) {
    //   options.port = config.port || 6379;
    // }

    // if (config.password) {
    //   options.password = config.password || "";
    // }

    const redis = new Redis(options);

    redis.on("error", (error: unknown) => {
      console.warn("[Redis] Error connecting", error);
    });

    return redis;
  } catch (e) {
    console.error(`[Redis] Could not create a Redis instance`);
    // throw new Error(`[Redis] Could not create a Redis instance`);
  }
}
