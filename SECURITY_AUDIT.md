# SECURITY_AUDIT — MẦM Phase 2

Ngày kiểm toán source: 2026-11-15. Đây là static review và thay đổi source; không phải pentest, compliance certification hoặc cam kết không còn lỗ hổng.

## Kết luận phát hành

<badge>RELEASE BLOCKER</badge> `package.json` và `package-lock.json` vẫn ghim `next@16.3.8`, nằm trong các dải phiên bản bị ảnh hưởng của nhiều advisory Next.js. Các advisory vendor nêu bản vá cho nhóm Critical/High bắt đầu từ `16.4.1`: GHSA-673q-mjm6-r5xr (Critical, RCE trong điều kiện Cache Components cụ thể), GHSA-2464-fhr4-w9xw (Critical, RCE trong Image Optimization khi điều kiện SVG được đáp ứng) và GHSA-p3m5-59mp-jv5r (High, DoS với App Router/Server Actions). Các dải affected đều bao gồm `16.3.8`; chi tiết điều kiện khai thác khác nhau theo advisory. Release page ghi `v16.4.6` phát hành 09/11/2026 tại thời điểm tra cứu, nhưng không được suy luận rằng chỉ nâng lên một version bất kỳ là giải quyết mọi advisory mới: một số advisory ngày 03/11 có dải ảnh hưởng riêng hoặc chưa công bố bản vá.

`react` và `react-dom` cũng đang ghim `19.0.0`. React đã công bố advisory Critical cho các gói `react-server-dom-*` ở nhánh `19.0.0`; một advisory RSC khác tháng 10/2026 cũng liệt kê nhiều bản `react-server-dom-*` bị ảnh hưởng. Hai gói server-dom không xuất hiện thành dependency riêng trong lockfile này, nên từ lockfile hiện tại chưa thể xác định chính xác bản runtime được Next bundle. Cần xác minh graph/runtime thực tế sau clean install và theo advisory hiện hành; không kết luận rằng chỉ vì `react` package có version `19.0.0` thì tất cả gói RSC cũng đúng cùng version.

Ngày 10/11/2026, React cập nhật advisory Critical GHSA-xqc2-xf4c-x3h3 về unauthenticated RCE trong React Server Components; các dải affected gồm `react-server-dom-*` từ 19.0.0 đến trước 19.0.9, từ 19.1.0 đến trước 19.1.10, từ 19.2.0 đến trước 19.2.9 và 19.3.0. Project đang ghim `react@19.0.0` + `react-dom@19.0.0` và dùng Next App Router. Lockfile không có package `react-server-dom-*` riêng để đối chiếu, vì vậy phải xác minh runtime RSC thực tế sau clean install; coi đây là release blocker cho đến khi resolved graph được kiểm tra và cập nhật. Các bản vá theo nhánh được advisory liệt kê: 19.0.9 / 19.1.10 / 19.2.9 / 19.3.1. Không suy ra rằng chỉ nâng top-level React mà không kiểm tra graph/runtime là đủ.

Ngoài ra, các advisory ngày 03/11/2026 gồm GHSA-vc7v-qv4w-wrv8, GHSA-mfr8-8qww-v76h và GHSA-rhh4-g77r-r9qj nhắm đến các cách dùng Cache Components/`use cache` cụ thể. Static search trong source hiện tại không thấy `cacheComponents`, `use cache`, `unstable_cache` hoặc Server Actions; đây là giảm điều kiện áp dụng của một số advisory, không thay thế nâng cấp. `package-lock.json` đang resolve `sharp@0.35.5`, đạt workaround mà advisory SVG optimizer nêu (sharp >=0.35.5). Next.js release `16.4.5` công bố các bản vá cho nhóm advisory ngày 03/11, và `16.4.6` được phát hành ngày 09/11/2026. Dù vậy cần cập nhật lên release ổn định đã vá và chạy full audit/build; không thể coi source search hay workaround riêng lẻ là xác nhận đã an toàn. `npm audit` chưa chạy thành công nên không thể chứng nhận dependency tree sạch.

Không nâng cấp package trong đợt này: `registry.npmjs.org` không phân giải DNS trong sandbox; không có npm cache; tự sửa `package.json` mà không cập nhật lockfile/install/test sẽ làm sản phẩm không tái lập được. **Không deploy public khi chưa nâng Next.js và chạy clean install/audit/test/build.**

## Phase 01 security work (2026-11-15)

