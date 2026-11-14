# ARCHITECTURE — MẦM Phase 2

## 1. Tổng quan

MẦM là Next.js App Router monolith theo modular boundaries. Không tách microservices khi quy mô và hạ tầng hiện tại chưa cần thiết.

- **Presentation:** pages, React components, client-side journal/tools.
- **API/application:** `app/api/**/route.ts` xác thực request, validation, rate limit, authorization và tạo response `no-store`.
- **Domain/service:** `lib/ai`, `lib/safety`, `lib/school`, `lib/resources`, `lib/auth`.
- **Data access:** `lib/db/**` qua một PostgreSQL pool giới hạn connections.
- **Security:** `lib/security` cho JSON request bounds, same-origin, field encryption, rate limit.

## 2. School Support Center flow

`SupportDirectory` → `GET /api/school-support` → `listPublicContacts()` → PostgreSQL `school_support_contacts`.

Chỉ hồ sơ `is_active=true`, `is_verified=true`, `last_verified_at IS NOT NULL` được công khai. Điện thoại chỉ được trả về nếu `phone_is_public`, `phone_consent_at` và `is_verified`; email có điều kiện consent riêng. Public API chỉ trả DTO đã lọc, không trả dữ liệu quản trị.

`tel:` là client-side anchor và chỉ chạy do người dùng kích hoạt. Copy dùng Clipboard API. Không có tự động gọi/SMS.

## 3. Verification and directory changes

Admin tạo/sửa hồ sơ bằng staff API. Mọi chỉnh sửa dữ liệu sẽ đặt `is_verified=false`, tắt public flags, xóa verification timestamps và đóng slot chưa đặt. Admin cần xác minh lại thông tin và ghi nhận consent điện thoại/email độc lập. Verification method hiện là **attestation của nhân sự quản trị** (`school_confirmation` hoặc `direct_staff_confirmation`), không phải OTP/đối soát tự động với hệ thống trường. Trường phải thực hiện kiểm chứng ngoài ứng dụng rồi mới đánh dấu.

## 4. Appointments and concurrent scheduling

`school_support_slots` lưu khung giờ do staff mở. Tạo slot serialize theo `pg_advisory_xact_lock(hashtext(contactId))` và từ chối khoảng thời gian giao nhau với slot `available`/`reserved`. Học sinh gửi booking sẽ khóa slot `FOR UPDATE`, cập nhật `available → reserved` có điều kiện và tạo appointment trong cùng transaction. Unique partial index đảm bảo một slot chỉ có tối đa một appointment `pending` hoặc `confirmed`.

Nếu không chọn slot, backend tạo yêu cầu lịch thủ công `pending`; requested date/time không được coi là slot đã xác nhận. Nhân sự quyết định `pending → confirmed/rejected`, `confirmed → completed`. Hủy hoặc từ chối giải phóng slot đã giữ; đổi lịch trở lại `pending`.

## 5. Private request data

Tên, số điện thoại, email và phần giới thiệu tự nguyện được mã hóa ở application layer bằng AES-256-GCM. Mỗi trường có IV và authentication tag riêng. Database giữ cancellation token dạng SHA-256 hash, không lưu token thô. `DATA_ENCRYPTION_KEY` là bắt buộc để ghi/đọc dữ liệu. Cần backup key an toàn và quy trình rotation có migration/re-encryption riêng; chưa có key rotation tự động.

## 6. Staff authentication / RBAC

Tài khoản cá nhân nằm ở `staff_users`; mật khẩu hash bằng scrypt; phiên là HMAC-SHA256 signed cookie HttpOnly, SameSite=Strict, Secure ở production. Mỗi request đọc lại role, active state và `support_contact_id` từ DB. Role:

- `super_admin`: quản trị toàn hệ thống, cấp Super Admin.
- `admin`: quản lý danh bạ, tài khoản không-superadmin, audit và queue vận hành.
- `content_manager`: role đã định nghĩa, CMS UI chưa triển khai.
- `school_counselor`, `teacher`: chỉ xem queue/slot gắn với contact_id.
- `technical_operator`: role đã định nghĩa; không có quyền xem appointment payload.

Teacher/counselor cần `support_contact_id`. API enforce role và scope ở server, không dựa vào ẩn/hiện UI.

## 7. AI orchestration

`orchestrateSupportRequest()` là rule-based routing tạm thời cho một provider chung. Các module chuyên biệt dùng chung Context/Safety/Provider flow; module chỉ điều chỉnh hướng dẫn prompt. Không tạo profile người học; module/topic không được lưu vào database. History gửi đi chỉ gồm user turns do frontend gửi, tối đa 8 lượt; server từ chối assistant roles trong history. Chưa có persistent summarization, RAG hoặc multi-provider failover.

## 8. Browser-only data

Journal và một số tùy chọn/bookmarks lưu ở localStorage; không truyền vào API chat hoặc support requests. Đây không phải kho lưu trữ an toàn cho thiết bị dùng chung; người học cần xóa dữ liệu local khi dùng máy chung. Chat sessions giữ trong React memory và mất khi đóng/tải lại trang.

## 9. Retention and operations

Retention helper xóa appointment `completed/cancelled/rejected` sau 90 ngày kể từ `updated_at`; một endpoint cron được bảo vệ bằng `CRON_SECRET` cần được nhà trường gọi mỗi ngày. Pending/confirmed không tự xóa. Legacy `support_requests` resolved hơn 90 ngày cũng được cleanup; dữ liệu legacy chưa giải quyết không tự xóa. Cần đặt chính sách thực tế của trường và xử lý yêu cầu xóa.

## 10. Limits

Chưa có CMS kiến thức, RAG, notifications/push/reminders, PWA, real-time video/chat, schedule sync với calendar của giáo viên, staff SSO/MFA, shared Redis rate-limit, multi-instance test, observability integration hoặc key rotation tự động. `next@16.3.8` còn là release blocker ghi trong `SECURITY_AUDIT.md`.
