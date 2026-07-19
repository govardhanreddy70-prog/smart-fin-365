const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
const client = fs.readFileSync(path.join(projectRoot, 'public', 'script.js'), 'utf8');
const styles = fs.readFileSync(path.join(projectRoot, 'public', 'styles.css'), 'utf8');
const packageScript = fs.readFileSync(path.join(projectRoot, 'scripts', 'create-godaddy-package.ps1'), 'utf8');
const productionEnv = fs.readFileSync(path.join(projectRoot, '.env.production.example'), 'utf8');
const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
const publicServerConfig = fs.readFileSync(path.join(projectRoot, 'public', 'server-config.js'), 'utf8');

test('backup API exposes the guarded catalog, validation, download, chain, and restore operations', () => {
  for (const route of [
    'app.get("/api/backups"',
    'app.get("/api/backups/:id"',
    'app.post("/api/backups/:id/validate"',
    'app.get("/api/backups/:id/download"',
    'app.post("/api/backups/:id/restore-chain"',
    'app.post("/api/backups/:id/restore"'
  ]) {
    assert.ok(server.includes(route), `Missing ${route}`);
  }
  assert.match(server, /app\.get\("\/api\/backups", async \(_req, res, next\) => \{[\s\S]*isAdminRole\(_req\.financeAuth\?\.role\)/);
  assert.match(server, /isAdminRole\(req\.financeAuth\?\.role\)/);
  assert.match(server, /function publicBackupRecord\(backup\)[\s\S]*const \{ internalPath, \.\.\.publicRecord \} = backup;/);
  assert.doesNotMatch(server, /for \(const filePath of unique\.slice\(-50\)\)/);
});

test('restore requires validation, a pre-restore backup, a confirmation phrase, and rollback protection', () => {
  assert.match(server, /Enter RESTORE to confirm this destructive operation\./);
  assert.match(server, /createPreRestoreFullBackup\(workbookPath, actor\)/);
  assert.match(server, /await fs\.copyFile\(preRestoreBackup\.internalPath, workbookPath\)\.catch/);
  assert.match(server, /appendSecurityLog\("backup_restore_completed"/);
  assert.match(server, /appendSecurityLog\("backup_restore_failed"/);
  assert.match(server, /Selected-module, date-range, and user-only restore are not available/);
});

test('incremental restore warnings and complete-chain selection use the required wording', () => {
  const requiredWarning = 'An incremental backup cannot be restored independently. Select the corresponding full backup and every required incremental backup in chronological order.';
  assert.ok(server.includes(requiredWarning));
  assert.match(client, /plan\.warning/);
  assert.ok(client.includes('Select Complete Restore Chain'));
  assert.doesNotMatch(`${server}\n${client}`, /\bpic\s+(?:the|a|an|backup|full|incremental)/i);
  assert.match(server, /workbookSchemaFingerprint/);
  assert.match(server, /Incremental dependency cycle detected/);
  assert.match(server, /incompatible workbook schema/);
  assert.match(server, /is not earlier than/);
});

test('backup browser provides searchable filters, required actions, and responsive record display', () => {
  for (const label of [
    'Search backup ID, name, source or status',
    'Full backups',
    'Incremental backups',
    'Checksum valid',
    'Available backups',
    'View',
    'Validate',
    'Download',
    'Restore'
  ]) {
    assert.ok(client.includes(label), `Missing ${label}`);
  }
  assert.match(client, /data-backup-search/);
  assert.match(client, /applyBackupFilters\(\)/);
  assert.match(styles, /\.backup-browser-table/);
  assert.match(styles, /\.backup-browser-table td::before/);
});

test('production configuration is environment-based and exposes a readiness health check', () => {
  assert.match(server, /Production requires the hosting provider to supply PORT/);
  assert.match(server, /Production requires DATA_DIR to point to protected persistent storage/);
  assert.match(server, /Production requires BACKUP_STORAGE_DIR to point to protected persistent storage/);
  assert.match(server, /app\.get\("\/healthz", async/);
  assert.match(server, /status: healthy \? "ready" : "starting_or_degraded"/);
  assert.match(server, /FINANCE_WEB_PASSWORD must be supplied through protected environment variables/);
  assert.match(server, /SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(server, /const environmentWorkbookPath = safeText\(process\.env\.FINANCE_WORKBOOK_PATH\)/);
  assert.match(productionEnv, /^PUBLIC_APP_URL=https:\/\/smartfin365\.com$/m);
  assert.match(productionEnv, /^GOOGLE_REDIRECT_URI=https:\/\/smartfin365\.com\/oauth2callback$/m);
  assert.doesNotMatch(productionEnv, /http:\/\/localhost/i);
  assert.match(productionEnv, /capacitor:\/\/localhost/);
});

test('production package and repository rules exclude private workbook and runtime secrets', () => {
  assert.match(packageScript, /smart-fin-365-node-production\.zip/);
  assert.match(packageScript, /data\\\.gitkeep/);
  assert.doesNotMatch(packageScript, /Copy-Item[^\n]*Finance_Records_Converted\.xlsx/);
  for (const required of [
    '.env.production',
    'workbook.config.json',
    'Finance_Records*.xlsx',
    'data/*.xlsx',
    'deployment-zips/*/'
  ]) {
    assert.ok(gitignore.includes(required), `Missing ${required} ignore rule`);
  }
  assert.doesNotMatch(publicServerConfig, /trycloudflare|192\.168\.|172\.20\.|localhost/i);
  assert.match(publicServerConfig, /autoProbe: false/);
});