- Đã sửa safety-provider contract: `GREEN` là nhãn rõ ràng riêng; `null` biểu thị không thể xác minh, không còn bị ép thành `GREEN`.
- API chat hiện fail-closed khi input guardrail không có verdict rõ ràng; khi output guardrail không trả chính xác `SAFE`, phản hồi model bị chặn với HTTP 503.
- Deterministic urgent path vẫn trả hướng dẫn hỗ trợ người thật mà không cần gọi provider.
- Đã thêm unit tests cho verdict GREEN/YELLOW, verdict không hợp lệ và output SAFE không rõ ràng. Chưa chạy được Vitest do dependency install bị chặn bởi DNS.
- Đã mở rộng routing thành multi-signal scoring và user-selected conversation mode; đây là prompt routing, không phải mô hình chẩn đoán.
- Chưa cập nhật Next/React hoặc lockfile: `registry.npmjs.org` không phân giải DNS (`curl` lỗi `Could not resolve host`), npm cache trống và `npm ci` bị timeout. Không sửa lockfile thủ công. Không deploy public cho tới khi dependency được cập nhật trong môi trường có registry, `npm ci`, dependency graph audit, tests và build đều thành công.

## Kiểm soát được triển khai trong source

- Staff dùng tài khoản riêng trong PostgreSQL, mật khẩu scrypt, HMAC signed HttpOnly/SameSite=Strict cookie, Secure trên production.
- Mỗi request reload active state/role/contact assignment và kiểm tra session version từ DB; đổi mật khẩu/quyền/phân công hoặc vô hiệu hóa làm tăng version để thu hồi các cookie đã phát hành trước đó.
- Sửa hoặc ngừng công khai hồ sơ nhân sự tự động vô hiệu hóa tài khoản Teacher/School Counselor gắn với hồ sơ và tăng session version.
- Script bootstrap chỉ tạo Super Admin đầu tiên khi bảng tài khoản còn trống; tránh chạy script tạo quyền cao sau khi hệ thống đã được khởi tạo.
- RBAC role và contact scope được enforce tại API/DB service; teacher/counselor chỉ thấy yêu cầu có contact_id khớp.
- Tạo/chỉnh sửa/verify/deactivate contact được giới hạn admin/super_admin và cùng-origin.
- Public directory chỉ trả hồ sơ active + verified; phone/email chỉ public với consent riêng và timestamps.
- Chỉnh sửa hồ sơ tự thu hồi verification và public flags; available slots được đóng.
- Phone chuẩn hóa E.164 `+84...`; không tạo số mẫu.
- Appointment PII được AES-256-GCM encrypt; cancellation token chỉ lưu SHA-256 hash.
- Slot creation có advisory lock theo contact + overlap check; booking lock row `FOR UPDATE`; unique partial index bảo vệ một active appointment/slot.
- State transitions appointment được kiểm soát.
- API JSON request bounded; no-store; same-origin trên mutation; rate limits process-local.
- Audit events cho login/logout, staff account changes/list views, directory changes, appointment list access, slot creation và appointment lifecycle. Nội dung chat/note không được ghi vào audit.
- Chat không nhận assistant transcript do browser gửi. Khi có `CONVERSATION_SECRET` (hoặc fallback `AUTH_SECRET` hợp lệ), server tạo cookie AES-256-GCM HttpOnly, ràng buộc session ID, giới hạn tối đa 4 message gần nhất và TTL 2 giờ. Đây là context ngắn hạn phía server tạo, không phải long-term database memory; khi không có secret, hội thoại không có server-managed context.
- Journal local-only, không tự gửi vào AI context hoặc yêu cầu hỗ trợ.

## Rủi ro còn tồn tại

| Mức | Rủi ro / giới hạn | Hành động cần có trước production |
|---|---|---|
| Critical | Next.js `16.3.8` nằm trong dải phiên bản của advisory Critical/High tháng 10/2026; React 19.0.0 cần xác minh RSC runtime. Một số điều kiện khai thác (Cache Components, Server Actions) chưa được tìm thấy trong source; `sharp@0.35.5` đáp ứng workaround cho một nhánh SVG optimizer. | Cập nhật Next.js lên release ổn định đã bao gồm bản vá (release hiện tại được xác minh: 16.4.6), đồng bộ React/RSC runtime phù hợp; clean install; kiểm tra dependency graph; audit/test/build trước deploy. |
| High | Chưa có MFA/SSO cho staff. | Tích hợp identity provider/2FA trước môi trường production có dữ liệu thật. |
| High | Rate limiter process-local. | Shared limiter/Redis/WAF; cấu hình trusted proxy để không nhận spoofed X-Forwarded-For. |
| High | Verification là admin attestation, không phải OTP/verification service. | Nhà trường phải xác minh ngoài hệ thống, lưu bằng chứng theo quy trình riêng và kiểm tra consent. |
| High | Retention chỉ chạy khi scheduler được cấu hình. | Thiết lập cron hàng ngày, theo dõi kết quả, thử restore/cleanup; pending/confirmed không tự xóa. |
| High | Encryption key rotation chưa tự động. | KMS/key versioning + re-encryption/rotation runbook và backup kiểm thử. |
| High | Chưa có DB integration test. | Chạy migration và transaction tests trên PostgreSQL staging, gồm booking concurrency. |
| Medium | Không có calendar sync, reminders, SMS/email/push notification. | Người phụ trách cần theo dõi queue trong dashboard; không được hứa hệ thống đã nhắc lịch. |
| Medium | Knowledge Library hiện chỉ có PostgreSQL full-text search; chưa có vector embeddings, semantic retrieval hoặc RAG injection vào chat. | Bổ sung ingestion/curation workflow, embeddings, relevance evaluation, provenance tests và consent-aware context assembly; hiện tại không tuyên bố đã có AI RAG. |
| Medium | AI module routing là multi-signal rule-based prompt routing; chat context chỉ là encrypted cookie ngắn hạn. | Đánh giá benchmark độc lập, red-team tests, model/provider terms và test tiếng Việt trước deployment. |
| Medium | CSP vẫn giữ policy tương thích Next; cần nonce/hash hardening. | Kiểm thử production CSP và hydration; rà soát third-party assets. |
| Medium | Chưa chạy browser QA/a11y audit. | Kiểm thử desktop/mobile/keyboard/screen readers trên staging. |
| Medium | Legacy `support_requests` có thể chứa plain text từ giai đoạn trước. | Kiểm tra dữ liệu legacy; khóa quyền admin; purge theo chính sách; backup trước khi xóa. |

