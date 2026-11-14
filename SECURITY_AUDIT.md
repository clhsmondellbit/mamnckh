# SECURITY_AUDIT — MẦM Phase 2

Ngày kiểm toán source: 2026-11-14. Đây là static review và thay đổi source; không phải pentest, compliance certification hoặc cam kết không còn lỗ hổng.

## Kết luận phát hành

<badge>RELEASE BLOCKER</badge> `package.json` và `package-lock.json` vẫn ghim `next@16.3.8`, nằm trong các dải phiên bản bị ảnh hưởng của nhiều advisory Next.js. Các advisory vendor nêu bản vá cho nhóm Critical/High bắt đầu từ `16.4.1`: GHSA-673q-mjm6-r5xr (Critical, RCE trong điều kiện Cache Components cụ thể), GHSA-2464-fhr4-w9xw (Critical, RCE trong Image Optimization khi điều kiện SVG được đáp ứng) và GHSA-p3m5-59mp-jv5r (High, DoS với App Router/Server Actions). Các dải affected đều bao gồm `16.3.8`; chi tiết điều kiện khai thác khác nhau theo advisory. Release page ghi `v16.4.6` phát hành 09/11/2026 tại thời điểm tra cứu, nhưng không được suy luận rằng chỉ nâng lên một version bất kỳ là giải quyết mọi advisory mới: một số advisory ngày 03/11 có dải ảnh hưởng riêng hoặc chưa công bố bản vá.

`react` và `react-dom` cũng đang ghim `19.0.0`. React đã công bố advisory Critical cho các gói `react-server-dom-*` ở nhánh `19.0.0`; một advisory RSC khác tháng 10/2026 cũng liệt kê nhiều bản `react-server-dom-*` bị ảnh hưởng. Hai gói server-dom không xuất hiện thành dependency riêng trong lockfile này, nên từ lockfile hiện tại chưa thể xác định chính xác bản runtime được Next bundle. Cần xác minh graph/runtime thực tế sau clean install và theo advisory hiện hành; không kết luận rằng chỉ vì `react` package có version `19.0.0` thì tất cả gói RSC cũng đúng cùng version.

Ngoài ra, GHSA-vc7v-qv4w-wrv8 và GHSA-mfr8-8qww-v76h (03/11/2026) ảnh hưởng các đường dùng Cache Components/`use cache` với root params ở các điều kiện cụ thể; GHSA-rhh4-g77r-r9qj đề cập binary arguments truyền vào `use cache`. Source hiện tại không cấu hình `cacheComponents` và không khai báo `use cache`/`unstable_cache`, nhưng dependency audit vẫn cần kiểm tra lại sau cập nhật. `npm audit` chưa chạy thành công nên không thể chứng nhận dependency tree sạch.

Không nâng cấp package trong đợt này: `registry.npmjs.org` không phân giải DNS trong sandbox; không có npm cache; tự sửa `package.json` mà không cập nhật lockfile/install/test sẽ làm sản phẩm không tái lập được. **Không deploy public khi chưa nâng Next.js và chạy clean install/audit/test/build.**

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
- AI history chỉ chấp nhận user turns; không tin assistant messages do browser cung cấp; safety decision deterministic giữ vai trò chính.
- Journal local-only, không tự gửi vào AI context hoặc yêu cầu hỗ trợ.

## Rủi ro còn tồn tại

| Mức | Rủi ro / giới hạn | Hành động cần có trước production |
|---|---|---|
| Critical | Next.js `16.3.8` thuộc dải nhiều advisory Critical/High; RSC runtime dependency chưa xác định được từ lockfile. | Cập nhật Next.js, React/React DOM và RSC runtime theo advisory hiện hành; clean install; kiểm tra resolved dependency graph; audit/test/build trước deploy. |
| High | Chưa có MFA/SSO cho staff. | Tích hợp identity provider/2FA trước môi trường production có dữ liệu thật. |
| High | Rate limiter process-local. | Shared limiter/Redis/WAF; cấu hình trusted proxy để không nhận spoofed X-Forwarded-For. |
| High | Verification là admin attestation, không phải OTP/verification service. | Nhà trường phải xác minh ngoài hệ thống, lưu bằng chứng theo quy trình riêng và kiểm tra consent. |
| High | Retention chỉ chạy khi scheduler được cấu hình. | Thiết lập cron hàng ngày, theo dõi kết quả, thử restore/cleanup; pending/confirmed không tự xóa. |
| High | Encryption key rotation chưa tự động. | KMS/key versioning + re-encryption/rotation runbook và backup kiểm thử. |
| High | Chưa có DB integration test. | Chạy migration và transaction tests trên PostgreSQL staging, gồm booking concurrency. |
| Medium | Không có calendar sync, reminders, SMS/email/push notification. | Người phụ trách cần theo dõi queue trong dashboard; không được hứa hệ thống đã nhắc lịch. |
| Medium | Không có Content CMS/RAG. | Nội dung hiện nằm trong source; quy trình review và cập nhật nội dung cần phát triển riêng. |
| Medium | AI module routing là rule-based prompt routing, chưa persistent context summary. | Review prompt, model/provider terms, red-team tests và test tiếng Việt. |
| Medium | CSP vẫn giữ policy tương thích Next; cần nonce/hash hardening. | Kiểm thử production CSP và hydration; rà soát third-party assets. |
| Medium | Chưa chạy browser QA/a11y audit. | Kiểm thử desktop/mobile/keyboard/screen readers trên staging. |
| Medium | Legacy `support_requests` có thể chứa plain text từ giai đoạn trước. | Kiểm tra dữ liệu legacy; khóa quyền admin; purge theo chính sách; backup trước khi xóa. |

## Privacy/data flow

- Chat: browser memory; khi AI bật, tin nhắn hiện tại và tối đa 8 user turns trước được chuyển tới provider cấu hình. Provider có thể có logging/retention riêng, cần review hợp đồng.
- Check-in: không lưu thành hồ sơ tâm lý.
- Journal: localStorage; thiết bị dùng chung có thể để lộ dữ liệu cho người dùng máy sau đó. Không đưa vào context.
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
