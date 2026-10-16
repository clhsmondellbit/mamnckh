import { isCurrentStaffAuthenticated } from '@/lib/auth/staff';
import { StorageUnavailableError, updateSupportRequest } from '@/lib/db/support-requests';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const updateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved']),
  assignedStaff: z.string().trim().max(120).optional(),
  followUpDate: z.string().date().optional(),
  internalNotes: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isCurrentStaffAuthenticated())) return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 401 });
  try {
    const { id } = await context.params;
    const changes = updateSchema.parse(await request.json());
    const updated = await updateSupportRequest(id, changes);
    return updated ? NextResponse.json({ request: updated }) : NextResponse.json({ error: 'Không tìm thấy yêu cầu.' }, { status: 404 });
  } catch (error) {
    if (error instanceof StorageUnavailableError) return NextResponse.json({ error: 'Chưa có kho dữ liệu yêu cầu hỗ trợ.' }, { status: 503 });
    return NextResponse.json({ error: 'Cập nhật chưa hợp lệ.' }, { status: 400 });
  }
}
