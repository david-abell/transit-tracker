import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: ["query", "info", "warn", "error"],
    log: ["warn", "error"],
  });

// @ts-ignore
// prisma.$on("query", (e: Prisma.QueryEvent) => {
//   console.log("Query: " + e.query);
//   console.log("Duration: " + e.duration + "ms");
// });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
