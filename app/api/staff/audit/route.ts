import { getCurrentStaffSession, staffHasRole } from '@/lib/auth/staff';
import { getDatabase } from '@/lib/db/client';
import { noStoreHeaders } from '@/lib/security/request';
import { NextResponse } from 'next/server';

export async function GET() {
  const actor = await getCurrentStaffSession();
  if (!staffHasRole(actor, ['super_admin','admin'])) return NextResponse.json({ error: 'Không có quyền xem nhật ký quản trị.' }, { status: 403, headers: noStoreHeaders() });
  try {
    const sql = getDatabase();
    const events = await sql<{ id: string; actor: string | null; action: string; target_type: string | null; target_id: string | null; changed_fields: unknown; created_at: Date }[]>`
      select 'staff:' || l.id::text as id, u.email as actor, l.action, l.target_type, l.target_id, l.changed_fields, l.created_at
      from staff_audit_log l left join staff_users u on u.id=l.actor_staff_user_id
      union all
      select 'contact:' || a.id::text as id, u.email as actor, a.action, 'school_support_contact' as target_type,
        a.contact_id::text as target_id, a.changed_fields, a.created_at
      from school_support_contact_audit a left join staff_users u on u.id=a.actor_staff_user_id
      union all
      select 'appointment:' || a.id::text as id, u.email as actor, a.action, 'school_support_appointment' as target_type,
        a.appointment_id::text as target_id, '[]'::jsonb as changed_fields, a.created_at
      from school_support_appointment_audit a left join staff_users u on u.id=a.actor_staff_user_id
      order by created_at desc limit 100
    `;
    return NextResponse.json({ events: events.map((event) => ({
      id: event.id, actor: event.actor || 'Tài khoản đã ngừng', action: event.action,
      targetType: event.target_type, targetId: event.target_id, changedFields: event.changed_fields,
      createdAt: event.created_at.toISOString(),
    })) }, { headers: noStoreHeaders() });
  } catch {
    return NextResponse.json({ error: 'Không thể tải nhật ký quản trị.' }, { status: 503, headers: noStoreHeaders() });
  }
}
