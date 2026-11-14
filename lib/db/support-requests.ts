import 'server-only';

import { getDatabase } from '@/lib/db/client';
import type { StaffSession } from '@/lib/auth/staff';
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

export class StorageUnavailableError extends Error {
  constructor() {
    super('Voluntary support requests are not configured');
    this.name = 'StorageUnavailableError';
  }
}

type DbSupportRequestRow = {
  id: string;
  preferred_name: string | null;
  contact_preference: string | null;
  topic: SupportTopic;
  support_level: 'green' | 'yellow';
  student_note: string | null;
  requested_support: string | null;
  status: SupportRequestStatus;
  assigned_staff: string | null;
  follow_up_date: string | null;
  internal_notes: string | null;
  created_at: Date;
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

/** Legacy records are read only by privileged staff; access itself is audited. */
export async function listSupportRequests(actor: StaffSession) {
  const sql = getDatabase();
  const rows = await sql.begin(async (tx) => {
    await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,changed_fields)
      values(${actor.id},'legacy_support_requests_list_viewed','support_request',${tx.json([])})`;
    return tx<DbSupportRequestRow[]>`select * from support_requests order by created_at desc limit 100`;
  });
  return rows.map(mapRecord);
}

export async function updateSupportRequest(
  id: string,
  changes: Pick<SupportRequestRecord, 'status' | 'assignedStaff' | 'followUpDate' | 'internalNotes'>,
  actor: StaffSession,
) {
  const sql = getDatabase();
  const rows = await sql.begin(async (tx) => {
    const updated = await tx<DbSupportRequestRow[]>`
      update support_requests
      set status = ${changes.status},
          assigned_staff = ${changes.assignedStaff || null},
          follow_up_date = ${changes.followUpDate || null},
          internal_notes = ${changes.internalNotes || null},
          updated_at = now()
      where id = ${id}
      returning *
    `;
    if (updated[0]) {
      await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id,changed_fields)
        values(${actor.id},'legacy_support_request_updated','support_request',${id},${tx.json(['status','assigned_staff','follow_up_date','internal_notes'])})`;
    }
    return updated;
  });
  return rows[0] ? mapRecord(rows[0]) : null;
}
