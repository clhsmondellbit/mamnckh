-- This table intentionally stores only the information a student explicitly
-- chooses to submit in a voluntary support request. It is not a chat archive.
create extension if not exists pgcrypto;

create table if not exists support_requests (
  id uuid primary key default gen_random_uuid(),
  preferred_name text,
  contact_preference text,
  topic text not null,
  support_level text not null check (support_level in ('green', 'yellow')),
  student_note text,
  requested_support text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  assigned_staff text,
  follow_up_date date,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
