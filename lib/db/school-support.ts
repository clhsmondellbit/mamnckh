import 'server-only';
import { createHash, randomBytes } from 'crypto';
import { getDatabase } from '@/lib/db/client';
import { decryptPrivateField, encryptPrivateField } from '@/lib/security/field-encryption';
import type { StaffSession } from '@/lib/auth/staff';

export type ContactMode = 'phone' | 'message' | 'in_person';
export type IntakeStatus = 'accepting' | 'limited' | 'not_accepting';
export interface ContactInput {
  fullName: string; avatarUrl?: string; roleTitle: string; department: string; supportTopics: string[];
  description: string; phoneE164?: string; email?: string; contactHours: string; contactModes: ContactMode[];
  intakeStatus: IntakeStatus; intakeNote: string;
}
export interface SupportContact extends ContactInput {
  id: string; avatarIsPublic: boolean; phoneIsPublic: boolean; emailIsPublic: boolean; isActive: boolean; isVerified: boolean;
  verificationMethod?: string; verifiedAt?: string; lastVerifiedAt?: string;
}
export interface PublicSupportContact {
  id: string; fullName: string; avatarUrl?: string; roleTitle: string; department: string; supportTopics: string[];
  description: string; phoneE164?: string; email?: string; contactHours: string; contactModes: ContactMode[];
  intakeStatus: IntakeStatus; intakeNote: string; lastVerifiedAt: string;
}

type ContactRow = {
  id: string; full_name: string; avatar_url: string | null; avatar_public_consent_at?: Date | null; role_title: string; department: string; support_topics: string[];
  description: string; phone_e164: string | null; phone_is_public: boolean; phone_consent_at: Date | null;
  email: string | null; email_is_public: boolean; email_consent_at?: Date | null; contact_hours: string; contact_modes: ContactMode[];
  intake_status: IntakeStatus; intake_note: string; is_active: boolean; is_verified: boolean;
  verification_method: string | null; verified_at: Date | null; last_verified_at: Date | null;
};

function mapContact(row: ContactRow): SupportContact {
  return {
    id: row.id, fullName: row.full_name, avatarUrl: row.avatar_url || undefined, avatarIsPublic: Boolean(row.avatar_public_consent_at), roleTitle: row.role_title,
    department: row.department, supportTopics: row.support_topics || [], description: row.description,
    phoneE164: row.phone_e164 || undefined, phoneIsPublic: row.phone_is_public, email: row.email || undefined,
    emailIsPublic: row.email_is_public, contactHours: row.contact_hours, contactModes: row.contact_modes || [],
    intakeStatus: row.intake_status, intakeNote: row.intake_note, isActive: row.is_active, isVerified: row.is_verified,
    verificationMethod: row.verification_method || undefined, verifiedAt: row.verified_at?.toISOString(), lastVerifiedAt: row.last_verified_at?.toISOString(),
  };
}

export async function listPublicContacts(): Promise<PublicSupportContact[]> {
  const sql = getDatabase();
  const rows = await sql<ContactRow[]>`
    select id, full_name, case when avatar_public_consent_at is not null and is_verified then avatar_url else null end as avatar_url, role_title, department, support_topics, description,
      case when phone_is_public and phone_consent_at is not null and is_verified then phone_e164 else null end as phone_e164,
      false as phone_is_public, null::timestamptz as phone_consent_at,
      case when email_is_public and email_consent_at is not null and is_verified then email else null end as email,
      false as email_is_public, email_consent_at, contact_hours, contact_modes, intake_status, intake_note,
      is_active, is_verified, verification_method, verified_at, last_verified_at
    from school_support_contacts
    where is_active = true and is_verified = true and last_verified_at is not null
    order by case intake_status when 'accepting' then 0 when 'limited' then 1 else 2 end, full_name asc
  `;
  return rows.map((row) => ({
    id: row.id, fullName: row.full_name, avatarUrl: row.avatar_url || undefined, roleTitle: row.role_title,
    department: row.department, supportTopics: row.support_topics || [], description: row.description,
    phoneE164: row.phone_e164 || undefined, email: row.email || undefined, contactHours: row.contact_hours,
    contactModes: (row.contact_modes || []).filter((mode) => mode === 'phone' || mode === 'message' || mode === 'in_person'), intakeStatus: row.intake_status, intakeNote: row.intake_note,
    lastVerifiedAt: row.last_verified_at?.toISOString() || '',
  }));
}

