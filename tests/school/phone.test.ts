import { describe, expect, it } from 'vitest';
import { formatVietnamesePhone, normalizeVietnamesePhone } from '@/lib/school/phone';

describe('Vietnamese phone normalization', () => {
  it('normalizes national mobile format', () => expect(normalizeVietnamesePhone('0912 345 678')).toBe('+84912345678'));
  it('normalizes international format', () => expect(normalizeVietnamesePhone('+84 912-345-678')).toBe('+84912345678'));
  it('rejects invalid or non-Vietnamese numbers', () => {
    expect(normalizeVietnamesePhone('12345')).toBeNull();
    expect(normalizeVietnamesePhone('+1 212 555 1234')).toBeNull();
    expect(normalizeVietnamesePhone('+840912345678')).toBeNull();
  });
  it('formats mobile numbers for display', () => expect(formatVietnamesePhone('+84912345678')).toBe('+84 912 345 678'));
});
