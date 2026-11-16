import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  conversationContextConfigured,
  createServerConversationContextCookie,
  readServerConversationContext,
} from '@/lib/ai/server-context';

describe('encrypted server-managed chat context', () => {
  const originalConversationSecret = process.env.CONVERSATION_SECRET;
  const originalAuthSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (originalConversationSecret === undefined) delete process.env.CONVERSATION_SECRET;
    else process.env.CONVERSATION_SECRET = originalConversationSecret;
    if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalAuthSecret;
  });

  it('round-trips only server-created context for the matching session', () => {
    process.env.CONVERSATION_SECRET = 'test-only-conversation-secret-0123456789';
    const cookie = createServerConversationContextCookie('session-12345678', [], 'Tin nhắn người dùng', 'Phản hồi từ assistant');
    expect(cookie).toBeTruthy();
    expect(readServerConversationContext(cookie || undefined, 'session-12345678')).toEqual([
      { role: 'user', content: 'Tin nhắn người dùng' },
      { role: 'assistant', content: 'Phản hồi từ assistant' },
    ]);
    expect(readServerConversationContext(cookie || undefined, 'different-session-123')).toEqual([]);
  });

  it('rejects modified cookies and unconfigured secrets', () => {
    process.env.CONVERSATION_SECRET = 'test-only-conversation-secret-0123456789';
    const cookie = createServerConversationContextCookie('session-12345678', [], 'Xin chào', 'Chào bạn');
    expect(cookie).toBeTruthy();
    const parts = cookie?.split('.') || [];
    // Flip a significant base64url character in the ciphertext. Changing only
    // the last character can alter padding bits without changing decoded bytes.
    if (parts.length === 4 && parts[3].length > 0) {
      parts[3] = `${parts[3].startsWith('A') ? 'B' : 'A'}${parts[3].slice(1)}`;
    }
    const altered = parts.join('.');
    expect(readServerConversationContext(altered, 'session-12345678')).toEqual([]);

    delete process.env.CONVERSATION_SECRET;
    delete process.env.AUTH_SECRET;
    expect(conversationContextConfigured()).toBe(false);
    expect(createServerConversationContextCookie('session-12345678', [], 'Xin chào', 'Chào bạn')).toBeNull();
  });

  it('caps stored history to a small recent window and clips content', () => {
    process.env.CONVERSATION_SECRET = 'test-only-conversation-secret-0123456789';
    const prior = Array.from({ length: 4 }, (_, index) => ({ role: index % 2 ? 'assistant' as const : 'user' as const, content: `turn-${index}` }));
    const cookie = createServerConversationContextCookie('session-12345678', prior, 'new user turn', 'new assistant turn');
    const restored = readServerConversationContext(cookie || undefined, 'session-12345678');
    expect(restored.length).toBeLessThanOrEqual(4);
    expect(restored.at(-1)?.content.length).toBeLessThanOrEqual(120);
    expect(restored.at(-1)?.role).toBe('assistant');
  });
});
