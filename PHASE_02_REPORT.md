# MẦM AI — Phase 02 Final Delivery Report

**Snapshot date:** 2026-11-15  
**Branch:** `feat/mam-next`  
**HEAD:** `bc103fd`  
**Release decision:** **NOT READY FOR PUBLIC STUDENT DEPLOYMENT**

This report records the implementation present in the delivered repository snapshot. It does not certify production readiness. The source tree contained substantial pre-existing Phase 01 modifications and could not be clean-installed because the npm registry DNS was unavailable. Work in Phase 02 was applied on top of that exact source tree; no reset, cleanup, branch switch, commit, or push was performed.

## 1. Executive summary

The Phase 02 work adds a privacy-first Private Studio, short-lived server-managed chat context, a PostgreSQL source-attributed knowledge library, an optional OpenAI-compatible chat adapter, a staff-only synthetic research view, and supporting tests/documentation. Existing school support and staff-management flows remain in the source tree.

The product is more complete at the source level, but it is **not a completed Psychological AI Platform**. The Private Studio data remains local to the browser profile; the knowledge search is lexical PostgreSQL full-text retrieval, not vector RAG; there is no durable long-term memory service; voice is browser speech recognition/synthesis, not realtime AI voice; Insight Studio is descriptive rather than statistical; and Research Lab does not run live model benchmarks.

The most important release blocker is dependency security: the repository still pins Next.js 16.3.8 and React/React DOM 19.0.0. Current official advisories cover those version ranges. Dependency updates were not attempted by manually editing the lockfile because `registry.npmjs.org` could not be resolved. A clean install, audit, semantic typecheck, lint, Vitest run, database integration and production build remain outstanding.

## 2. Repository preservation and Git state

- Source provided by the user: Phase 01 upgraded ZIP containing a Git repository.
- Active branch: `feat/mam-next`.
- HEAD: `bc103fd` (`Merge pull request #5 from syxduy-gif/main`).
- Local tracking reference: `origin/feat/mam-next`; `upstream/main` also points to the same local commit in the supplied snapshot. Remote state was not fetched because GitHub DNS was unavailable.
- At initial inspection, the working tree already had 126 tracked paths modified and 4 untracked paths. These were treated as user-owned work and retained.
- At final inspection, Git reported 126 tracked paths modified and 22 untracked paths. The increase is from Phase 02 additions; all pre-existing changes remain in the tree.
- No `git reset`, `git clean`, destructive checkout, commit, or push was run.
- Only `.env.example` was found in the repository root; no `.env` or `.env.local` was included in the delivered source archive.

## 3. Architecture and implementation changes

### 3.1 Private Studio and local encrypted vault

**Source:**
- `lib/privacy/private-vault.ts`
- `components/studio/personal-studio.tsx`
- `app/studio/page.tsx`
- `app/journal/page.tsx`
- `components/layout/site-header.tsx`

Implemented source paths:
- PBKDF2-SHA-256 with 310,000 iterations derives an AES-256-GCM key from the user's passphrase.
- Fresh 96-bit random IVs encrypt each record before it is stored in IndexedDB.
- Vault operations include list, save/update, delete, export and erase.
- Legacy journal import requires an explicit user action; deletion of the old plaintext localStorage copy requires a separate confirmation. Legacy IDs are retained for import deduplication.
- Stable IDs such as `journey:self` are accepted; invalid path-like IDs are rejected.
- `/journal` redirects to `/studio` while legacy browser journal data remains available for opt-in import.

**Boundary:** this is device/browser-profile local storage, not server-managed account storage. The passphrase is not recoverable. It does not protect against XSS, malicious extensions, a compromised browser/device, access to an unlocked profile, or decrypted JSON exports. Browser persistence and cross-browser behavior have not been tested with Playwright or real browsers. New Private Studio data is not sent to AI.

### 3.2 Server-managed short conversation context

**Source:**
- `lib/ai/server-context.ts`
- `app/api/chat/route.ts`
- `components/chat/chat-experience.tsx`
- `lib/types.ts`

