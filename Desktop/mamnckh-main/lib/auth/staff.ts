import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'mam_staff_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return value;
}

function sign(value: string, signingSecret: string) {
  return createHmac('sha256', signingSecret).update(value).digest('base64url');
}

export function isStaffFeatureEnabled() {
  return process.env.ENABLE_STAFF_DASHBOARD === 'true' && Boolean(process.env.DATABASE_URL) && Boolean(secret()) && Boolean(process.env.STAFF_PASSWORD);
}

export function verifyStaffPassword(candidate: string) {
  const configured = process.env.STAFF_PASSWORD;
  if (!configured || !isStaffFeatureEnabled()) return false;
  const expected = Buffer.from(configured);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createStaffSession() {
  const signingSecret = secret();
  if (!signingSecret) throw new Error('Staff auth is not configured');
  const payload = Buffer.from(JSON.stringify({ role: 'staff', exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload, signingSecret)}`;
}

export function verifyStaffSession(token?: string) {
  const signingSecret = secret();
  if (!token || !signingSecret) return false;
  const [payload, receivedSignature] = token.split('.');
  if (!payload || !receivedSignature) return false;
  const expectedSignature = sign(payload, signingSecret);
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(receivedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { role?: string; exp?: number };
    return session.role === 'staff' && typeof session.exp === 'number' && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isCurrentStaffAuthenticated() {
  const jar = await cookies();
  return verifyStaffSession(jar.get(COOKIE_NAME)?.value);
}

export const staffCookie = {
  name: COOKIE_NAME,
  maxAge: SESSION_TTL_SECONDS,
};
