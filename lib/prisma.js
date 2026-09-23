import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

/** @type {PrismaClient} */
let prisma;

try {
  prisma = globalForPrisma.prisma ?? new PrismaClient();
} catch {
  // During build time DATABASE_URL may not be available.
  // PrismaClient will be created at runtime when the route is actually called.
  prisma = /** @type {PrismaClient} */ (
    new Proxy(
      {},
      {
        get() {
          throw new Error(
            "PrismaClient could not be initialised. Check that DATABASE_URL is set."
          );
        },
      }
    )
  );
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
