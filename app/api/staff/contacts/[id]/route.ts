import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { activateContact, deactivateContact, updateContact } from '@/lib/db/school-support';
import { normalizeVietnamesePhone } from '@/lib/school/phone';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const schema = z.object({
  fullName: z.string().trim().min(2).max(120), avatarUrl: z.string().url().max(500).refine((value) => value.startsWith('https://')).optional().or(z.literal('')),
  roleTitle: z.string().trim().min(2).max(120), department: z.string().trim().min(2).max(120), supportTopics: z.array(z.string().trim().min(1).max(60)).max(20),
  description: z.string().trim().max(500), phone: z.string().trim().max(40).optional().or(z.literal('')), email: z.string().trim().email().max(254).optional().or(z.literal('')),
  contactHours: z.string().trim().max(200), contactModes: z.array(z.enum(['phone','message','in_person'])).min(1).max(4),
  intakeStatus: z.enum(['accepting','limited','not_accepting']), intakeNote: z.string().trim().max(200),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền chỉnh sửa danh bạ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const { id } = await context.params;
    const input = schema.parse(await readJsonRequest(request, 8 * 1024));
    const phoneE164 = input.phone ? normalizeVietnamesePhone(input.phone) : null;
    if (input.phone && !phoneE164) throw new Error('Số điện thoại Việt Nam chưa đúng định dạng.');
    const contact = await updateContact(id, { ...input, avatarUrl: input.avatarUrl || undefined, phoneE164: phoneE164 || undefined, email: input.email || undefined }, actor!);
    return contact ? NextResponse.json({ contact }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.' }, { status, headers: noStoreHeaders() });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền ngừng công khai hồ sơ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const { id } = await context.params;
  try {
    const contact = await deactivateContact(id, actor!);
    return contact ? NextResponse.json({ ok: true }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404, headers: noStoreHeaders() });
  } catch { return NextResponse.json({ error: 'Không thể ngừng công khai hồ sơ.' }, { status: 500, headers: noStoreHeaders() }); }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền kích hoạt hồ sơ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const { id } = await context.params;
  try {
    const contact = await activateContact(id, actor!);
    return contact ? NextResponse.json({ contact }, { headers: noStoreHeaders() }) : NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404, headers: noStoreHeaders() });
  } catch { return NextResponse.json({ error: 'Không thể kích hoạt hồ sơ.' }, { status: 500, headers: noStoreHeaders() }); }
}
