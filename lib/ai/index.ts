import { OpenRouterChatProvider, OpenRouterSafetyProvider } from '@/lib/ai/openrouter';
import { OpenAICompatibleChatProvider } from '@/lib/ai/compatible-provider';
import type { ChatModelProvider, SafetyModelProvider } from '@/lib/ai/types';

export function getChatProvider(): ChatModelProvider {
  const provider = process.env.AI_PROVIDER || 'openrouter';
  if (provider === 'openrouter') return new OpenRouterChatProvider();
  if (provider === 'openai-compatible') return new OpenAICompatibleChatProvider();
  throw new Error('AI_PROVIDER must be openrouter or openai-compatible');
}

/** Safety review remains separately configured via OpenRouter until another
 * safety provider is explicitly implemented and tested. */
export function getSafetyProvider(): SafetyModelProvider {
  return new OpenRouterSafetyProvider();
}