Implemented source paths:
- The chat API no longer accepts client-supplied assistant history.
- The server can store up to four recent messages in an AES-256-GCM cookie with `HttpOnly`, `SameSite=Strict`, path `/api/chat`, and a two-hour TTL.
- The encrypted context is bound to the client session ID. A mismatched session or altered authentication tag is rejected.
- If `CONVERSATION_SECRET` (or the compatibility fallback `AUTH_SECRET`) is absent or too short, chat continues without historical context rather than creating an unprotected transcript.
- Input/output safety failures clear the context cookie.

**Boundary:** this is short-lived browser-cookie context, not a PostgreSQL transcript, cross-device sync, user-controlled long-term memory, summarization or memory graph. The provider receives the current user message and, when configured, up to four prior messages from the encrypted cookie.

### 3.3 AI provider adapter

**Source:**
- `lib/ai/compatible-provider.ts`
- `lib/ai/index.ts`
- `.env.example`
- `ENV_SETUP.md`

OpenRouter remains supported. A second adapter supports the OpenAI-compatible `/chat/completions` API contract through server-side environment configuration (`AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`). It validates HTTPS in production, permits localhost HTTP only outside production, has a request timeout and does not automatically retry.

**Boundary:** this is not separate native SDK integration for each vendor. Safety assessment and output review remain tied to the configured OpenRouter safety provider. No provider health registry, streaming, model failover, per-user token budget, or cost ledger is implemented. No real provider end-to-end request was possible without credentials.

### 3.4 Psychological knowledge library

**Source:**
- `lib/knowledge/chunking.ts`
- `lib/knowledge/ingest.ts`
- `lib/knowledge/search.ts`
- `app/api/knowledge/search/route.ts`
- `app/api/staff/knowledge/route.ts`
- `components/knowledge/knowledge-search.tsx`
- `app/knowledge/page.tsx`
- `sql/migrations/003_knowledge_library.sql`

Implemented source paths:
- PostgreSQL tables for source-attributed documents, chunks and ingest audit records.
- Chunking with bounded size and overlap.
- Staff-role-gated ingestion, request-size limits, same-origin check and rate limit.
- HTTPS-only source URL validation; the server does not fetch submitted URLs.
- Document, chunks and audit metadata are written in one database transaction.
- Search returns published, staff-verified documents using PostgreSQL full-text (`tsvector`/`plainto_tsquery`) and source links.

**Boundary:** retrieval is lexical full-text search, not embeddings or vector search. There is no document upload/parser/virus scanning, automatic scientific source verification, vector relevance benchmark, or RAG context injection into chat. `verified_at` records an editor attestation, not independent scientific verification. Migration 003 and access checks need staging database tests.

### 3.5 Research Lab and regression data

**Source:**
- `data/research/psychological-evaluation.json`
- `tests/research/psychological-regression.test.ts`
- `app/staff/research/page.tsx`
- `package.json` (`research:eval`)

A staff-only Research Lab page documents an eight-case synthetic Vietnamese regression set for deterministic safety labels and orchestration modules. It explicitly states that the dataset does not benchmark model quality or compare GPT/Gemini/Claude.

**Boundary:** no actual model evaluations, benchmark run database, model/prompt version scorecards, fairness study, human evaluation workflow, or comparative results are implemented.

### 3.6 Product experience and navigation

`/studio` groups Story Journal, Memory Graph, Daily Reflection, Guided Journeys, Scenario Lab, Perspective Explorer, Insight Studio, Conversation Debrief, Personal Toolkit and MẦM Voice. These are deliberately described as partial, authored/local-first tools rather than clinical tests or model-powered workflows.

MẦM Voice uses browser Web Speech APIs after user acknowledgement. It is not a realtime AI conversation; the browser may process audio through its own recognition service. Raw audio is not archived by the MẦM application, and transcript saving is an explicit action.

Studio exposes partial Vietnamese/English control labels, font-size and high-contrast options. This is not global application localization or a WCAG conformance audit.

