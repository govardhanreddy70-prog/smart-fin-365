# Smart Fin 365 API Notes

Base production URL:

```text
https://smartfin365.com
```

All `/api/*` routes require an authenticated Smart Fin 365 session unless marked public by the server.

## Password Recovery

`POST /api/auth/forgot-password/request`

Body:

```json
{ "identifier": "user@example.com" }
```

Uses Supabase Auth email recovery when `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are configured. The reset link redirects to `/reset-password`. SMS/OTP is not required for Forgot Password.

## Tax Planner Advisory

`GET /api/tax-advisory`

Returns old-regime and new-regime estimates, recommended regime, detected deductions/exemptions, and income basis from the current workbook.

Detected items include `80C`, `80CCD`, `80D`, `Home Loan`, `Education Loan`, `HRA`, `LTA`, `Capital Gains`, and `Eligible Exemptions`.

## Support Tickets

`POST /api/support-tickets`

Body:

```json
{
  "name": "User Name",
  "email": "user@example.com",
  "mobile": "9739564234",
  "issueType": "Synchronization",
  "priority": "High",
  "description": "Issue details",
  "attachmentName": "screenshot.png",
  "attachmentSize": 12345
}
```

Creates a local support ticket and returns the ticket ID. Support email is `support@smartfin365.com`.

## Subscription Plans

`GET /api/subscription/plans`

Returns Free and Premium plan metadata. Premium is `Rs. 100/month` or `Rs. 1000/year` and unlocks Advanced Reports, Reports & Analytics, AI, Backup & Restore, Net Worth, Export Centre, and Family Dashboard.

## Trading

`GET /api/upstox/status`

Returns saved trading token status and last successful broker synchronization.

`POST /api/upstox/settings`

Stores the current Upstox token on the server. The UI is broker-ready for Upstox, Zerodha, and Dhan; live sync currently uses the Upstox API adapter until additional broker adapters are configured.

`POST /api/upstox/sync`

Synchronizes trading data with the configured Upstox account, then updates workbook-derived trading records.

## Google OAuth and Drive Sync

`GET /api/google-drive`

Returns Google Drive status, the exact `redirectUri`, configured scope list, credential state, and sync status. It never returns the OAuth Client Secret, access token, or refresh token.

`POST /api/google-drive/settings`

Stores the OAuth Client ID and OAuth Client Secret on the backend. Newly saved secrets are encrypted at rest using `GOOGLE_CONFIG_ENCRYPTION_KEY` or a generated local key in the ignored `work` folder.

`GET /auth/google`

Starts the server-side OAuth authorization-code flow with CSRF `state`, offline access, and consent prompt.

`GET /oauth2callback`

Validates OAuth `state`, exchanges the authorization code using the configured redirect URI, stores Google tokens only on the backend, and uploads/syncs the workbook if connected.

Requested scopes:

```text
https://www.googleapis.com/auth/drive.file
https://www.googleapis.com/auth/spreadsheets
openid
email
profile
```

`https://www.googleapis.com/auth/gmail.send` is requested only when `GOOGLE_ENABLE_GMAIL_SEND=true`.
