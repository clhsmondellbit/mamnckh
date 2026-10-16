import { describe, expect, it } from 'vitest';
import { getProviderUnavailableMessage, getRedSafetyMessage, presentationForLevel, validateModelOutput } from '@/lib/safety/policy';

describe('safety policy', () => {
  it('does not promise confidentiality in its emergency response', () => {
    const message = getRedSafetyMessage({});
    expect(message).toContain('không ở một mình');
    expect(message).not.toMatch(/giữ bí mật/i);
  });

  it('blocks unsafe procedural model output', () => {
    expect(validateModelOutput('Đây là cách tự làm hại bản thân...').safe).toBe(false);
  });

  it('shows human and emergency support only for red', () => {
    expect(presentationForLevel('green')).toEqual({ showHumanSupport: false, showEmergencySupport: false });
    expect(presentationForLevel('yellow')).toEqual({ showHumanSupport: true, showEmergencySupport: false });
    expect(presentationForLevel('red')).toEqual({ showHumanSupport: true, showEmergencySupport: true });
  });

  it('uses a transparent fallback rather than a fabricated response', () => {
    expect(getProviderUnavailableMessage()).toMatch(/chưa thể phản hồi/i);
  });
});
