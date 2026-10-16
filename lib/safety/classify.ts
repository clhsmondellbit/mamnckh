import type { SafetyAssessment, SupportLevel } from '@/lib/types';

/**
 * This is deliberately simple and auditable. It only ever escalates a
 * conversation; model output is never allowed to downgrade this result.
 */
const RED_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: 'self_harm_or_suicide_signal',
    pattern: /\b(tu tu|tự tử|tu sat|tự sát|tu lam hai|tự làm hại|tu lam dau|tự làm đau)\b/i,
  },
  {
    reason: 'self_harm_or_suicide_signal',
    pattern:
      /\b(muon|muốn|dinh|định|da|đã|se|sẽ|nghi).{0,36}(tu tu|tự tử|tu lam hai|tự làm hại|tu lam dau|tự làm đau|ket thuc cuoc song|kết thúc cuộc sống)\b/i,
  },
  {
    reason: 'self_harm_or_suicide_signal',
    pattern: /\b(muon|muốn).{0,20}(chet|chết|bien mat|biến mất)\b/i,
  },
  {
    reason: 'self_harm_or_suicide_signal',
    pattern: /\b(da|đã).{0,24}(tu lam dau|tự làm đau|tu lam hai|tự làm hại)\b/i,
  },
  {
    reason: 'self_harm_or_suicide_plan',
    pattern: /\b(chuan bi|chuẩn bị|ke hoach|kế hoạch).{0,50}(tu tu|tự tử|tu lam hai|tự làm hại|tu lam dau|tự làm đau)\b/i,
  },
  {
    reason: 'self_harm_or_suicide_signal',
    pattern: /\b(nghi den|nghĩ đến|y nghi|ý nghĩ).{0,40}(tu tu|tự tử|tu lam hai|tự làm hại|tu lam dau|tự làm đau)\b/i,
  },
  {
    reason: 'immediate_danger_or_violence',
    pattern: /\b(dang|đang).{0,35}(bi.{0,24}(danh|đánh|hanh hung|hành hung|de doa|đe doạ|de dọa)|xam hai|xâm hại)\b/i,
  },
  {
    reason: 'immediate_danger_or_violence',
    pattern: /\b(muon|muốn|se|sẽ).{0,24}(giet|giết|lam trong thuong|làm trọng thương|danh chet|đánh chết)\b/i,
  },
  {
    reason: 'abuse_or_immediate_danger',
    pattern: /\b(xam hai|xâm hại|bi bao hanh|bị bạo hành|khong an toan|không an toàn|nguy hiem ngay luc nay|nguy hiểm ngay lúc này)\b/i,
  },
];

const YELLOW_PATTERNS: Array<{ reason: string; pattern: RegExp }> = [
  {
    reason: 'sustained_distress',
    pattern: /\b(khong chiu noi nua|không chịu nổi nữa|qua suc|quá sức|keo dai|kéo dài|thuong xuyen|thường xuyên)\b/i,
  },
  {
    reason: 'repeated_bullying_or_serious_conflict',
    pattern: /\b(bat nat|bắt nạt|co lap|cô lập|de doa|đe doạ|de dọa|bao luc|bạo lực|mau thuan gia dinh|mâu thuẫn gia đình)\b/i,
  },
  {
    reason: 'significant_daily_impact',
    pattern: /\b(khong the di hoc|không thể đi học|khong ngu duoc|không ngủ được|khong hoc duoc|không học được|anh huong.*sinh hoat|ảnh hưởng.*sinh hoạt)\b/i,
  },
  {
    reason: 'warning_sign_needing_adult_support',
    pattern: /\b(moi thu vo nghia|mọi thứ vô nghĩa|chang con y nghia|chẳng còn ý nghĩa)\b/i,
  },
];

export function normalizeVietnamese(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function levelRank(level: SupportLevel): number {
  return { green: 0, yellow: 1, red: 2 }[level];
}

export function mostProtectiveLevel(...levels: SupportLevel[]): SupportLevel {
  return levels.reduce((current, next) =>
    levelRank(next) > levelRank(current) ? next : current,
  );
}

export function classifySafety(message: string): SafetyAssessment {
  const text = normalizeVietnamese(message);
  const redReasons = RED_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ reason }) => reason,
  );

  if (redReasons.length > 0) {
    return {
      level: 'red',
      reasons: [...new Set(redReasons)],
      requiresHumanSupport: true,
      requiresImmediateAction: true,
    };
  }

  const yellowReasons = YELLOW_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(
    ({ reason }) => reason,
  );

  if (yellowReasons.length > 0) {
    return {
      level: 'yellow',
      reasons: [...new Set(yellowReasons)],
      requiresHumanSupport: true,
      requiresImmediateAction: false,
    };
  }

  return {
    level: 'green',
    reasons: [],
    requiresHumanSupport: false,
    requiresImmediateAction: false,
  };
}
