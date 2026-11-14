import { OpenRouterChatProvider, OpenRouterSafetyProvider } from '@/lib/ai/openrouter';
import type { ChatModelProvider, SafetyModelProvider } from '@/lib/ai/types';

export function getChatProvider(): ChatModelProvider {
  const provider = process.env.AI_PROVIDER || 'openrouter';
  if (provider !== 'openrouter') {
    throw new Error('No supported AI provider is configured');
  }
  return new OpenRouterChatProvider();
}

export function getSafetyProvider(): SafetyModelProvider {
  return new OpenRouterSafetyProvider();
}
