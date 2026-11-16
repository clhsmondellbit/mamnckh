# MẦM AI — Phase 02 implementation notes

**Snapshot:** 2026-11-15  
**Branch:** `feat/mam-next`  
**Release state:** NOT READY FOR PUBLIC STUDENT DEPLOYMENT

This document describes code present in this repository snapshot. It does not represent a production certification. External services, database migrations, and a clean production build were not available for end-to-end verification in the working environment.

## 1. Phase 02 modules in this snapshot

| Module | Status | Implementation boundary |
|---|---|---|
| Private Studio / encrypted local vault | PARTIALLY COMPLETED | Browser Web Crypto AES-GCM + PBKDF2-derived key; ciphertext in IndexedDB; user-held passphrase; CRUD/export/delete; no server recovery; device/browser compromise and XSS are outside this protection boundary. Browser execution and persistence tests still need a browser runner. |
| Story Journal | PARTIALLY COMPLETED | Text entries, tags, search, edit, delete, JSON export and opt-in legacy localStorage import. No image attachment or cloud sync. |
| Memory Graph | PARTIALLY COMPLETED | User-entered nodes and user-selected single links; no automatic inference or graph-layout engine. |
| Daily Reflection | PARTIALLY COMPLETED | User-controlled daily reflection entries in encrypted local vault. No reminders or streak pressure. |
| Guided Journeys | PARTIALLY COMPLETED | Eight authored reflection journeys with locally persisted step completion/notes; not therapy or a validated intervention. |
| Scenario Lab | PARTIALLY COMPLETED | Authored branching communication scenarios and qualitative reflection; no dynamic AI roleplay or personality scores. |
| Perspective Explorer | PARTIALLY COMPLETED | Structured reflection prompts saved by user into journal; does not claim to know another person's thoughts. |
| Insight Studio | PARTIALLY COMPLETED | Counts and summaries over user-selected locally stored records; no statistical inference, causal attribution or wellbeing score. |
| Conversation Debrief | PARTIALLY COMPLETED | User-authored debrief template; no automatic AI summarization or transcript import. |
| Personal Toolkit | PARTIALLY COMPLETED | Starter tools and user-created collections, stored locally in encrypted vault. |
| MẦM Voice | PARTIALLY COMPLETED | Browser SpeechRecognition and SpeechSynthesis controls; browser/provider may process speech externally. No streaming AI voice conversation, no raw audio storage by this app. |
| Knowledge Library | PARTIALLY COMPLETED | PostgreSQL full-text (lexical) retrieval; documents have publisher/authors/URL/language/evidence type/verification timestamp; citations link to source. No embeddings/vector retrieval, ingestion parser, or automatic scientific source verification. |
| Knowledge ingestion | PARTIALLY COMPLETED | Staff role-gated API, content length limits, HTTPS source URL validation, chunking and transactionally written document/chunks/audit. No ingestion UI, no arbitrary URL fetching, no malware scanning for uploads because file upload is not implemented. |
| Chat context | PARTIALLY COMPLETED | Small server-created AES-256-GCM HttpOnly cookie, scoped to `/api/chat`, bound to a client session ID, expires after two hours. It is not durable server database history and does not sync across devices. |
| Multi-provider | PARTIALLY COMPLETED | OpenRouter remains supported; one OpenAI-compatible chat adapter is selectable via environment. No independently integrated provider-specific SDKs, provider health service, streaming, cost ledger, or automated fallback. Safety checks remain separately tied to OpenRouter. |
| Research Lab | PARTIALLY COMPLETED | Staff-only page and synthetic regression dataset; tests deterministic routing/safety expectations. No model evaluation runs, scorecard storage, human-subject research workflow, or GPT/Gemini/Claude comparison results. |
| Multilingual | PARTIALLY COMPLETED | Studio has Vietnamese/English labels for its top-level controls; the entire application, prompts, knowledge corpus and all component copy are not localized. |
| Accessibility preferences | PARTIALLY COMPLETED | Studio font scaling and high-contrast preference; system-level reduced-motion and semantic elements remain. No full WCAG audit or global accessibility settings page. |
| Resource Finder | PARTIALLY COMPLETED | `/knowledge` search over published, staff-verified library records plus existing support resources. No geographic search or live source discovery. |

## 2. Architecture and data flows

### Private data

The Private Studio is intentionally local-first. A passphrase is processed by PBKDF2 (310,000 SHA-256 iterations) with a random salt to derive an AES-256-GCM key. Each record is encrypted with a fresh 96-bit IV before being stored in IndexedDB. The raw passphrase and decrypted records are not intentionally persisted by the vault module. A user can export decrypted JSON; that export is plaintext and must be stored carefully. Browser XSS, malicious extensions, device compromise, an unlocked browser profile, browser backups, and passphrase loss remain risks.

