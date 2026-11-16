import type { ChatHistoryMessage } from '@/lib/types';

type TranscriptMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 1200;
// Keep worst-case UTF-8 payloads bounded alongside the current message so the
// API's 20 KiB body limit is not exceeded by a long student transcript.
const MAX_TOTAL_HISTORY_CHARS = 2500;

/**
 * Build the browser-supplied context accepted by POST /api/chat.
 * Assistant messages are intentionally excluded because client transcript
 * data is untrusted and must never be inserted as trusted assistant context.
 */
export function selectTrustedUserHistory(messages: readonly TranscriptMessage[]): ChatHistoryMessage[] {
  const selected: ChatHistoryMessage[] = [];
  let remainingChars = MAX_TOTAL_HISTORY_CHARS;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index];
    if (item.id === 'welcome' || item.role !== 'user' || !item.content.trim()) continue;
    if (selected.length >= MAX_HISTORY_MESSAGES || remainingChars <= 0) break;

    const limit = Math.min(MAX_MESSAGE_CHARS, remainingChars);
    const content = item.content.trim().slice(0, limit);
    if (!content) continue;

    selected.unshift({ role: 'user', content });
    remainingChars -= content.length;
  }

  return selected;
}
