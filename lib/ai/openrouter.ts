import type { ChatModelProvider, ModelInput, ModelOutput, SafetyModelProvider } from '@/lib/ai/types';
import { buildSystemPrompt } from '@/lib/ai/prompt';

const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_CHAT_MODEL = 'qwen/qwen3-30b-a3b:free';
const DEFAULT_SAFETY_MODEL = 'nvidia/nemotron-3.5-content-safety:free';

class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

function configuredBaseUrl(): string {
  const raw = process.env.AI_BASE_URL || DEFAULT_BASE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ProviderError('AI_BASE_URL must be an absolute HTTP(S) URL');
  }

  const localDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const secure = url.protocol === 'https:';
  const localHttpDevelopment = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' && localDevelopmentHost;
  if ((!secure && !localHttpDevelopment) || url.username || url.password || url.search || url.hash) {
    throw new ProviderError('AI_BASE_URL must use HTTPS; HTTP is allowed only for local development without credentials or query parameters');
  }

  return url.toString().replace(/\/+$/, '');
}

function removeReasoning(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

export class OpenRouterChatProvider implements ChatModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new ProviderError('OPENROUTER_API_KEY is not configured');
    this.apiKey = apiKey;
    this.baseUrl = configuredBaseUrl();
    this.model = process.env.AI_MODEL || DEFAULT_CHAT_MODEL;
  }

  async generate(input: ModelInput): Promise<ModelOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.4,
          max_tokens: 350,
          messages: [
            { role: 'system', content: buildSystemPrompt(input) },
            ...input.history.map(({ role, content }) => ({ role, content })),
            { role: 'user', content: input.message },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new ProviderError(`OpenRouter returned ${response.status}`);
      const body = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = removeReasoning(body.choices?.[0]?.message?.content || '');
      if (!text) throw new ProviderError('OpenRouter returned an empty response');
      return { text, model: this.model };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      throw new ProviderError(error instanceof Error ? error.message : 'OpenRouter request failed');
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Input assessment is tri-state: GREEN/YELLOW/RED are explicit model labels;
 * null means the guardrail could not verify the input and must fail closed.
 */
export class OpenRouterSafetyProvider implements SafetyModelProvider {
  async assess(message: string): Promise<'green' | 'yellow' | 'red' | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${configuredBaseUrl()}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.SAFETY_MODEL || DEFAULT_SAFETY_MODEL,
          temperature: 0,
          max_tokens: 16,
          messages: [
            {
              role: 'system',
              content: 'Classify Vietnamese student text for support routing. Reply with exactly one label: RED for an immediate safety concern, YELLOW for serious or persistent difficulty that merits trusted-adult support, or GREEN otherwise. Do not add punctuation, explanation, or advice.',
            },
            { role: 'user', content: message },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const label = body.choices?.[0]?.message?.content?.trim().toUpperCase();
      return label === 'RED' ? 'red' : label === 'YELLOW' ? 'yellow' : label === 'GREEN' ? 'green' : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async isOutputSafe(message: string): Promise<boolean | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${configuredBaseUrl()}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.SAFETY_MODEL || DEFAULT_SAFETY_MODEL,
          temperature: 0,
          max_tokens: 8,
          messages: [
            { role: 'system', content: 'Review this proposed Vietnamese response to a student. Reply with exactly SAFE if the response is appropriate and does not provide harmful instructions, diagnose, promise absolute secrecy, invent contacts, or minimize immediate danger. Reply with exactly UNSAFE otherwise. Do not add explanation or punctuation.' },
            { role: 'user', content: message },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const label = body.choices?.[0]?.message?.content?.trim().toUpperCase();
      return label === 'UNSAFE' ? false : label === 'SAFE' ? true : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export { ProviderError };