export async function listManagedContacts(actor: StaffSession): Promise<SupportContact[]> {
  const sql = getDatabase();
  const rows = await sql<ContactRow[]>`
    select id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
      phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
      intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    from school_support_contacts order by is_active desc, full_name asc
  `;
  await sql`insert into staff_audit_log(actor_staff_user_id,action,target_type,changed_fields) values(${actor.id},'directory_admin_list_viewed','school_support_contact',${sql.json([])})`;
  return rows.map(mapContact);
}

export async function createContact(input: ContactInput, actor: StaffSession) {
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    const rows = await tx<ContactRow[]>`
      insert into school_support_contacts
        (full_name, avatar_url, role_title, department, support_topics, description, phone_e164, email,
         contact_hours, contact_modes, intake_status, intake_note, created_by, updated_by)
      values
        (${input.fullName}, ${input.avatarUrl || null}, ${input.roleTitle}, ${input.department}, ${input.supportTopics},
         ${input.description}, ${input.phoneE164 || null}, ${input.email || null}, ${input.contactHours},
         ${input.contactModes}, ${input.intakeStatus}, ${input.intakeNote}, ${actor.id}, ${actor.id})
      returning id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
        phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
        intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    `;
    await tx`insert into school_support_contact_audit (contact_id, actor_staff_user_id, action, changed_fields)
      values (${rows[0].id}, ${actor.id}, 'created', ${tx.json(['profile'])})`;
    return mapContact(rows[0]);
  });
}

export async function updateContact(id: string, input: ContactInput, actor: StaffSession) {
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    const current = await tx<ContactRow[]>`select id from school_support_contacts where id = ${id} for update`;
    if (!current[0]) return null;
    const rows = await tx<ContactRow[]>`
      update school_support_contacts set
        full_name=${input.fullName}, avatar_url=${input.avatarUrl || null}, role_title=${input.roleTitle},
        department=${input.department}, support_topics=${input.supportTopics}, description=${input.description},
        phone_e164=${input.phoneE164 || null}, email=${input.email || null}, contact_hours=${input.contactHours},
        contact_modes=${input.contactModes}, intake_status=${input.intakeStatus}, intake_note=${input.intakeNote},
        is_verified=false, avatar_public_consent_at=null, phone_is_public=false, phone_consent_at=null, email_is_public=false, email_consent_at=null,
        verification_method=null, verified_by=null, verified_at=null, last_verified_at=null,
        updated_by=${actor.id}, updated_at=now()
      where id=${id}
      returning id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
        phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
        intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    `;
    const revokedStaff = await tx<{ id: string }[]>`
      update staff_users set is_active=false, session_version=session_version+1, updated_at=now()
      where support_contact_id=${id} and role in ('teacher','school_counselor') and is_active=true
      returning id
    `;
    for (const staff of revokedStaff) {
      await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id,changed_fields)
        values(${actor.id},'staff_access_revoked_contact_changed','staff_user',${staff.id},${tx.json(['is_active','session_version'])})`;
    }
    await tx`update school_support_slots set status='closed' where contact_id=${id} and status='available'`;
    await tx`insert into school_support_contact_audit (contact_id, actor_staff_user_id, action, changed_fields)
      values (${id}, ${actor.id}, 'updated_and_unverified', ${tx.json(['profile','avatar_consent','phone','email','availability'])})`;
    return mapContact(rows[0]);
  });
}

export async function verifyContact(id: string, actor: StaffSession, verificationMethod: string, avatarConsent: boolean, phoneConsent: boolean, emailConsent: boolean) {
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    const current = await tx<ContactRow[]>`select * from school_support_contacts where id=${id} for update`;
    const contact = current[0];
    if (!contact) return null;
    if (!contact.is_active) throw new Error('Không thể xác minh hồ sơ đã ngừng hoạt động.');
    if (avatarConsent && !contact.avatar_url) throw new Error('Không có ảnh đại diện để công khai');
    if (phoneConsent && !contact.phone_e164) throw new Error('Không có số điện thoại để công khai');
    if (emailConsent && !contact.email) throw new Error('Không có email để công khai');
    const rows = await tx<ContactRow[]>`
      update school_support_contacts set is_verified=true, verification_method=${verificationMethod},
        avatar_public_consent_at=${avatarConsent ? new Date() : null}, phone_is_public=${phoneConsent}, phone_consent_at=${phoneConsent ? new Date() : null},
        email_is_public=${emailConsent}, email_consent_at=${emailConsent ? new Date() : null}, verified_by=${actor.id}, verified_at=now(), last_verified_at=now(),
        updated_by=${actor.id}, updated_at=now()
      where id=${id}
      returning id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
        phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
        intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    `;
    await tx`insert into school_support_contact_audit (contact_id, actor_staff_user_id, action, changed_fields)
      values (${id}, ${actor.id}, 'verified', ${tx.json(['is_verified','avatar_public_consent_at','phone_is_public','email_is_public','last_verified_at'])})`;
    return mapContact(rows[0]);
  });
}

export async function deactivateContact(id: string, actor: StaffSession) {
  const sql = getDatabase();
  const rows = await sql.begin(async (tx) => {
    const updated = await tx<ContactRow[]>`
    update school_support_contacts set is_active=false, phone_is_public=false, email_is_public=false,
      updated_by=${actor.id}, updated_at=now() where id=${id}
    returning id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
      phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
      intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    `;
    if (updated[0]) {
      const revokedStaff = await tx<{ id: string }[]>`
        update staff_users set is_active=false, session_version=session_version+1, updated_at=now()
        where support_contact_id=${id} and role in ('teacher','school_counselor') and is_active=true
        returning id
      `;
      for (const staff of revokedStaff) {
        await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id,changed_fields)
          values(${actor.id},'staff_access_revoked_contact_deactivated','staff_user',${staff.id},${tx.json(['is_active','session_version'])})`;
      }
      await tx`update school_support_slots set status='closed' where contact_id=${id} and status='available'`;
      await tx`insert into school_support_contact_audit (contact_id, actor_staff_user_id, action, changed_fields)
        values (${id}, ${actor.id}, 'deactivated', ${tx.json(['is_active','phone_is_public','email_is_public','availability'])})`;
    }
    return updated;
  });
  return rows[0] ? mapContact(rows[0]) : null;
}

