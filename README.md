# Smart Fin 365

Plan Smart. Live Better..

A finance website for recording debt, loans, property, trading, dashboard, and synced Excel records. Every saved record is written to the finance workbook in this folder.

## Run

```powershell
npm.cmd install
npm.cmd start
```

Open:

```text
http://localhost:3333
```

Use **Download Excel** in the website to download the current workbook.

## Mobile and Always-On Access

On the same Wi-Fi network, open the LAN URL shown in the server log, for example:

```text
http://192.168.0.6:3333
```

That LAN URL works only while this computer is powered on. To access the tracker after the laptop shuts down, deploy it to an always-on Node.js host with protected persistent storage. See `PRODUCTION_DEPLOYMENT.md`.

Create the provider-neutral Node.js package with `npm.cmd run package:production`. It produces `deployment-zips/smart-fin-365-node-production.zip` without private workbooks or secrets. Keep GoDaddy DNS unchanged until the selected host has passed the production checklist in `PRODUCTION_DEPLOYMENT.md`.

Android/iOS wrapper projects and install notes are in `MOBILE_APPS.md`.

## Google Drive Sync

Option 1: install and sign in to Google Drive for Desktop. In the website, paste the Excel path from your synced drive folder into **Google Drive Excel Path**, for example:

```text
G:\My Drive\Finance_Records.xlsx
```

Click **Use This Excel File**. If that file does not exist yet, the app copies the current workbook there. After that, every new website entry is saved directly into the Excel file inside Google Drive, and Google Drive Desktop syncs it to the cloud.

Option 2: use Google Drive API upload to this folder:

```text
https://drive.google.com/drive/folders/11J5-NCSvx4dgCaZ1JwY5HIlcmlB2-a6v
```

Create a Google Cloud OAuth client for a **Web application** with this authorized redirect URI:

```text
http://localhost:3333/oauth2callback
```

Enable the Google Drive API in that Google Cloud project. Configure the OAuth Client ID and Client Secret privately on the server, for example with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables. The website only asks for the Gmail address as a sign-in hint. The Gmail password must be entered on Google's own sign-in page, never inside this app. After connection, website entries save locally and upload the Excel file to the Drive folder.

You can also paste the OAuth Client ID and Client Secret into the website's Google Drive panel, save the Gmail address, then click **Connect Gmail**. After Gmail is connected, each finance or property save uploads the Excel workbook to the provided Drive folder automatically.

## Data Stored

The Excel workbook contains:

- `Entries`: every record submitted from the website
- `Debts`: debt given and debt cleared records
- `Chitty`: chitty paid and chitty received records
- `Properties`: land/property details
- `Summary`: totals for debt, chitty balances, and the 24% yearly debt value
