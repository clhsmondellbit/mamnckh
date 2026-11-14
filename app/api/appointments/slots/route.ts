import { listAvailableSlots } from '@/lib/db/school-support';
import { noStoreHeaders } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const contactId = request.nextUrl.searchParams.get('contactId') || '';
  if (!/^[0-9a-f-]{36}$/i.test(contactId)) return NextResponse.json({ slots: [] }, { status: 400, headers: noStoreHeaders() });
  try {
    const slots = await listAvailableSlots(contactId);
    return NextResponse.json({ slots: slots.map((slot) => ({ id: slot.id, startsAt: slot.starts_at.toISOString(), endsAt: slot.ends_at.toISOString(), mode: slot.mode })) }, { headers: noStoreHeaders() });
  } catch { return NextResponse.json({ slots: [], error: 'Lịch tiếp nhận chưa được cấu hình.' }, { status: 503, headers: noStoreHeaders() }); }
}
