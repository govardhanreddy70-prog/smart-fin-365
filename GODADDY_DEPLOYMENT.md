# GoDaddy Domain Preparation

`smartfin365.com` remains registered with GoDaddy and currently serves the GoDaddy Launching Soon page. This project has **not** been deployed to that domain and this guide does not instruct any DNS changes.

Smart Fin 365 requires a Node.js-capable hosting provider with protected persistent storage. GoDaddy Website Builder pages cannot run the Express server, protected API routes, Supabase integration, Excel/Google Sheets synchronization, or Backup & Restore workflow.

Use the provider-neutral package:

```text
deployment-zips/smart-fin-365-node-production.zip
```

Complete the Supabase migration approval and production security test checklist in [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) first. After a Node.js hosting target has been selected and tested, update GoDaddy DNS only with explicit deployment approval.

Required eventual production URLs:

```text
PUBLIC_APP_URL=https://smartfin365.com
GOOGLE_REDIRECT_URI=https://smartfin365.com/oauth2callback
```

For local development only:

```text
PUBLIC_APP_URL=http://localhost:3333
GOOGLE_REDIRECT_URI=http://localhost:3333/oauth2callback
```
