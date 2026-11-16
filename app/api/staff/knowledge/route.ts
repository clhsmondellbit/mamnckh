import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentStaffSession, isStaffFeatureEnabled, staffHasRole } from '@/lib/auth/staff';
import { ingestKnowledgeDocument } from '@/lib/knowledge/ingest';
import { isSameOriginRequest, JsonRequestError, noStoreHeaders, readJsonRequest } from '@/lib/security/request';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';

const schema = z.object({
  title: z.string().trim().min(3).max(240),
  summary: z.string().trim().max(1200).default(''),
  content: z.string().trim().min(100).max(120000),
  publisher: z.string().trim().min(2).max(180),
  authors: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  sourceUrl: z.string().url().max(2048),
  publishedAt: z.string().date().optional(),
  verifiedAt: z.string().datetime().optional(),
  language: z.enum(['vi', 'en']),
  evidenceType: z.enum(['guideline', 'systematic_review', 'research', 'educational']),
  status: z.enum(['draft', 'published']).default('draft'),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403, headers: noStoreHeaders() });
  if (!isStaffFeatureEnabled()) return NextResponse.json({ error: 'Khu vực quản trị tri thức chưa được cấu hình.' }, { status: 503, headers: noStoreHeaders() });
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin', 'admin', 'content_manager'])) return NextResponse.json({ error: 'Bạn không có quyền quản lý tài liệu tri thức.' }, { status: 403, headers: noStoreHeaders() });
  const limit = checkRateLimit(requestRateLimitKey(request, 'knowledge-ingest'), 8, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Bạn đã nhập tài liệu quá thường xuyên. Hãy thử lại sau.' }, { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } });
  try {
    const input = schema.parse(await readJsonRequest(request, 128 * 1024));
    const result = await ingestKnowledgeDocument({ ...input, createdBy: actor!.id });
    return NextResponse.json({ ok: true, documentId: result.documentId, chunkCount: result.chunkCount, contentHash: result.contentHash, action: result.action }, { status: result.created ? 201 : 200, headers: noStoreHeaders() });
  } catch (error) {
    const status = error instanceof JsonRequestError ? error.status : 400;
    const message = error instanceof Error ? error.message : 'Không thể nhập tài liệu.';
    return NextResponse.json({ error: status === 413 ? 'Tài liệu vượt quá giới hạn dung lượng.' : message.slice(0, 240) }, { status, headers: noStoreHeaders() });
  }
}
