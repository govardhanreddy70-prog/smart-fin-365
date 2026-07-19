-- Smart Fin 365 governance, profile, sync, and backup-chain hardening.
--
-- Prerequisite: 001_smart_fin_365_rls.sql
-- This migration is additive. It creates no financial rows, deletes no records,
-- and retains the generic finance_records model that maps the existing workbook.
-- Review in a development Supabase project and take a database backup before use.

begin;

create extension if not exists "pgcrypto";

-- Standardize legacy role values without removing any profile rows.
update public.profiles
set role = case lower(coalesce(role, ''))
  when 'administrator' then 'admin'
  when 'super admin' then 'admin'
  when 'super_admin' then 'admin'
  when 'premium' then 'premium'
  when 'basic' then 'basic'
  when 'user' then 'basic'
  else 'basic'
end
where role is distinct from case lower(coalesce(role, ''))
  when 'administrator' then 'admin'
  when 'super admin' then 'admin'
  when 'super_admin' then 'admin'
  when 'premium' then 'premium'
  when 'basic' then 'basic'
  when 'user' then 'basic'
  else 'basic'
end;

alter table public.profiles
  alter column role set default 'basic';

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists alternate_mobile text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists country text,
  add column if not exists pin_code text,
  add column if not exists preferred_language text not null default 'en',
  add column if not exists preferred_currency text not null default 'INR',
  add column if not exists timezone text not null default 'Asia/Kolkata',
  add column if not exists date_format text not null default 'DD-MM-YYYY',
  add column if not exists financial_year_start_month smallint not null default 4,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb,
  add column if not exists theme_preference text not null default 'system',
  add column if not exists occupation text,
  add column if not exists employer text,
  add column if not exists emergency_contact jsonb not null default '{}'::jsonb,
  add column if not exists profile_photo_path text,
  add column if not exists last_login_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_role_check,
  add constraint profiles_role_check check (role in ('basic', 'premium', 'admin')),
  drop constraint if exists profiles_status_check,
  add constraint profiles_status_check check (status in ('active', 'disabled', 'suspended', 'deleted')),
  drop constraint if exists profiles_fy_month_check,
  add constraint profiles_fy_month_check check (financial_year_start_month between 1 and 12);

alter table public.finance_records
  add column if not exists record_version integer not null default 1,
  add column if not exists source_updated_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_origin text not null default 'smartfin365',
  add column if not exists idempotency_key text,
  add column if not exists retry_count integer not null default 0,
  add column if not exists last_sync_error text,
  add column if not exists conflict_status text not null default 'none';

alter table public.finance_records
  drop constraint if exists finance_records_sync_origin_check,
  add constraint finance_records_sync_origin_check check (sync_origin in ('smartfin365', 'google_sheets', 'excel_import', 'system')),
  drop constraint if exists finance_records_conflict_status_check,
  add constraint finance_records_conflict_status_check check (conflict_status in ('none', 'review_required', 'resolved'));

create unique index if not exists finance_records_user_idempotency_key_uidx
  on public.finance_records (user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists finance_records_owner_sheet_updated_idx
  on public.finance_records (user_id, worksheet_name, updated_at desc)
  where deleted_at is null;
create index if not exists finance_records_conflict_idx
  on public.finance_records (user_id, conflict_status, updated_at desc)
  where conflict_status <> 'none';

alter table public.sync_changes
  add column if not exists idempotency_key text,
  add column if not exists record_version integer,
  add column if not exists retry_count integer not null default 0,
  add column if not exists next_retry_at timestamptz,
  add column if not exists conflict_status text not null default 'none',
  add column if not exists payload_hash text,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

alter table public.sync_changes
  drop constraint if exists sync_changes_conflict_status_check,
  add constraint sync_changes_conflict_status_check check (conflict_status in ('none', 'review_required', 'resolved'));

create unique index if not exists sync_changes_user_idempotency_key_uidx
  on public.sync_changes (user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists sync_changes_queue_idx
  on public.sync_changes (status, next_retry_at, created_at)
  where processed_at is null;

create table if not exists public.sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  record_id uuid references public.finance_records(id) on delete set null,
  worksheet_name text not null,
  local_version integer,
  remote_version integer,
  local_payload jsonb not null default '{}'::jsonb,
  remote_payload jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'resolved_local', 'resolved_remote', 'ignored')),
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sync_conflicts_owner_status_idx
  on public.sync_conflicts (user_id, status, created_at desc);