## Privacy/data flow

- Chat: transcript hiển thị giữ trong React memory; context ngắn hạn tối đa 4 message trước được lưu trong cookie AES-GCM HttpOnly do server tạo, TTL 2 giờ. Khi AI bật, tin nhắn hiện tại và context này được gửi tới provider cấu hình; provider có thể có logging/retention riêng, cần review hợp đồng.
- Check-in: không lưu thành hồ sơ tâm lý.
- Journal legacy: các bản ghi cũ có thể còn trong `localStorage` cho đến khi người dùng chủ động nhập vào Private Studio và xác nhận xóa bản cũ. Bản ghi mới trong Private Studio được mã hóa AES-GCM trên thiết bị và lưu ciphertext trong IndexedDB; nội dung không được gửi tới AI. Cơ chế này không bảo vệ trước XSS, extension độc hại hoặc thiết bị đang mở khóa.
- Support requests: chỉ dữ liệu nhập riêng và user consent; không tự gửi chat/journal; các trường định danh và note mã hóa.
- Staff dashboard: admin có thể xem queue hỗ trợ được phân quyền theo vai trò; teacher/counselor bị giới hạn contact_id; technical_operator không có quyền appointment API.
- Contact data: public DTO chỉ trả channel được xác minh/consented; audit lưu action metadata, không ghi note.

## Dependency audit / test limits

`npm audit` chưa chạy được do registry DNS failure; vì vậy không thể xác nhận dependency tree sạch. Typecheck/lint/test/build và database integration cần được chạy trên môi trường có dependencies cài sạch. Chi tiết ở `TESTING.md`.

## Nguồn advisory cần đối chiếu lại trước deployment

- https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components
- https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3
- https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8
- https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h
- https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj
- https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr
- https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r
- https://github.com/vercel/next.js/releases


## Phase 02 additions (source review, not production verification)

- `/studio` now uses a browser-only AES-256-GCM encrypted IndexedDB vault. A passphrase-derived, non-extractable Web Crypto key remains in memory while unlocked; the application stores ciphertext, IVs, and KDF salt. The passphrase is not recoverable. This is device-local encryption, **not** end-to-end protection against XSS, malicious extensions, compromised browsers, browser profile access while unlocked, or keyloggers. The export is decrypted JSON and must be protected separately.
- A legacy journal import action explicitly asks before importing and separately asks before deleting the old plaintext `localStorage` copy. Existing legacy records are not automatically removed.
- Chat ignores client-supplied history. When `CONVERSATION_SECRET` or `AUTH_SECRET` is configured, the server stores a small recent transcript in an encrypted AES-GCM HttpOnly cookie scoped to `/api/chat`, bound to a random session identifier and expiring after two hours. No database chat archive is created. Without a valid secret, chat continues without historical context. Cookies may be replaced when the user changes chat session; there is no cross-device restoration.
- OpenAI-compatible chat provider adapter is optional and only supports the standard `/chat/completions` contract. Its safety guard remains the separately configured OpenRouter safety provider; this is not a direct integration with every vendor API.
- Knowledge retrieval uses PostgreSQL full-text search (`tsvector`, `plainto_tsquery`) over staff-ingested, source-attributed text. It is not embedding/vector search. No documents are automatically fetched from remote URLs; trusted staff submit text and provenance. Published documents require a verification timestamp. DB migration and staging authorization tests remain mandatory.
- Voice input uses browser Web Speech APIs only after explicit user interaction and acknowledgement. Depending on browser implementation, speech recognition may process audio outside the device. Raw audio is not stored by MẦM; transcript saving is an explicit action. This is not realtime AI voice conversation.
- `microphone=(self)` is permitted by Permissions-Policy for the voice feature; camera and geolocation remain disabled.
- Synthetic regression cases are included for deterministic classifier/orchestrator behavior. They are not clinical data, a model benchmark, or evidence of comparative superiority.