The old journal in `localStorage` is not silently migrated. The user must explicitly start import, then separately choose whether to delete the legacy plaintext copy. Imported legacy IDs are retained as deduplication markers so retrying does not create duplicate copies.

### Chat context

The chat endpoint no longer accepts browser-supplied assistant transcript messages. A successful conversation turn is placed in a small authenticated encrypted cookie created by the server. The cookie is bound to the supplied session ID and expires after two hours. This reduces trust in browser-provided history, but it is only short-lived context; it is not persistent cross-device memory, and it remains a browser cookie. Set `CONVERSATION_SECRET` to a distinct high-entropy secret (32+ characters); `AUTH_SECRET` is a compatibility fallback only.

### Knowledge retrieval

Migration `003_knowledge_library.sql` creates source metadata, chunks, PostgreSQL `tsvector` search, and an ingestion audit table. Published records require `verified_at`. Search only returns published and verified records for the requested language. Search is lexical full-text retrieval using PostgreSQL's `simple` text configuration. It is not semantic/vector RAG. Retrieved sources are displayed in the library page; AI chat does not yet automatically inject retrieved excerpts or generate model answers with citations.

## 3. Configuration and database setup

Required for the knowledge library:

- `DATABASE_URL`
- PostgreSQL with `pgcrypto` support (the prior migration creates it)
- `sql/schema.sql`
- `sql/migrations/002_school_support_center.sql`
- `sql/migrations/003_knowledge_library.sql`

Staff ingestion additionally requires `ENABLE_STAFF_DASHBOARD=true`, a valid staff session, and one of `super_admin`, `admin`, or `content_manager`.

For the optional OpenAI-compatible chat adapter:

- `AI_PROVIDER=openai-compatible`
- `AI_API_KEY`
- `AI_BASE_URL` (HTTPS in production; localhost HTTP is allowed only in non-production)
- `AI_MODEL`

For OpenRouter, keep `AI_PROVIDER=openrouter` and configure `OPENROUTER_API_KEY`. Safety classification and output checks still use the OpenRouter safety provider in this implementation; do not switch to another chat provider while assuming safety has been migrated with it.

Set `CONVERSATION_SECRET` to a separate high-entropy value. Never expose any provider key or secret to client code or commit real secrets.

## 4. Verification status and known blockers

The supplied environment did not have `node_modules`. Node and npm are available, but network DNS could not resolve `registry.npmjs.org` or `github.com`. `npm ci` and `npm audit` therefore could not complete; the lockfile was not rewritten manually. Full TypeScript typecheck, ESLint, Vitest, DB migration, browser persistence tests, and production build remain unverified until a clean dependency install and test services are available.

A syntax-only transpilation scan covered 114 `.ts`/`.tsx` files with zero syntax diagnostics. A separate isolated Node harness passed 29/29 assertions across vault validation, chunking, eight synthetic safety classifications, eight routing cases, and three encrypted-cookie checks. These checks transpile selected modules and mock `server-only`; they are not Vitest, browser, database, or provider integration tests. They do not replace typecheck, lint, tests, or build. `scripts/smoke.mjs` requires a running built app and is not considered passed unless executed against one.

## 5. Production blockers

1. Resolve and verify current Next.js, React and transitive dependency advisories with a reachable registry; update manifest and lockfile together using npm.
2. Run clean `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and `npm audit --audit-level=high`.
3. Apply migration 003 to staging and test document ingestion, role checks, full-text search, query load and deletion/retention policies.
4. Test Private Studio in supported browsers for IndexedDB transactions, recovery after reload, wrong passphrase, export/import, delete, and XSS CSP posture.
5. Decide whether school deployment requires managed key storage, server-side encrypted user identity, data backup/restore, retention and account-level data export/deletion. The current local vault is not an organization-managed archive.
6. Complete end-to-end safety tests and manual review with qualified safeguarding professionals before using with students. The AI does not diagnose and the deterministic/model safety paths are not a validated clinical risk instrument.
7. Implement a real content-ingestion workflow with editorial review, source ownership, review date and archival process. Do not represent the current metadata timestamp as independent validation of research quality.
8. Do not market MẦM Voice as realtime AI conversation, Insight Studio as validated psychometrics, or the Research Lab as an AI benchmark.

## 6. Phase 02 feature status summary

- **COMPLETED:** none of the large product capabilities are declared fully completed at production level in this snapshot.
- **PARTIALLY COMPLETED:** the modules in the table above have working source paths and are connected to local/browser or database-backed flows as described; deployment verification is still blocked.
- **BLOCKED:** clean dependency installation and all checks requiring installed dependencies, remote registry access, a PostgreSQL service, a configured AI provider, and browser automation.
- **NOT IMPLEMENTED:** server-side long-term memory, vector embeddings, retrieval-augmented chat answers, realtime streaming voice, cloud multimedia journal, global i18n, automatic reminders, model-comparison benchmark runner, persisted evaluation scorecards, and global WCAG verification.
