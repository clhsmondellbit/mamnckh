import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, 64, SCRYPT_OPTIONS)) as Buffer;
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, nText, rText, pText, saltText, hashText, extra] = encoded.split('$');
  if (scheme !== 'scrypt' || !nText || !rText || !pText || !saltText || !hashText || extra) return false;
  const n = Number(nText), r = Number(rText), p = Number(pText);
  if (n !== 16384 || r !== 8 || p !== 1) return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = (await scrypt(password, salt, 64, SCRYPT_OPTIONS)) as Buffer;
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
