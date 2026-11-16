# MẦM AI — Phase 01 Implementation Report

**Snapshot date:** 2026-11-15  
**Development branch:** `feat/mam-next`  
**Base commit:** `bc103fd`  
**Status:** Partial delivery; not production-ready.

## 1. Repository and change preservation

The supplied archive contained a Git repository on `feat/mam-next`. At inspection time, `HEAD` matched `origin/feat/mam-next`; the working tree already had 126 tracked files modified before this implementation pass. Those pre-existing edits span application routes, UI, database/security modules, dependency manifests and documentation. They were treated as user work and were not reset, checked out, committed or pushed. The implementation edits were made on top of that working tree.

## 2. Implemented in this pass

- Corrected the AI safety provider contract: explicit `green`, `yellow` and `red` are distinct results; `null` means the provider could not produce a valid verdict.
- Chat input guardrail now fails closed when it cannot return an explicit verdict. The chat provider is not called in that case.
- Output guardrail now requires an exact `SAFE` result; `UNSAFE`, malformed output, timeout and provider failure suppress the model response.
- Kept deterministic urgent routing independent of the AI provider, so an urgent deterministic path does not depend on an external guardrail being online.
- Added validated `AI_BASE_URL` handling: HTTPS is required except HTTP to loopback during non-production development; embedded credentials, query strings and fragments are rejected. Provider requests reject redirects to avoid forwarding authorization headers to another location.
- Expanded AI orchestration from first-match routing to multi-signal scoring and added six selectable conversation modes with separate strategy instructions.
- Connected the mode selector in the chat UI to the server-side orchestration and prompt.
- Aligned the chat client history with the API trust boundary: only prior user turns are forwarded; assistant turns are excluded; history is bounded to 8 turns / 2,500 total characters / 1,200 characters per turn to avoid API contract and body-size failures.
- Added interactive student self-support worksheets for calm/grounding, emotion exploration, thought reflection, stress planning, communication, scenario practice, growth steps and wellbeing reflection. These are explicitly session-only, not scored or diagnosed, and not uploaded to an AI provider.
- Expanded the personal journal to create/edit/search/tag/delete/export entries locally. The journal is not attached to AI chat context. Browser local storage is not encrypted and is not suitable for shared-device confidentiality.
- Updated feature, architecture, safety, privacy, security and testing documentation to distinguish what exists from what remains unavailable.
- Added Vitest cases for tri-state safety verdicts, explicit output verdict and provider base-URL validation. They are authored but not run because dependencies could not be installed.

## 3. AI core verification

The runtime smoke harness exercised 16 checks: study multi-signal routing, communication routing, decision-support mode, self-understanding mode, conservative human-support routing, deterministic bullying classification, prompt mode/strategy guidance, safe chat-history filtering and size bounds, explicit GREEN/YELLOW handling, invalid input verdict handling, explicit SAFE, ambiguous output verdict, rejection of insecure provider URLs and a chat-adapter request smoke. All 16 passed in the local harness.

This is not a clinical efficacy evaluation or a benchmark against GPT, Gemini or Claude. No performance or superiority claim is made.

## 4. Feature status

| Capability | Status | Boundary |
|---|---|---|
| AI conversation and six modes | Partially implemented | One OpenRouter provider; browser-only chat sessions; no streaming or persistent history. |
| AI orchestration and fail-closed safety checks | Implemented in source | Requires external safety-model availability for ordinary AI chat; automated tests not yet executed. |
| Emotional check-in | Partially implemented | Current form/API exists, but no user-controlled longitudinal store or timeline. |
| Personal journal | Partially implemented | Local browser storage with edit/search/tags/delete/export; not encrypted and not sent to AI. |
| Emotion Explorer / Thought Explorer / Calm Space | Partially implemented | Self-guided exercises, not a clinical assessment or treatment. |
| Growth Journey / Stress Planner / Wellbeing Reflection | Partially implemented | Session-only state; no persistent progress history. |
| Communication Coach / Scenario Practice | Partially implemented | Static/self-guided exercises; no dedicated interactive AI roleplay flow. |
| Human Support Connection / School Support Center | Partially implemented | Existing directory, request and appointment flows remain; DB integration needs staging verification. |
| Psychology Learning Hub / Support Resource Library | Partially implemented | Static resource data; no editorial CMS or semantic retrieval. |
| RAG with source-grounded citations | Not implemented | No curated corpus, embeddings, vector store or ingestion pipeline available. |
| Long-term memory and personal pattern insights | Not implemented | No student identity/consent design suitable for sensitive longitudinal data. |
| My Emotional Timeline / Progress Report / Personal Growth Profile | Not implemented | No persistent, consented event store; intentionally not faked with demo data. |
| Multi-provider AI adapters | Not implemented | OpenRouter remains the only implemented adapter. |

