# Quyền riêng tư và tối thiểu hóa dữ liệu

MẦM là công cụ hỗ trợ bước đầu và kết nối người thật. Không yêu cầu học sinh khai báo tên thật khi trò chuyện, không dùng dữ liệu chat để lập hồ sơ tâm lý và không mặc định chia sẻ dữ liệu cho nhà trường.

## Dữ liệu được xử lý/lưu ở đâu?

- **Chat khách:** nội dung phiên đang hoạt động nằm trong bộ nhớ trang của trình duyệt; không ghi transcript vào PostgreSQL. AI provider được cấu hình sẽ nhận tin nhắn hiện tại và tối đa 8 lượt user trước đó khi AI được bật. Nhà trường phải thẩm định điều khoản, logging và retention của provider trước khi cho học sinh sử dụng.
- **Safety/check-in:** phân loại hỗ trợ chạy trong request, không lưu thành hồ sơ cá nhân hoặc bảng điểm tâm lý.
- **Nhật ký phản tư:** lưu cục bộ trong trình duyệt của thiết bị; không tự gửi tới AI, giáo viên hoặc database. Người dùng cần lưu ý thiết bị dùng chung có thể để lộ nội dung local.
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
