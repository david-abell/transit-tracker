export const configuration = {
  redis: {
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  },
};
