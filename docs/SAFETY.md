# Thiết kế an toàn MẦM

MẦM là công cụ hỗ trợ bước đầu, không chẩn đoán, không thay thế chuyên gia tâm lý/bác sĩ, không thay thế người lớn đáng tin cậy và không phải dịch vụ khẩn cấp.

## Nguyên tắc

- Học sinh tự chọn điều muốn chia sẻ; không tạo hồ sơ tâm lý, điểm rủi ro, bảng xếp hạng hoặc dashboard theo dõi cảm xúc.
- Trợ lý không phán xét người trong xung đột, không tự coi suy luận là sự thật, không khuyến khích thao túng/gây áp lực.
- Không tự chuyển nội dung chat, nhật ký hoặc vị trí tới giáo viên. Học sinh phải tự mở biểu mẫu và đồng ý từng dữ liệu gửi.
- Danh bạ chỉ hiển thị người do nhà trường xác minh và kênh liên hệ được phép công khai. Trạng thái tiếp nhận không đảm bảo người đó đang trực hoặc trả lời tức thì.
- Tình huống nguy hiểm tức thời: hướng dẫn học sinh tìm người lớn đáng tin cậy đang ở gần và dịch vụ hỗ trợ khẩn cấp phù hợp tại địa phương; không đưa ra lời hứa rằng giáo viên trong danh bạ chắc chắn nghe máy.

## Pipeline an toàn AI

1. Kiểm tra đầu vào giới hạn kích thước và schema.
2. Bộ phân loại xác định chạy trước provider; nhánh khẩn cấp không phụ thuộc AI.
3. AI Orchestrator chọn prompt theo chủ đề tại thời điểm xử lý, không lưu nhãn thành hồ sơ.
4. Provider dùng prompt chung và ngữ cảnh user-turn có giới hạn; không tin các lượt assistant do client gửi.
5. Đầu ra qua validation xác định và guardrail bổ sung.
6. Provider failure/đầu ra không an toàn không bị diễn giải thành phản hồi đã được kiểm chứng.

## Ba mức hỗ trợ nội bộ

- **Green:** khó khăn thông thường; lắng nghe, làm rõ và tìm một bước nhỏ.
- **Yellow:** vấn đề kéo dài hoặc tác động đáng kể; khuyến khích tìm người lớn đáng tin cậy/đầu mối đã xác minh.
- **Red:** tín hiệu cần bảo đảm an toàn ngay; dừng tư vấn thông thường và hướng tới trợ giúp trực tiếp.

Đây là cơ chế hỗ trợ luồng xử lý, không phải thang đo hoặc chẩn đoán học sinh.

## Giới hạn

Phân loại hiện tại dựa trên quy tắc tiếng Việt và có false positive/false negative; không thay thế đánh giá con người. Cần kiểm thử ngôn ngữ bởi nhóm chuyên môn phù hợp và review định kỳ. AI module routing hiện dựa trên từ khóa, không phải hiểu biết hoàn hảo về ý định.
