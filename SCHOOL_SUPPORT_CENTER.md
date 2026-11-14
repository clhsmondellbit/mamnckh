# SCHOOL_SUPPORT_CENTER — Hướng dẫn vận hành

## Mục đích

School Support Center cho phép học sinh tìm hồ sơ liên hệ do trường xác minh, tự chọn gọi điện hoặc gửi yêu cầu hỗ trợ/đặt lịch. Đây không phải tổng đài trực 24/7 và trạng thái "đang tiếp nhận" không bảo đảm người đó đang trực hoặc phản hồi tức thời.

## Danh bạ công khai

Public API chỉ trả hồ sơ đang hoạt động, đã xác minh và có `last_verified_at`. Ảnh, phone và email đều có consent riêng:

- Ảnh đại diện: `avatar_public_consent_at` phải có giá trị và URL phải có; mặc định ẩn.
- Điện thoại: `phone_is_public=true`, `phone_consent_at` có giá trị, `is_verified=true`, số `phone_e164` hợp lệ.
- Email: `email_is_public=true`, `email_consent_at` có giá trị, `is_verified=true`.

Số Việt Nam chuẩn hóa về E.164 `+84...`. Hỗ trợ đầu vào `09...`, `+849...`, `849...`, `00849...` sau khi loại ký tự phân cách. Chuẩn hóa không đồng nghĩa xác minh số thuộc về giáo viên.

Hồ sơ không có số public sẽ không được trả số về frontend. Không có bản ghi demo hoặc số điện thoại giả trong database/source.

## Gọi điện

Giao diện hiển thị số ở dạng dễ đọc và liên kết `tel:+84...`; nút gọi không tự khởi tạo cuộc gọi. Smartphone thường mở ứng dụng gọi mặc định; desktop phụ thuộc handler/trình duyệt. Nút copy sao chép dạng E.164. MẦM không gửi SMS, không chia sẻ vị trí, chat history hoặc nhật ký cá nhân.

## Tìm kiếm và lọc

Tìm kiếm trong tên, vai trò, bộ phận, mô tả, topics và mode; chuẩn hóa Unicode để tìm tiếng Việt không phân biệt dấu. Có lọc topic, hình thức, trạng thái tiếp nhận.

## Yêu cầu hỗ trợ

Trường dữ liệu: tên/cách xưng hô, phone/email tự nguyện, hồ sơ người nhận, topic, phần giới thiệu ngắn, phương thức liên hệ và ngày/khung giờ mong muốn. Học sinh phải tick đồng ý sau khi xem người nhận, trường dữ liệu, mục đích, lưu trữ, cách hủy/xóa. Nội dung chat/nhật ký không được tự động đính kèm.

Thông tin cá nhân được AES-256-GCM mã hóa trước khi ghi vào các cột `*_enc`. Cancellation token chỉ hiển thị cho học sinh một lần; backend chỉ giữ hash. Người dùng phải lưu token để tự hủy/đổi lịch. Sau khi quay lại trang này, có thể nhập mã yêu cầu và token trong mục Quản lý yêu cầu đã gửi; MẦM không lưu token trong localStorage. Không chia sẻ token.

## Lịch hẹn

- Slot chỉ hiển thị khi nhân sự chủ động mở và hồ sơ đang xác minh/nhận yêu cầu.
- Đặt một slot khóa row trong transaction; yêu cầu đầu tiên chiếm được slot, các yêu cầu đồng thời khác nhận lỗi và cần tải lại.
- Mọi khoảng thời gian chồng lấn của một hồ sơ bị từ chối khi tạo slot.
- Slot được giữ ở trạng thái `reserved` trong khi appointment `pending`; được xem là lịch chỉ sau khi nhân sự `confirmed`.
- Không có slot thì học sinh có thể gửi ngày và khung giờ tự do; đó là yêu cầu thủ công `pending`, không phải lịch đặt chắc chắn.
- Học sinh có thể hủy/đề nghị đổi lịch bằng cancellation token; đổi lịch trở lại `pending`.
- Nhân sự chuyển `pending → confirmed/rejected`; `confirmed → completed`. Trạng thái terminal không được xác nhận lại.

