import type { Resource } from '@/lib/types';

export const resources: Resource[] = [
  {
    id: 'study-pressure-small-step',
    title: 'Khi việc học đang làm bạn ngợp',
    summary: 'Tách điều đang nặng thành một việc nhỏ, rõ ràng cho hôm nay.',
    topic: 'study_pressure',
    content: 'Thử viết ra một việc học nhỏ nhất bạn có thể làm trong 10–15 phút. Sau đó nghỉ ngắn và xem điều gì vẫn còn khó. Điểm số không quyết định toàn bộ giá trị của bạn; nếu áp lực kéo dài, hãy nói với một người lớn bạn tin tưởng.',
    audience: 'student',
    isEmergency: false,
    updatedAt: '2026-10-05',
  },
  {
    id: 'friendship-conflict',
    title: 'Khi có mâu thuẫn với bạn bè',
    summary: 'Tạm dừng, gọi tên điều mình cần và chọn cách nói chuyện an toàn.',
    topic: 'friends',
    content: 'Bạn có thể thử nói theo mẫu: “Khi chuyện này xảy ra, mình cảm thấy… Mình mong…”. Không cần phải giải quyết mọi chuyện ngay. Nếu có đe doạ, bắt nạt hoặc bạn không cảm thấy an toàn, hãy báo một người lớn trong trường.',
    audience: 'student',
    isEmergency: false,
    updatedAt: '2026-10-05',
  },
  {
    id: 'online-safety',
    title: 'Bị làm phiền hoặc chế giễu trên mạng',
    summary: 'Giữ an toàn trước, không đáp trả bằng bạo lực và tìm người hỗ trợ.',
    topic: 'cyberbullying',
    content: 'Bạn không cần đưa mật khẩu cho bất kỳ ai. Có thể lưu lại bằng chứng phù hợp, dùng công cụ chặn/báo cáo của nền tảng và nói với người lớn đáng tin cậy, nhất là khi chuyện liên quan đến học sinh trong trường.',
    audience: 'student',
    isEmergency: false,
    updatedAt: '2026-10-05',
  },
  {
    id: 'urgent-safety',
    title: 'Khi bạn đang không an toàn',
    summary: 'Đừng ở một mình; tìm một người lớn gần bạn ngay bây giờ.',
    topic: 'other',
    content: 'Nếu bạn đang gặp nguy hiểm hoặc nghĩ mình có thể làm đau bản thân hay người khác, hãy đi tới một người lớn đáng tin cậy ở gần bạn ngay. Ở trường, hãy tìm thầy cô hoặc nhân viên nhà trường gần nhất. Khi nguy hiểm tức thời, liên hệ dịch vụ khẩn cấp địa phương hoặc đến cơ sở y tế gần nhất.',
    audience: 'student',
    isEmergency: true,
    updatedAt: '2026-10-05',
  },
];
