import { createAppointment } from '@/lib/db/school-support';
import { normalizeVietnamesePhone } from '@/lib/school/phone';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  contactId: z.string().uuid(), slotId: z.string().uuid().optional(), requesterName: z.string().trim().max(80).optional(),
  requesterPhone: z.string().trim().max(40).optional(), requesterEmail: z.string().trim().email().max(254).optional(),
  note: z.string().trim().max(600).optional(), topic: z.string().trim().min(2).max(60),
  preferredMode: z.enum(['phone','message','in_person']), requestedDate: z.string().date().optional(),
  requestedTimeWindow: z.string().trim().max(120).optional(), consent: z.literal(true),
})
  .refine((value) => Boolean(value.requesterPhone || value.requesterEmail || value.preferredMode === 'in_person'), 'Hãy cung cấp cách liên hệ tự nguyện hoặc chọn gặp trực tiếp.')
  .refine((value) => Boolean(value.slotId || (value.requestedDate && value.requestedTimeWindow?.trim())), 'Hãy chọn lịch đã mở hoặc nhập ngày và khung giờ mong muốn.');

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  const limit = checkRateLimit(requestRateLimitKey(request, 'appointment-create'), 3, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Bạn đã gửi nhiều yêu cầu trong thời gian ngắn. Hãy thử lại sau.' }, { status: 429, headers: noStoreHeaders() });
  try {
    const data = schema.parse(await readJsonRequest(request, 8 * 1024));
    const phoneE164 = data.requesterPhone ? normalizeVietnamesePhone(data.requesterPhone) : undefined;
    if (data.requesterPhone && !phoneE164) return NextResponse.json({ error: 'Số điện thoại cần theo định dạng Việt Nam.' }, { status: 400, headers: noStoreHeaders() });
    const { consent: _consent, ...appointmentData } = data;
    const result = await createAppointment({ ...appointmentData, requesterPhone: phoneE164 });
    return NextResponse.json(result, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : error instanceof Error && error.message.includes('DATA_ENCRYPTION_KEY') ? 503 : 400;
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Chưa thể gửi yêu cầu đặt lịch.' }, { status, headers: noStoreHeaders() });
  }
}
