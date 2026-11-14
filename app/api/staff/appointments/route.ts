import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { listAppointmentsForStaff } from '@/lib/db/school-support';
import { noStoreHeaders } from '@/lib/security/request';
import { NextResponse } from 'next/server';
export async function GET() {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin','school_counselor','teacher'])) return NextResponse.json({ error: 'Không có quyền xem yêu cầu lịch.' }, { status: 403, headers: noStoreHeaders() });
  try { return NextResponse.json({ appointments: await listAppointmentsForStaff(actor!) }, { headers: noStoreHeaders() }); }
  catch { return NextResponse.json({ error: 'Không thể tải yêu cầu lịch.' }, { status: 503, headers: noStoreHeaders() }); }
}
