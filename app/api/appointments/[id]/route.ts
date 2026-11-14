import { rescheduleAppointment } from '@/lib/db/school-support';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({
  cancellationToken: z.string().min(30).max(100), slotId: z.string().uuid().optional(),
  requestedDate: z.string().date().optional(), requestedTimeWindow: z.string().trim().max(120).optional(),
  preferredMode: z.enum(['phone','message','in_person']).optional(),
}).refine((v) => Boolean(v.slotId || (v.requestedDate && v.requestedTimeWindow)), 'Thiếu lịch mới');
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const { id } = await context.params;
    const data = schema.parse(await readJsonRequest(request, 3 * 1024));
    const { cancellationToken, ...change } = data;
    const updated = await rescheduleAppointment(id, cancellationToken, change);
    return updated ? NextResponse.json({ ok: true, status: 'pending' }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không thể đổi lịch; hãy kiểm tra mã quản lý và trạng thái yêu cầu.' }, { status: 400, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể đổi lịch.' }, { status, headers: noStoreHeaders() });
  }
}
