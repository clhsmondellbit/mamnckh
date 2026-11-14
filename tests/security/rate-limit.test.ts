import { afterEach, describe, expect, it } from 'vitest';
import { checkRateLimit, clearRateLimitStoreForTests, requestRateLimitKey } from '@/lib/security/rate-limit';

afterEach(() => clearRateLimitStoreForTests());

describe('process-local rate limiter', () => {
  it('allows the configured number of requests and blocks the next request', () => {
    expect(checkRateLimit('chat:test', 2, 1_000, 100).allowed).toBe(true);
    expect(checkRateLimit('chat:test', 2, 1_000, 101).allowed).toBe(true);
    const blocked = checkRateLimit('chat:test', 2, 1_000, 102);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(1);
  });

  it('resets a bucket after its window expires', () => {
    checkRateLimit('chat:reset', 1, 1_000, 100);
    expect(checkRateLimit('chat:reset', 1, 1_000, 1_100).allowed).toBe(true);
  });

  it('uses the configured proxy client address and scopes keys', () => {
    const request = new Request('https://example.test/api', {
      headers: { 'x-forwarded-for': '203.0.113.10, 10.0.0.1' },
    });
    expect(requestRateLimitKey(request, 'chat')).toBe('chat:203.0.113.10');
    expect(requestRateLimitKey(request, 'check-in')).toBe('check-in:203.0.113.10');
  });
});
