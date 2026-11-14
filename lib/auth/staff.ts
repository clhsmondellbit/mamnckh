import 'server-only';
import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { getDatabase } from '@/lib/db/client';
import { verifyPassword } from '@/lib/auth/password';

export const STAFF_ROLES = ['super_admin', 'admin', 'content_manager', 'school_counselor', 'teacher', 'technical_operator'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export interface StaffSession {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  supportContactId?: string;
  sessionVersion: number;
}

type StaffRow = { id: string; email: string; display_name: string; password_hash: string; role: StaffRole; support_contact_id: string | null; is_active: boolean; session_version: number };
const COOKIE_NAME = 'mam_staff_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function signingSecret() {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function isStaffFeatureEnabled() {
  const encryptionKey = process.env.DATA_ENCRYPTION_KEY || '';
  const hasValidEncryptionKey = Buffer.from(encryptionKey, 'base64').length === 32;
  return process.env.ENABLE_STAFF_DASHBOARD === 'true' && Boolean(process.env.DATABASE_URL) && Boolean(signingSecret()) && hasValidEncryptionKey;
}

export async function authenticateStaff(email: string, password: string): Promise<StaffSession | null> {
  if (!isStaffFeatureEnabled()) return null;
  const sql = getDatabase();
  const rows = await sql<StaffRow[]>`
    select id, email, display_name, password_hash, role, support_contact_id, is_active, session_version
    from staff_users where lower(email) = lower(${email}) limit 1
  `;
  const user = rows[0];
  if (!user || !user.is_active || !(await verifyPassword(password, user.password_hash))) return null;
  await sql`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id) values(${user.id},'login_success','staff_user',${user.id})`;
  return mapStaff(user);
}

function mapStaff(user: StaffRow): StaffSession {
  return { id: user.id, email: user.email, displayName: user.display_name, role: user.role, supportContactId: user.support_contact_id || undefined, sessionVersion: user.session_version };
}

export function createStaffSession(userId: string, sessionVersion: number) {
  const secret = signingSecret();
  if (!secret) throw new Error('Staff auth is not configured');
  const payload = Buffer.from(JSON.stringify({ sub: userId, ver: sessionVersion, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function readSessionToken(token?: string): { sub: string; ver: number; exp: number } | null {
  const secret = signingSecret();
  if (!token || !secret) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; ver?: number; exp?: number };
    if (typeof decoded.sub !== 'string' || !/^[0-9a-f-]{36}$/i.test(decoded.sub) || typeof decoded.exp !== 'number' || decoded.exp <= Math.floor(Date.now() / 1000) || !Number.isInteger(decoded.ver) || (decoded.ver ?? 0) < 1) return null;
    return { sub: decoded.sub, ver: decoded.ver!, exp: decoded.exp };
  } catch { return null; }
}

export async function getCurrentStaffSession(): Promise<StaffSession | null> {
  if (!isStaffFeatureEnabled()) return null;
  try {
    const jar = await cookies();
    const token = readSessionToken(jar.get(COOKIE_NAME)?.value);
    if (!token) return null;
    const sql = getDatabase();
    const rows = await sql<StaffRow[]>`
      select id, email, display_name, password_hash, role, support_contact_id, is_active, session_version
      from staff_users where id = ${token.sub} and is_active = true limit 1
    `;
    return rows[0] && rows[0].session_version === token.ver ? mapStaff(rows[0]) : null;
  } catch { return null; }
}

export async function isCurrentStaffAuthenticated() {
  return Boolean(await getCurrentStaffSession());
}

export function staffHasRole(session: StaffSession | null, roles: readonly StaffRole[]) {
  return Boolean(session && roles.includes(session.role));
}

export const staffCookie = { name: COOKIE_NAME, maxAge: SESSION_TTL_SECONDS };
