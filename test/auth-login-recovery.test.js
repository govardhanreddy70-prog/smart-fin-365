const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');
const server = fs.readFileSync(path.join(projectRoot, 'server.js'), 'utf8');
const client = fs.readFileSync(path.join(projectRoot, 'public', 'script.js'), 'utf8');
const page = fs.readFileSync(path.join(projectRoot, 'public', 'index.html'), 'utf8');

test('unconfigured local development server can bootstrap an administrator without a default password', () => {
  assert.match(server, /function isLoopbackRequest\(req\)/);
  assert.match(server, /app\.post\("\/api\/auth\/local-bootstrap"/);
  assert.match(server, /if \(isHostedProduction \|\| !isLoopbackRequest\(req\)\) return res\.sendStatus\(404\)/);
  assert.match(server, /if \(settings\.enabled\) return res\.status\(409\)/);
  assert.match(server, /financeWebPasswordHash: createPasswordHash\(newPassword\)/);
  assert.match(server, /loginConfigured: settings\.enabled/);
  assert.doesNotMatch(server, /financeWebPasswordHash:\s*["'](?:admin|password)["']/i);
});

test('login client recovers from an unreachable saved server URL and explains real connectivity failures', () => {
  assert.match(client, /async function recoverServerConnection\(\)/);
  assert.match(client, /async function fetchWithServerRecovery\(path, options\)/);
  assert.match(client, /Cannot reach the Smart Fin 365 server/);
  assert.match(client, /localAdminSetupSubmit\?\.addEventListener/);
  assert.match(client, /publicApiJson\("\/api\/auth\/local-bootstrap"/);
  assert.match(client, /authConnectServerButton\?\.addEventListener/);
  assert.match(client, /Checking server connection/);
  assert.match(page, /id="localAdminSetupPanel"/);
  assert.match(page, /id="authServerUrl"/);
});
