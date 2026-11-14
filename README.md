# MẦM — AI Đồng Hành Học Đường

MẦM là ứng dụng web tiếng Việt hỗ trợ học sinh nhìn nhận khó khăn học đường, quản lý áp lực và tự nguyện kết nối với người lớn/nhân sự hỗ trợ do nhà trường xác minh.

> MẦM là công cụ hỗ trợ bước đầu, không phải cơ sở chẩn đoán và không thay thế chuyên gia tâm lý, bác sĩ, giáo viên hoặc hỗ trợ trực tiếp. Nếu cần trợ giúp ngay, hãy đến cạnh một người lớn đáng tin cậy đang ở gần và liên hệ dịch vụ khẩn cấp phù hợp tại địa phương. Danh bạ MẦM không bảo đảm người được liệt kê đang trực hoặc sẽ nghe máy ngay.

## Tình trạng bàn giao

Bản này bổ sung School Support Center có danh bạ lưu trong PostgreSQL, quy trình xác minh và đồng ý công khai kênh liên hệ, liên kết gọi `tel:`, sao chép số, yêu cầu tư vấn/đặt lịch, slot do nhân sự mở, tài khoản nhân sự riêng, vai trò và nhật ký thao tác. Hồ sơ giáo viên và số điện thoại không có dữ liệu giả; danh bạ công khai rỗng cho đến khi nhà trường nhập và xác minh thông tin thật.

**Điều kiện trước production:** source đầu vào vẫn ghim `next@16.3.8`. Dependency chưa được nâng cấp trong môi trường xây dựng vì npm registry không phân giải DNS. Tham khảo `SECURITY_AUDIT.md`; không triển khai public trước khi nâng phiên bản Next.js đã vá, cài sạch, audit, test và build lại.

## Chức năng hiện có

- Chat khách; chỉ gửi các lượt người dùng trước đó làm ngữ cảnh, tối đa 8 lượt; không gửi lịch sử assistant do trình duyệt tự khai báo.
- Safety checks trước/sau khi gọi AI; tình huống nghiêm trọng dùng nhánh hướng dẫn xác định và không chờ AI.
- AI Orchestrator chọn prompt chuyên biệt trong một provider chung: chat, hỗ trợ học tập, cảm xúc, phản tư, giao tiếp, kiến thức, hướng dẫn tìm người hỗ trợ.
- Check-in cảm xúc không tạo hồ sơ tâm lý.
- Thư viện nội dung hiện có, tìm kiếm không phân biệt dấu và bookmark lưu cục bộ.
- Công cụ grounding, chia nhỏ nhiệm vụ, phản tư ngắn; không tự chấm điểm học sinh.
- Nhật ký phản tư local-only trong trình duyệt; không được tự động gửi vào AI context hoặc School Support Center.
- School Support Center: danh bạ chỉ gồm hồ sơ được xác minh; gọi điện bằng `tel:`, copy số, tìm kiếm/lọc, gửi yêu cầu và đặt lịch.
- Counselor/staff dashboard: hàng đợi yêu cầu theo hồ sơ được phân công, mở slot, xác nhận/từ chối/hoàn tất.
- Admin: quản lý hồ sơ và tài khoản nhân sự, xác minh/thu hồi xác minh, audit log.

Các phần chưa triển khai đầy đủ (CMS nội dung, RAG, push notifications, nhắc lịch, PWA, streaming, nhiều hơn 8 lượt ngữ cảnh, đánh giá từng câu trả lời AI, xác minh SMS OTP) được liệt kê trong `FEATURES.md`; không giả lập bằng UI.

## Công nghệ

- Next.js App Router, React, TypeScript.
- PostgreSQL qua `postgres` tagged-template queries.
- AI provider API tương thích OpenAI/OpenRouter (tùy cấu hình).
- Zod validation, Vitest.
- AES-256-GCM cho dữ liệu riêng tư của yêu cầu hỗ trợ; scrypt cho mật khẩu nhân sự.

