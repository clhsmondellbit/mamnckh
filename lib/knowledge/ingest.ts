import 'server-only';
import { createHash } from 'node:crypto';
import { getKnowledgeDatabase } from '@/lib/db/client';
import { splitKnowledgeDocument } from '@/lib/knowledge/chunking';

export type KnowledgeDocumentInput = {
  title: string;
  summary: string;
  content: string;
  publisher: string;
  authors: string[];
  sourceUrl: string;
  publishedAt?: string;
  verifiedAt?: string;
  language: 'vi' | 'en';
  evidenceType: 'guideline' | 'systematic_review' | 'research' | 'educational';
  status: 'draft' | 'published';
  createdBy: string;
};

export async function ingestKnowledgeDocument(input: KnowledgeDocumentInput) {
  if (input.status === 'published' && !input.verifiedAt) throw new Error('Published documents require a verifiedAt timestamp');
  if (input.verifiedAt && (!Number.isFinite(Date.parse(input.verifiedAt)) || Date.parse(input.verifiedAt) > Date.now())) {
    throw new Error('verifiedAt must be a valid timestamp that is not in the future');
  }
  const chunks = splitKnowledgeDocument(input.content);
  if (!chunks.length) throw new Error('Document has no extractable text');
  if (chunks.length > 160) throw new Error('Document is too large to ingest in one request');

  const source = new URL(input.sourceUrl);
  if (source.protocol !== 'https:' || source.username || source.password) throw new Error('Knowledge source URL must use HTTPS without credentials');
  const hash = createHash('sha256').update(`${input.title}\n${input.sourceUrl}\n${input.content}`, 'utf8').digest('hex');
  const sql = getKnowledgeDatabase();

  return sql.begin(async (transaction) => {
    const docs = await transaction<{ id: string; inserted: boolean }[]>`
      insert into knowledge_documents (
        title, summary, publisher, authors, source_url, published_at,
        verified_at, language, evidence_type, status, content_sha256, created_by
      ) values (
        ${input.title}, ${input.summary}, ${input.publisher}, ${input.authors}, ${input.sourceUrl},
        ${input.publishedAt || null}, ${input.verifiedAt || null}, ${input.language},
        ${input.evidenceType}, ${input.status}, ${hash}, ${input.createdBy}
      )
      on conflict (content_sha256) do update set
        title = excluded.title,
        summary = excluded.summary,
        publisher = excluded.publisher,
        authors = excluded.authors,
        source_url = excluded.source_url,
        published_at = excluded.published_at,
        verified_at = excluded.verified_at,
        language = excluded.language,
        evidence_type = excluded.evidence_type,
        status = excluded.status,
        updated_at = now()
      returning id, (xmax = 0) as inserted
    `;
    const documentId = docs[0]?.id;
    if (!documentId) throw new Error('Knowledge document could not be saved');
    await transaction`delete from knowledge_chunks where document_id = ${documentId}`;
    for (const chunk of chunks) {
      await transaction`
        insert into knowledge_chunks (document_id, chunk_index, content)
        values (${documentId}, ${chunk.index}, ${chunk.content})
      `;
    }
    const action = input.status === 'published' ? 'published' : docs[0].inserted ? 'created' : 'updated';
    await transaction`
      insert into knowledge_ingest_audit(document_id, actor_staff_user_id, action, chunk_count)
      values(${documentId}, ${input.createdBy}, ${action}, ${chunks.length})
    `;
    return { documentId, chunkCount: chunks.length, contentHash: hash, action, created: docs[0].inserted };
  });
}
