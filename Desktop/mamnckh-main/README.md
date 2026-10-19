# MẦM — AI Đồng Hành Học Đường

MẦM là ứng dụng web tiếng Việt hỗ trợ sức khỏe tinh thần học đường cho học sinh THPT. Ứng dụng giúp học sinh có một điểm bắt đầu an toàn để chia sẻ, nhìn rõ vấn đề và tìm người thật có thể hỗ trợ.

> MẦM là công cụ hỗ trợ bước đầu; không thay thế chuyên gia tâm lý, bác sĩ, chẩn đoán hoặc dịch vụ khẩn cấp. Khi có nguy cơ tức thời, hãy tìm người lớn đáng tin cậy ở gần và liên hệ dịch vụ hỗ trợ phù hợp tại địa phương.

Thứ tự ưu tiên của sản phẩm:

**AN TOÀN → LẮNG NGHE → HIỂU VẤN ĐỀ → ĐỊNH HƯỚNG → KẾT NỐI NGƯỜI THẬT**

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Yêu cầu](#yêu-cầu)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Cấu hình thông tin hỗ trợ của trường](#cấu-hình-thông-tin-hỗ-trợ-của-trường)
- [Bật quy trình gửi yêu cầu hỗ trợ](#bật-quy-trình-gửi-yêu-cầu-hỗ-trợ)
- [Các trang và API](#các-trang-và-api)
- [Kiểm tra chất lượng](#kiểm-tra-chất-lượng)
- [Quyền riêng tư và giới hạn an toàn](#quyền-riêng-tư-và-giới-hạn-an-toàn)
- [Triển khai](#triển-khai)
- [Tài liệu trong dự án](#tài-liệu-trong-dự-án)

## Tính năng

- Trò chuyện khách không cần tài khoản học sinh.
- Check-in cảm xúc ngắn để học sinh tự nhìn lại tâm trạng, áp lực, cảm giác kết nối và an toàn.
- Phân loại mức hỗ trợ theo ba mức: **green** (khó khăn thông thường), **yellow** (nên kết nối thêm với người lớn), **red** (ưu tiên an toàn ngay).
- Quy tắc an toàn tiếng Việt chạy trước phản hồi AI. Guardrail AI nếu được cấu hình chỉ có thể nâng mức cảnh báo, không được hạ mức do quy tắc xác định. Trường hợp red dùng hướng dẫn xác định sẵn và không chờ mô hình hội thoại.
- Danh sách tài nguyên và thông tin liên hệ do trường cung cấp. Ứng dụng không tự tạo tên, số điện thoại hoặc hướng dẫn khẩn cấp.
- Quy trình tự nguyện gửi yêu cầu hỗ trợ cho nhân sự nhà trường; chỉ bật khi được cấu hình đầy đủ.
- Khu vực nhân sự có đăng nhập và quản lý yêu cầu hỗ trợ.

## Công nghệ

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- OpenRouter qua API tương thích OpenAI (tùy chọn)
- PostgreSQL (chỉ cần cho quy trình yêu cầu hỗ trợ tùy chọn)
- Vitest và smoke test HTTP

Các trang được tổ chức trong `app/`, API server trong `app/api/`, thành phần giao diện trong `components/`, và logic dùng chung trong `lib/`.

## Yêu cầu

- Node.js 20 trở lên
- npm 10 trở lên
- PostgreSQL 15 trở lên nếu bật lưu yêu cầu hỗ trợ và dashboard nhân sự
- API key OpenRouter nếu muốn có phản hồi hội thoại AI trực tiếp

## Cài đặt và chạy

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000). Máy chủ phát triển Next.js sẽ tải cấu hình từ `.env.local`. Không đưa tệp này lên Git.

Nếu chưa đặt `OPENROUTER_API_KEY`, ứng dụng vẫn chạy; phần chat hiển thị thông báo không khả dụng thay vì giả lập câu trả lời AI. Các trang trợ giúp, an toàn, tài nguyên và quyền riêng tư vẫn dùng được.

## Cấu hình môi trường

Sao chép `.env.example` thành `.env.local`, sau đó điền các biến cần dùng. Để trống các giá trị tùy chọn nếu chưa bật tính năng tương ứng.

| Biến | Bắt buộc khi | Mô tả |
| --- | --- | --- |
| `AI_PROVIDER` | Có thể để mặc định | Provider hiện dùng là `openrouter`. |
| `AI_BASE_URL` | Dùng AI | API base URL; mặc định `https://openrouter.ai/api/v1`. |
| `OPENROUTER_API_KEY` | Muốn có phản hồi AI | API key bí mật; chỉ sử dụng phía server. Không đổi thành biến `NEXT_PUBLIC_`. |
| `AI_MODEL` | Dùng AI | Model hội thoại; mặc định `qwen/qwen3-30b-a3b:free`. |
| `SAFETY_MODEL` | Dùng guardrail AI | Model hỗ trợ rà soát an toàn; mặc định `nvidia/nemotron-3.5-content-safety:free`. |
| `NEXT_PUBLIC_SCHOOL_NAME` | Có thông tin trường đã xác minh | Tên trường hiển thị công khai. |
| `SCHOOL_SUPPORT_CONFIG_JSON` | Có đầu mối hỗ trợ đã xác minh | Cấu hình JSON các đầu mối, xem mẫu bên dưới. |
| `SCHOOL_ESCALATION_INSTRUCTIONS` | Có hướng dẫn đã xác minh | Hướng dẫn kết nối/hỗ trợ do trường phê duyệt. |
| `SCHOOL_SUPPORT_LAST_VERIFIED_AT` | Có thông tin trường | Ngày thông tin được rà soát gần nhất. |
| `ENABLE_STAFF_DASHBOARD` | Bật quy trình nhân sự | Phải đặt chính xác `true`. |
| `DATABASE_URL` | Bật quy trình nhân sự | Chuỗi kết nối PostgreSQL. |
| `AUTH_SECRET` | Bật quy trình nhân sự | Bí mật ký phiên đăng nhập, tối thiểu 32 ký tự. |
| `STAFF_PASSWORD` | Bật quy trình nhân sự | Mật khẩu nhân sự dùng để đăng nhập. |
| `APP_URL` | Theo môi trường triển khai | URL gốc ứng dụng; mặc định `http://localhost:3000`. |

Giữ mọi khóa và mật khẩu ở phía server. Dùng secret manager của nền tảng triển khai cho môi trường production; không commit `.env.local` hoặc chia sẻ giá trị bí mật trong log.

## Cấu hình thông tin hỗ trợ của trường

Mở [config/school-support.example.json](config/school-support.example.json), điền thông tin đã được nhà trường xác nhận rồi đặt nội dung JSON vào `SCHOOL_SUPPORT_CONFIG_JSON`. Có thể dùng một dòng JSON trong `.env.local`, ví dụ:

```dotenv
SCHOOL_SUPPORT_CONFIG_JSON={"schoolName":"Tên trường","homeroomTeacher":{"label":"GVCN","name":"","phone":"","email":"","availability":""},"schoolCounselor":{"label":"Người phụ trách tư vấn học đường","name":"","phone":"","email":"","location":"","availability":""},"schoolSupportRoom":{"label":"Phòng tư vấn học đường","location":"","availability":""},"emergencyContact":{"label":"Đầu mối khẩn cấp của trường","phone":""},"nearbyMedicalFacility":{"label":"Cơ sở y tế gần trường","name":"","location":""},"escalationInstructions":"","lastVerifiedAt":"2026-01-01"}
```

Thay toàn bộ ví dụ bằng dữ liệu thực đã xác minh trước khi sử dụng với học sinh. Để trống trường thông tin chưa biết; ứng dụng không điền thay bằng dữ liệu phỏng đoán. Cập nhật ngày xác minh mỗi khi đầu mối hoặc quy trình thay đổi.

## Bật quy trình gửi yêu cầu hỗ trợ

Mặc định, tính năng gửi yêu cầu và khu vực nhân sự bị tắt. Để bật, cần cấu hình đồng thời `ENABLE_STAFF_DASHBOARD=true`, `DATABASE_URL`, `AUTH_SECRET` (ít nhất 32 ký tự) và `STAFF_PASSWORD`.

Tạo bảng tối thiểu trong cơ sở dữ liệu:

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

Sau đó khởi động lại ứng dụng. Học sinh có thể chủ động gửi yêu cầu; nhân sự đăng nhập tại `/staff/login`, xem ở `/staff/requests` và quản lý qua dashboard. Tính năng này chỉ lưu các trường học sinh tự gửi cùng thông tin xử lý của nhân sự, không lưu toàn bộ nội dung chat. Nhà trường cần giới hạn quyền truy cập và xác định thời hạn lưu/xóa dữ liệu.

## Các trang và API

### Trang giao diện

| Đường dẫn | Mục đích |
| --- | --- |
| `/` | Trang chủ |
| `/chat` | Trò chuyện hỗ trợ |
| `/check-in` | Check-in cảm xúc |
| `/help` | Trợ giúp và kết nối hỗ trợ |
| `/resources` | Tài nguyên |
| `/about` | Giới thiệu MẦM |
| `/privacy` | Thông tin quyền riêng tư |
| `/staff` | Cổng khu vực nhân sự |
| `/staff/login` | Đăng nhập nhân sự |
| `/staff/dashboard` | Dashboard nhân sự |
| `/staff/requests` | Danh sách yêu cầu hỗ trợ |
| `/staff/settings` | Cài đặt nhân sự |

### API

| Phương thức và đường dẫn | Mục đích |
| --- | --- |
| `POST /api/chat` | Xử lý chat, kiểm tra mức an toàn và trả lời qua provider AI nếu khả dụng |
| `POST /api/chat/classify` | Phân loại mức hỗ trợ cho nội dung gửi lên |
| `POST /api/check-in` | Đánh giá check-in; không lưu câu trả lời check-in |
| `GET /api/resources` | Lấy danh sách tài nguyên |
| `GET /api/resources/:id` | Lấy tài nguyên theo mã |
| `GET /api/school-support` | Lấy các đầu mối trường đã cấu hình |
| `POST /api/support-requests` | Tạo yêu cầu hỗ trợ tự nguyện |
| `GET /api/support-requests` | Liệt kê yêu cầu; yêu cầu phiên nhân sự hợp lệ |
| `PATCH /api/support-requests/:id` | Cập nhật xử lý yêu cầu; yêu cầu phiên nhân sự hợp lệ |
| `POST /api/staff/auth` | Đăng nhập nhân sự |
| `DELETE /api/staff/auth` | Đăng xuất nhân sự |

API kiểm tra dữ liệu đầu vào phía server. Khi gửi dữ liệu không hợp lệ, API trả lỗi thay vì tiếp tục xử lý.

## Kiểm tra chất lượng

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Smoke test HTTP chạy với máy chủ production đã khởi động. Trong cửa sổ terminal thứ nhất:

```bash
npm run build
npm run start
```

Trong cửa sổ terminal thứ hai:

```bash
E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

Smoke test kiểm tra các route công khai và đường xử lý red mà không cần khóa AI. Các kịch bản hồi quy về phân luồng an toàn nằm trong bộ test Vitest.

## Quyền riêng tư và giới hạn an toàn

- Chat khách không cần tên thật; transcript chat không được lưu trong cơ sở dữ liệu của MVP.
- Check-in được đánh giá trong request và không được lưu lại.
- Yêu cầu hỗ trợ là tự nguyện, cần sự đồng ý rõ ràng và chỉ lưu trường người dùng chủ động gửi. Không đính kèm transcript chat.
- Không nên nhập mật khẩu, OTP, dữ liệu tài chính, thông tin đăng nhập mạng xã hội, địa chỉ chính xác không cần thiết hoặc thông tin nhận dạng không cần thiết.
- Phân loại quy tắc là lớp khởi đầu có thể kiểm tra, không phải công cụ chẩn đoán lâm sàng và không thể bảo đảm nhận diện mọi cách diễn đạt.
- Trường cần kiểm thử tình huống tiếng Việt thực tế, xác minh danh bạ và quy trình ngoài giờ, phân quyền nhân sự, công bố chính sách lưu trữ/xóa dữ liệu và chuẩn bị quy trình xử lý sự cố trước khi triển khai cho học sinh.

Xem thêm [docs/SAFETY.md](docs/SAFETY.md), [docs/PRIVACY.md](docs/PRIVACY.md) và [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Triển khai

Quy trình tổng quát: cài dependencies, cấu hình biến môi trường trên nền tảng, chạy `npm run build`, sau đó chạy `npm run start` trong môi trường Node.js. Khi dùng PostgreSQL, áp dụng `sql/schema.sql` trước khi bật tính năng nhân sự. Đặt `APP_URL` theo tên miền triển khai và bảo đảm kết nối chỉ dùng HTTPS trong production.

Trước khi đưa vào sử dụng thật, nhà trường cần phê duyệt model/provider, nội dung an toàn, đầu mối hỗ trợ, phân quyền, thời hạn lưu trữ và quy trình ứng phó. Cấu hình model miễn phí trong mẫu phù hợp cho phát triển/demo; không phải cam kết về độ tin cậy, quyền riêng tư hoặc mức phù hợp cho môi trường production.

## Tài liệu trong dự án

- [Kiến trúc](docs/ARCHITECTURE.md)
- [Thiết kế an toàn](docs/SAFETY.md)
- [Quyền riêng tư](docs/PRIVACY.md)
- [Mẫu cấu hình hỗ trợ trường](config/school-support.example.json)
- [Hướng dẫn smoke test](tests/e2e/README.md)
