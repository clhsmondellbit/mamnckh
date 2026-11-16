# FEATURES — MẦM (source status after Phase 01 work slice)

Trạng thái mô tả source code trong ZIP; không đồng nghĩa đã được chạy trên môi trường production. Mọi phần `BLOCKED` được ghi rõ trong `TESTING.md`.

## Giữ lại từ phiên bản trước

| Feature | Status | Ghi chú |
|---|---|---|
| Chat khách và hội thoại nhiều lượt | Implemented in source | Client chỉ gửi tin nhắn hiện tại/sessionId; tối đa 4 message context được server bảo vệ trong cookie AES-GCM HttpOnly, TTL 2 giờ; không có transcript DB. |
| Safety deterministic + fail-closed AI guardrail | Implemented in source | Explicit GREEN/YELLOW/RED + SAFE required; unknown/unavailable blocks non-urgent AI response; urgent deterministic path remains provider-independent. |
| Check-in cảm xúc | Implemented in source | Không lưu thành hồ sơ cá nhân. |
| Resource library | Implemented in source | Data bundle tĩnh; operator cần review nội dung và nguồn. |
| Search không phân biệt dấu/bookmarks | Implemented in source | Bookmark lưu localStorage. |
| Help/privacy/about pages | Implemented in source | Nội dung cần cập nhật theo quy trình nhà trường. |

## School Support Center và quản trị nhân sự hiện có

| Feature | Status | Ghi chú |
|---|---|---|
| School Support Center public directory | Implemented in source | DB-backed, chỉ hồ sơ active + verified. Rỗng nếu trường chưa nhập data. |
| Profile with role/department/topics/hours/modes/intake | Implemented in source | Admin CRUD; không gán chuyên môn chưa có căn cứ. |
| Verified phone + consent-gated public field | Implemented in source | Admin attestation; không phải OTP. Mọi sửa đổi thu hồi verification. |
| `tel:` call button and copy phone | Implemented in source | Người dùng chủ động nhấn, không auto call/SMS. |
| Search/filter | Implemented in source | Name/role/department/topics/mode/intake, accent-insensitive. |
| Voluntary support request | Implemented in source | Mỗi trường nhập rõ, consent, no chat/journal auto attach. |
| Encrypted private request fields | Implemented in source | AES-256-GCM; requires `DATA_ENCRYPTION_KEY`. |
| Real slots and manual pending requests | Implemented in source | Slot only if staff opens; manual time is pending, not confirmed booking. |
| Concurrent slot protection | Implemented in source | Advisory lock + overlap check + row lock + partial unique index. DB integration not run. |
| Student cancel/reschedule token | Implemented in source | Raw token shown once; only hash stored; student can later manage using request ID + token on Support Center. |
| Staff personal accounts/RBAC | Implemented in source | scrypt, HMAC cookie, role/contact scope; profile change/deactivation revokes linked counselor/teacher account and sessions. MFA not included. |
| Staff queue / slot management | Implemented in source | Teacher/counselor scoped; admins manage all. |
| Audit list | Implemented in source | Metadata events only; no chat or notes. |
| Retention endpoint | Implemented in source | Needs trusted daily scheduler; not automatic until configured. |
| AI Orchestrator | Implemented in source | Multi-signal weighted routing hints, six user-selectable conversation modes, and separate response strategies. One OpenRouter provider pipeline; no student profile. |
| Journal local-only | Implemented in source | Create/edit/search/tag/delete/export; not sent to AI. Device-shared risk remains. |
| Student tools | Partially implemented in source | Calm grounding, Emotion Explorer, Thought Explorer, Stress Planner, Communication Coach, Scenario Practice, Growth Journey and wellbeing reflection. Data is session-only, not persisted or sent to AI. No diagnosis/scoring. |


## Phase 01 requested capability matrix

The table below is the honest implementation status in this repository snapshot; source presence is not runtime verification.

| Capability | Status | Current boundary |
|---|---|---|
| MẦM AI Conversation + six conversation modes | Partially implemented | The UI exposes six modes; prompt routing supports them. One OpenRouter adapter only; no streaming, persistent transcript or long-term memory. |
| Emotional Check-in | Partially implemented | Form/API safety response exists; no user-controlled history/timeline store. |
| Personal Psychological Journal | Partially implemented | Local browser journal with create/edit/search/tag/delete/export; remains on this browser profile and is not sent to AI. |
| Psychological Insight / Personal Growth Profile | Not implemented | Current reflection tools are not a durable personal profile or psychological assessment. |
| Emotion Explorer | Partially implemented | Self-guided emotion description and reflection; no validated emotion-model inference. |
| Thought Explorer | Partially implemented | Self-guided event/thought/facts/alternative-view worksheet; not CBT treatment. |
| Calm Space | Partially implemented | Self-guided grounding exercise; no audio catalogue or guided session engine. |
| Growth Journey | Partially implemented | Session-only goal/step planner; no persistent goals or progress archive. |
| Personal Pattern Insights | Not implemented | No consented longitudinal data pipeline or analytics. |
| Human Support Connection | Partially implemented | Existing verified directory/request/appointment flows; AI does not transmit chat or auto-book. |
| Scenario Practice | Partially implemented | Static self-guided scenarios; no interactive AI role simulation or scoring. |
| Communication Coach | Partially implemented | Local phrase builder and link to chat; no dedicated AI coaching workflow. |
| Stress Management Planner | Partially implemented | Local worksheet; no persistent plan tracking. |
| Sleep & Wellbeing Reflection | Partially implemented | Session-only reflection; no medical evaluation or longitudinal trend. |
| Psychology Learning Hub | Partially implemented | Static resource library; no editorial CMS or semantic search. |
| Support Resource Library | Partially implemented | Static resources plus school support directory; source review/verification remains an operational task. |
| My Emotional Timeline | Not implemented | Check-ins and journal are not aggregated into a timeline. |
| Progress Reflection Report | Not implemented | No durable event store/report generation. |
| School Psychological Support | Partially implemented | Existing school support topics, forms and directory cover selected pathways; no full school case-management workflow. |
| RAG, long-term memory and multi-provider engine | Not implemented | Requires curated corpus, embedding/vector storage, user identity/consent model and additional provider adapters. |