## 4. Feature completion matrix

Status is based on the actual implementation boundary in this snapshot. A page/component by itself is not treated as completion.

| Capability | Status | Data/API and verification boundary |
|---|---|---|
| Private encrypted vault | PARTIALLY COMPLETED | IndexedDB ciphertext; browser execution and recovery/export flows still need browser tests. |
| Story Journal | PARTIALLY COMPLETED | Local encrypted text CRUD, tags, search, export and opt-in legacy import; no images or cloud sync. |
| Memory Graph | PARTIALLY COMPLETED | User-authored nodes and explicitly selected links; no automatic relation inference or graph engine. |
| Daily Reflection | PARTIALLY COMPLETED | User-authored entries in local encrypted vault; no scheduled nudges. |
| Guided Journeys | PARTIALLY COMPLETED | Eight authored reflection journeys; not validated therapy/intervention. |
| Scenario Lab | PARTIALLY COMPLETED | Three authored branching scenarios; no dynamic AI roleplay. |
| Perspective Explorer | PARTIALLY COMPLETED | User-led worksheet; does not infer another person's thoughts. |
| Insight Studio | PARTIALLY COMPLETED | Descriptive counts/summaries only; no statistical pattern detection or causal inference. |
| Conversation Debrief | PARTIALLY COMPLETED | Manual template; no AI transcript summarization. |
| Personal Toolkit | PARTIALLY COMPLETED | Starter/custom tools stored in encrypted local vault. |
| MẦM Voice | PARTIALLY COMPLETED | Browser speech recognition/synthesis; no realtime AI voice transport. |
| Knowledge Library | PARTIALLY COMPLETED | PostgreSQL lexical search and source citations; no vector RAG. |
| Staff knowledge ingestion | PARTIALLY COMPLETED | Role-gated API and transactional audit; no editorial CMS or automatic source validation. |
| Short-term chat context | PARTIALLY COMPLETED | Encrypted HttpOnly cookie up to four messages/two hours; no database transcript or long-term memory. |
| Multi-provider chat | PARTIALLY COMPLETED | OpenRouter + one OpenAI-compatible adapter; safety still depends on OpenRouter. |
| Research Lab | PARTIALLY COMPLETED | Staff-only synthetic regression cases; no live benchmark or comparison results. |
| Multilingual mode | PARTIALLY COMPLETED | Partial Vietnamese/English labels in Studio only; global UI/prompt/knowledge localization absent. |
| Accessibility mode | PARTIALLY COMPLETED | Studio font/contrast options; no full WCAG audit, global controls or screen-reader QA. |
| Resource Finder | PARTIALLY COMPLETED | Searches published local knowledge library; no live geographic/resource search. |
| Emotional Check-in | PARTIALLY COMPLETED | Existing form/API; no longitudinal timeline store. |
| Emotion / Thought Explorer | PARTIALLY COMPLETED | Self-reflection tools; not diagnosis or CBT treatment. |
| Calm Space / grounding | PARTIALLY COMPLETED | Self-guided exercises; no validated guided audio library. |
| Growth Journey / Personal Goals | PARTIALLY COMPLETED | Older session-level tools plus new local journeys; no unified durable growth profile. |
| Personal Pattern Insights | NOT IMPLEMENTED | No longitudinal, consented analytics pipeline; Insight Studio only summarizes local record counts. |
| Emotional Timeline | NOT IMPLEMENTED | No unified timeline aggregation across check-ins, journal, events and goals. |
| Progress Reflection Report | NOT IMPLEMENTED | No report generation from a durable event store. |
| Personal Growth Profile | NOT IMPLEMENTED | No durable user profile beyond the user-authored local records. |
| Human Support / Human Bridge | PARTIALLY COMPLETED | Existing verified directory, voluntary support request and appointment workflows; no automatic content sharing or AI summary transfer. |
| School Psychological Support | PARTIALLY COMPLETED | Existing school-support topics and contact flows; not a full case-management system. |
| Vector RAG and grounded chat answers | NOT IMPLEMENTED | No embeddings/vector index or AI context assembly with retrieved citations. |
| Durable long-term server memory | NOT IMPLEMENTED | No database-backed user memory, provenance controls, expiry, sync or user memory-management center. |
| Realtime AI voice conversation | NOT IMPLEMENTED | Browser transcription/speech only; no streaming audio model integration. |
| Cloud multimedia journal | NOT IMPLEMENTED | No image upload/storage or encrypted cloud media pipeline. |
| Model benchmark runner / scorecards | NOT IMPLEMENTED | No live model evaluation, GPT/Gemini/Claude comparison or persisted scorecards. |
| Global localization / WCAG conformance | NOT IMPLEMENTED | Studio preferences are limited; no app-wide locale or formal accessibility verification. |

