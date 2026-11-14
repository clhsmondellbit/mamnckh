import { classifySafety } from '@/lib/safety/classify';
import { presentationForLevel } from '@/lib/safety/policy';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(requestRateLimitKey(request, 'classify'), 15, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Bạn đã gửi quá nhiều yêu cầu. Hãy thử lại sau ít phút.' },
      { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  try {
    const { message } = z.object({ message: z.string().trim().min(1).max(2000) }).parse(
      await readJsonRequest(request, 4 * 1024),
    );
    const assessment = classifySafety(message);
    // Client-facing data deliberately excludes confidence and raw rule reasons.
    return NextResponse.json(
      { supportLevel: assessment.level, ...presentationForLevel(assessment.level) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json({ error: 'Tin nhắn chưa hợp lệ.' }, { status, headers: noStoreHeaders() });
  }
}
