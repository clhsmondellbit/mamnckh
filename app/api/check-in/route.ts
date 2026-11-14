import { classifySafety } from '@/lib/safety/classify';
import { getRedSafetyMessage, presentationForLevel } from '@/lib/safety/policy';
import { schoolSupportConfig } from '@/lib/school/config';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const checkInSchema = z.object({
  mood: z.number().int().min(1).max(5),
  pressure: z.number().int().min(1).max(5),
  connected: z.number().int().min(1).max(5),
  feelsSafe: z.boolean(),
  note: z.string().trim().max(500).optional().default(''),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(requestRateLimitKey(request, 'check-in'), 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Bạn đã gửi quá nhiều lượt check-in. Hãy thử lại sau ít phút.' },
      { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const data = checkInSchema.parse(await readJsonRequest(request, 4 * 1024));
    const safety = classifySafety(data.note);
    const red = !data.feelsSafe || safety.level === 'red';
    const yellow = safety.level === 'yellow' || data.pressure >= 4 || data.mood <= 2 || data.connected <= 2;
    const level = red ? 'red' : yellow ? 'yellow' : 'green';
    const message = red
      ? getRedSafetyMessage(schoolSupportConfig)
      : yellow
        ? 'Có vẻ bạn đang cần thêm sự đồng hành. Bạn có thể chọn một người lớn mà bạn tin tưởng để nói chuyện hôm nay.'
        : 'Cảm ơn bạn đã dừng lại để lắng nghe bản thân. Bạn có thể giữ nhịp chăm sóc nhỏ này và tìm MẦM khi cần.';
    return NextResponse.json(
      { message, supportLevel: level, ...presentationForLevel(level) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Thông tin check-in chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
