# Kiến trúc kỹ thuật MẦM

MẦM hiện được tổ chức theo kiến trúc modular monolith trên Next.js App Router. Mục tiêu là tách trách nhiệm rõ ràng mà không đưa thêm dịch vụ phân tán khi chưa có nhu cầu thực tế.

## Các lớp

- `app/`: trang và API Route Handlers.
- `components/`: component giao diện, biểu mẫu, chat, tài nguyên và khu vực nhân sự.
- `lib/safety/`: phân loại hỗ trợ và chính sách đầu ra.
- `lib/ai/`: hợp đồng provider, prompt và adapter OpenRouter.
- `lib/resources/`: dữ liệu và tìm kiếm tài nguyên.
- `lib/security/`: giới hạn request, kiểm tra cùng nguồn và rate limit.
- `lib/auth/`, `lib/db/`, `lib/school/`: xác thực, lưu trữ yêu cầu và cấu hình trường.

## Luồng chat

1. Rate limit tiến trình.
2. Đọc JSON có giới hạn byte thực tế.
3. Kiểm tra schema với Zod.
4. Chạy quy tắc an toàn xác định tiếng Việt.
5. Guardrail AI tùy chọn chỉ được nâng mức hỗ trợ.
6. Mức đỏ được xử lý bằng phản hồi xác định, không chờ mô hình hội thoại.
7. Kiểm tra đầu ra xác định và guardrail tùy chọn.
8. Trả kết quả với `Cache-Control: no-store`.

Client chỉ gửi tối đa 8 lượt người dùng trước đó, không gửi lại lượt assistant tự khai báo từ trình duyệt. Đổi lại, provider không nhận bản sao đầy đủ mọi câu trả lời trước đó. Chat được giữ trong bộ nhớ trình duyệt, không ghi vào database của MẦM.

## Ranh giới dữ liệu

- Khi bật AI, tin nhắn hiện tại và tối đa 8 lượt người dùng trước được gửi tới provider được cấu hình.
- Guardrail có thể gửi nội dung hiện tại và câu trả lời dự kiến trong các request riêng.
- Check-in không được lưu.
- Yêu cầu handoff chỉ lưu các trường học sinh tự gửi và không kèm transcript.
- Yêu thích tài nguyên lưu mã tài nguyên công khai trong local storage.

## Database và mở rộng

Pool PostgreSQL được chia sẻ trong tiến trình và giới hạn tối đa 3 kết nối mỗi tiến trình. Cần tính tổng kết nối khi scale nhiều instance và dùng pooler phù hợp. Rate limit hiện cũng chỉ ở cấp tiến trình; production nhiều instance cần rate limit chung tại reverse proxy/WAF hoặc shared store.

## Hạn chế vận hành hiện tại

Khu vực nhân sự dùng một mật khẩu chia sẻ, chưa có tài khoản riêng, audit trail hay RBAC chi tiết. Không nên triển khai cho trường thật với dữ liệu nhạy cảm cho tới khi bổ sung danh tính riêng, quyền tối thiểu, nhật ký truy cập và quy trình retention. CSP production còn dùng `unsafe-inline` cho script/style để tương thích framework; cần đánh giá CSP nonce trước triển khai bảo đảm cao.
