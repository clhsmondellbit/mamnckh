import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { closeAvailabilitySlot } from '@/lib/db/school-support';
import { isSameOriginRequest, noStoreHeaders } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin','school_counselor','teacher'])) return NextResponse.json({ error: 'Không có quyền đóng khung giờ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Mã khung giờ chưa hợp lệ.' }, { status: 400, headers: noStoreHeaders() });
  try {
    const closed = await closeAvailabilitySlot(id, actor!);
    return closed ? NextResponse.json({ ok: true }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy slot chưa đặt, slot đã qua giờ hoặc slot không thuộc hồ sơ được phân công.' }, { status: 409, headers: noStoreHeaders() });
  } catch { return NextResponse.json({ error: 'Không thể đóng khung giờ.' }, { status: 503, headers: noStoreHeaders() }); }
}
