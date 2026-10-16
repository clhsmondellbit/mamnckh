import { configuredContacts, schoolSupportConfig } from '@/lib/school/config';
import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    schoolName: schoolSupportConfig.schoolName,
    contacts: configuredContacts(),
    escalationInstructions: schoolSupportConfig.escalationInstructions,
    lastVerifiedAt: schoolSupportConfig.lastVerifiedAt,
  });
}