create table if not exists public.role_feature_permissions (
  role_code text not null check (role_code in ('basic', 'premium', 'admin')),
  feature_key text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  can_import boolean not null default false,
  can_export boolean not null default false,
  can_sync boolean not null default false,
  can_restore boolean not null default false,
  can_administrate boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (role_code, feature_key)
);

create table if not exists public.user_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  permissions jsonb not null default '{}'::jsonb,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, feature_key)
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event text not null,
  entity text,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);

-- Extend the existing backup catalog with the information needed to construct and
-- validate a complete full-plus-incremental restore chain.
alter table public.backups
  add column if not exists backup_name text,
  add column if not exists backup_period text,
  add column if not exists file_size_bytes bigint,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists source text not null default 'smartfin365',
  add column if not exists status text not null default 'available',
  add column if not exists parent_full_backup_id uuid references public.backups(id) on delete restrict,
  add column if not exists previous_incremental_backup_id uuid references public.backups(id) on delete restrict,
  add column if not exists checksum_algorithm text not null default 'sha256',
  add column if not exists checksum_value text,
  add column if not exists integrity_status text not null default 'pending',
  add column if not exists schema_version text,
  add column if not exists restore_eligible boolean not null default false,
  add column if not exists restore_scope jsonb not null default '{"scope":"full_system"}'::jsonb,
  add column if not exists expires_at timestamptz,
  add column if not exists validated_at timestamptz,
  add column if not exists validation_error text;

update public.backups
set backup_name = coalesce(backup_name, nullif(storage_path, ''), concat('Backup ', id::text))
where backup_name is null or backup_name = '';

alter table public.backups
  alter column backup_name set not null,
  drop constraint if exists backups_backup_type_check,
  add constraint backups_backup_type_check check (backup_type in ('full', 'incremental')),
  drop constraint if exists backups_status_check,
  add constraint backups_status_check check (status in ('available', 'creating', 'failed', 'expired', 'restored', 'corrupted')),
  drop constraint if exists backups_integrity_status_check,
  add constraint backups_integrity_status_check check (integrity_status in ('pending', 'valid', 'invalid', 'missing'));

create index if not exists backups_owner_created_idx
  on public.backups (user_id, created_at desc);
create index if not exists backups_restore_chain_idx
  on public.backups (user_id, parent_full_backup_id, created_at);

create table if not exists public.restore_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  target_user_id uuid references public.profiles(id) on delete restrict,
  scope text not null check (scope in ('full_system', 'current_user', 'module', 'date_range')),
  scope_filter jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'validating', 'awaiting_confirmation', 'running', 'completed', 'failed', 'rolled_back', 'cancelled')),
  confirmation_phrase_verified_at timestamptz,
  pre_restore_backup_id uuid references public.backups(id) on delete restrict,
  estimated_restore_point timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.restore_job_items (
  id uuid primary key default gen_random_uuid(),
  restore_job_id uuid not null references public.restore_jobs(id) on delete cascade,
  backup_id uuid not null references public.backups(id) on delete restrict,
  sequence_number integer not null,
  required boolean not null default true,
  validation_status text not null default 'pending' check (validation_status in ('pending', 'valid', 'invalid', 'missing')),
  created_at timestamptz not null default now(),
  unique (restore_job_id, backup_id),
  unique (restore_job_id, sequence_number)
);