No Phase 02 capability is marked `COMPLETED` at production acceptance level in this report.

## 5. Security and privacy

### Improvements in source

- Local Private Studio encrypts persisted record bodies with AES-256-GCM; the passphrase-derived key remains in memory while unlocked.
- Chat no longer trusts assistant history from the browser; context cookie is encrypted, HttpOnly, session-bound and short-lived.
- Knowledge ingestion applies role checks, same-origin enforcement, payload limits, rate limits, HTTPS source validation and a transactionally written audit event.
- Voice controls require an explicit acknowledgement before microphone use and provide stop controls.
- Research is synthetic and is not used to build a student-level psychological score.

### Remaining risks

- Private Studio is not E2E protection against a compromised device, XSS or malicious extensions. Old journal data may remain plaintext in localStorage until the user explicitly migrates and deletes it.
- No central account-level export/deletion/memory-consent service or server-side encrypted personal memory exists.
- School support legacy records may include plaintext fields from older records; review/retention is still an operational task.
- Rate limiting is process-local and not sufficient for a multi-instance public deployment without a shared limiter/WAF.
- `DATA_ENCRYPTION_KEY` rotation is not automated.
- No formal penetration test, browser security test, CSP nonce hardening assessment or human-safeguarding audit was run.

### Dependency security release blocker

The current manifest and lockfile still contain:
- `next@16.3.8`
- `react@19.0.0`
- `react-dom@19.0.0`

Official Next.js advisories include affected Next 16 versions up to 16.4.0 for Critical/High issues fixed from 16.4.1, plus a later advisory affecting versions through 16.4.4 and fixed from 16.4.5. Official package metadata reviewed on 2026-11-15 reported Next 16.4.6 as the latest stable release. React Server Components advisories list the 19.0.x line through versions before 19.0.9 as affected; package metadata reviewed on 2026-11-15 reported React 19.3.1 as latest stable. The actual resolved `react-server-dom-*` graph was not available for inspection because dependencies could not be installed. Condition-specific applicability must be verified against the actual build and runtime.

No dependency update or manual lockfile edit was performed because the npm registry was not reachable. Production deployment is blocked until the exact graph is updated to patched, mutually compatible versions and a clean audit passes.

Authoritative references:
- https://github.com/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/advisories/GHSA-673q-mjm6-r5xr
- https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r
- https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385
- https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3
- https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453
- https://www.npmjs.com/package/next
- https://www.npmjs.com/package/react

## 6. Testing and validation results

