import { cancelAppointment } from '@/lib/db/school-support';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({ cancellationToken: z.string().min(30).max(100) });
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const { id } = await context.params;
    const { cancellationToken } = schema.parse(await readJsonRequest(request, 2 * 1024));
    const cancelled = await cancelAppointment(id, cancellationToken);
    return cancelled ? NextResponse.json({ ok: true }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không thể hủy yêu cầu này. Hãy kiểm tra mã quản lý và trạng thái.' }, { status: 400, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Yêu cầu hủy chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
