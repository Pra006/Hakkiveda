const store = new Map();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key, { windowMs, maxRequests }) {
  cleanup();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

// --- Configurable rate-limit tiers ---

export const RATE_LIMIT_TIERS = {
  "auth-strict": { windowMs: 15 * 60_000, maxRequests: 5 },
  "auth-moderate": { windowMs: 15 * 60_000, maxRequests: 10 },
  "otp-verify": { windowMs: 15 * 60_000, maxRequests: 10 },
  public: { windowMs: 60_000, maxRequests: 30 },
};

export function getClientIP(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitByIP(request, tierName) {
  const tier = RATE_LIMIT_TIERS[tierName];
  if (!tier) throw new Error(`Unknown rate limit tier: ${tierName}`);

  const ip = getClientIP(request);
  const key = `${tierName}:ip:${ip}`;
  const result = checkRateLimit(key, tier);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: "Too many requests. Please try again later.",
        retryAfterSeconds: result.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfterSeconds),
        },
      }
    );
  }

  return null;
}
