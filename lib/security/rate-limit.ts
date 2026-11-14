type RateEntry = { count: number; resetAt: number };

const MAX_ENTRIES = 5_000;
const PRUNE_EVERY = 100;

type RateLimitGlobal = typeof globalThis & {
  __mamRateLimitEntries?: Map<string, RateEntry>;
  __mamRateLimitOperations?: number;
};

const globalForRateLimit = globalThis as RateLimitGlobal;
const entries = (globalForRateLimit.__mamRateLimitEntries ??= new Map<string, RateEntry>());

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  remaining: number;
};

/**
 * Process-local best-effort limiter. It bounds memory and is useful as a first
 * layer, but deployments with multiple instances must also rate-limit at a
 * trusted proxy, WAF, or shared store.
 */
export function checkRateLimit(
  key: string,
  limit = 12,
  windowMs = 10 * 60 * 1000,
  now = Date.now(),
): RateLimitResult {
  if (!Number.isInteger(limit) || limit < 1 || !Number.isFinite(windowMs) || windowMs < 1) {
    throw new Error('Invalid rate-limit configuration');
  }

  const safeKey = key.slice(0, 180);
  const existing = entries.get(safeKey);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;

  entry.count += 1;
  entries.set(safeKey, entry);

  const operations = (globalForRateLimit.__mamRateLimitOperations ?? 0) + 1;
  globalForRateLimit.__mamRateLimitOperations = operations;
  if (operations % PRUNE_EVERY === 0 || entries.size > MAX_ENTRIES) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey);
    }
    while (entries.size > MAX_ENTRIES) {
      const oldestKey = entries.keys().next().value as string | undefined;
      if (!oldestKey) break;
      entries.delete(oldestKey);
    }
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return {
    allowed: entry.count <= limit,
    retryAfterSeconds,
    remaining: Math.max(0, limit - entry.count),
  };
}

/**
 * Use only behind a reverse proxy configured to overwrite X-Forwarded-For.
 * Never treat a client-provided forwarding header as a trustworthy identity
 * unless the deployment proxy strips incoming copies first.
 */
export function requestRateLimitKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const candidate = forwarded || realIp || 'unknown-client';
  const safeClient = candidate.replace(/[^a-zA-Z0-9:.%_-]/g, '').slice(0, 96) || 'unknown-client';
  return `${scope}:${safeClient}`;
}

export function clearRateLimitStoreForTests() {
  entries.clear();
  globalForRateLimit.__mamRateLimitOperations = 0;
}
