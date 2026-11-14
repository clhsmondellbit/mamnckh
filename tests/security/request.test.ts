import { describe, expect, it } from 'vitest';
import { isSameOriginRequest, readJsonRequest } from '@/lib/security/request';

describe('request security helpers', () => {
  it('reads valid JSON within the byte limit', async () => {
    const request = new Request('https://example.test/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Xin chào' }),
    });
    await expect(readJsonRequest(request, 100)).resolves.toEqual({ message: 'Xin chào' });
  });

  it('rejects an unsupported content type', async () => {
    const request = new Request('https://example.test/api', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    });
    await expect(readJsonRequest(request, 100)).rejects.toMatchObject({ status: 415 });
  });

  it('enforces the actual body size', async () => {
    const request = new Request('https://example.test/api', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'a'.repeat(100) }),
    });
    await expect(readJsonRequest(request, 10)).rejects.toMatchObject({ status: 413 });
  });

  it('requires a matching Origin for browser mutations', () => {
    expect(isSameOriginRequest(new Request('https://example.test/api', {
      method: 'POST', headers: { origin: 'https://example.test' },
    }))).toBe(true);
    expect(isSameOriginRequest(new Request('https://example.test/api', {
      method: 'POST', headers: { origin: 'https://attacker.test' },
    }))).toBe(false);
    expect(isSameOriginRequest(new Request('https://example.test/api', { method: 'POST' }))).toBe(false);
  });
});