-- Auth-created profiles always begin as basic users. The service role may create
-- administrator records, but regular users can never elevate their own profile.
create or replace function public.set_profile_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.role := coalesce(nullif(new.role, ''), 'basic');
  if new.role not in ('basic', 'premium', 'admin') then
    new.role := 'basic';
  end if;
  new.status := coalesce(nullif(new.status, ''), 'active');
  return new;
end;
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() = old.id and not public.is_admin() then
    if new.role is distinct from old.role
      or new.status is distinct from old.status
      or new.subscription_id is distinct from old.subscription_id
      or new.google_sheet_id is distinct from old.google_sheet_id
      or new.email is distinct from old.email
      or new.mobile is distinct from old.mobile
      or new.deleted_at is distinct from old.deleted_at then
      raise exception 'This profile field can only be changed by an administrator or verified server workflow.';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.prevent_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Audit and activity logs are append-only.';
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, mobile, full_name, display_name, role, status)
  values (
    new.id,
    lower(nullif(new.email, '')),
    nullif(new.phone, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'basic',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_defaults_before_insert on public.profiles;
create trigger profiles_defaults_before_insert
before insert on public.profiles
for each row execute function public.set_profile_defaults();

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row execute function public.prevent_profile_privilege_escalation();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_row_updated_at();

drop trigger if exists finance_records_updated_at on public.finance_records;
create trigger finance_records_updated_at
before update on public.finance_records
for each row execute function public.set_row_updated_at();

drop trigger if exists user_feature_permissions_updated_at on public.user_feature_permissions;
create trigger user_feature_permissions_updated_at
before update on public.user_feature_permissions
for each row execute function public.set_row_updated_at();

drop trigger if exists restore_jobs_updated_at on public.restore_jobs;
create trigger restore_jobs_updated_at
before update on public.restore_jobs
for each row execute function public.set_row_updated_at();

drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only
before update or delete on public.audit_log
for each row execute function public.prevent_log_mutation();

drop trigger if exists activity_log_append_only on public.activity_log;
create trigger activity_log_append_only
before update or delete on public.activity_log
for each row execute function public.prevent_log_mutation();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- RLS helpers run with the migration owner so an ownership check does not recurse
-- through profile policies. The service role still bypasses these policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
      and deleted_at is null
  );
$$;

create or replace function public.owns_row(row_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = row_user_id or public.is_admin();
$$;

alter table public.sync_conflicts enable row level security;
alter table public.role_feature_permissions enable row level security;
alter table public.user_feature_permissions enable row level security;
alter table public.activity_log enable row level security;
alter table public.restore_jobs enable row level security;
alter table public.restore_job_items enable row level security;

-- Replace the permissive first-draft policies. Mutating financial, backup, sync,
-- role, and audit data is server-side only; client sessions can read only their own
-- permitted information. This keeps the Express API and future mobile API as the
-- transactional boundary while RLS still protects against cross-user access.
drop policy if exists profiles_owner_select on public.profiles;
drop policy if exists profiles_owner_insert on public.profiles;
drop policy if exists profiles_owner_update on public.profiles;
drop policy if exists profiles_owner_delete on public.profiles;
create policy profiles_self_or_admin_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_admin_update on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists user_sheets_owner_select on public.user_sheets;
drop policy if exists user_sheets_owner_insert on public.user_sheets;
drop policy if exists user_sheets_owner_update on public.user_sheets;
drop policy if exists user_sheets_owner_delete on public.user_sheets;
create policy user_sheets_owner_or_admin_select on public.user_sheets
  for select using (public.owns_row(user_id));

drop policy if exists worksheet_definitions_owner_select on public.worksheet_definitions;
drop policy if exists worksheet_definitions_owner_insert on public.worksheet_definitions;
drop policy if exists worksheet_definitions_owner_update on public.worksheet_definitions;
drop policy if exists worksheet_definitions_owner_delete on public.worksheet_definitions;
create policy worksheet_definitions_owner_or_admin_select on public.worksheet_definitions
  for select using (public.owns_row(user_id));

drop policy if exists finance_records_owner_select on public.finance_records;
drop policy if exists finance_records_owner_insert on public.finance_records;
drop policy if exists finance_records_owner_update on public.finance_records;
drop policy if exists finance_records_owner_delete on public.finance_records;
create policy finance_records_owner_or_admin_select on public.finance_records
  for select using (public.owns_row(user_id));

drop policy if exists sync_changes_owner_select on public.sync_changes;
drop policy if exists sync_changes_owner_insert on public.sync_changes;
drop policy if exists sync_changes_owner_update on public.sync_changes;
drop policy if exists sync_changes_owner_delete on public.sync_changes;
create policy sync_changes_owner_or_admin_select on public.sync_changes
  for select using (public.owns_row(user_id));

drop policy if exists audit_log_owner_select on public.audit_log;
drop policy if exists audit_log_owner_insert on public.audit_log;
create policy audit_log_owner_or_admin_select on public.audit_log
  for select using (actor_id = auth.uid() or user_id = auth.uid() or public.is_admin());

drop policy if exists backups_owner_select on public.backups;
drop policy if exists backups_owner_insert on public.backups;
drop policy if exists backups_owner_delete on public.backups;
create policy backups_owner_or_admin_select on public.backups
  for select using (public.owns_row(user_id));

drop policy if exists subscriptions_owner_select on public.subscriptions;
drop policy if exists subscriptions_owner_insert on public.subscriptions;
drop policy if exists subscriptions_owner_update on public.subscriptions;
create policy subscriptions_owner_or_admin_select on public.subscriptions
  for select using (public.owns_row(user_id));

drop policy if exists support_tickets_owner_select on public.support_tickets;
drop policy if exists support_tickets_owner_insert on public.support_tickets;
drop policy if exists support_tickets_owner_update on public.support_tickets;
create policy support_tickets_owner_or_admin_select on public.support_tickets
  for select using (public.owns_row(user_id));

drop policy if exists security_owner_select on public.user_security_settings;
drop policy if exists security_owner_insert on public.user_security_settings;
drop policy if exists security_owner_update on public.user_security_settings;
create policy security_settings_owner_or_admin_select on public.user_security_settings
  for select using (public.owns_row(user_id));

create policy sync_conflicts_owner_or_admin_select on public.sync_conflicts
  for select using (public.owns_row(user_id));
create policy user_feature_permissions_self_or_admin_select on public.user_feature_permissions
  for select using (public.owns_row(user_id));
create policy role_feature_permissions_authenticated_select on public.role_feature_permissions
  for select using (auth.role() = 'authenticated');
create policy activity_log_owner_or_admin_select on public.activity_log
  for select using (user_id = auth.uid() or public.is_admin());
create policy restore_jobs_admin_select on public.restore_jobs
  for select using (public.is_admin());
create policy restore_job_items_admin_select on public.restore_job_items
  for select using (public.is_admin());

-- Seed safe role defaults. Administrators can later manage feature overrides.
insert into public.role_feature_permissions (
  role_code, feature_key, can_view, can_create, can_edit, can_delete, can_import, can_export, can_sync, can_restore, can_administrate
)
values
  ('basic', 'dashboard', true, false, false, false, false, false, false, false, false),
  ('basic', 'financial_records', true, true, true, false, true, true, true, false, false),
  ('premium', 'dashboard', true, false, false, false, false, false, false, false, false),
  ('premium', 'financial_records', true, true, true, false, true, true, true, false, false),
  ('premium', 'advanced_analytics', true, false, false, false, false, true, false, false, false),
  ('admin', 'dashboard', true, false, false, false, false, false, false, false, true),
  ('admin', 'financial_records', true, true, true, true, true, true, true, true, true),
  ('admin', 'user_management', true, true, true, true, false, true, false, false, true),
  ('admin', 'backup_restore', true, true, false, false, false, true, true, true, true)
on conflict (role_code, feature_key) do nothing;

commit;
