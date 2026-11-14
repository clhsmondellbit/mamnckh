import { authenticateStaff, createStaffSession, getCurrentStaffSession, isStaffFeatureEnabled, staffCookie } from '@/lib/auth/staff';
import { getDatabase } from '@/lib/db/client';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const credentials = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) });

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isStaffFeatureEnabled()) return NextResponse.json({ error: 'Khu vực nhân sự chưa được cấu hình.' }, { status: 503, headers: noStoreHeaders() });
  const limit = checkRateLimit(requestRateLimitKey(request, 'staff-login'), 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Bạn đã thử đăng nhập quá nhiều lần. Hãy thử lại sau ít phút.' }, { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } });
  try {
    const { email, password } = credentials.parse(await readJsonRequest(request, 2 * 1024));
    const user = await authenticateStaff(email, password);
    if (!user) return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401, headers: noStoreHeaders() });
    const response = NextResponse.json({ ok: true, user: { email: user.email, displayName: user.displayName, role: user.role } }, { headers: noStoreHeaders() });
    response.cookies.set(staffCookie.name, createStaffSession(user.id, user.sessionVersion), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: staffCookie.maxAge });
    return response;
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Thông tin đăng nhập chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}

export async function GET() {
  const user = await getCurrentStaffSession();
  if (!user) return NextResponse.json({ user: null }, { status: 401, headers: noStoreHeaders() });
  return NextResponse.json({ user: { email: user.email, displayName: user.displayName, role: user.role } }, { headers: noStoreHeaders() });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const actor = await getCurrentStaffSession();
  if (actor) {
    try { const sql = getDatabase(); await sql`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id) values(${actor.id},'logout_success','staff_user',${actor.id})`; }
    catch { /* Session revocation still takes priority if the audit store is temporarily unavailable. */ }
  }
  const response = NextResponse.json({ ok: true }, { headers: noStoreHeaders() });
  response.cookies.set(staffCookie.name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
