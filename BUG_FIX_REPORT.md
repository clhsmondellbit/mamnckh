# BUG_FIX_REPORT — MẦM Phase 2

## Các thay đổi trong source

| Area | Phát hiện/điểm yếu | Thay đổi |
|---|---|---|
| School Support Center | Danh bạ trước đây lấy cấu hình tĩnh, không có verification/capability consent | Chuyển sang PostgreSQL contacts; API công khai chỉ trả hồ sơ active + verified, phone/email lọc theo consent riêng. |
| Phone | Input có thể có nhiều định dạng; cần `tel:` ổn định | Chuẩn hóa số VN sang E.164 `+84`; UI hiển thị định dạng dễ đọc, click-to-call và copy. |
| Directory updates | Sửa phone/profile có thể để sót trạng thái xác minh cũ | Mọi sửa đổi tự thu hồi xác minh, ẩn phone/email và đóng slot available; admin xác minh lại. |
| Appointments | Không có dữ liệu lịch/booking thật | Bổ sung tables, encrypted request fields, cancellation hash, manual pending request và slot reservation. |
| Booking race | Hai request có thể chọn cùng slot hoặc mở slot chồng lấn | Row lock `FOR UPDATE`, conditional update, advisory transaction lock theo contact, overlap check và partial unique index. |
| Appointment states | Có thể cần ngăn chuyển trạng thái không hợp lệ | `pending → confirmed/rejected`, `confirmed → completed`; state khác bị từ chối; cancel/reschedule dùng token. |
| Staff authentication | Một credential chia sẻ không đáp ứng kiểm soát theo vai trò | Tài khoản cá nhân, scrypt password hash, HMAC cookie, active-state lookup và role/contact scope. |
| Staff lockout | Có thể vô hiệu hóa Super Admin cuối cùng | Chặn hạ quyền/vô hiệu hóa Super Admin cuối cùng. |
| Privacy | Nội dung hỗ trợ định danh có nguy cơ lưu rõ | AES-256-GCM encryption cho name/phone/email/note; raw cancellation token chỉ trả lần đầu, DB giữ hash. |
| Audit | List/view and lifecycle actions cần actor metadata | Audit log cho staff login/logout/list, contact management, slot creation, appointment views/status. Không log nội dung chat/note. |
| Staff UI | Dashboard có nút đăng xuất giả/không nối API | Thêm nút đăng xuất client gọi DELETE API; xóa import/render trùng AuditList. |
| Legacy request API | Form generic không thể chỉ rõ người nhận và consent | POST cũ trả 410 hướng sang School Support Center; GET queue legacy chỉ dành admin. |
| AI routing | Một prompt chung ít phân luồng nhiệm vụ | Thêm rule-based orchestrator module routing trên provider pipeline dùng chung; không lưu profile. |
| Student personal tools | Cần nhật ký/công cụ tự hỗ trợ | Thêm journal local-only và tools; không tự gửi journal vào AI context. |

## File chính

- `sql/migrations/002_school_support_center.sql`
- `lib/db/school-support.ts`, `lib/db/staff-users.ts`, `lib/db/client.ts`
- `lib/auth/staff.ts`, `lib/auth/password.ts`
- `lib/security/field-encryption.ts`, `lib/school/phone.ts`
- `app/api/school-support/route.ts`, `app/api/appointments/**`, `app/api/staff/**`
- `components/support-center/**`, `components/staff/**`, `components/chat/chat-experience.tsx`
- `lib/ai/orchestrator.ts`, `lib/ai/prompt.ts`, `app/api/chat/route.ts`

## Xác minh

Không được suy luận “sửa xong” là “đã test”. Typecheck, lint, Vitest, PostgreSQL integration, production build và npm audit bị BLOCKED trong sandbox do thiếu node_modules, npm registry DNS và database/provider. Chi tiết command/status ở `TESTING.md`. Source mới và migration chưa được apply trên DB thật trong môi trường này.

- Gia cố thêm phân quyền lịch ở tầng service (không chỉ ở route) và bổ sung session version để đặt lại mật khẩu, đổi quyền/phân công hoặc vô hiệu hóa tài khoản thu hồi phiên đăng nhập cũ ngay.
- Khi sửa/ngừng công khai hồ sơ liên hệ, tài khoản Teacher/School Counselor gắn hồ sơ tự động bị vô hiệu hóa; cần xác minh lại và Admin kích hoạt lại có chủ đích.
- Bootstrap Super Admin nay chỉ chạy khi `staff_users` còn trống; các tài khoản tiếp theo phải được tạo từ dashboard đã xác thực.
- Sửa đổi lịch thủ công giữ lại hình thức liên hệ hiện tại thay vì mặc định chuyển sang gặp trực tiếp; backend kiểm tra phương thức đó vẫn được hỗ trợ.
- Sửa câu lệnh cập nhật hồ sơ danh bạ có phép gán lặp cùng một cột `avatar_public_consent_at`, tránh lỗi SQL khi cập nhật hồ sơ.

- Bổ sung biểu mẫu quản lý yêu cầu ở trang School Support Center để học sinh có thể nhập lại mã yêu cầu + cancellation token sau khi tải lại trang; hủy có xác nhận, đổi lịch trở lại trạng thái chờ. Mã không được lưu vào localStorage.
