import { getChatProvider, getSafetyProvider } from '@/lib/ai';
import { getProviderUnavailableMessage, getRedSafetyMessage, presentationForLevel, validateModelOutput } from '@/lib/safety/policy';
import { classifySafety, mostProtectiveLevel } from '@/lib/safety/classify';
import { schoolSupportConfig } from '@/lib/school/config';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { SUPPORT_TOPICS, type ChatApiResponse, type ChatHistoryMessage } from '@/lib/types';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const historyItem = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1200),
});

const requestSchema = z.object({
  sessionId: z.string().trim().min(8).max(100),
  message: z.string().trim().min(1).max(2000),
  topicHint: z.enum(SUPPORT_TOPICS).optional(),
  history: z.array(historyItem).max(8).optional().default([]),
});

function getRateKey(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-client';
}

function response(
  message: string,
  supportLevel: ChatApiResponse['supportLevel'],
  providerAvailable: boolean,
  status = 200,
) {
  return NextResponse.json<ChatApiResponse>(
    { message, supportLevel, providerAvailable, ...presentationForLevel(supportLevel) },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateKey(request));
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Bạn đã gửi khá nhiều tin nhắn. Hãy thử lại sau ít phút.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Tin nhắn chưa hợp lệ hoặc quá dài.' }, { status: 400 });
  }

  const deterministic = classifySafety(payload.message);
  if (deterministic.level === 'red') {
    return response(getRedSafetyMessage(schoolSupportConfig), 'red', true);
  }

  // The guardrail may escalate a case but must never reduce deterministic safety.
  const modelSafety = await getSafetyProvider().assess(payload.message);
  const supportLevel = mostProtectiveLevel(deterministic.level, modelSafety || 'green');
  if (supportLevel === 'red') {
    return response(getRedSafetyMessage(schoolSupportConfig), 'red', true);
  }

  try {
    const output = await getChatProvider().generate({
      message: payload.message,
      history: payload.history as ChatHistoryMessage[],
      supportLevel,
      topicHint: payload.topicHint,
      schoolSupport: schoolSupportConfig,
    });
    const validation = validateModelOutput(output.text);
    if (!validation.safe) {
      // A withheld output must never be replaced with a second uncontrolled response.
      return response(getRedSafetyMessage(schoolSupportConfig), 'red', false, 503);
    }
    // This is an extra guardrail; a timeout or ambiguous result cannot defeat
    // the deterministic input/output policies already applied above.
    const outputSafety = await getSafetyProvider().isOutputSafe(output.text);
    if (outputSafety === false) {
      return response(getRedSafetyMessage(schoolSupportConfig), 'red', false, 503);
    }
    return response(output.text, supportLevel, true);
  } catch {
    return response(getProviderUnavailableMessage(), supportLevel, false, 503);
  }
}
