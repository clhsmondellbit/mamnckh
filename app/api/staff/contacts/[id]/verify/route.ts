import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { verifyContact } from '@/lib/db/school-support';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
const schema = z.object({ verificationMethod: z.enum(['school_confirmation','direct_staff_confirmation']), avatarConsentConfirmed: z.boolean(), phoneConsentConfirmed: z.boolean(), emailConsentConfirmed: z.boolean() });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Chỉ quản trị viên được xác minh hồ sơ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const { id } = await context.params;
    const body = schema.parse(await readJsonRequest(request, 2 * 1024));
    const contact = await verifyContact(id, actor!, body.verificationMethod, body.avatarConsentConfirmed, body.phoneConsentConfirmed, body.emailConsentConfirmed);
    return contact ? NextResponse.json({ contact }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể xác minh hồ sơ.' }, { status, headers: noStoreHeaders() });
  }
}
