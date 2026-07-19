# Smart Fin 365 Supabase Architecture

Smart Fin 365 keeps the existing Google Sheets / Excel template as the master data model and maps worksheet rows into Supabase using a generic, RLS-protected record model.

## Required Environment

Set these only on the server:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
AUTH_OTP_ENABLED=false
```

Never place the service role key in frontend code, Excel, Google Sheets, APK, iOS project, or public hosting files.

## Database Initialization

Run:

```sql
supabase/migrations/001_smart_fin_365_rls.sql
```

This creates:

- `profiles`
- `user_sheets`
- `worksheet_definitions`
- `finance_records`
- `sync_changes`
- `audit_log`
- `backups`
- `subscriptions`
- `support_tickets`
- `user_security_settings`

RLS is enabled on every user data table. Users can only read/write rows where `user_id = auth.uid()`. Admin access is controlled through `profiles.role = 'admin'`.

## Worksheet Mapping

The app exposes `/api/supabase/schema-blueprint` for the current worksheet-to-column mapping. Future worksheets can be added to the master Google Sheet and registered in `worksheet_definitions` without rewriting finance calculations.

## User Provisioning

During registration, Smart Fin 365 creates a local user profile and records a pending `googleSheet` provisioning object. Once Google OAuth is configured, the provisioning worker should:

1. Copy the master Google Sheet template.
2. Store the new Google Sheet ID in `profiles.google_sheet_id` and `user_sheets.google_sheet_id`.
3. Read worksheet names and headers.
4. Upsert worksheet metadata into `worksheet_definitions`.
5. Initialize empty `finance_records` rows only when required.
6. Queue delta sync records in `sync_changes`.

## Sync Rules

- Smart Fin 365 changes create delta sync entries.
- Google Sheet changes sync back by comparing row hashes and timestamps.
- Active browser edits are not overwritten.
- New worksheet columns are detected and stored in `worksheet_definitions.columns`.
- Existing Excel/Google Drive workbook calculations are preserved until each user sheet is fully provisioned.

## Authentication

OTP is disabled. Active login flow:

1. Email/mobile + password.
2. One configured second factor.
3. MPIN setup is required when no second factor exists.
4. WebAuthn biometric methods can be enabled only after credentials exist.

