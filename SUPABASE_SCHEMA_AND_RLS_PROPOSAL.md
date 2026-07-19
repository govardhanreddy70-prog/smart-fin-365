# Smart Fin 365 Supabase Schema and RLS Proposal

Status: prepared for review only. No migration has been applied to Supabase.

## Source of Truth

Supabase will be the transactional system of record. Google Sheets and the existing
Excel workbook remain synchronized reporting and controlled-editing surfaces. They do
not own authentication, roles, subscriptions, audit history, or conflict resolution.

The existing workbook stays intact. Its `Chitty`, `Trading`, `Market Pulse`,
`Portfolio`, `Stocks`, and `Mutual Funds` sheets remain active and are represented by
their worksheet definitions and records; this proposal does not remove or rename them.

## Migration Order

1. `001_smart_fin_365_rls.sql` establishes the generic workbook-backed model.
2. `002_smart_fin_365_governance_and_sync.sql` hardens roles and RLS, adds profile,
   sync, audit, activity, backup-chain, and restore-job support.

Both migrations are additive. Migration 002 does not truncate, drop, reset, or delete
financial tables or historical workbook data. Its only `update` normalizes any existing
profile role labels (`User` to `basic`, `Administrator` to `admin`) before enforcing the
new allowed role values. The new Supabase project currently has no Smart Fin 365 data,
so it has no data effect until records are migrated deliberately.

## Core Schema

| Area | Tables | Purpose |
| --- | --- | --- |
| Identity and profile | `profiles`, `user_security_settings`, `subscriptions` | Supabase Auth user profile, settings, role, plan and account state. |
| Workbook mapping | `user_sheets`, `worksheet_definitions`, `finance_records` | One user-owned Google Sheet/template map and stable UUID-backed rows without relying on spreadsheet row numbers. |
| Synchronization | `sync_changes`, `sync_conflicts` | Idempotent jobs, retry state, record versions, conflict review and worker locks. |
| Authorization | `role_feature_permissions`, `user_feature_permissions` | Stable `basic`, `premium`, and `admin` roles plus feature-level overrides. |
| Governance | `audit_log`, `activity_log` | Append-only security/audit events and separate non-sensitive usage events. |
| Backup and restore | `backups`, `restore_jobs`, `restore_job_items` | Full/incremental backup chain, integrity checks, pre-restore backup and restore-job audit trail. |

## RLS Policy Matrix

| Data | Basic/Premium user | Admin | Server service role |
| --- | --- | --- | --- |
| Profile | Read own; edit only permitted personal preferences | Read/update permitted profiles | Full controlled access |
| Finance records | Read own only | Read authorized users | Transactional create/update/delete through API |
| Sheets and definitions | Read own mappings | Read authorized mappings | Provision and synchronize |
| Sync jobs/conflicts | Read own status and conflicts | Read authorized status | Queue, retry and resolve |
| Feature permissions/subscriptions | Read own | Read/manage | Controlled writes |
| Audit/activity logs | Read own relevant events | Read audit/activity logs | Append events only |
| Backups/restores | Read own eligible backups | Manage catalog and restore jobs | Validate, create, execute and report |

There are no direct client mutation policies for financial rows, sync jobs, backup jobs,
roles, subscriptions, or logs. The Express API and future mobile API form the mutation
boundary, using the server-only service role key. This blocks a browser or mobile client
from bypassing validation or writing another user's data directly.

## Conflict and Synchronization Policy

- Every row uses the existing UUID `finance_records.id`; spreadsheet row numbers are
  never identity.
- Each mutation has an idempotency key, source, record version, origin and timestamp.
- Supabase is authoritative for confirmed financial writes.
- Google Sheets edits are imported as proposed changes. The most recent valid update is
  accepted only when it does not conflict with a newer Supabase version.
- Conflicting financial changes create `sync_conflicts` records for review; neither
  side is silently overwritten.
- Deleted rows use `deleted_at`, so a stale spreadsheet row cannot recreate a deleted
  record without an explicit restore operation.
- Queue workers lock jobs, track retries, and retain the latest safe error message.
- Formula cells are not imported as source fields; the shared calculation layer will
  calculate derived totals from typed input data in a later implementation phase.

## Restore-Chain Design

An incremental backup cannot be restored independently. A restore request must include
its parent full backup and each incremental backup through the selected point, ordered by
creation time. Before a restore can run, the server will validate every file, checksum,
schema version and dependency, create a pre-restore full backup, require an administrator
to type `RESTORE`, and write the plan to `restore_jobs` and `restore_job_items`.

The migration provides only the data model and RLS for this workflow. No restore engine
or production data operation is enabled by these SQL files.

## Development and Production Gate

Before applying either migration:

1. Create a development Supabase project or branch and configure its project URL,
   publishable key and server-only service role key outside source control.
2. In the production Supabase dashboard, create and verify a database backup or PITR
   coverage. Record the timestamp and restore capability in the deployment change log.
3. Run migration 001, then 002, only in development.
4. Create one test user and verify RLS with authenticated and anonymous requests.
5. Seed no production financial data until workbook totals reconcile with the proposed
   import mapping.
6. Review the migration output, RLS test results and the generated database backup.
7. Obtain explicit approval before production migration, data import, Google Sheets
   bidirectional sync, or DNS/deployment changes.

## Required Environment Variables

```dotenv
SUPABASE_URL=https://himgtvlurzamjfoaoaqm.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
```

`SUPABASE_ANON_KEY` remains supported only as a legacy alias. The service-role key must
be injected through the protected server environment and must never appear in frontend
code, browser storage, the workbook, Google Sheets, logs, or Git.
