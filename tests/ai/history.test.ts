import { describe, expect, it } from 'vitest';
import { selectTrustedUserHistory } from '@/lib/ai/history';

describe('chat history boundary', () => {
  it('sends only prior user turns and excludes the welcome assistant message', () => {
    const history = selectTrustedUserHistory([
      { id: 'welcome', role: 'assistant', content: 'Welcome' },
      { id: 'user-1', role: 'user', content: 'Mình thấy áp lực.' },
      { id: 'assistant-1', role: 'assistant', content: 'Cảm ơn bạn đã chia sẻ.' },
    ]);

    expect(history).toEqual([{ role: 'user', content: 'Mình thấy áp lực.' }]);
  });

  it('keeps the most recent context within API message and total character limits', () => {
    const turns = Array.from({ length: 12 }, (_, index) => ({
      id: `user-${index}`,
      role: 'user' as const,
      content: `${index}:` + 'a'.repeat(1400),
    }));

    const history = selectTrustedUserHistory(turns);
    expect(history).toHaveLength(3);
    expect(history.every((turn) => turn.content.length <= 1200)).toBe(true);
    expect(history.reduce((sum, turn) => sum + turn.content.length, 0)).toBeLessThanOrEqual(2500);
    expect(history.at(-1)?.content).toContain('11:');
  });
});
