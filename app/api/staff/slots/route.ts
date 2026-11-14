import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { addAvailabilitySlot, listStaffSlots } from '@/lib/db/school-support';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({ contactId: z.string().uuid(), startsAt: z.string().datetime(), endsAt: z.string().datetime(), mode: z.enum(['phone','message','in_person']) }).refine((v) => new Date(v.endsAt) > new Date(v.startsAt), 'Giờ kết thúc phải sau giờ bắt đầu');
export async function GET() {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin','school_counselor','teacher'])) return NextResponse.json({ error: 'Không có quyền xem lịch.' }, { status: 403, headers: noStoreHeaders() });
  try { return NextResponse.json({ slots: await listStaffSlots(actor!) }, { headers: noStoreHeaders() }); }
  catch { return NextResponse.json({ error: 'Không thể tải lịch tiếp nhận.' }, { status: 503, headers: noStoreHeaders() }); }
}

export async function POST(request: NextRequest) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin','school_counselor','teacher'])) return NextResponse.json({ error: 'Không có quyền mở khung giờ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const data = schema.parse(await readJsonRequest(request, 3 * 1024));
    if (['school_counselor','teacher'].includes(actor!.role) && actor!.supportContactId !== data.contactId) return NextResponse.json({ error: 'Bạn chỉ được quản lý lịch thuộc hồ sơ được phân công.' }, { status: 403, headers: noStoreHeaders() });
    if (new Date(data.startsAt) <= new Date()) return NextResponse.json({ error: 'Chỉ có thể mở lịch trong tương lai.' }, { status: 400, headers: noStoreHeaders() });
    const slot = await addAvailabilitySlot(data.contactId, data.startsAt, data.endsAt, data.mode, actor!);
    return NextResponse.json({ slot: { id: slot.id, startsAt: slot.starts_at.toISOString(), endsAt: slot.ends_at.toISOString(), mode: slot.mode } }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể mở khung giờ.' }, { status, headers: noStoreHeaders() });
  }
}
