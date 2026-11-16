-- Curated, source-attributed psychological knowledge library.
-- Apply after 002_school_support_center.sql. Search uses PostgreSQL full-text
-- retrieval; this migration intentionally does not claim vector/embedding RAG.
BEGIN;

create table if not exists knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 3 and 240),
  summary text not null default '' check (length(summary) <= 1200),
  publisher text not null check (length(publisher) between 2 and 180),
  authors text[] not null default '{}',
  source_url text not null check (source_url ~ '^https://'),
  published_at date,
  verified_at timestamptz,
  language text not null check (language in ('vi','en')),
  evidence_type text not null check (evidence_type in ('guideline','systematic_review','research','educational')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  content_sha256 char(64) not null unique,
  created_by uuid references staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_published_requires_verification check (status <> 'published' or verified_at is not null)
);

create index if not exists knowledge_documents_published_idx
  on knowledge_documents(language, status, verified_at desc)
  where status = 'published' and verified_at is not null;

create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references knowledge_documents(id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null check (length(content) between 1 and 5000),
  search_vector tsvector generated always as (to_tsvector('simple', content)) stored,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists knowledge_chunks_document_idx on knowledge_chunks(document_id, chunk_index);
create index if not exists knowledge_chunks_search_idx on knowledge_chunks using gin(search_vector);

create table if not exists knowledge_ingest_audit (
  id bigserial primary key,
  document_id uuid references knowledge_documents(id) on delete set null,
  actor_staff_user_id uuid references staff_users(id) on delete set null,
  action text not null check (action in ('created','updated','published','archived')),
  chunk_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists knowledge_ingest_audit_created_idx on knowledge_ingest_audit(created_at desc);

COMMIT;
