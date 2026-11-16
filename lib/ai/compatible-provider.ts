import 'server-only';
import type { ChatModelProvider, ModelInput, ModelOutput } from '@/lib/ai/types';
import { buildSystemPrompt } from '@/lib/ai/prompt';

class CompatibleProviderError extends Error {
  constructor(message: string) { super(message); this.name = 'CompatibleProviderError'; }
}

function getTrustedBaseUrl(): string {
  const raw = process.env.AI_BASE_URL;
  if (!raw) throw new CompatibleProviderError('AI_BASE_URL is required for the openai-compatible provider');
  let url: URL;
  try { url = new URL(raw); }
  catch { throw new CompatibleProviderError('AI_BASE_URL must be an absolute URL'); }
  const localDev = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(localDev && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new CompatibleProviderError('AI_BASE_URL must use HTTPS and must not include credentials, query parameters or fragments');
  }
  return url.toString().replace(/\/+$/, '');
}

export class OpenAICompatibleChatProvider implements ChatModelProvider {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new CompatibleProviderError('AI_API_KEY is not configured');
    this.apiKey = apiKey;
    this.baseUrl = getTrustedBaseUrl();
    this.model = process.env.AI_MODEL || '';
    if (!this.model) throw new CompatibleProviderError('AI_MODEL is not configured');
  }

  async generate(input: ModelInput): Promise<ModelOutput> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        redirect: 'error',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
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
      if (!response.ok) throw new CompatibleProviderError(`AI provider returned ${response.status}`);
      const body = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const text = (body.choices?.[0]?.message?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      if (!text || text.length > 4000) throw new CompatibleProviderError('AI provider returned an invalid response');
      return { text, model: this.model };
    } catch (error) {
      if (error instanceof CompatibleProviderError) throw error;
      throw new CompatibleProviderError('AI provider request failed or timed out');
    } finally {
      clearTimeout(timeout);
    }
  }
}