## Yêu cầu

- Node.js 20.9+ (khuyến nghị Node.js 22 LTS được nền tảng hỗ trợ).
- npm 10+.
- PostgreSQL 14+ (15+ khuyến nghị) nếu bật School Support Center/staff.
- API key AI provider nếu cần phản hồi AI trực tiếp.

## Cài đặt local

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Nếu không có `OPENROUTER_API_KEY`, ứng dụng không giả lập AI; API trả thông báo provider chưa khả dụng. Các trang tĩnh, công cụ và thư viện vẫn hoạt động. Danh bạ trực tuyến yêu cầu PostgreSQL và migration.

## Cấu hình môi trường

| Biến | Ý nghĩa |
|---|---|
| `OPENROUTER_API_KEY` | Secret AI provider, chỉ server-side. |
| `AI_BASE_URL`, `AI_MODEL`, `SAFETY_MODEL` | Provider endpoint và model được operator chọn. |
| `ENABLE_STAFF_DASHBOARD=true` | Bật các API staff/School Support Center; cần đồng thời có `DATABASE_URL`, `AUTH_SECRET` hợp lệ và `DATA_ENCRYPTION_KEY` Base64 đúng 32 bytes. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `AUTH_SECRET` | HMAC session secret tối thiểu 32 ký tự; dùng random secret. |
| `DATA_ENCRYPTION_KEY` | Base64 của đúng 32 bytes ngẫu nhiên cho dữ liệu yêu cầu hỗ trợ. Mất key thì không giải mã được dữ liệu đang lưu. |
| `CRON_SECRET` | Secret dài, ngẫu nhiên cho endpoint dọn dữ liệu định kỳ. |
| `APP_URL` | Public origin chính xác; HTTPS khi production, không có path. |
| `SCHOOL_SUPPORT_CONFIG_JSON` | Cấu hình hướng dẫn an toàn/escalation cho AI; **không** phải danh bạ công khai. |

Tạo secret ví dụ trên máy tin cậy:

```bash
openssl rand -hex 32       # AUTH_SECRET
openssl rand -base64 32    # DATA_ENCRYPTION_KEY
openssl rand -hex 32       # CRON_SECRET
```

Không commit `.env.local`, không để secret trong `NEXT_PUBLIC_*`, source code, screenshot hoặc log. Xem `ENV_SETUP.md`.

## Database và bootstrap admin

