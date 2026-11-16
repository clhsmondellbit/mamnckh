# TESTING — MẦM Phase 02 delivery snapshot (2026-11-15)

## Kết quả kiểm chứng trong sandbox hiện tại

| Kiểm tra | Trạng thái | Kết quả thực tế |
|---|---|---|
| Repository / Git inspection | PASS | Branch `feat/mam-next`, HEAD `bc103fd`, tracking `origin/feat/mam-next`; source ZIP ban đầu có 126 tracked modifications và 4 untracked paths trước khi bắt đầu Phase 02. Không reset, clean, checkout, commit hoặc push. Tại thời điểm bàn giao vẫn có 126 tracked paths thay đổi và 23 untracked paths; toàn bộ được giữ nguyên. |
| TypeScript syntax-only transpile | PASS | 114 file `.ts`/`.tsx` (loại trừ `.d.ts`, `.git`, `node_modules`, `.next`, output sinh tự động) được transpile bằng TypeScript global 5.8.3; 0 syntax diagnostics. Đây không phải semantic typecheck. |
| Isolated runtime harness | PASS | 29/29 assertion cô lập: 7 passphrase/record-ID validation, 3 chunking, 8 safety classifications, 8 orchestration routes trên synthetic dataset và 3 encrypted-cookie checks (round-trip, session binding, ciphertext tampering). Harness transpile các module cần kiểm tra và mock `server-only`; không phải Vitest hoặc end-to-end test. |
| `node --check scripts/smoke.mjs` | PASS | Script smoke test parse cú pháp thành công. |
| `package.json` + `package-lock.json` JSON parse | PASS | Cả hai file parse được; lockfile không được sửa thủ công trong Phase 02. |
| `npm ping --fetch-retries=0 --fetch-timeout=10000` | BLOCKED | Exit 1; DNS `EAI_AGAIN registry.npmjs.org`. Một lần `npm ci` trước đó đã timeout; chưa có clean install. |
| `npm run typecheck` | BLOCKED | Exit 2; 2,843 diagnostics do thiếu dependencies và type definitions. Phần lớn là JSX intrinsic element / module-resolution / Node globals; còn 6 nullable diagnostics tại staff pages vì `next/navigation` không có type declarations nên `redirect()` không được nhận diện là `never`. Không thể coi đây là typecheck thành công hoặc kết luận mọi source typing hợp lệ. |
| `npm run lint` | BLOCKED | Exit 127: `eslint: not found`. |
| `npm test -- --reporter=dot` | BLOCKED | Exit 127: `vitest: not found`; các Vitest test files đã được thêm nhưng runner chưa cài. |
| `npm run build` | BLOCKED | Exit 127: `next: not found`; không có production build. |
| `npm audit --audit-level=high --fetch-retries=0 --fetch-timeout=10000` | BLOCKED | Exit 1 vì audit endpoint không truy cập được do `EAI_AGAIN`; không phải kết quả audit sạch. |
| `node scripts/smoke.mjs` | BLOCKED | Exit 1, `ECONNREFUSED 127.0.0.1:3000`; không có app server đang chạy để nhận smoke test. |
| PostgreSQL migration / API integration | BLOCKED | Không có database server/credentials. Migration `003` và các role/transaction/query cần staging verification. |
| Browser / mobile / accessibility QA | BLOCKED | Không có Next build/server hoặc browser automation; Private Studio IndexedDB và Web Speech chưa được kiểm thử trên browser thật. |
| AI provider end-to-end | BLOCKED | Không có API keys/provider thật; không tuyên bố đã kiểm thử dịch vụ production. |

**Giới hạn:** 114-file syntax scan và 29 isolated runtime assertions không thay thế semantic typecheck, ESLint, Vitest, production build, DB integration, penetration test, browser QA hoặc đánh giá safeguarding bởi chuyên gia. Không deploy public cho học sinh trước khi xử lý P0/P1, cập nhật dependency, chạy full CI và xác minh quy trình an toàn với đơn vị có chuyên môn.

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
13. Student có thể quản lý yêu cầu sau khi tải lại trang bằng request ID + cancellation token; hủy yêu cầu cần xác nhận trong UI.
14. Journal/local data không xuất hiện trong `/api/chat` hoặc `/api/appointments` trừ khi người dùng nhập một phần nội dung mới và xác nhận riêng.
15. AI: deterministic red path không gọi provider; provider failure không hạ safety level; forged assistant-history rejected; client history chỉ có user turns và nằm trong giới hạn kích thước.
16. Retention endpoint từ chối thiếu/sai CRON_SECRET; cleanup xóa terminal >90d, giữ pending quá 180 ngày và confirmed có ngày hẹn quá 180 ngày.

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
