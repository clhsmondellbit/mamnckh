import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

export const CHAT_CONTEXT_COOKIE = 'mam_chat_context';
const COOKIE_VERSION = 'v1';
const COOKIE_AAD = 'mam-chat-context-v1';
const CONTEXT_TTL_SECONDS = 60 * 60 * 2;
const MAX_MESSAGES = 4;
const MAX_MESSAGE_CHARS = 220;
const MAX_COOKIE_CHARS = 3600;

export type ServerContextMessage = { role: 'user' | 'assistant'; content: string };
type ContextPayload = { sessionId: string; expiresAt: number; messages: ServerContextMessage[] };

function contextKey(): Buffer | null {
  const configured = process.env.CONVERSATION_SECRET || process.env.AUTH_SECRET;
  if (!configured || configured.length < 32) return null;
  return createHash('sha256').update(configured, 'utf8').digest();
}

function validContext(value: unknown): value is ContextPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ContextPayload>;
  return typeof candidate.sessionId === 'string'
    && typeof candidate.expiresAt === 'number'
    && Array.isArray(candidate.messages)
    && candidate.messages.length <= MAX_MESSAGES
    && candidate.messages.every((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string' && message.content.length <= MAX_MESSAGE_CHARS);
}

export function readServerConversationContext(cookie: string | undefined, sessionId: string): ServerContextMessage[] {
  const key = contextKey();
  if (!key || !cookie || cookie.length > MAX_COOKIE_CHARS) return [];
  const [version, ivText, tagText, ciphertextText, extra] = cookie.split('.');
  if (version !== COOKIE_VERSION || !ivText || !tagText || !ciphertextText || extra) return [];

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64url'));
    decipher.setAAD(Buffer.from(COOKIE_AAD));
    decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(ciphertextText, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
    const parsed: unknown = JSON.parse(decrypted);
    if (!validContext(parsed) || parsed.sessionId !== sessionId || parsed.expiresAt <= Math.floor(Date.now() / 1000)) return [];
    return parsed.messages;
  } catch {
    return [];
  }
}

export function createServerConversationContextCookie(
  sessionId: string,
  previousMessages: ServerContextMessage[],
  userMessage: string,
  assistantMessage: string,
): string | null {
  const key = contextKey();
  if (!key) return null;

  // Keep only a very small recent window. The encrypted cookie is HttpOnly and
  // scoped to /api/chat, so the browser client cannot read or forge assistant turns.
  const candidateMessages: ServerContextMessage[] = [
    ...previousMessages,
    { role: 'user', content: userMessage },
    { role: 'assistant', content: assistantMessage },
  ];
  const messages: ServerContextMessage[] = candidateMessages
    .slice(-MAX_MESSAGES)
    .map((message) => ({ role: message.role, content: message.content.slice(0, MAX_MESSAGE_CHARS) }));

  let payload: ContextPayload = {
    sessionId,
    expiresAt: Math.floor(Date.now() / 1000) + CONTEXT_TTL_SECONDS,
    messages,
  };
  let serialized = JSON.stringify(payload);
  // A conservative cap avoids exceeding common browser cookie limits, including
  // UTF-8 Vietnamese text which can occupy several bytes per character.
  while (serialized.length > 1100 && payload.messages.length > 2) {
    payload.messages = payload.messages.slice(-2);
    serialized = JSON.stringify(payload);
  }
  payload.messages = payload.messages.map((message) => ({ ...message, content: message.content.slice(0, 120) }));
  serialized = JSON.stringify(payload);

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(COOKIE_AAD));
  const ciphertext = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
  const cookie = [COOKIE_VERSION, iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.');
  return cookie.length <= MAX_COOKIE_CHARS ? cookie : null;
}

export function getConversationContextCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/chat',
    maxAge: CONTEXT_TTL_SECONDS,
  };
}

export function conversationContextConfigured() {
  return Boolean(contextKey());
}
