export const SUPPORT_TOPICS = [
  'study_pressure',
  'exams',
  'low_grades',
  'motivation',
  'friends',
  'isolation',
  'bullying',
  'cyberbullying',
  'family_conflict',
  'relationships',
  'self_confidence',
  'anxiety_stress',
  'sadness',
  'loneliness',
  'social_media',
  'sleep_worry',
  'school_avoidance',
  'emotion_regulation',
  'communication',
  'future_self_direction',
  'other',
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number];
export type SupportLevel = 'green' | 'yellow' | 'red';

export interface SafetyAssessment {
  level: SupportLevel;
  reasons: string[];
  requiresHumanSupport: boolean;
  requiresImmediateAction: boolean;
  confidence?: number;
}

export interface Contact {
  label: string;
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  availability?: string;
}

export interface SchoolSupportConfig {
  schoolName?: string;
  homeroomTeacher?: Contact;
  schoolCounselor?: Contact;
  schoolSupportRoom?: Contact;
  emergencyContact?: Contact;
  nearbyMedicalFacility?: Contact;
  escalationInstructions?: string;
  lastVerifiedAt?: string;
}

export interface Resource {
  id: string;
  title: string;
  summary: string;
  topic: SupportTopic;
  content: string;
  audience: 'student' | 'staff';
  isEmergency: boolean;
  updatedAt: string;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatApiResponse {
  message: string;
  supportLevel: SupportLevel;
  showHumanSupport: boolean;
  showEmergencySupport: boolean;
  providerAvailable: boolean;
}
