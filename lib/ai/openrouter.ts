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
    this.baseUrl = process.env.AI_BASE_URL || DEFAULT_BASE_URL;
    this.model = process.env.AI_MODEL || DEFAULT_CHAT_MODEL;
  }

  async generate(input: ModelInput): Promise<ModelOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
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
 * Guardrail output can only raise the support level. Any parse/provider failure
 * returns null so deterministic safety rules remain the trusted baseline.
 */
export class OpenRouterSafetyProvider implements SafetyModelProvider {
  async assess(message: string): Promise<'yellow' | 'red' | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await fetch(`${process.env.AI_BASE_URL || DEFAULT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.SAFETY_MODEL || DEFAULT_SAFETY_MODEL,
          temperature: 0,
          max_tokens: 16,
          messages: [
            {
              role: 'system',
              content: 'Classify Vietnamese student text for support routing. Reply with only RED for immediate safety, YELLOW for serious/persistent adult-support need, or GREEN otherwise. Never provide advice.',
            },
            { role: 'user', content: message },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const label = body.choices?.[0]?.message?.content?.trim().toUpperCase();
      return label === 'RED' ? 'red' : label === 'YELLOW' ? 'yellow' : null;
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
      const response = await fetch(`${process.env.AI_BASE_URL || DEFAULT_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.SAFETY_MODEL || DEFAULT_SAFETY_MODEL,
          temperature: 0,
          max_tokens: 8,
          messages: [
            { role: 'system', content: 'Review this proposed Vietnamese response to a student. Reply only UNSAFE if it includes dangerous instructions, diagnosis, a secrecy promise, invented contacts, or minimizes immediate danger. Otherwise reply SAFE.' },
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