Trên database mới, chạy lần lượt:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/migrations/002_school_support_center.sql
```

Migration `002` tạo các bảng `staff_users`, `school_support_contacts`, `school_support_slots`, `school_support_appointments` và các audit logs. Migration là additive đối với `support_requests` hiện có. Sao lưu và chạy thử trên staging trước production.

Tạo tài khoản Super Admin ban đầu từ môi trường tin cậy có quyền DB. Các biến `STAFF_BOOTSTRAP_*` chỉ dùng một lần, không đưa vào `.env.example` hoặc secret store dài hạn:

```bash
STAFF_BOOTSTRAP_EMAIL=admin@school.example \
STAFF_BOOTSTRAP_NAME='School Administrator' \
STAFF_BOOTSTRAP_PASSWORD='use-a-unique-16-plus-character-password' \
npm run staff:create
```

Thay email/mật khẩu ví dụ bằng tài khoản do nhà trường kiểm soát. Script bootstrap chỉ chạy khi bảng `staff_users` còn trống và chỉ tạo Super Admin đầu tiên; các tài khoản tiếp theo phải tạo trong Admin Dashboard. Chỉ chia sẻ mật khẩu ban đầu với đúng người nhận qua kênh an toàn. Sau bootstrap, xóa các biến tạm khỏi shell/CI logs. Không dùng tài khoản chung.

## Kết nối giáo viên và đặt lịch

1. Admin đăng nhập `/staff/login`.
2. Trong dashboard, tạo hồ sơ nhân sự với thông tin do nhà trường xác nhận. Hồ sơ mới mặc định chưa xác minh và chưa hiển thị công khai.
3. Xác minh danh tính/đơn vị, quyền sử dụng số điện thoại/email; chỉ bật từng ô đồng ý công khai khi có bằng chứng đồng ý thực tế.
4. Mọi cập nhật hồ sơ sẽ tự thu hồi trạng thái xác minh và ẩn ảnh/điện thoại/email; đóng slot chưa đặt và tự vô hiệu hóa các tài khoản giáo viên/counselor gắn với hồ sơ đó.
5. Sau khi xác minh lại hồ sơ, Admin kiểm tra và kích hoạt lại đúng tài khoản được phân công nếu còn phù hợp. Tài khoản đã bị vô hiệu hóa không thể đăng nhập; `session_version` làm mất hiệu lực cookie cũ.
6. Tạo tài khoản riêng cho nhân sự; vai trò `teacher`/`school_counselor` cần gắn với một hồ sơ hỗ trợ.
7. Giáo viên mở slot thực tế trong Availability Manager. Học sinh chỉ thấy slot có trạng thái available.
8. Nếu học sinh chọn slot, transaction PostgreSQL giữ slot nguyên tử; yêu cầu vẫn `pending` cho đến khi nhân sự xác nhận. Nếu không có slot, đây chỉ là yêu cầu lịch thủ công chờ xác nhận, không phải booking chắc chắn.

Chi tiết tại `SCHOOL_SUPPORT_CENTER.md` và `COUNSELOR_SETUP.md`.

## Các trang chính

- `/` — Trang chủ.
- `/chat` — AI Chat.
- `/check-in` — Check-in tự nguyện.
- `/tools` — Công cụ hỗ trợ học sinh.
- `/journal` — Nhật ký local-only.
- `/resources` — Thư viện kiến thức hiện có.
- `/support-center` — Danh bạ đã xác minh, gọi điện và yêu cầu hỗ trợ.
- `/help` — Hướng dẫn tìm sự trợ giúp.
- `/staff/login`, `/staff/dashboard` — Khu vực nhân sự được phân quyền.

## Kiểm tra chất lượng

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm audit --audit-level=high
```

Không đánh dấu PASS nếu chưa thực sự chạy. Tình trạng lần kiểm tra bàn giao được ghi trong `TESTING.md`. E2E smoke yêu cầu ứng dụng đã build/chạy và được trỏ tới bởi `APP_URL`.

## Bảo mật và quyền riêng tư

- Không tự động gửi lịch sử chat hoặc nhật ký cá nhân đến giáo viên.
- Yêu cầu tư vấn chỉ chứa trường người dùng nhập và đồng ý; trường nhạy cảm được mã hóa bằng AES-256-GCM.
- Admin/counselor/teacher chỉ có phạm vi truy cập theo vai trò; giáo viên chỉ xem yêu cầu thuộc hồ sơ được gắn.
- Số điện thoại và email chỉ công khai khi hồ sơ đã xác minh, kênh đó có consent và cờ public được bật. Khi chỉnh sửa/ngừng công khai hồ sơ, tài khoản Teacher/School Counselor gắn hồ sơ bị tự vô hiệu hóa; Admin chỉ kích hoạt lại sau khi xác minh lại.
- `tel:` chỉ mở khi học sinh nhấn nút; MẦM không tự gọi/SMS hoặc chia sẻ vị trí.
- Rate limiter hiện process-local; triển khai nhiều instance cần WAF/Redis/shared limiter.
- Cấu hình scheduler hằng ngày để gọi retention endpoint; không cấu hình scheduler thì cleanup không tự chạy.

Xem `SECURITY_AUDIT.md`, `docs/PRIVACY.md`, `docs/SAFETY.md`.
