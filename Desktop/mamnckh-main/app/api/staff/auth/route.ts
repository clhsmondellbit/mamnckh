import { createStaffSession, isStaffFeatureEnabled, staffCookie, verifyStaffPassword } from '@/lib/auth/staff';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const credentials = z.object({ password: z.string().min(1).max(256) });

export async function POST(request: NextRequest) {
  if (!isStaffFeatureEnabled()) return NextResponse.json({ error: 'Khu vực nhân sự chưa được cấu hình.' }, { status: 503 });
  try {
    const { password } = credentials.parse(await request.json());
    if (!verifyStaffPassword(password)) return NextResponse.json({ error: 'Mật khẩu không đúng.' }, { status: 401 });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(staffCookie.name, createStaffSession(), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: staffCookie.maxAge });
    return response;
  } catch {
    return NextResponse.json({ error: 'Thông tin đăng nhập chưa hợp lệ.' }, { status: 400 });
  }
}

export function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(staffCookie.name, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
