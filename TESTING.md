# TESTING — MẦM Phase 2

## Kết quả kiểm chứng tại thời điểm đóng gói

| Kiểm tra | Trạng thái | Kết quả thực tế |
|---|---|---|
| Đọc source + kiểm tra cấu trúc | PASS | ZIP đầu vào được giải nén; cấu trúc, route, module và tài liệu được kiểm tra. |
| TypeScript syntax-only parse (94 implementation/test `.ts`/`.tsx` files; 95 total including one `.d.ts`) | PASS | TypeScript 5.8.3 `transpileModule` parse-only scan; không có syntax diagnostics. Đây không phải typecheck.
| Runtime utility smoke checks | PASS | 23 Node assertions: phone normalization/format, AI routing, process-local rate limit, AES-256-GCM round-trip/tamper rejection và scrypt password hash/verify. |
| Unit test Vitest: phone/orchestrator | BLOCKED | `npm test -- --reporter=dot` exit 127 (`vitest: not found`); không thể cài do npm registry DNS không hoạt động. |
| TypeScript (`npm run typecheck`) | BLOCKED | Script exit 2; dependencies và typings của dự án không được cài nên global `tsc` không thể resolve Next/React/Vitest/Node modules. |
| ESLint (`npm run lint`) | BLOCKED | Script exit 127 (`eslint: not found`). |
| Integration test PostgreSQL | BLOCKED | Không có PostgreSQL server/credentials được cung cấp trong sandbox. |
| Appointment concurrency test | BLOCKED | Chưa có PostgreSQL instance để kiểm tra transaction và advisory lock end-to-end. |
| AI provider | BLOCKED | Không có API key/provider credentials. |
| Production build (`npm run build`) | BLOCKED | Script exit 127 (`next: not found`); không thể clean-install Next.js/SWC do npm registry trả `EAI_AGAIN`. |
| Dependency audit (`npm audit --audit-level=high`) | BLOCKED | Exit 1 do `registry.npmjs.org` DNS `EAI_AGAIN`; không phải kết quả audit sạch. |
| Desktop/mobile browser QA | BLOCKED | Không có browser automation/server build đã chạy trong môi trường này. |
| Migration apply/rollback | BLOCKED | Không có PostgreSQL instance. Migration SQL đã được tạo nhưng chưa áp dụng vào DB thực. |
| Archive content check | PASS | ZIP được tạo, `unzip -t` không lỗi; đã kiểm tra danh sách tệp không chứa `node_modules`, `.git`, `.next`, cache, `.env` thật hoặc credential file. Chỉ giữ `.env.example`. |

TypeScript syntax scan dùng `transpileModule` để parse 94 file triển khai/kiểm thử (95 file TypeScript tổng cộng nếu tính một `.d.ts`), không kiểm tra semantic types, module resolution hay generated Next types. `package.json` và root dependency metadata trong `package-lock.json` đã được đối chiếu và khớp.

Không có kiểm tra bị ghi PASS nếu chưa thực sự chạy. Bản này chưa đủ điều kiện deploy public do dependency security advisory và các hạng mục BLOCKED bên trên. Unit test file đã được thêm không có nghĩa test runner đã execute.

## Test commands for CI / staging

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --audit-level=high
```

## Required integration scenarios

1. Public API không trả contact chưa xác minh/inactive.
2. Phone/email chỉ public khi đúng kênh consent đã được ghi nhận.
3. Điện thoại trả E.164 đúng, anchor `tel:` và copy button chỉ kích hoạt do người dùng.
4. Search accent-insensitive, filter topic/mode/intake.
5. Tạo appointment với slot: một yêu cầu thắng; request thứ hai cùng slot bị từ chối.
6. Hai slot overlap cùng contact không thể mở.
7. Manual time request luôn `pending`, không hiển thị như confirmed.
8. Hủy/từ chối giải phóng reserved slot; đổi lịch quay lại pending.
9. Không cho phép `pending → completed`, `cancelled → confirmed`, `rejected → confirmed`.
10. Teacher/counselor chỉ đọc và cập nhật yêu cầu gắn đúng `support_contact_id`.
11. Admin/role mutation có origin check; deactivated staff cookie bị vô hiệu ở lần request kế.
12. Request PII được encrypt; DB không chứa plain note/phone/name; cancellation token chỉ lưu hash; đổi mật khẩu/quyền hoặc tự vô hiệu hóa liên kết hồ sơ sẽ tăng session version/thu hồi phiên cũ.
16. Student có thể quản lý yêu cầu sau khi tải lại trang bằng request ID + cancellation token; hủy yêu cầu cần xác nhận trong UI.
13. Journal/local data không xuất hiện trong `/api/chat` hoặc `/api/appointments` trừ khi người dùng nhập một phần nội dung mới và xác nhận riêng.
14. AI: deterministic red path không gọi provider; provider failure không hạ safety level; forged assistant-history rejected.
15. Retention endpoint từ chối thiếu/sai CRON_SECRET; cleanup xóa terminal >90d, giữ pending quá 180 ngày và confirmed có ngày hẹn quá 180 ngày.

## Local browser QA checklist

- Desktop 1280px+, tablet 768px, mobile 360px.
- Keyboard tab order, focus visible, form labels, error states, empty states.
- Màn hình có/không có phone/email, hồ sơ limited/not accepting.
- Trình duyệt hỗ trợ `tel:` và trình duyệt desktop không có handler.
- Clipboard permission denied.
- Ứng dụng gọi điện yêu cầu người dùng xác nhận; không auto call.
- Test với school contacts được xác minh trong staging, không dùng người/số giả.

## Migration checks on staging

- Snapshot/backup trước khi apply.
- Apply `sql/schema.sql`, sau đó migration `002`.
- Verify constraints/indexes/FK.
- Tạo Super Admin, contact nháp, verify consent false/true, teacher user, slot và appointment.
- Test slot booking bằng hai session concurrent.
- Test key backup/restore trước khi nhập dữ liệu thật.
