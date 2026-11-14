import { getDatabase } from '@/lib/db/client';
import { noStoreHeaders } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error:'Unauthorized' }, { status:401, headers:noStoreHeaders() });
  try {
    const sql = getDatabase();
    const rows = await sql<{ deleted_count: number }[]>`select purge_old_school_support_appointments() as deleted_count`;
    const oldRequests = await sql<{ id: string }[]>`delete from support_requests where status='resolved' and updated_at < now() - interval '90 days' returning id`;
    return NextResponse.json({ deletedAppointments: rows[0]?.deleted_count || 0, deletedLegacyRequests: oldRequests.length }, { headers:noStoreHeaders() });
  } catch { return NextResponse.json({ error:'Retention cleanup failed.' }, { status:503, headers:noStoreHeaders() }); }
}
