import { describe, expect, it } from 'vitest';
import { orchestrateSupportRequest } from '@/lib/ai/orchestrator';

describe('AI orchestrator', () => {
  it('routes school workload requests to study support', () => {
    expect(orchestrateSupportRequest('Mình đang quá tải việc học và lo kỳ thi')).toMatchObject({ module:'study_support', topicHint:'study_pressure' });
  });
  it('routes study planning requests', () => {
    expect(orchestrateSupportRequest('Lập kế hoạch học tập cho tuần này')).toMatchObject({ module:'study_support', topicHint:'study_pressure' });
  });
  it('routes communication preparation', () => {
    expect(orchestrateSupportRequest('Mình muốn chuẩn bị cách nói chuyện với bạn')).toMatchObject({ module:'communication', topicHint:'communication', strategy:'communication_support' });
  });
  it('selects decision support when the user is weighing options', () => {
    expect(orchestrateSupportRequest('Mình phân vân không biết nên chọn cách nào')).toMatchObject({ strategy:'decision_support', mode:'free_talk' });
  });
  it('honors the conversation mode selected by the user', () => {
    expect(orchestrateSupportRequest('Mình cần cân nhắc một lựa chọn', undefined, 'decision_support')).toMatchObject({ mode:'decision_support', strategy:'decision_support' });
  });
  it('selects a reflective strategy for self-understanding topics', () => {
    expect(orchestrateSupportRequest('Mình muốn hiểu cảm xúc của mình')).toMatchObject({ module:'reflection', strategy:'reflective' });
  });
  it('honors an explicitly selected topic', () => {
    expect(orchestrateSupportRequest('Xin chào', 'friends')).toMatchObject({ module:'communication', topicHint:'friends' });
  });
  it('does not create a diagnosis or student profile', () => {
    const decision = orchestrateSupportRequest('Mình hơi buồn hôm nay');
    expect(decision).toHaveProperty('module', 'emotional_support');
    expect(decision).not.toHaveProperty('diagnosis');
    expect(decision).not.toHaveProperty('studentProfile');
    expect(decision).toHaveProperty('strategy', 'active_listening');
  });
});
