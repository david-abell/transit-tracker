import Redis, { RedisOptions } from "ioredis";

const options: RedisOptions = {
  enableAutoPipelining: true,
  family: process.env.NODE_ENV === "production" ? 6 : 4,
  // host: [region].[app-name].internal exa cdg.transit-redis.internal
  host: process.env.REDIS_HOST || "127.0.0.1",
  lazyConnect: true,
  maxRetriesPerRequest: 0,
  port: 6379,
  password: process.env.REDIS_PASSWORD || "",
  showFriendlyErrorStack: true,
  retryStrategy: (times: number) => {
    if (times > 3) {
      throw new Error(
        `[Redis] Could not connect after ${times} attempts. ${JSON.stringify(
          options,
        )}`,
      );
    }

    return Math.min(times * 200, 1000);
  },
};

export function createRedisInstance() {
  try {
    const redis = new Redis(options);

    redis.on("connect", () => console.log("Redis is connected"));
    redis.on("reconnecting", () => console.log("Redis is reconnecting"));
    redis.on("ready", () => console.log("Redis is ready"));
    redis.on("error", (error: unknown) => {
      console.warn("[Redis] Error connecting", error);
    });

    return redis;
  } catch (e) {
    console.error(
      `[Redis] Could not create a Redis instance with options: ${options}`,
    );
    throw new Error(`[Redis] Could not create a Redis instance`);
  }
}

export const redisClient = createRedisInstance();
