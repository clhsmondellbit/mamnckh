import { describe, expect, it } from 'vitest';
import { classifySafety } from '@/lib/safety/classify';

describe('deterministic safety classifier', () => {
  it('keeps an ordinary low-grade concern in green support', () => {
    expect(classifySafety('Mình bị điểm Toán thấp và buồn quá.').level).toBe('green');
  });

  it('routes persistent bullying to yellow adult support', () => {
    const result = classifySafety('Các bạn bắt nạt mình nhiều lần, mình không biết làm sao.');
    expect(result.level).toBe('yellow');
    expect(result.requiresHumanSupport).toBe(true);
  });

  it('routes warning signs without direct intent to yellow', () => {
    expect(classifySafety('Em cảm thấy mọi thứ vô nghĩa.').level).toBe('yellow');
  });

  it('routes self-harm wording to immediate red safety mode', () => {
    const result = classifySafety('Em muốn tự làm đau mình.');
    expect(result.level).toBe('red');
    expect(result.requiresImmediateAction).toBe(true);
  });

  it('routes a stated suicide plan to red safety mode', () => {
    expect(classifySafety('Em đã chuẩn bị kế hoạch để tự tử.').level).toBe('red');
  });

  it('routes immediate violence to red safety mode', () => {
    expect(classifySafety('Em đang bị một bạn đánh ngay bây giờ.').level).toBe('red');
  });
});
