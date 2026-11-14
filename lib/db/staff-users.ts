import 'server-only';
import { getDatabase } from '@/lib/db/client';
import { hashPassword } from '@/lib/auth/password';
import type { StaffRole, StaffSession } from '@/lib/auth/staff';

export interface StaffUserSummary {
  id: string;
  email: string;
  displayName: string;
  role: StaffRole;
  supportContactId?: string;
  isActive: boolean;
  createdAt: string;
}

type StaffUserRow = {
  id: string;
  email: string;
  display_name: string;
  role: StaffRole;
  support_contact_id: string | null;
  is_active: boolean;
  created_at: Date;
};

function mapUser(row: StaffUserRow): StaffUserSummary {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    supportContactId: row.support_contact_id || undefined,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

const needsContactAssignment = (role: StaffRole) => role === 'teacher' || role === 'school_counselor';

export async function listStaffUsers(actor: StaffSession): Promise<StaffUserSummary[]> {
  const sql = getDatabase();
  const rows = await sql<StaffUserRow[]>`
    select id, email, display_name, role, support_contact_id, is_active, created_at
    from staff_users order by created_at asc
  `;
  await sql`
    insert into staff_audit_log(actor_staff_user_id, action, target_type, changed_fields)
    values (${actor.id}, 'staff_users_list_viewed', 'staff_user', ${sql.json([])})
  `;
  return rows.map(mapUser);
}

export async function createStaffUser(
  input: { email: string; displayName: string; password: string; role: StaffRole; supportContactId?: string },
  actor: StaffSession,
): Promise<StaffUserSummary> {
  const sql = getDatabase();
  const passwordHash = await hashPassword(input.password);

  return await sql.begin(async (tx) => {
    if (needsContactAssignment(input.role)) {
      const contact = await tx<{ id: string }[]>`
        select id from school_support_contacts
        where id = ${input.supportContactId || null} and is_active = true and is_verified = true
        for share
      `;
      if (!contact[0]) throw new Error('Tài khoản giáo viên/nhân sự tư vấn phải gắn với hồ sơ đang hoạt động và đã xác minh.');
    }

    const rows = await tx<StaffUserRow[]>`
      insert into staff_users(email, display_name, password_hash, role, support_contact_id)
      values (${input.email.toLowerCase()}, ${input.displayName}, ${passwordHash}, ${input.role}, ${input.supportContactId || null})
      returning id, email, display_name, role, support_contact_id, is_active, created_at
    `;
    await tx`
      insert into staff_audit_log(actor_staff_user_id, action, target_type, target_id, changed_fields)
      values (${actor.id}, 'staff_user_created', 'staff_user', ${rows[0].id}, ${tx.json(['email', 'display_name', 'role', 'support_contact_id'])})
    `;
    return mapUser(rows[0]);
  });
}

export async function updateStaffUser(
  id: string,
  input: { displayName?: string; role?: StaffRole; supportContactId?: string | null; isActive?: boolean; password?: string },
  actor: StaffSession,
): Promise<StaffUserSummary | null> {
  const sql = getDatabase();
  const passwordHash = input.password ? await hashPassword(input.password) : null;

  return await sql.begin(async (tx) => {
    // Read first without locking so contact -> staff lock order stays consistent with
    // profile edits that revoke assigned accounts inside the contact transaction.
    const snapshot = await tx<{ id: string; role: StaffRole; support_contact_id: string | null; is_active: boolean }[]>`
      select id, role, support_contact_id, is_active from staff_users where id = ${id}
    `;
    if (!snapshot[0]) return null;

    const effectiveRole = input.role ?? snapshot[0].role;
    const effectiveContactId = input.supportContactId !== undefined ? input.supportContactId : snapshot[0].support_contact_id;

    if (needsContactAssignment(effectiveRole)) {
      if (!effectiveContactId) throw new Error('Tài khoản giáo viên/nhân sự tư vấn phải gắn với một hồ sơ hỗ trợ.');
      const contact = await tx<{ id: string }[]>`
        select id from school_support_contacts
        where id = ${effectiveContactId} and is_active = true and is_verified = true
        for share
      `;
      if (!contact[0]) throw new Error('Giáo viên/nhân sự tư vấn chỉ được gắn với hồ sơ đang hoạt động và đã xác minh.');
    } else if (effectiveContactId) {
      const contact = await tx<{ id: string }[]>`
        select id from school_support_contacts where id = ${effectiveContactId}
      `;
      if (!contact[0]) throw new Error('Hồ sơ hỗ trợ được gắn không tồn tại.');
    }

    const old = await tx<{ id: string; role: StaffRole; support_contact_id: string | null; is_active: boolean }[]>`
      select id, role, support_contact_id, is_active from staff_users where id = ${id} for update
    `;
    if (!old[0]) return null;
    if (old[0].role !== snapshot[0].role || old[0].support_contact_id !== snapshot[0].support_contact_id || old[0].is_active !== snapshot[0].is_active) {
      throw new Error('Tài khoản vừa được thay đổi bởi người quản trị khác. Hãy tải lại rồi thử lại.');
    }
    if (old[0].role === 'super_admin' && actor.role !== 'super_admin') {
      throw new Error('Chỉ Super Admin được chỉnh sửa tài khoản Super Admin.');
    }
    if (old[0].role === 'super_admin' && (input.role && input.role !== 'super_admin' || input.isActive === false)) {
      await tx`select pg_advisory_xact_lock(87111, 9002)`;
      const remaining = await tx<{ count: number }[]>`
        select count(*)::int as count from staff_users
        where role = 'super_admin' and is_active = true and id <> ${id}
      `;
      if ((remaining[0]?.count || 0) < 1) throw new Error('Không thể hạ quyền hoặc vô hiệu hóa Super Admin cuối cùng.');
    }

    const invalidateSessions = Boolean(passwordHash) || input.role !== undefined || input.supportContactId !== undefined || input.isActive !== undefined;
    const rows = await tx<StaffUserRow[]>`
      update staff_users set
        display_name = coalesce(${input.displayName ?? null}, display_name),
        role = coalesce(${input.role ?? null}, role),
        support_contact_id = case when ${input.supportContactId !== undefined} then ${input.supportContactId ?? null} else support_contact_id end,
        is_active = coalesce(${input.isActive ?? null}, is_active),
        password_hash = coalesce(${passwordHash}, password_hash),
        session_version = case when ${invalidateSessions} then session_version + 1 else session_version end,
        updated_at = now()
      where id = ${id}
      returning id, email, display_name, role, support_contact_id, is_active, created_at
    `;
    const changed = [
      ...(input.displayName !== undefined ? ['display_name'] : []),
      ...(input.role !== undefined ? ['role'] : []),
      ...(input.supportContactId !== undefined ? ['support_contact_id'] : []),
      ...(input.isActive !== undefined ? ['is_active'] : []),
      ...(passwordHash ? ['password_hash'] : []),
    ];
    await tx`
      insert into staff_audit_log(actor_staff_user_id, action, target_type, target_id, changed_fields)
      values (${actor.id}, 'staff_user_updated', 'staff_user', ${id}, ${tx.json(changed)})
    `;
    return mapUser(rows[0]);
  });
}
