import 'server-only';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function encryptionKey(): Buffer {
  const encoded = process.env.DATA_ENCRYPTION_KEY;
  if (!encoded) throw new Error('DATA_ENCRYPTION_KEY is required for private support-request storage');
  const key = Buffer.from(encoded, 'base64');
  if (key.length !== 32) throw new Error('DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
  return key;
}

export function encryptPrivateField(value?: string | null): string | null {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptPrivateField(value?: string | null): string | undefined {
  if (!value) return undefined;
  const [version, ivText, tagText, encryptedText] = value.split(':');
  if (version !== 'v1' || !ivText || !tagText || !encryptedText) throw new Error('Unsupported encrypted field format');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedText, 'base64url')), decipher.final()]).toString('utf8');
}
