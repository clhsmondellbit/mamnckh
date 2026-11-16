# Quyền riêng tư và tối thiểu hóa dữ liệu

MẦM là công cụ hỗ trợ bước đầu và kết nối người thật. Không yêu cầu học sinh khai báo tên thật khi trò chuyện, không dùng dữ liệu chat để lập hồ sơ tâm lý và không mặc định chia sẻ dữ liệu cho nhà trường.

## Dữ liệu được xử lý/lưu ở đâu?

- **Chat khách:** nội dung phiên đang hoạt động nằm trong bộ nhớ trang của trình duyệt; không ghi transcript vào PostgreSQL. Frontend không gửi lịch sử assistant do client tự tạo. Nếu `CONVERSATION_SECRET` (hoặc `AUTH_SECRET` hợp lệ) được cấu hình, API lưu tối đa 4 message gần nhất trong cookie AES-256-GCM do server tạo, HttpOnly, gắn với session ID và hết hạn sau 2 giờ; provider AI nhận context đó cùng tin nhắn mới. Đây không phải long-term memory, không đồng bộ thiết bị và không có bản transcript database. Nhà trường phải thẩm định điều khoản, logging và retention của provider trước khi cho học sinh sử dụng.
- **Safety/check-in:** phân loại hỗ trợ chạy trong request, không lưu thành hồ sơ cá nhân hoặc bảng điểm tâm lý.
- **Journal legacy:** bản ghi cũ ở `localStorage` vẫn chưa mã hóa cho đến khi người dùng tự nhập vào Private Studio; import và xóa bản cũ đều yêu cầu lựa chọn riêng.
- **Private Studio:** Story Journal, Memory Graph, Daily Reflection, Guided Journeys, Scenario Lab, Insight Studio, Conversation Debrief và Toolkit lưu ciphertext trong IndexedDB bằng AES-GCM; khóa được dẫn xuất từ cụm mật khẩu thông qua PBKDF2 và chỉ tồn tại trong phiên mở khóa. Nội dung không gửi tới server hoặc AI. Quên mật khẩu thì không thể khôi phục. Cơ chế này không bảo vệ khỏi XSS, extension độc hại, trình duyệt/thiết bị bị xâm nhập, hoặc thiết bị đang mở khóa. JSON export là dữ liệu đã giải mã và cần bảo vệ riêng.
- **Công cụ tự hỗ trợ:** công cụ hiện có ở `/tools` vẫn dùng trạng thái trang hiện tại và không gửi nội dung đến AI; tiến độ các Guided Journeys và Scenario Lab mới có thể lưu vào Private Studio mã hóa nếu người dùng mở kho.
- **School Support Center:** chỉ dữ liệu học sinh tự nhập và đồng ý gửi mới được lưu (tên/cách xưng hô, phone/email, chủ đề, lời giới thiệu ngắn, lựa chọn liên hệ/lịch). Các trường này được mã hóa AES-256-GCM trước khi ghi DB. Nội dung chat, check-in và nhật ký không được tự động đính kèm.
- **Mã hủy/đổi lịch:** token hiển thị một lần cho học sinh; DB chỉ lưu SHA-256 hash. Nếu mất token, học sinh cần liên hệ đầu mối nhà trường theo chính sách đã công bố.
- **Danh bạ:** hồ sơ phải active + verified mới được công khai. Ảnh đại diện, phone và email có cờ consent riêng; trường hợp không có consent thì API không trả giá trị đó ra public client. Số điện thoại được chuẩn hóa về E.164, không có nghĩa là hệ thống đã xác thực thuê bao bằng OTP.
- **Legacy support requests:** biểu mẫu cũ đã ngừng nhận mới; bản ghi cũ có thể chứa plain text từ phiên bản trước. Chỉ Admin/Super Admin xem được; việc truy cập và cập nhật được ghi audit metadata. Nhà trường phải rà soát dữ liệu cũ theo chính sách trước khi mở môi trường thật.
- **Audit:** ghi tài khoản, hành động, loại đối tượng, thời điểm và tên trường thay đổi; không ghi nội dung note/chat vào log. Chính sách thời gian lưu audit phải do trường ban hành.
- **Tài nguyên yêu thích:** lưu ID tài nguyên trong local storage; không lưu nội dung tâm sự.

## Người có thể xem yêu cầu tư vấn

- Giáo viên/nhân sự tư vấn chỉ xem yêu cầu gắn với hồ sơ `support_contact_id` được phân công.
- Admin/Super Admin có thể xử lý hàng đợi vận hành và quản trị danh bạ/tài khoản. Quyền Admin không có nghĩa là được xem hội thoại AI hoặc nhật ký cá nhân; các nguồn dữ liệu đó không được lưu tập trung.
- Technical Operator/Content Manager không được cấp API đọc yêu cầu tư vấn trong phiên bản hiện tại.

## Thời gian lưu trữ

- Yêu cầu đã hoàn tất/hủy/từ chối: cleanup sau 90 ngày từ lần cập nhật trạng thái cuối.
- Yêu cầu pending quá 180 ngày: cleanup.
- Yêu cầu confirmed có ngày hẹn đã quá 180 ngày: cleanup.
- Slot cũ: slot available đã qua giờ tự chuyển closed; slot closed/reserved quá 90 ngày sau giờ kết thúc được xóa bởi cùng retention job.
- Cleanup chỉ chạy khi trường cấu hình scheduler gọi endpoint bảo vệ bằng `CRON_SECRET` hằng ngày. Không cấu hình scheduler nghĩa là dữ liệu không tự xóa.

Thời hạn trên là giá trị mặc định trong migration; trường phải kiểm tra lại với chính sách lưu trữ, nghĩa vụ pháp lý và quy trình vận hành trước production.

## Quyền rút lại và xóa

Học sinh có thể hủy yêu cầu bằng mã quản lý một lần sau khi gửi. Yêu cầu xóa dữ liệu còn tồn tại cần gửi qua đầu mối nhà trường; bản này chưa có cổng tự xóa ngay lập tức bằng tài khoản học sinh vì không yêu cầu tài khoản học sinh.

## Trước khi đưa vào trường

Nhà trường cần công bố chính sách và căn cứ xử lý, người nhận, phạm vi quản trị, thời gian lưu trữ, quy trình xóa, quy trình sự cố, chính sách provider, địa điểm xử lý dữ liệu, quy trình xác minh/consent danh bạ và đầu mối tiếp nhận ngoài giờ. Không mô tả ứng dụng là end-to-end private hoặc cam kết bí mật tuyệt đối.

- **Voice:** nhận dạng giọng nói phụ thuộc Web Speech API của trình duyệt; trình duyệt có thể dùng dịch vụ bên ngoài. MẦM không lưu audio thô; transcript chỉ lưu khi người dùng chủ động yêu cầu.
- **Knowledge:** tìm kiếm chỉ trả tài liệu `published` có `verified_at`; phần văn bản và metadata tri thức lưu trong PostgreSQL. Search hiện chỉ là lexical full-text; chưa tự gửi trích đoạn vào AI chat và chưa dùng vector embeddings. API tìm kiếm trả excerpt cùng URL nguồn. Thời điểm `verified_at` là lời xác nhận của nhân sự nội dung, không phải chứng nhận độc lập về chất lượng khoa học.
