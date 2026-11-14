import { normalizeVietnamese } from '@/lib/safety/classify';
import type { SupportTopic } from '@/lib/types';

export type AssistantModule = 'chat'|'study_support'|'emotional_support'|'reflection'|'communication'|'knowledge'|'human_support_routing';
export interface OrchestrationDecision { module: AssistantModule; topicHint?: SupportTopic }

const rules: Array<{ module: AssistantModule; topic: SupportTopic; terms: string[] }> = [
  { module:'study_support', topic:'study_pressure', terms:['bai tap','bài tập','lich hoc','lịch học','ke hoach hoc tap','kế hoạch học tập','lap ke hoach','lập kế hoạch','phan chia nhiem vu','phân chia nhiệm vụ','kiem tra','kiểm tra','thi cu','thi cử','diem so','điểm số','qua tai viec hoc','quá tải việc học','mat dong luc hoc','mất động lực học'] },
  { module:'communication', topic:'communication', terms:['noi chuyen','nói chuyện','giao tiep','giao tiếp','tu choi','từ chối','xin loi','xin lỗi','bat dong','bất đồng','trinh bay','trình bày'] },
  { module:'reflection', topic:'emotion_regulation', terms:['nhat ky','nhật ký','tu nhin nhan','tự nhìn nhận','phan tu','phản tư','suy nghi','suy nghĩ','cam xuc','cảm xúc'] },
  { module:'emotional_support', topic:'anxiety_stress', terms:['lo lang','lo lắng','cang thang','căng thẳng','met moi','mệt mỏi','buon','buồn','co don','cô đơn','ap luc','áp lực'] },
  { module:'human_support_routing', topic:'other', terms:['muon gap thay co','muốn gặp thầy cô','tim nguoi ho tro','tìm người hỗ trợ','tu van hoc duong','tư vấn học đường','goi lai','gọi lại'] },
  { module:'knowledge', topic:'other', terms:['kien thuc','kiến thức','la gi','là gì','giai thich','giải thích','tai lieu','tài liệu','nguon tham khao','nguồn tham khảo'] },
];

/** Runtime routing only; this decision is not persisted as a student profile. */
export function orchestrateSupportRequest(message: string, selectedTopic?: SupportTopic): OrchestrationDecision {
  if (selectedTopic) {
    const module: AssistantModule = selectedTopic === 'study_pressure' || selectedTopic === 'exams' || selectedTopic === 'low_grades' || selectedTopic === 'motivation'
      ? 'study_support'
      : selectedTopic === 'communication' || selectedTopic === 'friends' ? 'communication'
      : selectedTopic === 'emotion_regulation' ? 'reflection'
      : selectedTopic === 'other' ? 'chat' : 'emotional_support';
    return { module, topicHint:selectedTopic };
  }
  const text = normalizeVietnamese(message);
  for (const rule of rules) if (rule.terms.some((term) => text.includes(normalizeVietnamese(term)))) return { module:rule.module, topicHint:rule.topic };
  return { module:'chat' };
}