## Partial / not implemented

| Feature | Status | Reason |
|---|---|---|
| Content CMS | Not implemented | Resource data remains code-managed; no false admin UI was added. |
| RAG / semantic knowledge retrieval with citations | Not implemented | No curated source corpus / embedding store provided. Knowledge prompt routing is not RAG and must not claim citations. |
| AI answer ratings/feedback module | Not implemented | No durable feedback backend/privacy specification. |
| Persistent AI conversation summarization | Not implemented | Có short context cookie tối đa 4 message/2 giờ; không có transcript DB, summarization hoặc long-term memory. |
| Streaming responses | Not implemented | Current provider returns a complete response. |
| Human support recommendation from AI | Partial | Orchestrator adds human-support prompt intent; it does not automatically match people or transfer data. Student chooses directory manually. |
| Real-time calendar sync | Not implemented | Staff opens slots manually; no school calendar provider supplied. |
| Notifications/reminders/email/SMS/push | Not implemented | No sender/provider/consent/operational configuration available. |
| PWA/offline install | Not implemented | Not part of tested delivery. |
| Content manager workflow | Not implemented | `content_manager` role exists but no CMS page/API. |
| MFA/SSO | Not implemented | Individual staff credentials exist, but enterprise identity required before production. |
| Shared multi-instance rate limiting | Not implemented | In-process limiter only; use WAF/Redis externally. |
| Automated key rotation | Not implemented | `DATA_ENCRYPTION_KEY` rotation needs an explicit re-encryption process. |
| Independent contact OTP verification | Not implemented | Current verification is documented admin attestation only. |

No demo teacher or telephone record is seeded into the directory.

## Phase 02 implementation status (2026-11-15)

This table describes source-level integration, not production acceptance. Full install/typecheck/lint/test/build/database/browser verification remains blocked by unavailable npm/Git DNS and missing external services. See `docs/PHASE_02.md` and `PHASE_02_REPORT.md`.

| Phase 02 capability | Status | Evidence / current boundary |
|---|---|---|
| Private encrypted vault | PARTIALLY COMPLETED | `lib/privacy/private-vault.ts`, `/studio`; PBKDF2 + AES-GCM + IndexedDB. Local device only; browser verification pending. |
| Story Journal | PARTIALLY COMPLETED | CRUD, tag/search, export, explicit opt-in legacy import; no images/cloud sync. |
| Memory Graph | PARTIALLY COMPLETED | User-created notes and explicitly selected links; not automated psychological inference. |
| Daily Reflection | PARTIALLY COMPLETED | Locally encrypted entries; optional, no streak requirements. |
| Guided Journeys | PARTIALLY COMPLETED | Eight static guided reflection programs with saved step notes. |
| Scenario Lab | PARTIALLY COMPLETED | Three authored branching communication scenarios, no live AI roleplay. |
| Perspective Explorer | PARTIALLY COMPLETED | User-led perspective worksheet; does not infer another person's thoughts. |
| Insight Studio | PARTIALLY COMPLETED | Descriptive record counts only; no causal claims, clinical scores or predictive model. |
| Conversation Debrief | PARTIALLY COMPLETED | Manual reflection template; no automatic transcript summarization. |
| Personal Toolkit | PARTIALLY COMPLETED | Starter and custom tools saved in encrypted local vault. |
| MẦM Voice | PARTIALLY COMPLETED | Browser speech recognition/synthesis; no real-time AI voice or app-side audio archive. |
| Knowledge Library | PARTIALLY COMPLETED | PostgreSQL full-text search over published + verified metadata; no vector embeddings or RAG chat integration. |
| Knowledge ingestion API | PARTIALLY COMPLETED | Role-gated content ingest with chunking and transactional audit; no CMS UI or source auto-validation. |
| Short-term chat context | PARTIALLY COMPLETED | Server-created encrypted HttpOnly cookie, two-hour TTL; not durable or cross-device. |
| Multi-provider chat | PARTIALLY COMPLETED | OpenRouter and one OpenAI-compatible adapter; safety provider still OpenRouter. |
| Research Lab | PARTIALLY COMPLETED | Staff-only synthetic deterministic regression suite; no model benchmark results. |
| Vietnamese/English | PARTIALLY COMPLETED | Studio-only partial localization; not global application localization. |
| Accessibility preferences | PARTIALLY COMPLETED | Studio font size/high contrast options; full WCAG audit not run. |
| Resource Finder | PARTIALLY COMPLETED | Search in approved local knowledge library; no external live search. |

No Phase 02 capability is marked `COMPLETED` until the relevant integration and runtime acceptance checks are performed. Current production release is blocked.
