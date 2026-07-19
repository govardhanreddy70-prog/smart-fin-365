const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const migrationPath = path.join(projectRoot, 'supabase', 'migrations', '002_smart_fin_365_governance_and_sync.sql');
const proposalPath = path.join(projectRoot, 'SUPABASE_SCHEMA_AND_RLS_PROPOSAL.md');
const migration = fs.readFileSync(migrationPath, 'utf8');
const proposal = fs.readFileSync(proposalPath, 'utf8');

test('governance migration is transactional and non-destructive', () => {
  assert.match(migration, /^begin;/mi);
  assert.match(migration, /commit;/mi);
  assert.doesNotMatch(migration, /\btruncate\b/i);
  assert.doesNotMatch(migration, /\bdrop\s+table\b/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\b/i);
});

test('governance migration includes required multi-user controls', () => {
  for (const required of [
    'public.sync_conflicts',
    'public.role_feature_permissions',
    'public.user_feature_permissions',
    'public.activity_log',
    'public.restore_jobs',
    'public.restore_job_items',
    'idempotency_key',
    'record_version',
    'public.prevent_log_mutation',
    'public.handle_new_auth_user'
  ]) {
    assert.ok(migration.includes(required), `Missing ${required}`);
  }
});

test('governance migration enables RLS for new tables and keeps direct writes server-side', () => {
  for (const required of [
    'alter table public.sync_conflicts enable row level security;',
    'alter table public.role_feature_permissions enable row level security;',
    'alter table public.user_feature_permissions enable row level security;',
    'alter table public.activity_log enable row level security;',
    'alter table public.restore_jobs enable row level security;',
    'alter table public.restore_job_items enable row level security;',
    'finance_records_owner_or_admin_select'
  ]) {
    assert.ok(migration.includes(required), `Missing ${required}`);
  }
  assert.doesNotMatch(migration, /create policy finance_records_[^\n]*\n\s*for insert/i);
  assert.doesNotMatch(migration, /create policy finance_records_[^\n]*\n\s*for update/i);
  assert.doesNotMatch(migration, /create policy finance_records_[^\n]*\n\s*for delete/i);
});

test('proposal documents workbook preservation, source of truth, and approval gate', () => {
  for (const required of [
    'Supabase will be the transactional system of record',
    '`Chitty`',
    '`Trading`',
    '`Market Pulse`',
    '`Portfolio`',
    '`Stocks`',
    '`Mutual Funds`',
    'Obtain explicit approval before production migration'
  ]) {
    assert.ok(proposal.includes(required), `Missing ${required}`);
  }
});