### Updated dependency release blocker

The uploaded project still pins `next@16.3.8`, `react@19.0.0`, and `react-dom@19.0.0`. Official package metadata currently shows Next.js `16.4.6` and React `19.3.1` as latest stable versions at the time checked; Next.js advisories published 03/11/2026 and a Critical SVG image-optimizer advisory published 14/10/2026 must be checked against the exact resolved graph. React's RSC advisories also require checking bundled `react-server-dom-*` packages, not only top-level package versions. Network DNS to npm/GitHub is unavailable in this execution environment, so package updates and `npm audit` are intentionally not attempted via manual lockfile edits. This remains a release blocker.


## Phase 02 security review (source-level)

- Private Studio uses PBKDF2-SHA-256 (310,000 iterations) to derive an AES-256-GCM key from a user passphrase; random per-record IVs are used and ciphertext is stored in IndexedDB. The vault is local-only, has no recovery/rotation service, and does not protect against compromised browser runtime, XSS, malicious extensions, a shared unlocked device, or decrypted JSON exports. Browser persistence and cross-browser verification have not been performed.
- Legacy journal migration requires explicit user action; deleting the old plaintext `localStorage` copy is a separate confirmation. Legacy IDs are retained as deduplication metadata to make retries idempotent.
- Chat context uses a server-created AES-256-GCM cookie, `HttpOnly`, `SameSite=Strict`, scoped to `/api/chat`, and expires after two hours. It is a short context window only, not a persistent server transcript. The browser still stores the opaque encrypted cookie; client-provided assistant messages are not trusted.
- Knowledge ingestion is role-checked, same-origin, request-size bounded and rate-limited. Document, chunks and audit event are written in one PostgreSQL transaction. Source URLs must be HTTPS; the server does not fetch submitted URLs. `verified_at` is an editor attestation timestamp, not an automated review or proof of scientific quality.
- Knowledge search returns published documents with a verification timestamp using PostgreSQL lexical full-text search. It does not yet inject retrieved content into chat; citation display in the separate library is not evidence of RAG-grounded AI answers.
- MẦM Voice uses browser speech APIs only after a user consent checkbox. The browser may process audio through a third-party service; MẦM does not archive raw audio. No realtime AI voice transport is implemented.
- Research Lab currently exposes synthetic deterministic regression tests; it does not run live model benchmarks or store model-comparison scorecards.

### Current dependency advisory check (2026-11-15)

- `next@16.3.8` remains pinned in both package manifest and lockfile. Official Next.js advisories list 16.0.0–16.4.0 as affected by GHSA-2464-fhr4-w9xw (Critical RCE condition in Image Optimization) and GHSA-673q-mjm6-r5xr (Critical RCE condition in Cache Components); both are patched from 16.4.1. GHSA-p3m5-59mp-jv5r (High DoS with App Router/Server Actions) is also patched from 16.4.1. The Nov 3 GHSA-pc58-hwjq-p385 advisory (Moderate) lists versions through 16.4.4 and is patched from 16.4.5. npm reported 16.4.6 as latest on 2026-11-15. The precise applicability of condition-specific advisories must still be checked against the build/runtime, but the current pin is not acceptable for production.
- `react@19.0.0` and `react-dom@19.0.0` remain pinned. GHSA-xqc2-xf4c-x3h3 (Critical RSC RCE) and GHSA-h3gv-c5rc-p453 (High Server Functions DoS) list the 19.0.x branch up to but excluding 19.0.9 as affected. The fixed versions include React 19.0.9 on that branch; npm reported 19.3.1 as the latest stable React release on 2026-11-15. The exact bundled `react-server-dom-*` graph still must be checked after install.
- No dependency upgrade was applied because the sandbox could not resolve `registry.npmjs.org` and no cache was available. Do not use this report as evidence that the dependency set is clean. The lockfile was not hand-edited. Update Next/React and matching tooling together in a network-enabled environment; then perform a clean install, `npm audit`, typecheck, lint, tests and production build.

Authoritative references reviewed on 2026-11-15:

- https://github.com/advisories/GHSA-2464-fhr4-w9xw
- https://github.com/advisories/GHSA-673q-mjm6-r5xr
- https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r
- https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385
- https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3
- https://github.com/react/react/security/advisories/GHSA-h3gv-c5rc-p453
- https://www.npmjs.com/package/next
- https://www.npmjs.com/package/react
