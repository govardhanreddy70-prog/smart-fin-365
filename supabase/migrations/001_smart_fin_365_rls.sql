-- Smart Fin 365 Supabase foundation.
-- Run in the existing Supabase project SQL editor or through Supabase migrations.
-- The Google Sheets template remains the master workbook layout; worksheet rows are
-- stored in finance_records with worksheet_name + row_data so new sheets/columns can
-- be recognized without a destructive schema rewrite.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  mobile text,
  full_name text,
  role text not null default 'user',
  status text not null default 'active',
  google_sheet_id text,
  subscription_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  google_sheet_id text not null,
  template_version text,
  sync_status text not null default 'pending',
  last_sheet_sync_at timestamptz,
  last_supabase_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, google_sheet_id)
);

create table if not exists public.worksheet_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  worksheet_name text not null,
  columns jsonb not null default '[]'::jsonb,
  formulas jsonb not null default '{}'::jsonb,
  template_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, worksheet_name)
);

create table if not exists public.finance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  worksheet_name text not null,
  module text not null,
  record_key text,
  row_index integer,
  row_data jsonb not null default '{}'::jsonb,
  row_hash text,
  deleted_at timestamptz,
  source text not null default 'smartfin365',
  sync_status text not null default 'synced',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, worksheet_name, record_key)
);

create table if not exists public.sync_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  worksheet_name text not null,
  record_id uuid references public.finance_records(id) on delete set null,
  change_type text not null,
  source text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  event text not null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  backup_type text not null,
  storage_path text not null,
  retention_until date not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'family',
  status text not null default 'active',
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null,
  status text not null default 'open',
  priority text not null default 'normal',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_security_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  mpin_hash text,
  webauthn_credentials jsonb not null default '{}'::jsonb,
  trusted_devices jsonb not null default '[]'::jsonb,
  second_factor_methods jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_sheets enable row level security;
alter table public.worksheet_definitions enable row level security;
alter table public.finance_records enable row level security;
alter table public.sync_changes enable row level security;
alter table public.audit_log enable row level security;
alter table public.backups enable row level security;
alter table public.subscriptions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.user_security_settings enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.owns_row(row_user_id uuid)
returns boolean language sql stable as $$
  select auth.uid() = row_user_id or public.is_admin();
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'user_sheets',
    'worksheet_definitions',
    'finance_records',
    'sync_changes',
    'audit_log',
    'backups',
    'subscriptions',
    'support_tickets'
  ] loop
    execute format('drop policy if exists %I_owner_select on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_owner_insert on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_owner_update on public.%I', table_name, table_name);
    execute format('drop policy if exists %I_owner_delete on public.%I', table_name, table_name);
  end loop;
end $$;

create policy profiles_owner_select on public.profiles for select using (public.owns_row(id));
create policy profiles_owner_insert on public.profiles for insert with check (auth.uid() = id or public.is_admin());
create policy profiles_owner_update on public.profiles for update using (public.owns_row(id)) with check (public.owns_row(id));
create policy profiles_owner_delete on public.profiles for delete using (public.is_admin());

create policy user_sheets_owner_select on public.user_sheets for select using (public.owns_row(user_id));
create policy user_sheets_owner_insert on public.user_sheets for insert with check (public.owns_row(user_id));
create policy user_sheets_owner_update on public.user_sheets for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));
create policy user_sheets_owner_delete on public.user_sheets for delete using (public.owns_row(user_id));

create policy worksheet_definitions_owner_select on public.worksheet_definitions for select using (public.owns_row(user_id));
create policy worksheet_definitions_owner_insert on public.worksheet_definitions for insert with check (public.owns_row(user_id));
create policy worksheet_definitions_owner_update on public.worksheet_definitions for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));
create policy worksheet_definitions_owner_delete on public.worksheet_definitions for delete using (public.owns_row(user_id));

create policy finance_records_owner_select on public.finance_records for select using (public.owns_row(user_id));
create policy finance_records_owner_insert on public.finance_records for insert with check (public.owns_row(user_id));
create policy finance_records_owner_update on public.finance_records for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));
create policy finance_records_owner_delete on public.finance_records for delete using (public.owns_row(user_id));

create policy sync_changes_owner_select on public.sync_changes for select using (public.owns_row(user_id));
create policy sync_changes_owner_insert on public.sync_changes for insert with check (public.owns_row(user_id));
create policy sync_changes_owner_update on public.sync_changes for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));
create policy sync_changes_owner_delete on public.sync_changes for delete using (public.owns_row(user_id));

create policy audit_log_owner_select on public.audit_log for select using (public.owns_row(user_id) or actor_id = auth.uid());
create policy audit_log_owner_insert on public.audit_log for insert with check (actor_id = auth.uid() or public.is_admin());

create policy backups_owner_select on public.backups for select using (public.owns_row(user_id));
create policy backups_owner_insert on public.backups for insert with check (public.owns_row(user_id));
create policy backups_owner_delete on public.backups for delete using (public.owns_row(user_id));

create policy subscriptions_owner_select on public.subscriptions for select using (public.owns_row(user_id));
create policy subscriptions_owner_insert on public.subscriptions for insert with check (public.is_admin());
create policy subscriptions_owner_update on public.subscriptions for update using (public.is_admin()) with check (public.is_admin());

create policy support_tickets_owner_select on public.support_tickets for select using (public.owns_row(user_id));
create policy support_tickets_owner_insert on public.support_tickets for insert with check (auth.uid() = user_id or public.is_admin());
create policy support_tickets_owner_update on public.support_tickets for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));

create policy security_owner_select on public.user_security_settings for select using (public.owns_row(user_id));
create policy security_owner_insert on public.user_security_settings for insert with check (auth.uid() = user_id or public.is_admin());
create policy security_owner_update on public.user_security_settings for update using (public.owns_row(user_id)) with check (public.owns_row(user_id));