export async function activateContact(id: string, actor: StaffSession) {
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    const rows = await tx<ContactRow[]>`
      update school_support_contacts set is_active=true, is_verified=false, avatar_public_consent_at=null, phone_is_public=false, email_is_public=false,
        phone_consent_at=null, email_consent_at=null, verification_method=null, verified_by=null,
        verified_at=null, last_verified_at=null, updated_by=${actor.id}, updated_at=now()
      where id=${id}
      returning id, full_name, avatar_url, avatar_public_consent_at, role_title, department, support_topics, description, phone_e164,
        phone_is_public, phone_consent_at, email, email_is_public, email_consent_at, contact_hours, contact_modes,
        intake_status, intake_note, is_active, is_verified, verification_method, verified_at, last_verified_at
    `;
    if (rows[0]) await tx`insert into school_support_contact_audit(contact_id,actor_staff_user_id,action,changed_fields)
      values(${id},${actor.id},'reactivated_unverified',${tx.json(['is_active','verification','public_channels'])})`;
    return rows[0] ? mapContact(rows[0]) : null;
  });
}

export async function addAvailabilitySlot(contactId: string, startsAt: string, endsAt: string, mode: ContactMode, actor: StaffSession) {
  if (['teacher', 'school_counselor'].includes(actor.role) && actor.supportContactId !== contactId) {
    throw new Error('Bạn chỉ được quản lý lịch thuộc hồ sơ được phân công.');
  }
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    // Serialize slot creation per contact, then lock the contact record so a
    // concurrent edit/deactivation cannot race with availability creation.
    await tx`select pg_advisory_xact_lock(hashtext(${contactId}))`;
    const contact = await tx<{ id: string; is_active: boolean; is_verified: boolean; intake_status: IntakeStatus; contact_modes: ContactMode[] }[]>`
      select id,is_active,is_verified,intake_status,contact_modes from school_support_contacts where id=${contactId} for share
    `;
    if (!contact[0] || !contact[0].is_active || !contact[0].is_verified || !['accepting','limited'].includes(contact[0].intake_status) || !contact[0].contact_modes.includes(mode)) {
      throw new Error('Không tìm thấy hồ sơ đã xác minh hoặc hồ sơ chưa nhận lịch theo hình thức này.');
    }
    const overlap = await tx<{ id: string }[]>`
      select id from school_support_slots
      where contact_id=${contactId} and status in ('available','reserved')
        and starts_at < ${endsAt}::timestamptz and ends_at > ${startsAt}::timestamptz
      limit 1
    `;
    if (overlap[0]) throw new Error('Khung giờ bị chồng lấn với một lịch đang mở hoặc đã được giữ.');
    const rows = await tx<{ id: string; starts_at: Date; ends_at: Date; mode: ContactMode; status: string }[]>`
      insert into school_support_slots (contact_id, starts_at, ends_at, mode, created_by)
      select c.id, ${startsAt}::timestamptz, ${endsAt}::timestamptz, ${mode}, ${actor.id}
      from school_support_contacts c where c.id=${contactId} and c.is_active=true and c.is_verified=true
        and c.intake_status in ('accepting','limited') and c.contact_modes @> array[${mode}]::text[]
      returning id, starts_at, ends_at, mode, status
    `;
    if (!rows[0]) throw new Error('Không tìm thấy hồ sơ đã xác minh hoặc hồ sơ chưa nhận lịch');
    await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id,changed_fields)
      values(${actor.id},'availability_slot_created','school_support_slot',${rows[0].id},${tx.json(['contact_id','starts_at','ends_at','mode'])})`;
    return rows[0];
  });
}

export interface StaffSlotSummary { id: string; contactId: string; contactName: string; startsAt: string; endsAt: string; mode: ContactMode; status: 'available'|'reserved'|'closed' }

export async function listStaffSlots(actor: StaffSession): Promise<StaffSlotSummary[]> {
  const sql = getDatabase();
  const isAdmin = ['super_admin','admin'].includes(actor.role);
  const rows = isAdmin
    ? await sql<{ id:string; contact_id:string; full_name:string; starts_at:Date; ends_at:Date; mode:ContactMode; status:'available'|'reserved'|'closed' }[]>`
        select s.id,s.contact_id,c.full_name,s.starts_at,s.ends_at,s.mode,s.status
        from school_support_slots s join school_support_contacts c on c.id=s.contact_id
        where s.starts_at > now() and s.status in ('available','reserved')
        order by s.starts_at asc limit 200`
    : actor.supportContactId
      ? await sql<{ id:string; contact_id:string; full_name:string; starts_at:Date; ends_at:Date; mode:ContactMode; status:'available'|'reserved'|'closed' }[]>`
        select s.id,s.contact_id,c.full_name,s.starts_at,s.ends_at,s.mode,s.status
        from school_support_slots s join school_support_contacts c on c.id=s.contact_id
        where s.contact_id=${actor.supportContactId} and s.starts_at > now() and s.status in ('available','reserved')
        order by s.starts_at asc limit 200`
      : [];
  await sql`insert into staff_audit_log(actor_staff_user_id,action,target_type,changed_fields)
    values(${actor.id},'availability_slots_list_viewed','school_support_slot',${sql.json([])})`;
  return rows.map((row) => ({ id:row.id, contactId:row.contact_id, contactName:row.full_name,
    startsAt:row.starts_at.toISOString(), endsAt:row.ends_at.toISOString(), mode:row.mode, status:row.status }));
}

export async function closeAvailabilitySlot(id: string, actor: StaffSession): Promise<boolean> {
  const sql = getDatabase();
  return await sql.begin(async (tx) => {
    const rows = ['super_admin','admin'].includes(actor.role)
      ? await tx<{ id:string; status:string; starts_at:Date }[]>`select id,status,starts_at from school_support_slots where id=${id} for update`
      : actor.supportContactId
        ? await tx<{ id:string; status:string; starts_at:Date }[]>`select id,status,starts_at from school_support_slots where id=${id} and contact_id=${actor.supportContactId} for update`
        : [];
    if (!rows[0] || rows[0].status !== 'available' || rows[0].starts_at <= new Date()) return false;
    const updated = await tx<{ id:string }[]>`update school_support_slots set status='closed' where id=${id} and status='available' returning id`;
    if (!updated[0]) return false;
    await tx`insert into staff_audit_log(actor_staff_user_id,action,target_type,target_id,changed_fields)
      values(${actor.id},'availability_slot_closed','school_support_slot',${id},${tx.json(['status'])})`;
    return true;
  });
}

export async function listAvailableSlots(contactId: string) {
  const sql = getDatabase();
  return await sql<{ id: string; contact_id: string; starts_at: Date; ends_at: Date; mode: ContactMode }[]>`
    select s.id, s.contact_id, s.starts_at, s.ends_at, s.mode
    from school_support_slots s join school_support_contacts c on c.id=s.contact_id
    where s.contact_id=${contactId} and s.status='available' and s.starts_at > now()
      and c.is_active=true and c.is_verified=true and c.intake_status in ('accepting','limited')
    order by s.starts_at asc limit 60
  `;
}

export interface AppointmentInput {
  contactId: string; slotId?: string; requesterName?: string; requesterPhone?: string; requesterEmail?: string;
  note?: string; topic: string; preferredMode: ContactMode; requestedDate?: string; requestedTimeWindow?: string;
}
export interface StudentAppointmentResult { id: string; status: string; createdAt: string; cancellationToken: string }

export async function createAppointment(input: AppointmentInput): Promise<StudentAppointmentResult> {
  const sql = getDatabase();
  const cancellationToken = randomBytes(32).toString('base64url');
  const cancellationHash = createHash('sha256').update(cancellationToken).digest('hex');
  const rows = await sql.begin(async (tx) => {
    const contacts = await tx<{ id: string; is_active: boolean; is_verified: boolean; intake_status: IntakeStatus; contact_modes: ContactMode[] }[]>`
      select id, is_active, is_verified, intake_status, contact_modes from school_support_contacts where id=${input.contactId} for share
    `;
    const contact = contacts[0];
    if (!contact || !contact.is_active || !contact.is_verified || !['accepting','limited'].includes(contact.intake_status)) throw new Error('Hồ sơ hiện chưa thể nhận yêu cầu trực tuyến');
    if (!input.slotId && !contact.contact_modes.includes(input.preferredMode)) throw new Error('Hồ sơ không cung cấp hình thức liên hệ này.');

    let slotId: string | null = null;
    let requestedDate = input.requestedDate || null;
    let requestedTime = input.requestedTimeWindow || null;
    let mode = input.preferredMode;
    if (input.slotId) {
      const slots = await tx<{ id: string; mode: ContactMode; starts_at: Date }[]>`
        select id, mode, starts_at from school_support_slots
        where id=${input.slotId} and contact_id=${input.contactId} and status='available' and starts_at > now()
        for update
      `;
      if (!slots[0]) throw new Error('Khung giờ này vừa được đặt hoặc không còn khả dụng. Hãy tải lại lịch.');
      const updated = await tx<{ id: string }[]>`
        update school_support_slots set status='reserved' where id=${input.slotId} and status='available' returning id
      `;
      if (!updated[0]) throw new Error('Khung giờ này vừa được người khác chọn.');
      slotId = slots[0].id;
      mode = slots[0].mode;
      requestedDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(slots[0].starts_at);
      requestedTime = slots[0].starts_at.toISOString();
    } else if (!requestedDate) {
      throw new Error('Cần chọn một khung giờ đã mở hoặc nhập ngày mong muốn');
    } else {
      const todayVietnam = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
      if (requestedDate < todayVietnam) throw new Error('Ngày mong muốn không thể ở trong quá khứ.');
    }

    const created = await tx<{ id: string; created_at: Date }[]>`
      insert into school_support_appointments
        (contact_id, slot_id, requester_name_enc, requester_phone_enc, requester_email_enc, note_enc,
         topic, preferred_mode, requested_date, requested_time_window, status, consented_at, consent_notice_version, cancellation_token_hash)
      values (${input.contactId}, ${slotId}, ${encryptPrivateField(input.requesterName)}, ${encryptPrivateField(input.requesterPhone)},
        ${encryptPrivateField(input.requesterEmail)}, ${encryptPrivateField(input.note)}, ${input.topic}, ${mode},
        ${requestedDate}, ${requestedTime}, 'pending', now(), '2026-11-v1', ${cancellationHash})
      returning id, created_at
    `;
    await tx`insert into school_support_appointment_audit(appointment_id,action) values(${created[0].id},'student_requested')`;
    return created;
  });
  return { id: rows[0].id, status: 'pending', createdAt: rows[0].created_at.toISOString(), cancellationToken };
}

type AppointmentRow = {
  id: string; contact_id: string; slot_id: string | null; full_name: string; requester_name_enc: string | null;
  requester_phone_enc: string | null; requester_email_enc: string | null; note_enc: string | null; topic: string;
  preferred_mode: ContactMode; requested_date: string | null; requested_time_window: string | null; status: string; created_at: Date;
};
function mapAppointment(row: AppointmentRow) {
  return { id: row.id, contactId: row.contact_id, contactName: row.full_name, requesterName: decryptPrivateField(row.requester_name_enc),
    requesterPhone: decryptPrivateField(row.requester_phone_enc), requesterEmail: decryptPrivateField(row.requester_email_enc),
    note: decryptPrivateField(row.note_enc), topic: row.topic, preferredMode: row.preferred_mode,
    requestedDate: row.requested_date, requestedTimeWindow: row.requested_time_window, status: row.status, createdAt: row.created_at.toISOString() };
}

export async function listAppointmentsForStaff(actor: StaffSession) {
  const sql = getDatabase();
  const isAdmin = ['super_admin','admin'].includes(actor.role);
  const rows = isAdmin
    ? await sql<AppointmentRow[]>`
        select a.id,a.contact_id,a.slot_id,c.full_name,a.requester_name_enc,a.requester_phone_enc,a.requester_email_enc,a.note_enc,
          a.topic,a.preferred_mode,a.requested_date,a.requested_time_window,a.status,a.created_at
        from school_support_appointments a join school_support_contacts c on c.id=a.contact_id
        order by a.created_at desc limit 100`
    : actor.supportContactId
      ? await sql<AppointmentRow[]>`
        select a.id,a.contact_id,a.slot_id,c.full_name,a.requester_name_enc,a.requester_phone_enc,a.requester_email_enc,a.note_enc,
          a.topic,a.preferred_mode,a.requested_date,a.requested_time_window,a.status,a.created_at
        from school_support_appointments a join school_support_contacts c on c.id=a.contact_id
        where a.contact_id=${actor.supportContactId} order by a.created_at desc limit 100`
      : [];
  await sql`insert into staff_audit_log(actor_staff_user_id,action,target_type) values(${actor.id},'appointments_list_viewed','school_support_appointment')`;
  return rows.map(mapAppointment);
}

export async function updateAppointmentStatus(id: string, status: 'confirmed'|'completed'|'rejected', actor: StaffSession) {
  const sql = getDatabase();
  const isAdmin = ['super_admin','admin'].includes(actor.role);
  return await sql.begin(async (tx) => {
    const rows = isAdmin
      ? await tx<{ id: string; slot_id: string | null; contact_id: string; status: string }[]>`select id,slot_id,contact_id,status from school_support_appointments where id=${id} for update`
      : actor.supportContactId
        ? await tx<{ id: string; slot_id: string | null; contact_id: string; status: string }[]>`select id,slot_id,contact_id,status from school_support_appointments where id=${id} and contact_id=${actor.supportContactId} for update`
        : [];
    if (!rows[0]) return false;
    const row = rows[0];
    const validTransition = status === 'confirmed' || status === 'rejected' ? row.status === 'pending' : row.status === 'confirmed';
    if (!validTransition) return false;
    await tx`update school_support_appointments set status=${status}, updated_at=now() where id=${id}`;
    await tx`insert into school_support_appointment_audit (appointment_id, actor_staff_user_id, action) values (${id}, ${actor.id}, ${status})`;
    if (status === 'rejected' && row.slot_id) await tx`update school_support_slots set status='available' where id=${row.slot_id} and status='reserved'`;
    return true;
  });
}

export async function cancelAppointment(id: string, token: string) {
  const sql = getDatabase();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return await sql.begin(async (tx) => {
    const rows = await tx<{ slot_id: string | null; status: string }[]>`select slot_id,status from school_support_appointments where id=${id} and cancellation_token_hash=${tokenHash} for update`;
    if (!rows[0] || !['pending','confirmed'].includes(rows[0].status)) return false;
    await tx`update school_support_appointments set status='cancelled', updated_at=now() where id=${id}`;
    if (rows[0].slot_id) await tx`update school_support_slots set status='available' where id=${rows[0].slot_id} and status='reserved'`;
    await tx`insert into school_support_appointment_audit (appointment_id, action) values (${id}, 'student_cancelled')`;
    return true;
  });
}

export async function rescheduleAppointment(
  id: string,
  token: string,
  change: { slotId?: string; requestedDate?: string; requestedTimeWindow?: string; preferredMode?: ContactMode },
) {
  const sql = getDatabase();
  const tokenHash = createHash('sha256').update(token).digest('hex');
  return await sql.begin(async (tx) => {
    const current = await tx<{ contact_id: string; slot_id: string | null; status: string; preferred_mode: ContactMode }[]>`
      select contact_id, slot_id, status, preferred_mode from school_support_appointments
      where id=${id} and cancellation_token_hash=${tokenHash} for update
    `;
    if (!current[0] || !['pending','confirmed'].includes(current[0].status)) return false;
    const contact = await tx<{ contact_modes: ContactMode[]; is_active: boolean; is_verified: boolean; intake_status: IntakeStatus }[]>`
      select contact_modes,is_active,is_verified,intake_status from school_support_contacts where id=${current[0].contact_id}
    `;
    if (!contact[0]?.is_active || !contact[0].is_verified || !['accepting','limited'].includes(contact[0].intake_status)) {
      throw new Error('Hồ sơ hiện không nhận lịch thay đổi trực tuyến. Hãy liên hệ nhà trường.');
    }
    let nextSlotId: string | null = null;
    let nextDate = change.requestedDate || null;
    let nextWindow = change.requestedTimeWindow || null;
    let nextMode = change.preferredMode || current[0].preferred_mode;
    if (!contact[0].contact_modes.includes(nextMode)) throw new Error('Hình thức liên hệ hiện tại không còn khả dụng cho hồ sơ này.');
    if (change.slotId) {
      const available = await tx<{ id: string; mode: ContactMode; starts_at: Date }[]>`
        select id, mode, starts_at from school_support_slots
        where id=${change.slotId} and contact_id=${current[0].contact_id} and status='available' and starts_at > now() for update
      `;
      if (!available[0]) throw new Error('Khung giờ mới không còn khả dụng.');
      const locked = await tx<{ id: string }[]>`update school_support_slots set status='reserved' where id=${change.slotId} and status='available' returning id`;
      if (!locked[0]) throw new Error('Khung giờ mới vừa được đặt.');
      nextSlotId = available[0].id;
      nextMode = available[0].mode;
      nextDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(available[0].starts_at);
      nextWindow = available[0].starts_at.toISOString();
    } else if (!nextDate || !nextWindow) {
      throw new Error('Cần chọn khung giờ đã mở hoặc nhập ngày và thời gian mong muốn.');
    } else {
      const todayVietnam = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Ho_Chi_Minh', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
      if (nextDate < todayVietnam) throw new Error('Ngày mong muốn không thể ở trong quá khứ.');
    }
    if (current[0].slot_id) await tx`update school_support_slots set status='available' where id=${current[0].slot_id} and status='reserved'`;
    await tx`
      update school_support_appointments set slot_id=${nextSlotId}, requested_date=${nextDate},
        requested_time_window=${nextWindow}, preferred_mode=${nextMode}, status='pending', updated_at=now()
      where id=${id}
    `;
    await tx`insert into school_support_appointment_audit (appointment_id, action) values (${id}, 'student_rescheduled')`;
    return true;
  });
}
