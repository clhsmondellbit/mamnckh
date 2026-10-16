import 'server-only';

import type { SupportLevel, SupportTopic } from '@/lib/types';

export type SupportRequestStatus = 'new' | 'in_progress' | 'resolved';

export interface SupportRequestInput {
  preferredName?: string;
  contactPreference?: string;
  topic: SupportTopic;
  supportLevel: Extract<SupportLevel, 'green' | 'yellow'>;
  studentNote?: string;
  requestedSupport?: string;
}

export interface SupportRequestRecord extends SupportRequestInput {
  id: string;
  status: SupportRequestStatus;
  assignedStaff?: string;
  followUpDate?: string;
  internalNotes?: string;
  createdAt: string;
}

class StorageUnavailableError extends Error {
  constructor() {
    super('Voluntary support requests are not configured');
    this.name = 'StorageUnavailableError';
  }
}

async function getSql() {
  if (!process.env.DATABASE_URL || process.env.ENABLE_STAFF_DASHBOARD !== 'true') throw new StorageUnavailableError();
  const postgres = (await import('postgres')).default;
  return postgres(process.env.DATABASE_URL, { prepare: false, max: 3 });
}

type DbSupportRequestRow = {
  id: string; preferred_name: string | null; contact_preference: string | null; topic: SupportTopic; support_level: 'green' | 'yellow'; student_note: string | null; requested_support: string | null; status: SupportRequestStatus; assigned_staff: string | null; follow_up_date: string | null; internal_notes: string | null; created_at: Date;
};

function mapRecord(row: DbSupportRequestRow): SupportRequestRecord {
  return {
    id: row.id,
    preferredName: row.preferred_name || undefined,
    contactPreference: row.contact_preference || undefined,
    topic: row.topic,
    supportLevel: row.support_level,
    studentNote: row.student_note || undefined,
    requestedSupport: row.requested_support || undefined,
    status: row.status,
    assignedStaff: row.assigned_staff || undefined,
    followUpDate: row.follow_up_date || undefined,
    internalNotes: row.internal_notes || undefined,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createSupportRequest(input: SupportRequestInput) {
  const sql = await getSql();
  const rows = await sql<DbSupportRequestRow[]>`
    insert into support_requests
      (preferred_name, contact_preference, topic, support_level, student_note, requested_support)
    values (${input.preferredName || null}, ${input.contactPreference || null}, ${input.topic}, ${input.supportLevel}, ${input.studentNote || null}, ${input.requestedSupport || null})
    returning *
  `;
  return mapRecord(rows[0]);
}

export async function listSupportRequests() {
  const sql = await getSql();
  const rows = await sql<DbSupportRequestRow[]>`select * from support_requests order by created_at desc limit 100`;
  return rows.map(mapRecord);
}

export async function updateSupportRequest(id: string, changes: Pick<SupportRequestRecord, 'status' | 'assignedStaff' | 'followUpDate' | 'internalNotes'>) {
  const sql = await getSql();
  const rows = await sql<DbSupportRequestRow[]>`
    update support_requests
    set status = ${changes.status}, assigned_staff = ${changes.assignedStaff || null}, follow_up_date = ${changes.followUpDate || null}, internal_notes = ${changes.internalNotes || null}, updated_at = now()
    where id = ${id}
    returning *
  `;
  return rows[0] ? mapRecord(rows[0]) : null;
}

export { StorageUnavailableError };
