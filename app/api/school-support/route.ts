import { NextResponse } from 'next/server';
import { listPublicContacts } from '@/lib/db/school-support';
import { DatabaseUnavailableError } from '@/lib/db/client';
import { noStoreHeaders } from '@/lib/security/request';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const contacts = await listPublicContacts();
    return NextResponse.json({ contacts }, { headers: noStoreHeaders() });
  } catch (error) {
    const unavailable = error instanceof DatabaseUnavailableError;
    return NextResponse.json(
      { contacts: [], error: unavailable ? 'Danh bạ trực tuyến chưa được nhà trường cấu hình.' : 'Chưa thể tải danh bạ hỗ trợ.' },
      { status: unavailable ? 503 : 500, headers: noStoreHeaders() },
    );
  }
}
