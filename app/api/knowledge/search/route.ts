import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge } from '@/lib/knowledge/search';
import { isKnowledgeDatabaseConfigured } from '@/lib/db/client';
import { checkRateLimit, requestRateLimitKey } from '@/lib/security/rate-limit';
import { noStoreHeaders } from '@/lib/security/request';

export async function GET(request: NextRequest) {
  const limit = checkRateLimit(requestRateLimitKey(request, 'knowledge-search'), 25, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: 'Bạn đã tìm kiếm nhiều lần. Hãy thử lại sau ít phút.' }, { status: 429, headers: { ...noStoreHeaders(), 'Retry-After': String(limit.retryAfterSeconds) } });
  const query = request.nextUrl.searchParams.get('q')?.trim() || '';
  const languageValue = request.nextUrl.searchParams.get('lang') || 'vi';
  const language = languageValue === 'en' ? 'en' : 'vi';
  if (query.length < 2 || query.length > 180) return NextResponse.json({ error: 'Từ khóa cần từ 2 đến 180 ký tự.' }, { status: 400, headers: noStoreHeaders() });
  if (!isKnowledgeDatabaseConfigured()) return NextResponse.json({ error: 'Thư viện tri thức chưa được kết nối với cơ sở dữ liệu.' }, { status: 503, headers: noStoreHeaders() });
  try {
    const results = await searchKnowledge(query, language, 8);
    return NextResponse.json({ results, retrieval: 'postgres-full-text', notice: 'Kết quả chỉ gồm tài liệu đã được nhân sự xác minh và xuất bản.' }, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ error: 'Không thể truy vấn thư viện tri thức lúc này.' }, { status: 503, headers: noStoreHeaders() });
  }
}
