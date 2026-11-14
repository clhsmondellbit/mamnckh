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
    expect(orchestrateSupportRequest('Mình muốn chuẩn bị cách nói chuyện với bạn')).toMatchObject({ module:'communication', topicHint:'communication' });
  });
  it('honors an explicitly selected topic', () => {
    expect(orchestrateSupportRequest('Xin chào', 'friends')).toMatchObject({ module:'communication', topicHint:'friends' });
  });
  it('does not create a diagnosis or student profile', () => {
    const decision = orchestrateSupportRequest('Mình hơi buồn hôm nay');
    expect(decision).toHaveProperty('module', 'emotional_support');
    expect(decision).not.toHaveProperty('diagnosis');
    expect(decision).not.toHaveProperty('studentProfile');
  });
});
