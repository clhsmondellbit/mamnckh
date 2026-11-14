import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { StorageUnavailableError, updateSupportRequest } from '@/lib/db/support-requests';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const updateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved']),
  assignedStaff: z.string().trim().max(120).optional(),
  followUpDate: z.string().date().optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});
const idSchema = z.string().uuid();

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!actor) return NextResponse.json({ error: 'Cần đăng nhập.' }, { status: 401, headers: noStoreHeaders() });
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Chỉ quản trị viên được cập nhật yêu cầu chưa gắn người nhận.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  }

  try {
    const { id: rawId } = await context.params;
    const id = idSchema.parse(rawId);
    const changes = updateSchema.parse(await readJsonRequest(request, 4 * 1024));
    const updated = await updateSupportRequest(id, changes, actor);
    return updated
      ? NextResponse.json({ request: updated }, { headers: noStoreHeaders() })
      : NextResponse.json({ error: 'Không tìm thấy yêu cầu.' }, { status: 404, headers: noStoreHeaders() });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return NextResponse.json({ error: 'Chưa có kho dữ liệu yêu cầu hỗ trợ.' }, { status: 503, headers: noStoreHeaders() });
    }
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Cập nhật chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
