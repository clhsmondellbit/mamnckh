type RateEntry = { count: number; resetAt: number };
const entries = new Map<string, RateEntry>();

export function checkRateLimit(key: string, limit = 12, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const existing = entries.get(key);
  const entry = !existing || existing.resetAt <= now ? { count: 0, resetAt: now + windowMs } : existing;
  entry.count += 1;
  entries.set(key, entry);
  return { allowed: entry.count <= limit, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
}
