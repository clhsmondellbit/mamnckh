/** Normalize Vietnamese public contact numbers to E.164 (+84...). */
export function normalizeVietnamesePhone(input: string): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '');
  if (!compact || /[^+0-9]/.test(compact)) return null;
  let digits: string;
  if (compact.startsWith('+84')) digits = compact.slice(3);
  else if (compact.startsWith('0084')) digits = compact.slice(4);
  else if (compact.startsWith('84')) digits = compact.slice(2);
  else if (compact.startsWith('0')) digits = compact.slice(1);
  else return null;
  if (!/^[1-9]\d{7,9}$/.test(digits)) return null;
  return `+84${digits}`;
}

export function formatVietnamesePhone(e164: string): string {
  const normalized = normalizeVietnamesePhone(e164);
  if (!normalized) return e164;
  const digits = normalized.slice(3);
  if (digits.length === 9) return `+84 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return `+84 ${digits}`;
}
