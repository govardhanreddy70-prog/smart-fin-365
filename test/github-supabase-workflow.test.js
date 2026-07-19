const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(projectRoot, '.github', 'workflows', 'supabase-migrations.yml'), 'utf8');
const guide = fs.readFileSync(path.join(projectRoot, 'GITHUB_SUPABASE_RELEASE.md'), 'utf8');

test('normal GitHub workflow events validate migrations without a production database write', () => {
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /push:/);
  assert.match(workflow, /No database write was performed by this job/);
  assert.match(workflow, /production-migrate:/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
});

test('production migration requires a protected environment and explicit evidence', () => {
  for (const required of [
    'name: supabase-production',
    'SUPABASE_ACCESS_TOKEN',
    'SUPABASE_DB_PASSWORD',
    'SUPABASE_PROJECT_REF',
    'backup_reference',
    'development_test_reference',
    'APPLY_PRODUCTION_MIGRATIONS',
    'supabase db push --dry-run',
    'supabase db push'
  ]) {
    assert.ok(workflow.includes(required), `Missing ${required}`);
  }
  assert.match(guide, /GitHub Environment is configured by the project\s+administrator/);
  assert.match(guide, /No Supabase\s+migration, database write, data import, or deployment occurs/);
});
