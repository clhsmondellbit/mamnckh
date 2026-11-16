import { getChatProvider, getSafetyProvider } from '@/lib/ai';
import { CHAT_CONTEXT_COOKIE, conversationContextConfigured, createServerConversationContextCookie, getConversationContextCookieOptions, readServerConversationContext } from '@/lib/ai/server-context';
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
import { SUPPORT_TOPICS, type ChatApiResponse } from '@/lib/types';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

const requestSchema = z.object({
  sessionId: z.string().trim().min(8).max(100),
  message: z.string().trim().min(1).max(2000),
  topicHint: z.enum(SUPPORT_TOPICS).optional(),
  mode: z.enum(['free_talk', 'emotional_support', 'self_understanding', 'problem_exploration', 'decision_support', 'social_relationships']).optional(),
});

function response(
  message: string,
  supportLevel: ChatApiResponse['supportLevel'],
  providerAvailable: boolean,
  status = 200,
  contextAvailable = conversationContextConfigured(),
) {
  return NextResponse.json<ChatApiResponse>(
    { message, supportLevel, providerAvailable, contextAvailable, ...presentationForLevel(supportLevel) },
    { status, headers: noStoreHeaders() },
  );
}

function clearConversationContext(responseObject: NextResponse) {
  responseObject.cookies.set(CHAT_CONTEXT_COOKIE, '', { ...getConversationContextCookieOptions(), maxAge: 0 });
  return responseObject;
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
    return clearConversationContext(response(getRedSafetyMessage(schoolSupportConfig), 'red', false));
  }

  let supportLevel: Exclude<ChatApiResponse['supportLevel'], 'red'> = deterministic.level;
  try {
    // The guardrail can escalate a case but must never reduce deterministic safety.
    const modelSafety = await getSafetyProvider().assess(payload.message);
    // Unknown is not GREEN. If the required guardrail cannot complete, do not
    // send this message to the chat model or present an unchecked response.
    if (modelSafety === null) {
      return clearConversationContext(response(getProviderUnavailableMessage(), deterministic.level, false, 503));
    }
    const evaluatedLevel = mostProtectiveLevel(deterministic.level, modelSafety);
    if (evaluatedLevel === 'red') {
      return clearConversationContext(response(getRedSafetyMessage(schoolSupportConfig), 'red', false));
    }
    supportLevel = evaluatedLevel;

    const orchestration = orchestrateSupportRequest(payload.message, payload.topicHint, payload.mode);
    const serverHistory = readServerConversationContext(request.cookies.get(CHAT_CONTEXT_COOKIE)?.value, payload.sessionId);
    const output = await getChatProvider().generate({
      message: payload.message,
      history: serverHistory,
      supportLevel,
      assistantModule: orchestration.module,
      conversationStrategy: orchestration.strategy,
      conversationMode: orchestration.mode,
      topicHint: orchestration.topicHint,
      schoolSupport: schoolSupportConfig,
    });

    const validation = validateModelOutput(output.text);
    if (!validation.safe) {
      // Suppress unsafe model output without incorrectly labelling the student
      // as an urgent case when the input did not indicate one.
      return clearConversationContext(response(getUnsafeOutputMessage(), supportLevel, false, 503));
    }

    // A second, explicit output verdict is required before a model answer is shown.
    const outputSafety = await getSafetyProvider().isOutputSafe(output.text);
    // Only an explicit SAFE result passes the second guardrail. Unknown and
    // unavailable results are treated conservatively.
    if (outputSafety !== true) {
      return clearConversationContext(response(getUnsafeOutputMessage(), supportLevel, false, 503));
    }

    const successfulResponse = response(output.text, supportLevel, true);
    const encryptedContext = createServerConversationContextCookie(
      payload.sessionId,
      serverHistory,
      payload.message,
      output.text,
    );
    if (encryptedContext) successfulResponse.cookies.set(CHAT_CONTEXT_COOKIE, encryptedContext, getConversationContextCookieOptions());
    else successfulResponse.cookies.set(CHAT_CONTEXT_COOKIE, '', { ...getConversationContextCookieOptions(), maxAge: 0 });
    return successfulResponse;
  } catch {
    return clearConversationContext(response(getProviderUnavailableMessage(), supportLevel, false, 503));
  }
}
