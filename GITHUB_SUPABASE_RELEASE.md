# GitHub to Supabase Release Gate

Repository: `govardhanreddy70-prog/smart-fin-365`

This repository contains a protected GitHub Actions workflow at `.github/workflows/supabase-migrations.yml`. A normal push or pull request validates migration source only. It does not access or modify Supabase.

## One-Time GitHub Configuration

1. In the repository, protect `main` and require pull-request review for migration changes.
2. Create a GitHub Environment named `supabase-production`.
3. Configure required reviewers for that environment. Do not allow self-review for production migration approval.
4. Add these Environment secrets; never place them in repository files:

   ```text
   SUPABASE_ACCESS_TOKEN=<Supabase personal access token>
   SUPABASE_DB_PASSWORD=<production database password>
   ```

5. Add this Environment variable:

   ```text
   SUPABASE_PROJECT_REF=himgtvlurzamjfoaoaqm
   ```

`SUPABASE_ACCESS_TOKEN` is used by the Supabase CLI for the Management APIs, and `SUPABASE_DB_PASSWORD` is required by CLI commands that link and push to a remote database. Do not use the public publishable key or the server service-role key for this CI authentication.

## Required Release Gate

Before a production workflow run:

1. Review `SUPABASE_SCHEMA_AND_RLS_PROPOSAL.md` and the migration SQL.
2. Verify a restorable production backup or point-in-time recovery reference.
3. Apply and test the migrations against a separate development Supabase project or branch.
4. Record the development test result.
5. Obtain explicit approval for the production database write.

Only then start **Supabase Migration Safety Gate** manually from GitHub Actions and provide:

```text
apply_production: true
backup_reference: <verified backup or PITR reference>
development_test_reference: <development test result>
confirmation: APPLY_PRODUCTION_MIGRATIONS
```

The GitHub Environment approval and the exact confirmation are both required before `supabase db push` can run. The workflow runs a dry run first, then writes only the tracked migration files. It never resets, truncates, or deletes production data.

## What Has Not Happened

No Supabase credential was added to GitHub, no GitHub Environment was created, and no migration was applied. Those are protected account-level actions that must be configured by the project administrator.
