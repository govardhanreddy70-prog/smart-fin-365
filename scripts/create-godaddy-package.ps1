param(
  [string]$OutputPath = "deployment-zips\smart-fin-365-node-production.zip"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$stage = Join-Path $root "deployment-zips\node-production-app"
$zipPath = Join-Path $root $OutputPath

if (Test-Path -LiteralPath $stage) {
  Remove-Item -LiteralPath $stage -Recurse -Force
}

New-Item -ItemType Directory -Path $stage | Out-Null
New-Item -ItemType Directory -Path (Join-Path $stage "data") | Out-Null

$files = @(
  "server.js",
  "package.json",
  "package-lock.json",
  "README.md",
  "API_DOCUMENTATION.md",
  "PHASE1_ARCHITECTURE_AND_MIGRATION_PLAN.md",
  "SUPABASE_ARCHITECTURE.md",
  "SUPABASE_SCHEMA_AND_RLS_PROPOSAL.md",
  "GODADDY_DEPLOYMENT.md",
  "PRODUCTION_DEPLOYMENT.md",
  "Dockerfile",
  ".dockerignore",
  ".env.production.example",
  ".env.godaddy.example"
)

foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $root $file) -Destination (Join-Path $stage $file) -Force
}

Copy-Item -LiteralPath (Join-Path $root "public") -Destination (Join-Path $stage "public") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root "supabase") -Destination (Join-Path $stage "supabase") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $root "data\.gitkeep") -Destination (Join-Path $stage "data\.gitkeep") -Force

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

$zipDir = Split-Path -Parent $zipPath
if ($zipDir -and !(Test-Path -LiteralPath $zipDir)) {
  New-Item -ItemType Directory -Path $zipDir | Out-Null
}

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $zipPath -Force
Write-Host "Production Node.js package ready: $zipPath"
