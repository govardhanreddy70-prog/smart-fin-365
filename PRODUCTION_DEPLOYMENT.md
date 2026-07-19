# Smart Fin 365 Production Deployment

## Status and Scope

This guide prepares a Node.js deployment only. It does **not** deploy the application, change GoDaddy DNS, or claim that `https://smartfin365.com` is live. Keep the current GoDaddy Launching Soon page in place until a selected Node.js hosting target, Supabase migration approval, and security testing are complete.

The generated package contains application code, migration files, documentation, and empty data-directory marker files only. It never contains a financial workbook, `.env` file, OAuth credentials, Supabase keys, access tokens, database passwords, logs, or runtime configuration.

## Package and Commands

Create the provider-neutral package from the project root:

```powershell
npm.cmd run package:production
```

Output:

```text
deployment-zips/smart-fin-365-node-production.zip
```

On the hosting provider after extracting the package:

```text
Build command: npm ci --omit=dev
Start command: npm start
Health check: GET /healthz
```

The application listens on the hosting provider's `process.env.PORT`. Production startup fails closed if `PORT`, `DATA_DIR`, or `BACKUP_STORAGE_DIR` is missing.

## Required Environment Variables

Start from `.env.production.example`, but place real values only in the hosting provider's protected environment-variable service.

Required for the planned production deployment:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=<provided by the hosting provider>
TRUST_PROXY=1
CORS_ALLOWED_ORIGINS=https://smartfin365.com
DATA_DIR=<protected persistent data volume>
BACKUP_STORAGE_DIR=<separate protected persistent backup volume>
FINANCE_WORKBOOK_PATH=<private workbook path on DATA_DIR>
REQUIRE_EXISTING_WORKBOOK=true
PUBLIC_APP_URL=https://smartfin365.com
PUBLIC_BASE_URL=https://smartfin365.com
API_BASE_URL=https://smartfin365.com/api
FINANCE_PUBLIC_URL=https://smartfin365.com
APP_URL=https://smartfin365.com
GOOGLE_REDIRECT_URI=https://smartfin365.com/oauth2callback
FINANCE_WEB_USER=<administrator username>
FINANCE_WEB_PASSWORD=<long private password>
ALLOW_RUNTIME_CREDENTIAL_STORAGE=false
SUPABASE_REQUIRED=true
SUPABASE_URL=<project URL>
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<server-only service role key>
```

Set Google Drive values only when Google synchronization is enabled:

```text
GOOGLE_DRIVE_FOLDER_ID=<Google Drive folder ID>
GOOGLE_CLIENT_ID=<OAuth web client ID>
GOOGLE_CLIENT_SECRET=<OAuth client secret>
GOOGLE_CONFIG_ENCRYPTION_KEY=<64-character hex key>
```

Production disables saving broker and OAuth client credentials through the web form. Supply those deployment secrets through the hosting provider environment variables instead. OAuth refresh tokens created after a successful Google authorization are encrypted server-side in the protected data volume and are never packaged or returned by an API.

Set broker, SMTP, or OTP variables only for the services that are enabled. Do not put any secret in browser JavaScript, mobile builds, Excel workbooks, Google Sheets, Git, or deployment ZIP files.

For local development, use `.env.example` with:

```text
PUBLIC_APP_URL=http://localhost:3333
GOOGLE_REDIRECT_URI=http://localhost:3333/oauth2callback
```

## Persistent Storage and Backup Requirements

Mount `DATA_DIR` and `BACKUP_STORAGE_DIR` as private, encrypted-at-rest volumes outside the application release directory. The Node package contains no financial records and does not bootstrap a blank production workbook when `REQUIRE_EXISTING_WORKBOOK=true`.

Before the first production start, transfer the current workbook to `FINANCE_WORKBOOK_PATH` through a protected administrator process and verify its checksum. Never upload it into the web root or source repository.

The backup workflow provides:

- Weekly validated full workbook snapshots in `BACKUP_STORAGE_DIR`.
- SHA-256 checksum validation and workbook-schema fingerprints.
- Full and incremental dependency-chain validation, including parent full backup, every intermediate incremental backup, chronology, checksum, and schema compatibility.
- A pre-restore full backup before each restore.
- Admin/Super Admin-only validation, download, and restoration.
- `RESTORE` typed confirmation, restore job auditing, post-restore verification, and rollback to the pre-restore backup on failure.

Current Excel snapshots are full snapshots. Incremental chains can be catalogued and validated, but incremental application remains disabled until a tested delta-backup format is introduced. This avoids presenting a full workbook copy as a misleading incremental backup.

Retain backup storage independently from the application release. Configure provider backups or object-storage replication for both persistent volumes before enabling production writes.

## Supabase Migration Procedure

Supabase is the intended transactional source of truth; Google Sheets remains a synchronized reporting and controlled-editing interface. The migrations are prepared but have not been applied.

1. Review [SUPABASE_SCHEMA_AND_RLS_PROPOSAL.md](SUPABASE_SCHEMA_AND_RLS_PROPOSAL.md) and both files in `supabase/migrations/`.
2. Verify a restorable Supabase database backup or point-in-time recovery configuration.
3. Create a development Supabase project or branch with no production data.
4. Store the Supabase service-role key only in that environment's protected server settings.
5. Apply and test the migrations in development using the Supabase CLI or SQL editor, for example:

   ```text
   supabase db push
   ```

6. Test Row Level Security, owner isolation, audit writes, Google Sheets synchronization, backups, restore safety, and conflict handling.
7. Review the results and obtain explicit approval before applying migrations to the production Supabase project.

Do not reset, truncate, delete, or overwrite production data. Do not apply production migrations until the approval gate is completed.

## Post-Deployment Test Checklist

1. Confirm the provider assigns `PORT` and `GET /healthz` returns HTTP 200 with `status: "ready"`.
2. Confirm HTTPS, secure cookies, and the exact public URL `https://smartfin365.com` after DNS is approved separately.
3. Verify unauthenticated financial API requests are rejected and administrator login works.
4. Verify a normal workbook update, Google Sheets synchronization, and Supabase write/read in a controlled test record.
5. Validate a full backup checksum, download it as an administrator, and inspect the restore plan without performing a restore.
6. In a non-production copy, exercise a full restore and confirm pre-restore backup, audit record, and rollback behavior.
7. Confirm incremental chain validation rejects missing parents, missing intermediate backups, bad order, invalid checksum, and schema mismatch.
8. Confirm no private workbook, `.env`, token, secret, or log exists in the deployed code artifact or public directory.
9. Verify mobile clients use the HTTPS origin and do not contain LAN/tunnel fallback addresses.
10. Keep GoDaddy DNS unchanged until the selected provider passes all checks and deployment approval is given.
