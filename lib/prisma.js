import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Cap the per-instance connection pool. Vercel serverless spins up many
// function instances concurrently; each one otherwise opens its own pool and
// the total exceeds Prisma Postgres' role connection limit.
function withPoolLimits(rawUrl) {
  if (!rawUrl) return rawUrl;
  const sep = rawUrl.includes("?") ? "&" : "?";
  const params = [];
  if (!/[?&]connection_limit=/.test(rawUrl)) params.push("connection_limit=1");
  if (!/[?&]pool_timeout=/.test(rawUrl)) params.push("pool_timeout=20");
  return params.length ? `${rawUrl}${sep}${params.join("&")}` : rawUrl;
}

/** @type {PrismaClient} */
let prisma;

try {
  prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
      datasources: { db: { url: withPoolLimits(process.env.DATABASE_URL) } },
    });
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