## Verification procedure

Admin kiểm tra nguồn nhà trường/đầu mối nhân sự ngoài MẦM, xác nhận chức vụ/phân công, gọi đối chiếu số từ nguồn chính thức và lưu sự đồng ý công khai. Màn hình xác minh ghi nhận `school_confirmation` hoặc `direct_staff_confirmation` cùng tài khoản, thời điểm, cờ consent. Đây là attestation nội bộ, chưa phải SMS OTP hoặc xác minh độc lập tự động.

Bất kỳ cập nhật hồ sơ nào sẽ xóa xác minh, tắt công khai ảnh/phone/email và đóng slot available. Tài khoản Teacher/School Counselor gắn hồ sơ cũng tự động bị vô hiệu hóa, tăng `session_version` để thu hồi phiên đang mở. Admin phải xác minh lại hồ sơ rồi chủ động kích hoạt lại đúng tài khoản. Ngừng công khai hồ sơ cũng vô hiệu hóa tài khoản gắn và đóng slot chưa đặt; appointment đã gửi vẫn được lưu để xử lý theo retention policy.

## Retention

Các yêu cầu `completed`, `cancelled`, `rejected` được xóa sau 90 ngày kể từ lần cập nhật cuối; `pending` quá 180 ngày và `confirmed` có ngày hẹn đã quá 180 ngày cũng được xóa. Slot đã hết hạn được đóng; slot closed/reserved quá 90 ngày sau giờ kết thúc được dọn. Nhà trường phải cấu hình trusted scheduler gọi `POST /api/cron/purge-support-data` mỗi ngày, kèm `Authorization: Bearer $CRON_SECRET`. Nếu không cấu hình, không có tự động xóa. Yêu cầu xóa thủ công phải được xử lý bởi quản trị viên theo chính sách trường và bảo toàn nghĩa vụ lưu trữ hợp pháp.

## API chính

- `GET /api/school-support` — danh bạ public verified.
- `GET /api/appointments/slots?contactId=...` — slot public available.
- `POST /api/appointments` — tạo yêu cầu; yêu cầu JSON consent true.
- `POST /api/appointments/:id/cancel` — hủy bằng token.
- `PATCH /api/appointments/:id` — yêu cầu đổi lịch bằng token.
- `GET/POST /api/staff/contacts` — xem/thêm hồ sơ admin.
- `PATCH/DELETE /api/staff/contacts/:id` — cập nhật/ẩn hồ sơ admin.
- `POST /api/staff/contacts/:id/verify` — xác minh + consent admin.
- `GET/POST /api/staff/slots`, `DELETE /api/staff/slots/:id` — xem/mở/đóng slot chưa được giữ.
- `GET /api/staff/appointments`, `PATCH /api/staff/appointments/:id` — queue/status theo quyền.

## Tài khoản nhân sự và lịch

- Mỗi tài khoản nhân sự dùng email riêng, mật khẩu băm scrypt, cookie HMAC; DB kiểm tra vai trò, trạng thái active, hồ sơ được phân công và session version mỗi request. Đổi mật khẩu/quyền/phân công hoặc vô hiệu hóa tài khoản đều thu hồi phiên cũ.
- Khi sửa hoặc ngừng công khai hồ sơ nhân sự, tài khoản Teacher/School Counselor gắn hồ sơ bị tự động vô hiệu hóa; sau khi hồ sơ xác minh lại, Admin cần kích hoạt lại tài khoản có chủ đích.
- Giáo viên/nhân sự tư vấn chỉ mở/đóng lịch và xử lý yêu cầu của hồ sơ được gán. Lịch mở phải ở tương lai và không chồng thời gian với lịch đang mở/được giữ.
