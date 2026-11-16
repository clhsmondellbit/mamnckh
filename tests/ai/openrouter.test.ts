import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenRouterChatProvider, OpenRouterSafetyProvider } from '@/lib/ai/openrouter';

describe('OpenRouter safety provider', () => {
  const originalApiKey = process.env.OPENROUTER_API_KEY;
  const originalBaseUrl = process.env.AI_BASE_URL;

  beforeEach(() => {
    process.env.OPENROUTER_API_KEY = 'test-only-key';
    process.env.AI_BASE_URL = 'https://openrouter.ai/api/v1';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (originalApiKey === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = originalApiKey;
    if (originalBaseUrl === undefined) delete process.env.AI_BASE_URL;
    else process.env.AI_BASE_URL = originalBaseUrl;
  });

  it('distinguishes an explicit GREEN verdict from an unavailable verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'GREEN' } }] }), { status: 200 }),
    ));

    await expect(new OpenRouterSafetyProvider().assess('Mình muốn sắp xếp lại lịch học.')).resolves.toBe('green');
  });

  it('escalates an explicit YELLOW verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'YELLOW' } }] }), { status: 200 }),
    ));

    await expect(new OpenRouterSafetyProvider().assess('Mình cần thêm người hỗ trợ.')).resolves.toBe('yellow');
  });

  it('returns null for an invalid label instead of treating it as GREEN', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'MAYBE' } }] }), { status: 200 }),
    ));

    await expect(new OpenRouterSafetyProvider().assess('Mình không chắc.')).resolves.toBeNull();
  });

  it('requires an explicit SAFE output verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'SAFE' } }] }), { status: 200 }),
    ));

    await expect(new OpenRouterSafetyProvider().isOutputSafe('Một phản hồi hỗ trợ phù hợp.')).resolves.toBe(true);
  });

  it('returns null for an ambiguous output verdict', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'SAFE, I THINK' } }] }), { status: 200 }),
    ));

    await expect(new OpenRouterSafetyProvider().isOutputSafe('Một phản hồi.')).resolves.toBeNull();
  });

  it('rejects non-local HTTP base URLs for the chat provider', () => {
    process.env.AI_BASE_URL = 'http://untrusted.example/api/v1';
    expect(() => new OpenRouterChatProvider()).toThrow(/HTTPS/);
  });

  it('rejects credentials embedded in a provider base URL', () => {
    process.env.AI_BASE_URL = 'https://user:password@openrouter.ai/api/v1';
    expect(() => new OpenRouterChatProvider()).toThrow(/HTTPS/);
  });
});
