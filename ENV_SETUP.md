# ENV_SETUP — Thiết lập môi trường MẦM

## Yêu cầu

- Node.js 20.9+ (Node 22 khuyến nghị), npm 10+.
- PostgreSQL 14+ khi bật danh bạ/nhân sự/lịch.
- Kết nối outbound tới AI provider khi bật AI.

## Cài đặt

```bash
npm ci
cp .env.example .env.local
```

Điền biến phù hợp. Chạy `npm run dev` để mở local. Không đưa `.env.local` lên Git hoặc ZIP.

## Required secrets

- `AUTH_SECRET`: tối thiểu 32 ký tự ngẫu nhiên để ký session cookie.
- `DATA_ENCRYPTION_KEY`: Base64-encoded 32 bytes ngẫu nhiên để encrypt/decrypt dữ liệu yêu cầu hỗ trợ. Sao lưu trong secret manager; mất key sẽ làm mất khả năng đọc dữ liệu đang lưu.
- `CRON_SECRET`: secret ngẫu nhiên riêng cho endpoint retention.
- `OPENROUTER_API_KEY`: tùy chọn; chỉ server-side.

Tạo giá trị bằng `openssl rand -hex 32` cho AUTH/CRON và `openssl rand -base64 32` cho DATA key. Không dùng cùng một key cho nhiều mục đích.

## Database

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/migrations/002_school_support_center.sql
```

Backup DB trước migration trên môi trường đang dùng. `002` là migration phụ thêm; kiểm tra staging trước production.

## Bootstrap tài khoản đầu tiên

Tạo Super Admin từ shell/máy bảo mật có quyền database:

```bash
STAFF_BOOTSTRAP_EMAIL=admin@school.example \
STAFF_BOOTSTRAP_NAME='School Admin' \
STAFF_BOOTSTRAP_PASSWORD='a-unique-password-at-least-16-chars' \
npm run staff:create
```

Dùng email/mật khẩu thực do nhà trường cấp; ví dụ trên không phải credential. Script chỉ tạo Super Admin đầu tiên và chỉ khi `staff_users` còn trống; các tài khoản sau được tạo từ Admin Dashboard. Các `STAFF_BOOTSTRAP_*` chỉ dùng trong lệnh bootstrap, không ghi lâu dài vào `.env.local`. Tài khoản riêng được quản lý trong `staff_users`.

## Retention job

Cấu hình scheduler tin cậy chạy hằng ngày:

```bash
curl -X POST "$APP_URL/api/cron/purge-support-data" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Bảo vệ biến `$CRON_SECRET` trong secret manager và không log giá trị. Nếu không gọi tác vụ, retention cleanup không tự chạy.

## Reverse proxy / production

- Chỉ phục vụ qua HTTPS.
- `APP_URL` phải đúng origin public, không path.
- Reverse proxy phải xóa header `X-Forwarded-For` do client tự gửi và chỉ đặt header đáng tin cậy.
- Dùng WAF hoặc rate-limit dùng chung (Redis/edge) khi chạy nhiều instance; rate limiter trong app hiện local theo process.
- Cấu hình logging không lưu request body của chat/check-in/support request.
- Review data processing/retention của AI provider và chỉ bật AI sau khi có thông báo rõ cho học sinh.
- Cấu hình backup DB + encryption key riêng, kiểm thử restore.

## Dependency release blocker

Source hiện ghim Next.js `16.3.8`; không cập nhật package/lockfile trong đợt này vì npm registry DNS lỗi trong môi trường build. Xem `SECURITY_AUDIT.md`. Không public deploy trước khi nâng Next.js cùng `eslint-config-next`/lockfile theo advisory mới nhất rồi cài sạch, audit, typecheck, lint, test, build.

Khi quản trị viên đặt lại mật khẩu nhân sự, `session_version` của tài khoản tăng lên và các phiên đã cấp trước đó sẽ không còn hợp lệ ở request tiếp theo.
