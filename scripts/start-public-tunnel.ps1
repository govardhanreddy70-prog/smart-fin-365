param(
  [switch]$OpenStatusPage,
  [switch]$SkipServerConfigUpdate
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$tunnelDir = Join-Path $root "work\public-tunnel"
$cloudflared = Join-Path $tunnelDir "cloudflared.exe"
$outLog = Join-Path $tunnelDir "cloudflared.out.log"
$errLog = Join-Path $tunnelDir "cloudflared.err.log"
$pidFile = Join-Path $tunnelDir "cloudflared.pid"
$urlFile = Join-Path $tunnelDir "latest-public-url.txt"
$statusPage = Join-Path $tunnelDir "latest-public-url.html"
$loginFile = Join-Path $root "work\public-url-login.txt"

function Get-SavedPassword {
  if (-not (Test-Path -LiteralPath $loginFile)) { return "" }
  $line = Get-Content -LiteralPath $loginFile | Where-Object { $_ -like "Password:*" } | Select-Object -First 1
  return ($line -replace "^Password:\s*", "").Trim()
}

function Ensure-Cloudflared {
  New-Item -ItemType Directory -Force -Path $tunnelDir | Out-Null
  if (Test-Path -LiteralPath $cloudflared) { return }
  Invoke-WebRequest -UseBasicParsing -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflared -TimeoutSec 180
}

function Ensure-FinanceServer {
  $password = Get-SavedPassword
  if ($password) {
    $env:FINANCE_WEB_USER = "admin"
    $env:FINANCE_WEB_PASSWORD = $password
  }

  $status = cmd /c pm2 jlist 2>$null
  $isKnown = $false
  $isOnline = $false
  try {
    $items = $status | ConvertFrom-Json
    $app = $items | Where-Object { $_.name -eq "finance-excel-tracker" } | Select-Object -First 1
    $isKnown = [bool]$app
    $isOnline = $app.pm2_env.status -eq "online"
  } catch {}

  if ($isOnline) { return }
  if ($isKnown) {
    cmd /c pm2 start finance-excel-tracker --update-env | Out-String | Write-Host
  } else {
    Push-Location $root
    try {
      cmd /c pm2 start server.js --name finance-excel-tracker --update-env | Out-String | Write-Host
    } finally {
      Pop-Location
    }
  }

  for ($attempt = 1; $attempt -le 20; $attempt++) {
    try {
      $health = Invoke-WebRequest -UseBasicParsing "http://localhost:3333/healthz" -TimeoutSec 3
      if ($health.StatusCode -eq 200) { return }
    } catch {}
    Start-Sleep -Seconds 1
  }
  throw "Finance server did not become reachable on http://localhost:3333."
}

function Stop-OldTunnel {
  if (Test-Path -LiteralPath $pidFile) {
    $oldPid = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($oldPid -and (Get-Process -Id ([int]$oldPid) -ErrorAction SilentlyContinue)) {
      Stop-Process -Id ([int]$oldPid) -Force
    }
  }
}

function Start-Tunnel {
  Remove-Item -LiteralPath $outLog,$errLog -Force -ErrorAction SilentlyContinue
  $process = Start-Process -FilePath $cloudflared `
    -ArgumentList @("tunnel", "--url", "http://localhost:3333", "--no-autoupdate") `
    -WorkingDirectory $tunnelDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru
  Set-Content -LiteralPath $pidFile -Value $process.Id -Encoding ASCII
  return $process
}

function Wait-ForTunnelUrl {
  for ($attempt = 1; $attempt -le 45; $attempt++) {
    $combined = @()
    if (Test-Path -LiteralPath $outLog) { $combined += Get-Content -LiteralPath $outLog -ErrorAction SilentlyContinue }
    if (Test-Path -LiteralPath $errLog) { $combined += Get-Content -LiteralPath $errLog -ErrorAction SilentlyContinue }
    $match = ($combined | Select-String -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -First 1).Matches.Value
    if ($match) { return $match.TrimEnd("/") }
    Start-Sleep -Seconds 1
  }
  throw "Cloudflare tunnel did not return a public URL. Check $errLog."
}

function Write-StatusPage([string]$PublicUrl) {
  Set-Content -LiteralPath $urlFile -Value $PublicUrl -Encoding UTF8
  $html = @"
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Smart Fin 365 Public URL</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #eef4f8; color: #18212f; }
      main { width: min(680px, calc(100% - 32px)); background: #fff; border: 1px solid #d8dee8; border-radius: 10px; padding: 28px; box-shadow: 0 18px 50px rgba(20,34,58,.12); }
      h1 { margin: 0 0 12px; }
      a { color: #146c43; font-weight: 800; overflow-wrap: anywhere; }
      code { background: #f4f7fb; padding: 3px 6px; border-radius: 5px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Smart Fin 365 Public URL</h1>
      <p>Current tunnel URL:</p>
      <p><a href="$PublicUrl">$PublicUrl</a></p>
      <p>Use username <code>admin</code> and your current app password.</p>
      <p>This quick tunnel URL is recreated when the laptop restarts. For one fixed URL, use a Cloudflare named tunnel/custom domain or cloud hosting.</p>
    </main>
  </body>
</html>
"@
  Set-Content -LiteralPath $statusPage -Value $html -Encoding UTF8
}

Ensure-Cloudflared
Ensure-FinanceServer
Stop-OldTunnel
$process = Start-Tunnel
$publicUrl = Wait-ForTunnelUrl
Write-StatusPage $publicUrl

if (-not $SkipServerConfigUpdate) {
  powershell.exe -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "configure-public-url.ps1") -PublicUrl $publicUrl | Out-String | Write-Host
}

Write-Host "Public URL: $publicUrl"
Write-Host "Tunnel PID: $($process.Id)"
Write-Host "Status page: $statusPage"

if ($OpenStatusPage) {
  Start-Process $statusPage
}
