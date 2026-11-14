# COUNSELOR_SETUP — Cấu hình nhân sự tư vấn

## 1. Chuẩn bị trước khi nhập

Nhà trường cần cung cấp và xác nhận: họ tên, chức vụ/vai trò chính xác, bộ phận, chủ đề có thể tiếp nhận, mô tả, số điện thoại liên hệ được phép công bố, email công việc, lịch tiếp nhận, phương thức hỗ trợ, trạng thái nhận yêu cầu. Không gán chức danh/chuyên môn tâm lý nếu trường chưa xác nhận.

Số điện thoại cá nhân chỉ được nhập/công khai khi người sở hữu đồng ý và nhà trường cho phép. Không sử dụng số mẫu, số hotline đoán, số cá nhân của giáo viên khác hoặc thông tin lấy từ mạng xã hội không được phép.

## 2. Apply database and bootstrap

Thực hiện hướng dẫn trong README/ENV_SETUP. Migration `002_school_support_center.sql` phải chạy sau `sql/schema.sql`. Tạo Super Admin đầu tiên bằng `npm run staff:create`; mật khẩu ít nhất 16 ký tự, không để các biến bootstrap lưu trong env lâu dài.

## 3. Tạo hồ sơ

1. Admin đăng nhập `/staff/login`, mở dashboard.
2. Trong phần quản lý danh bạ, chọn thêm hồ sơ.
3. Điền tên, roleTitle, department, topics, mô tả, phone/email nếu có, contactHours, contactModes, intakeStatus.
4. Tạo hồ sơ nháp. Hồ sơ mặc định chưa xác minh và không được public.

Vai trò gợi ý chỉ mang tính phân loại dữ liệu; admin phải nhập đúng chức vụ được nhà trường xác nhận. Giáo viên chủ nhiệm không mặc định là chuyên viên tư vấn tâm lý.

## 4. Xác minh và đồng ý công khai

Trước khi nhấn xác minh, admin cần:

- Đối chiếu danh tính và nhiệm vụ với nguồn chính thức nội bộ.
- Xác minh số điện thoại từ nguồn mà trường quản lý hoặc qua liên hệ trực tiếp đã được xác nhận.
- Có sự đồng ý riêng để công khai ảnh đại diện (nếu có), số điện thoại nếu là số cá nhân, và email.
- Chọn `school_confirmation` nếu trường xác nhận, hoặc `direct_staff_confirmation` khi người đó trực tiếp xác nhận.
- Tick đúng từng consent ảnh/điện thoại/email; bỏ trống có nghĩa là không công khai kênh đó.

MẦM lưu actor, phương thức và thời điểm xác minh. Đây là biên bản attestation trong hệ thống, không phải OTP hoặc dịch vụ xác minh số tự động.

## 5. Cập nhật và ngừng công khai

- Khi thay đổi bất kỳ thông tin liên hệ/chức vụ/giờ tiếp nhận nào, nhấn chỉnh sửa rồi lưu. Hệ thống tự động thu hồi `is_verified`, avatar/phone/email public consent flags và các timestamp xác minh; slot chưa đặt sẽ bị đóng. Các tài khoản Teacher/School Counselor gắn hồ sơ đồng thời bị vô hiệu hóa và session version tăng để thu hồi cookie cũ.
- Sau khi Admin xác minh lại hồ sơ và sự đồng ý công khai phù hợp, Admin mở phần tài khoản nhân sự, kiểm tra đúng người/đúng hồ sơ rồi chủ động kích hoạt tài khoản cũ. Nếu người đó không còn phụ trách, giữ tài khoản ở trạng thái vô hiệu hóa hoặc chuyển phân công theo quy trình của trường.
- Sau khi cập nhật, xác minh lại với nhà trường và người sở hữu số; tick lại consent tương ứng.
- Khi nhân sự nghỉ/không còn tiếp nhận, dùng “Ngừng công khai”. Hồ sơ bị loại khỏi public directory, số/email bị ẩn và slot chưa đặt bị đóng.
- Không xóa trực tiếp dòng dữ liệu trong DB để thay thế quy trình audit; chỉ xử lý xóa theo quy định lưu trữ của trường.

## 6. Tạo tài khoản cá nhân

Admin mở mục tài khoản, nhập email công việc, tên, mật khẩu ban đầu từ 16 ký tự và role. Giáo viên/counselor phải gắn với hồ sơ hỗ trợ tương ứng. Giáo viên chỉ đọc yêu cầu có `contact_id` khớp; không thể xem toàn bộ chat hoặc nhật ký.

Super Admin mới được tạo/cấp quyền Super Admin. Hệ thống ngăn thao tác vô hiệu hóa/hạ quyền Super Admin cuối cùng.

## 7. Mở lịch

Giáo viên/counselor đăng nhập bằng account riêng, vào lịch tiếp nhận, chọn ngày/giờ, thời lượng và mode. Admin có thể chọn hồ sơ. Chỉ hồ sơ đã xác minh/đang nhận yêu cầu mới mở slot. Không tạo slot khi chưa biết người nhận thực sự rảnh. Hệ thống từ chối các slot giao nhau.

## 8. Xử lý yêu cầu

Queue chỉ hiển thị yêu cầu gắn với hồ sơ của người dùng hiện tại (admin được phép vận hành có thể xem queue toàn hệ thống). Dữ liệu tên/số/email/note được giải mã trên server khi đã qua authorization. Xác nhận, từ chối hoặc đánh dấu hoàn tất theo thực tế. Không tải/copy dữ liệu riêng tư ra bảng tính hay kênh chat không được trường phê duyệt.

## 9. Giới hạn và vận hành

- Không có email/SMS/push tự động trong bản này.
- Không có calendar sync; slot phải được nhân sự mở thủ công.
- Yêu cầu lịch tự do luôn chờ xác nhận.
- Retention 90 ngày chỉ chạy khi trường cấu hình scheduler gọi endpoint hằng ngày; pending quá 180 ngày và confirmed có ngày hẹn đã quá 180 ngày được dọn; yêu cầu hoạt động gần đây được giữ lại. Cleanup chỉ chạy khi scheduler được cấu hình.
- Phải backup `DATA_ENCRYPTION_KEY` và cơ sở dữ liệu an toàn. Rotation key hiện cần quy trình kỹ thuật riêng.
- Staff auth chưa có SSO/MFA; áp dụng chính sách truy cập mạnh, HTTPS, WAF/shared rate limit và cập nhật dependencies trước production.

Khi đổi mật khẩu tài khoản nhân sự, hệ thống tăng `session_version`; cookie đã phát hành trước đó không còn hợp lệ ở request kế tiếp. Nếu tài khoản nhân sự rời nhiệm vụ, đặt `isActive=false` để vô hiệu hóa truy cập ngay. Nếu hồ sơ liên hệ bị sửa hoặc ngừng công khai, hệ thống tự động thực hiện bước vô hiệu hóa tài khoản gắn hồ sơ.
