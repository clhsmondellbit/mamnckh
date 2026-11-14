import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { createContact, listManagedContacts } from '@/lib/db/school-support';
import { normalizeVietnamesePhone } from '@/lib/school/phone';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const modes = ['phone','message','in_person'] as const;
const contactSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  avatarUrl: z.string().url().max(500).refine((value) => value.startsWith('https://'), 'Ảnh đại diện phải dùng HTTPS').optional().or(z.literal('')),
  roleTitle: z.string().trim().min(2).max(120),
  department: z.string().trim().min(2).max(120),
  supportTopics: z.array(z.string().trim().min(1).max(60)).max(20),
  description: z.string().trim().max(500).default(''),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  contactHours: z.string().trim().max(200).default(''),
  contactModes: z.array(z.enum(modes)).min(1).max(4),
  intakeStatus: z.enum(['accepting','limited','not_accepting']),
  intakeNote: z.string().trim().max(200).default(''),
});

function prepare(input: z.infer<typeof contactSchema>) {
  const phoneE164 = input.phone ? normalizeVietnamesePhone(input.phone) : null;
  if (input.phone && !phoneE164) throw new Error('Số điện thoại Việt Nam chưa đúng định dạng.');
  return { ...input, avatarUrl: input.avatarUrl || undefined, phoneE164: phoneE164 || undefined, email: input.email || undefined };
}

export async function GET() {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền quản lý danh bạ.' }, { status: 403, headers: noStoreHeaders() });
  try { return NextResponse.json({ contacts: await listManagedContacts(actor!) }, { headers: noStoreHeaders() }); }
  catch { return NextResponse.json({ error: 'Không thể tải danh bạ quản trị.' }, { status: 503, headers: noStoreHeaders() }); }
}

export async function POST(request: NextRequest) {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền thêm hồ sơ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const limit = checkRateLimit(requestRateLimitKey(request, 'staff-contact-create'), 20, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Bạn thao tác quá nhanh.' }, { status: 429, headers: noStoreHeaders() });
  try {
    const parsed = contactSchema.parse(await readJsonRequest(request, 8 * 1024));
    const contact = await createContact(prepare(parsed), actor!);
    return NextResponse.json({ contact }, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Dữ liệu hồ sơ chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
