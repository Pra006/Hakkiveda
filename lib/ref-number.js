/**
 * Reference / serial number generators.
 * Kept separate from b2b.js so routes can import them
 * without pulling in PrismaClient at build time.
 */

export function generateRefNumber(prefix = "B2B") {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

export function generateNumber(prefix) {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${y}${m}-${seq}`;
}
