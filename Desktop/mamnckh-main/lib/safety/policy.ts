import type { SchoolSupportConfig, SupportLevel } from '@/lib/types';

const UNSAFE_OUTPUT_PATTERNS = [
  /\b(cach|cách|hướng dẫn|huong dan|bước).{0,45}(tu tu|tự tử|tu lam hai|tự làm hại|tu lam dau|tự làm đau)\b/i,
  /\b(giau|giấu|che giau|che giấu).{0,50}(nguoi lon|người lớn|giao vien|giáo viên|bo me|bố mẹ|cha me|cha mẹ)\b/i,
  /\b(ban bi|bạn bị|em bi|em bị).{0,35}(tram cam|trầm cảm|roi loan|rối loạn)\b/i,
];

export function getRedSafetyMessage(config: SchoolSupportConfig): string {
  const localInstruction = config.escalationInstructions
    ? ` ${config.escalationInstructions}`
    : ' Nếu nguy hiểm đang xảy ra ngay lúc này, hãy liên hệ dịch vụ khẩn cấp tại địa phương hoặc đến cơ sở y tế gần nhất.';

  return `Mình rất tiếc vì bạn đang phải đối mặt với điều này. Điều quan trọng nhất lúc này là bạn không ở một mình. Hãy tìm ngay một người lớn đáng tin cậy đang ở gần bạn — như thầy cô, người thân hoặc nhân viên nhà trường — và nói rằng bạn cần được giúp ngay.${localInstruction}`;
}

export function getProviderUnavailableMessage(): string {
  return 'Mình chưa thể phản hồi ngay lúc này. Bạn vẫn có thể xem các nguồn hỗ trợ của nhà trường hoặc tìm một người lớn mà bạn tin tưởng.';
}

export function validateModelOutput(output: string): {
  safe: boolean;
  reason?: string;
} {
  const concise = output.trim();
  if (!concise || concise.length > 4000) {
    return { safe: false, reason: 'empty_or_oversized_output' };
  }

  if (UNSAFE_OUTPUT_PATTERNS.some((pattern) => pattern.test(concise))) {
    return { safe: false, reason: 'unsafe_output_pattern' };
  }

  return { safe: true };
}

export function presentationForLevel(level: SupportLevel) {
  return {
    showHumanSupport: level === 'yellow' || level === 'red',
    showEmergencySupport: level === 'red',
  };
}
