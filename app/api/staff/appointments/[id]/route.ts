import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { updateAppointmentStatus } from '@/lib/db/school-support';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({ status: z.enum(['confirmed','completed','rejected']) });
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin','school_counselor','teacher'])) return NextResponse.json({ error: 'Không có quyền cập nhật lịch.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const { id } = await context.params;
    const { status } = schema.parse(await readJsonRequest(request, 2 * 1024));
    const updated = await updateAppointmentStatus(id, status, actor!);
    return updated ? NextResponse.json({ ok: true, status }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy yêu cầu hoặc bạn không được phân công.' }, { status: 404, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Thông tin cập nhật chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
