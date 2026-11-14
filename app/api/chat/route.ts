import { getChatProvider, getSafetyProvider } from '@/lib/ai';
import { orchestrateSupportRequest } from '@/lib/ai/orchestrator';
import {
  getProviderUnavailableMessage,
  getRedSafetyMessage,
  getUnsafeOutputMessage,
  presentationForLevel,
  validateModelOutput,
} from '@/lib/safety/policy';
import { classifySafety, mostProtectiveLevel } from '@/lib/safety/classify';
import { schoolSupportConfig } from '@/lib/school/config';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { SUPPORT_TOPICS, type ChatApiResponse, type ChatHistoryMessage } from '@/lib/types';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const historyItem = z.object({
  // Assistant messages are never accepted from the browser: a forged assistant
  // turn could otherwise be inserted into trusted-looking model context.
  role: z.literal('user'),
  content: z.string().trim().min(1).max(1200),
});

const requestSchema = z.object({
  sessionId: z.string().trim().min(8).max(100),
  message: z.string().trim().min(1).max(2000),
  topicHint: z.enum(SUPPORT_TOPICS).optional(),
  history: z.array(historyItem).max(8).optional().default([]),
});

function response(
  message: string,
  supportLevel: ChatApiResponse['supportLevel'],
  providerAvailable: boolean,
  status = 200,
) {
  return NextResponse.json<ChatApiResponse>(
    { message, supportLevel, providerAvailable, ...presentationForLevel(supportLevel) },
    { status, headers: noStoreHeaders() },
  );
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(requestRateLimitKey(request, 'chat'), 12, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Bạn đã gửi khá nhiều tin nhắn. Hãy thử lại sau ít phút.' },
      { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: z.infer<typeof requestSchema>;
  try {
    payload = requestSchema.parse(await readJsonRequest(request, 20 * 1024));
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    return NextResponse.json(
      { error: status === 413 ? 'Nội dung gửi lên quá lớn.' : 'Tin nhắn chưa hợp lệ hoặc quá dài.' },
      { status, headers: noStoreHeaders() },
    );
  }

  const deterministic = classifySafety(payload.message);
  if (deterministic.level === 'red') {
    // The deterministic urgent path intentionally does not call an AI provider.
    return response(getRedSafetyMessage(schoolSupportConfig), 'red', false);
  }

  let supportLevel: Exclude<ChatApiResponse['supportLevel'], 'red'> = deterministic.level;
  try {
    // The guardrail can escalate a case but must never reduce deterministic safety.
    const modelSafety = await getSafetyProvider().assess(payload.message);
    const evaluatedLevel = mostProtectiveLevel(deterministic.level, modelSafety || 'green');
    if (evaluatedLevel === 'red') {
      return response(getRedSafetyMessage(schoolSupportConfig), 'red', false);
    }
    supportLevel = evaluatedLevel;

    const orchestration = orchestrateSupportRequest(payload.message, payload.topicHint);
    const output = await getChatProvider().generate({
      message: payload.message,
      history: payload.history as ChatHistoryMessage[],
      supportLevel,
      assistantModule: orchestration.module,
      topicHint: orchestration.topicHint,
      schoolSupport: schoolSupportConfig,
    });

    const validation = validateModelOutput(output.text);
    if (!validation.safe) {
      // Suppress unsafe model output without incorrectly labelling the student
      // as an urgent case when the input did not indicate one.
      return response(getUnsafeOutputMessage(), supportLevel, false, 503);
    }

    // This optional second pass is an additional guardrail, not a guarantee.
    // Provider failure/ambiguous output cannot lower the deterministic level.
    const outputSafety = await getSafetyProvider().isOutputSafe(output.text);
    if (outputSafety === false) {
      return response(getUnsafeOutputMessage(), supportLevel, false, 503);
    }

    return response(output.text, supportLevel, true);
  } catch {
    return response(getProviderUnavailableMessage(), supportLevel, false, 503);
  }
}
