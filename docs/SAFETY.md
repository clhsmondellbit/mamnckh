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
3. AI Orchestrator chọn module, chế độ tương tác và chiến lược hội thoại bằng routing hint nhiều tín hiệu; không lưu nhãn thành hồ sơ.
4. Với nhánh không khẩn cấp, safety provider phải trả nhãn đầu vào rõ `GREEN`, `YELLOW` hoặc `RED`. Không có kết quả/nhãn không hợp lệ dẫn tới HTTP 503 và không gửi nội dung sang chat model.
5. Provider dùng prompt chung và ngữ cảnh user-turn có giới hạn; không tin các lượt assistant do client gửi.
6. Đầu ra phải qua deterministic validation và được safety provider xác nhận rõ `SAFE`. `UNSAFE`, kết quả không rõ hoặc lỗi provider đều bị chặn.
7. Provider failure/đầu ra không an toàn không bị diễn giải thành phản hồi đã được kiểm chứng; nhánh deterministic khẩn cấp không phụ thuộc provider.

## Ba mức hỗ trợ nội bộ

- **Green:** khó khăn thông thường; lắng nghe, làm rõ và tìm một bước nhỏ.
- **Yellow:** vấn đề kéo dài hoặc tác động đáng kể; khuyến khích tìm người lớn đáng tin cậy/đầu mối đã xác minh.
- **Red:** tín hiệu cần bảo đảm an toàn ngay; dừng tư vấn thông thường và hướng tới trợ giúp trực tiếp.

Đây là cơ chế hỗ trợ luồng xử lý, không phải thang đo hoặc chẩn đoán học sinh.

## Giới hạn

Phân loại hiện tại dựa trên quy tắc tiếng Việt và có false positive/false negative; không thay thế đánh giá con người. Cần kiểm thử ngôn ngữ bởi nhóm chuyên môn phù hợp và review định kỳ. AI module routing hiện dựa trên từ khóa, không phải hiểu biết hoàn hảo về ý định.


## Phase 02 notes

- Private Studio uses user-controlled passphrase encryption on the device. MẦM does not derive diagnoses or automatically send stored private records into chat context.
- Insight Studio reports counts of explicitly selected records; it does not assign mental-health scores, predict conditions, or infer causality.
- Scenario Lab uses pre-authored communication branches. It is practice material, not an assessment of personality or social worth.
- Voice recognition is opt-in and browser-mediated. Users are warned that browser providers may process audio externally; no background recording is implemented.
- Research tests use synthetic examples and test software routing only. They are not validated clinical scales, clinical risk tools, or human-subject research results.