| Command/check | Result | Evidence |
|---|---|---|
| TypeScript syntax-only transpile | PASS | 114 `.ts`/`.tsx` files; zero syntax diagnostics, TypeScript 5.8.3 global transpiler. |
| Isolated runtime harness | PASS | 29/29 assertions: vault validation (7), knowledge chunking (3), synthetic safety (8), synthetic routing (8), encrypted context cookie (3). Selected modules were transpiled and `server-only` mocked. |
| `node --check scripts/smoke.mjs` | PASS | Script syntax parses. |
| package/lock JSON parse | PASS | Both JSON files parse. |
| `npm ping --fetch-retries=0 --fetch-timeout=10000` | BLOCKED | `EAI_AGAIN registry.npmjs.org`. |
| `npm ci` | BLOCKED | A prior install attempt timed out; no complete `node_modules` exists. |
| `npm run typecheck` | BLOCKED | Exit 2; 2,843 diagnostics due missing Next/React/Zod/Postgres/Node type packages; six nullability diagnostics are also surfaced because Next redirect typings are unavailable. |
| `npm run lint` | BLOCKED | Exit 127; `eslint` binary unavailable. |
| `npm test -- --reporter=dot` | BLOCKED | Exit 127; `vitest` binary unavailable. |
| `npm run build` | BLOCKED | Exit 127; `next` binary unavailable. |
| `npm audit --audit-level=high` | BLOCKED | Exit 1; registry audit endpoint unavailable due DNS. This is not a clean audit. |
| `node scripts/smoke.mjs` | BLOCKED | Exit 1; no application server at `127.0.0.1:3000`. |
| PostgreSQL migration/integration | BLOCKED | No DB service/credentials in sandbox. |
| Browser QA / accessibility | BLOCKED | No built app/browser automation. |
| Real AI provider tests | BLOCKED | No live provider keys. |

The 29 isolated assertions are not Vitest, browser, DB, provider, penetration, or clinical evaluation. They provide narrow deterministic checks only.

## 7. Deployment and verification instructions

1. In a network-enabled, controlled environment, update Next.js/React and related tooling to patched mutually compatible versions; regenerate `package-lock.json` with npm rather than editing it manually.
2. Run `npm ci`, then `npm audit --audit-level=high`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Resolve all P0/P1 findings before public use.
3. Configure `.env.local` from `.env.example`. Use a new high-entropy `CONVERSATION_SECRET` (32+ characters) separate from `AUTH_SECRET` where possible. Configure `OPENROUTER_API_KEY` for the current safety path. For the compatible adapter, configure `AI_PROVIDER=openai-compatible`, `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL`; do not expose credentials to client bundles.
4. Back up PostgreSQL and apply `sql/schema.sql`, `sql/migrations/002_school_support_center.sql`, then `sql/migrations/003_knowledge_library.sql` in a staging database. Verify rollback/recovery procedures before production migration.
5. Configure real, verified support contacts and role assignments. Do not seed demo phone numbers or staff records.
6. Run DB authorization tests, slot concurrency tests, ingestion transaction tests, browser vault persistence/wrong-passphrase/export/delete tests, voice permission tests, and chat safety/provider failure tests.
7. Complete a safeguarding and privacy review with qualified school personnel before any student rollout. Publish real retention, consent, incident and support procedures.

The `npm run research:eval` command is available in package scripts but could not run because Vitest was unavailable. The smoke script requires a running built app; it is not a substitute for the above tests.

## 8. Known limitations and next technical work

- Update dependency graph after registry access and validate every advisory against the resolved graph.
- Run full CI, database migration/integration and browser QA.
- Implement vector embeddings, RAG-grounded chat assembly and citation correctness tests if a curated corpus and privacy model are approved.
- Implement durable user memory only after identity, consent, access, retention, deletion, export and key-management architecture is defined.
- Build server-side Emotional Timeline, Personal Pattern Insights and user-approved progress reports; do not derive clinical labels or wellbeing scores.
- Add realtime AI voice only after provider capability, streaming, explicit consent and audio retention have been verified.
- Add content CMS/editorial review, model benchmark runner and stored scorecards only with governance and reproducible test sets.
- Complete app-wide localization, keyboard/screen-reader QA and WCAG audit.
- Review school legacy data, shared limiter deployment, key rotation, logging retention, CSP and incident response.

No further phase is initiated by this report. The above items are unresolved Phase 02 release conditions or future implementation gaps.

## 9. Git handoff

- Branch: `feat/mam-next`.
- HEAD: `bc103fd`.
- Tracked paths changed: 126.
- Untracked paths: 23.
- Commit: not created.
- Push: not performed.
- Existing user modifications were preserved and included in the source archive.
