import type { Contact, SchoolSupportConfig } from '@/lib/types';

function configuredJson(): SchoolSupportConfig {
  const raw = process.env.SCHOOL_SUPPORT_CONFIG_JSON;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as SchoolSupportConfig;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    // A broken optional configuration must never turn into invented contacts.
    return {};
  }
}

/**
 * Deployments should replace these values through an approved configuration
 * source. Empty contact fields are intentional: MẦM must never invent them.
 */
const baseConfig = configuredJson();

export const schoolSupportConfig: SchoolSupportConfig = {
  ...baseConfig,
  schoolName: process.env.NEXT_PUBLIC_SCHOOL_NAME || baseConfig.schoolName,
  escalationInstructions: process.env.SCHOOL_ESCALATION_INSTRUCTIONS || baseConfig.escalationInstructions,
  lastVerifiedAt: process.env.SCHOOL_SUPPORT_LAST_VERIFIED_AT || baseConfig.lastVerifiedAt,
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