The detailed capability matrix is in `FEATURES.md`.

## 5. Dependency security blocker

The supplied manifest/lockfile currently declare `next@16.3.8`, `react@19.0.0` and `react-dom@19.0.0`. Current vendor advisories include critical React Server Components vulnerabilities affecting multiple 19.x `react-server-dom-*` release lines, and Next.js advisories affecting versions in the 16.3.x line. The lockfile does not provide enough evidence to identify the exact RSC runtime bundled by Next without a clean dependency resolution. The lockfile does resolve `sharp@0.35.5`, which meets the published workaround threshold for the specific SVG image-optimizer advisory; static review did not find `cacheComponents`, `use cache`, `unstable_cache` or Server Actions, but feature-specific review does not replace an upgrade.

No package versions or lockfile entries were changed in this pass. `npm ci` timed out and `registry.npmjs.org` failed DNS resolution. Manually editing versions without a generated lockfile and a clean install would create an unverified, non-reproducible dependency graph. Next.js 16.4.6 is the latest stable release shown by the official releases page on 2026-11-15; 16.4.5 contains the November 3 security fixes. **Do not deploy publicly until Next/React and the resolved RSC runtime have been patched, a clean install is completed, and audit/typecheck/test/build all pass.** See `SECURITY_AUDIT.md` for advisory identifiers and operational mitigations.

## 6. Test results

- PASS: TypeScript syntax-only parse of 98 `.ts`/`.tsx` source/config files across the project (excluding `.git`, `node_modules` and generated output); zero parse diagnostics.
- PASS: 16 local AI/runtime smoke assertions.
- BLOCKED: `npm ci` — timeout; npm registry DNS unavailable.
- BLOCKED: `npm run typecheck` — missing type definitions/dependencies in partial `node_modules`.
- BLOCKED: `npm run lint` — ESLint binary absent.
- BLOCKED: `npm test -- --reporter=dot` — Vitest binary absent.
- BLOCKED: `npm run build` — Next.js binary absent.
- BLOCKED: `npm audit --audit-level=high` — npm registry `EAI_AGAIN`.
- BLOCKED: PostgreSQL migrations/integration, DB access-control/concurrency, browser/mobile QA and live AI-provider tests — required services/credentials were not available.

Exact command outcomes are recorded in `TESTING.md`.

## 7. Database, API and privacy

No database schema migration was added in this pass. This avoids introducing persistent sensitive-student records before a complete student identity, consent, retention and access-control model exists. The existing School Support Center database flows are retained and must be integration-tested against PostgreSQL staging. The chat API now accepts an optional `mode`; it preserves existing fields and returns a conservative HTTP 503 when either AI safety verdict is unavailable or ambiguous.

The journal is local browser storage only. Local storage is readable by someone with access to the same browser profile; it is not encrypted. The new tools keep state in the active page session and do not submit their worksheet inputs to the backend. Chat content is still sent to the configured model and safety provider when that integration is configured; review provider data handling and terms before real student use.

## 8. Known limitations / release blockers

1. Patch and resolve the Next.js, React and RSC dependency tree, then run `npm ci`, `npm audit`, typecheck, lint, test and build.
2. Run database migrations, RBAC isolation, encryption, appointment concurrency and retention tests on PostgreSQL staging.
3. Validate the actual AI safety model on a diverse Vietnamese test set; current model verdict is an external guardrail, not clinical risk assessment.
4. Add persistent student data only after consent, deletion/export, retention, authentication and school-vs-student access boundaries are formally specified.
5. Build RAG only after obtaining licensed, reviewed, source-attributed psychological learning material and selecting a suitable embedding/vector storage design.
6. Implement multi-provider adapters, persistent memory, timeline, profile and pattern insights as secure vertical slices rather than demo-only UI.
7. Verify the school’s real escalation instructions and support directory with authorized staff before enabling student-facing production use.

## 9. Git handoff

No commit or push was performed. The working branch remains `feat/mam-next`. The original pre-existing changes remain present. Review the complete diff in your local clone before committing or opening a pull request.

## 10. Next phase candidates (not implemented here)

- Curated knowledge ingestion and citation-backed RAG.
- Consent-driven, user-visible memory with edit/delete/expiry controls.
- Persistent check-in timeline and growth reports with private-by-default access.
- Student account/authentication and privacy threat model before storing longitudinal records.
- Additional provider adapters and deterministic cost/latency fallback policy.
- Broader evaluation suite with blinded human review and red-team testing.
