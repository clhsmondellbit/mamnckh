import 'server-only';
import { getKnowledgeDatabase } from '@/lib/db/client';

export type KnowledgeSearchResult = {
  documentId: string;
  title: string;
  summary: string;
  publisher: string;
  authors: string[];
  sourceUrl: string;
  publishedAt: string | null;
  verifiedAt: string;
  language: 'vi' | 'en';
  evidenceType: string;
  excerpt: string;
  relevance: number;
};

export async function searchKnowledge(query: string, language: 'vi' | 'en' = 'vi', limit = 6): Promise<KnowledgeSearchResult[]> {
  const normalized = query.trim().slice(0, 180);
  if (!normalized) return [];
  const sql = getKnowledgeDatabase();
  const rows = await sql<KnowledgeSearchResult[]>`
    select
      d.id as "documentId",
      d.title,
      d.summary,
      d.publisher,
      d.authors,
      d.source_url as "sourceUrl",
      d.published_at::text as "publishedAt",
      d.verified_at::text as "verifiedAt",
      d.language,
      d.evidence_type as "evidenceType",
      left(c.content, 900) as excerpt,
      ts_rank_cd(c.search_vector, plainto_tsquery('simple', ${normalized}))::float8 as relevance
    from knowledge_chunks c
    join knowledge_documents d on d.id = c.document_id
    where d.status = 'published'
      and d.verified_at is not null
      and d.language = ${language}
      and c.search_vector @@ plainto_tsquery('simple', ${normalized})
    order by relevance desc, d.verified_at desc
    limit ${Math.max(1, Math.min(limit, 10))}
  `;
  return rows;
}
