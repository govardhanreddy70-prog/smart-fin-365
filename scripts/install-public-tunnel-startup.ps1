$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $PSScriptRoot "start-public-tunnel.ps1"
$taskName = "Smart Fin 365 Public Tunnel"
$powershell = (Get-Command powershell.exe).Source
$argument = "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Missing startup script: $scriptPath"
}

try {
  $action = New-ScheduledTaskAction -Execute $powershell -Argument $argument -WorkingDirectory $root
  $trigger = New-ScheduledTaskTrigger -AtLogOn
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Starts Smart Fin 365 local server and Cloudflare public tunnel at Windows sign-in." -Force | Out-Null
  Write-Host "Installed startup task: $taskName"
} catch {
  $startupFolder = [Environment]::GetFolderPath("Startup")
  $cmdPath = Join-Path $startupFolder "Smart Fin 365 Public Tunnel.cmd"
  $cmd = @"
@echo off
cd /d "$root"
start "" /min "$powershell" -NoProfile -ExecutionPolicy Bypass -File "$scriptPath"
"@
  Set-Content -LiteralPath $cmdPath -Value $cmd -Encoding ASCII
  Write-Host "Scheduled Task was not allowed, so installed Startup shortcut instead:"
  Write-Host "  $cmdPath"
}

Write-Host "Run now with:"
Write-Host "  powershell.exe -ExecutionPolicy Bypass -File `"$scriptPath`" -OpenStatusPage"
