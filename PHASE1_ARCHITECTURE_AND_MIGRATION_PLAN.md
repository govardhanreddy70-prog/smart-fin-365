# Smart Fin 365 Phase 1 Architecture and Migration Plan

This document records the non-destructive inspection before Supabase, Family Income migration, Master Ledger removal, and restore-chain implementation.

## Current Workbook Mapping

Inspected workbook: `Finance_Records_Converted.xlsx`

Relevant sheets found:

- `Entries`: current Master Ledger-style source with 138 rows and legacy entry columns.
- `Salary & Income`: salary/payroll income sheet with gross salary, deductions, net salary, rental income, agricultural income, other income, total monthly income, financial year, and sync columns.
- `Family Income`: generic income receivables sheet with expected amount, income received, pending income, status, notes, and sync columns.
- `Savings`: savings account balances and growth.
- `Bank & Cash Manager`: bank/cash transactions and linked module references.
- `Agriculture Farm Records`: farm income, received, pending, expenses, and profit/loss.
- `Farm Manager`: broader farm profile/activity records.
- `Backup & Restore`: current backup records, but it lacks dependency-chain fields required by the new restore workflow.
- `Summary`, `Dashboard`, `Net Worth`: derived/reporting sheets.

Protected sheets that must remain in use:

- `Chitty`
- `Trading`
- `Market Pulse`
- `Portfolio`
- `Stocks`
- `Mutual Funds`

## Family Income Merge Finding

There are two visible Family Income home tiles in the current web UI:

- Route `salary-income`
- Route `family-income`

They map to different workbook sheets:

- `Salary & Income` appears to be structured payroll/income calculation data.
- `Family Income` appears to be generic income receivable tracking.

These should not be physically merged into one sheet without approval because they represent different record types and double-counting is possible. Recommended UI migration:

- Keep underlying sheets separate for compatibility.
- Create one visible `Family Income` tile.
- Add tabs:
  - Overview
  - Salary & Income
  - Bank, Cash & Savings
  - EPFO
  - Salary
  - Deductions
  - Rent
  - Agriculture
  - Other Income
- Use shared calculation selectors to include each record once by stable ID and category.
- Do not migrate or duplicate existing rows until overlap rules are approved.

## Master Ledger Dependency Finding

The visible `Master Ledger` tile routes to `entries`, which is backed by the `Entries` sheet and still has historical Lent/Debt, Chitty, and legacy fields. It is also used as a derived-all-records source in several dashboard/reporting flows.

Recommended migration before UI removal:

- Create a dependency map for every summary/report/export using `Entries`.
- Move formulas to domain modules: Lent, Chitty, Loan, Properties, Trading, Family Income.
- Keep `Entries` hidden/read-only during transition.
- Remove only the visible tile/navigation after reports reconcile.
- Do not delete the sheet until a full dependency report and backup are approved.

## Shared Formula Layer

Recommended server-side module: `services/financeCalculations.js`

Initial shared definitions:

- Gross Income = Salary + Rent + Agriculture + Other Income + applicable additional income
- Net Salary = Gross Salary - Salary Deductions
- Net Income = Total Income - Total Deductions
- Cash and Savings = Bank Balance + Cash Balance + Savings Balance
- EPFO Balance = Employee Contribution + Employer Contribution + Interest - Withdrawals
- Family Income Total = sum of eligible income categories by stable record ID, excluding duplicates

Consumers:

- Family Income overview
- Dashboard
- Net Worth
- Reports & Analytics
- Exports
- Google Sheets sync
- Local Excel sync
- Future Supabase sync
- Mobile APIs

## Backup Restore-Chain Design

Current backup discovery finds local/Drive workbook backup files, but the catalog lacks:

- Backup ID
- Full/incremental type
- Parent full-backup ID
- Previous incremental-backup ID
- Checksum
- Schema version
- Retention expiry
- Restore eligibility
- Restore audit log

Recommended non-destructive implementation:

- Add a backup catalog JSON/table first.
- Compute SHA-256 checksum for each backup.
- Classify existing backups as `Full` unless an incremental dependency is known.
- Disable restore for unknown incremental chains.
- Before restore, create a pre-restore full backup.
- Require `RESTORE` typed confirmation.
- Record restore job ID and append-only audit event.

Required warning text:

> An incremental backup cannot be restored independently. Select the corresponding full backup and every required incremental backup in chronological order.

## Google Sheets Synchronization Policy

Recommended initial policy from the request:

- Supabase is the transactional source of truth.
- Google Sheets is a synchronized reporting/editing interface.
- Every record uses a stable UUID.
- Non-conflicting changes use the latest valid `updated_at`.
- Conflicting financial changes are flagged for review instead of silently overwritten.

Confirmation needed: whether Google Sheets must remain the primary source of truth for this application.

## Supabase Implementation Stop Point

No Supabase schema, credential, RLS, sync-worker, or migration changes should be made until the owner provides the requested details and authorizes migrations.

Required details:

1. Supabase project URL
2. Supabase anonymous/public key
3. Confirmation that the service-role key will be configured only in secure backend environment variables
4. Existing Supabase schema, if any
5. Current authentication method
6. Whether existing users must be migrated
7. Google Sheets spreadsheet ID
8. Existing Google Sheet names and column structures
9. Whether Supabase or Google Sheets should be the primary source of truth
10. Preferred production and development environments
11. Whether database migrations are authorized
12. Confirmation that backups exist before migration

## Immediate Safe Work Completed Separately

The Google OAuth setup UI can be improved without Supabase or data migration. That work is independent from this migration plan.
