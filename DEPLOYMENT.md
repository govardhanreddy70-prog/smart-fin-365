# Deployment Overview

Smart Fin 365 is a Node.js service, not a static website. Run it on an always-on Node.js-capable hosting provider with protected persistent storage for the workbook, configuration, logs, and backup archive.

The canonical deployment runbook is [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md). It documents environment variables, build/start commands, health checks, Supabase migration approval, backup retention, persistent volumes, and the post-deployment test checklist.

Use local development values only on a developer machine:

```text
PUBLIC_APP_URL=http://localhost:3333
GOOGLE_REDIRECT_URI=http://localhost:3333/oauth2callback
```

Use the planned public values only after the selected host is ready and deployment is approved:

```text
PUBLIC_APP_URL=https://smartfin365.com
GOOGLE_REDIRECT_URI=https://smartfin365.com/oauth2callback
```

No DNS update or public deployment is performed by this repository or guide.
