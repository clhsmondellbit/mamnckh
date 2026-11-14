import { z } from 'zod';
import type { Contact, SchoolSupportConfig } from '@/lib/types';

const optionalText = (max: number) => z.string().trim().max(max).optional();

const contactSchema = z.object({
  label: z.string().trim().max(80).default(''),
  name: optionalText(120),
  phone: optionalText(40),
  email: z.string().trim().max(254).email().or(z.literal('')).optional(),
  location: optionalText(200),
  availability: optionalText(120),
});

const schoolConfigSchema = z.object({
  schoolName: optionalText(120),
  homeroomTeacher: contactSchema.optional(),
  schoolCounselor: contactSchema.optional(),
  schoolSupportRoom: contactSchema.optional(),
  emergencyContact: contactSchema.optional(),
  nearbyMedicalFacility: contactSchema.optional(),
  escalationInstructions: optionalText(500),
  lastVerifiedAt: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function parseConfiguredJson(): SchoolSupportConfig {
  const raw = process.env.SCHOOL_SUPPORT_CONFIG_JSON;
  if (!raw || raw.length > 12_000) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = schoolConfigSchema.safeParse(parsed);
    return result.success ? result.data : {};
  } catch {
    // Invalid optional configuration must never turn into invented contacts.
    return {};
  }
}

function readOptionalText(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return normalized ? normalized.slice(0, max) : undefined;
}

function readDate(value: string | undefined): string | undefined {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

const baseConfig = parseConfiguredJson();

export const schoolSupportConfig: SchoolSupportConfig = {
  ...baseConfig,
  schoolName: readOptionalText(process.env.NEXT_PUBLIC_SCHOOL_NAME, 120) || baseConfig.schoolName,
  escalationInstructions: readOptionalText(process.env.SCHOOL_ESCALATION_INSTRUCTIONS, 500) || baseConfig.escalationInstructions,
  lastVerifiedAt: readDate(process.env.SCHOOL_SUPPORT_LAST_VERIFIED_AT) || baseConfig.lastVerifiedAt,
};

export function configuredContacts(config = schoolSupportConfig): Contact[] {
  return [
    config.homeroomTeacher,
    config.schoolCounselor,
    config.schoolSupportRoom,
    config.emergencyContact,
    config.nearbyMedicalFacility,
  ].filter((contact): contact is Contact => Boolean(contact?.name || contact?.phone || contact?.email || contact?.location));
}
