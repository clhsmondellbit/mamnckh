-- School Support Center + staff RBAC + appointment scheduling.
-- Apply after sql/schema.sql. PostgreSQL 14+ recommended.
BEGIN;
create extension if not exists pgcrypto;

create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('super_admin','admin','content_manager','school_counselor','teacher','technical_operator')),
  support_contact_id uuid,
  is_active boolean not null default true,
  session_version integer not null default 1 check (session_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Keep the migration safe if staff_users was created by an earlier draft.
alter table staff_users add column if not exists session_version integer not null default 1;
create index if not exists staff_users_active_role_idx on staff_users(role, is_active);

create table if not exists school_support_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  avatar_url text,
  avatar_public_consent_at timestamptz,
  role_title text not null,
  department text not null,
  support_topics text[] not null default '{}',
  description text not null default '',
  phone_e164 text,
  phone_is_public boolean not null default false,
  phone_consent_at timestamptz,
  email text,
  email_is_public boolean not null default false,
  email_consent_at timestamptz,
  contact_hours text not null default '',
  contact_modes text[] not null default '{in_person}',
  intake_status text not null default 'not_accepting' check (intake_status in ('accepting','limited','not_accepting')),
  intake_note text not null default '',
  is_active boolean not null default true,
  is_verified boolean not null default false,
  verification_method text,
  verified_by uuid references staff_users(id) on delete set null,
  verified_at timestamptz,
  last_verified_at timestamptz,
  created_by uuid references staff_users(id) on delete set null,
  updated_by uuid references staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint school_contact_phone_format check (phone_e164 is null or phone_e164 ~ '^\+84[1-9][0-9]{7,9}$'),
  constraint school_contact_public_phone_requires_verification check (phone_is_public = false or (is_verified = true and phone_e164 is not null and phone_consent_at is not null)),
  constraint school_contact_public_email_requires_verification check (email_is_public = false or (is_verified = true and email is not null and email_consent_at is not null)),
  constraint school_contact_avatar_consent_requires_verification check (avatar_public_consent_at is null or (is_verified = true and avatar_url is not null)),
  constraint school_contact_modes_valid check (contact_modes <@ array['phone','message','in_person']::text[]),
  constraint school_contact_verification_complete check (is_verified = false or (verification_method in ('school_confirmation','direct_staff_confirmation') and verified_by is not null and verified_at is not null and last_verified_at is not null))
);
create index if not exists school_support_contacts_active_idx on school_support_contacts(is_active, is_verified, intake_status);
create index if not exists school_support_contacts_topics_idx on school_support_contacts using gin(support_topics);

do $$ begin
  if not exists (select 1 from pg_constraint where conname='staff_users_support_contact_fk') then
    alter table staff_users add constraint staff_users_support_contact_fk
      foreign key (support_contact_id) references school_support_contacts(id) on delete set null;
  end if;
end $$;

create table if not exists school_support_contact_audit (
  id bigserial primary key,
  contact_id uuid references school_support_contacts(id) on delete set null,
  actor_staff_user_id uuid references staff_users(id) on delete set null,
  action text not null,
  changed_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists school_support_contact_audit_contact_idx on school_support_contact_audit(contact_id, created_at desc);

create table if not exists school_support_slots (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references school_support_contacts(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  mode text not null check (mode in ('phone','message','in_person')),
  status text not null default 'available' check (status in ('available','reserved','closed')),
  created_by uuid references staff_users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint slot_time_order check (ends_at > starts_at),
  unique(contact_id, starts_at, ends_at)
);
create index if not exists school_support_slots_public_idx on school_support_slots(contact_id, status, starts_at);

create table if not exists school_support_appointments (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references school_support_contacts(id) on delete restrict,
  slot_id uuid references school_support_slots(id) on delete set null,
  requester_name_enc text,
  requester_phone_enc text,
  requester_email_enc text,
  note_enc text,
  topic text not null,
  preferred_mode text not null check (preferred_mode in ('phone','message','in_person')),
  requested_date date,
  requested_time_window text,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled','rejected')),
  consented_at timestamptz not null,
  consent_notice_version text not null,
  cancellation_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_slot_or_manual_date check (slot_id is not null or requested_date is not null)
);
create index if not exists school_support_appointments_contact_idx on school_support_appointments(contact_id, status, created_at desc);
create index if not exists school_support_appointments_date_idx on school_support_appointments(requested_date, status);
create unique index if not exists school_support_appointments_active_slot_unique on school_support_appointments(slot_id) where slot_id is not null and status in ('pending','confirmed');

-- Add explicit routing/consent fields to the existing, voluntary support request table.
alter table support_requests
  add column if not exists contact_id uuid references school_support_contacts(id) on delete set null,
  add column if not exists consent_notice_version text,
  add column if not exists consented_at timestamptz;

create table if not exists school_support_appointment_audit (
  id bigserial primary key,
  appointment_id uuid references school_support_appointments(id) on delete set null,
  actor_staff_user_id uuid references staff_users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists school_support_appointment_audit_created_idx on school_support_appointment_audit(created_at desc);

-- Call from a trusted scheduler once per day. Terminal appointment PII is deleted
-- after 90 days; no chat history is stored in this table.
create or replace function purge_old_school_support_appointments() returns integer
language plpgsql as $$
declare deleted_count integer;
begin
  delete from school_support_appointments
  where (status in ('completed','cancelled','rejected') and updated_at < now() - interval '90 days')
     or (status = 'pending' and created_at < now() - interval '180 days')
     or (status = 'confirmed' and requested_date < current_date - 180);
  get diagnostics deleted_count = row_count;
  update school_support_slots set status='closed'
    where status='available' and ends_at < now();
  delete from school_support_slots s
    where s.status in ('closed','reserved') and s.ends_at < now() - interval '90 days'
      and not exists (select 1 from school_support_appointments a where a.slot_id=s.id and a.status in ('pending','confirmed'));
  return deleted_count;
end;
$$;

create table if not exists staff_audit_log (
  id bigserial primary key,
  actor_staff_user_id uuid references staff_users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  changed_fields jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists staff_audit_log_actor_idx on staff_audit_log(actor_staff_user_id, created_at desc);

COMMIT;
