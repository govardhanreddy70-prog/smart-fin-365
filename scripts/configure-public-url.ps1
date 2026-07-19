param(
  [Parameter(Mandatory = $true)]
  [string]$PublicUrl,

  [string[]]$FallbackUrl = @(
    "http://192.168.0.5:3333",
    "http://192.168.0.6:3333",
    "http://192.168.0.7:3333",
    "http://172.20.10.2:3333",
    "http://172.20.10.3:3333"
  )
)

$ErrorActionPreference = "Stop"

function Normalize-ServerUrl([string]$Value) {
  $raw = if ($null -eq $Value) { "" } else { $Value }
  $trimmed = $raw.Trim().TrimEnd("/")
  if (-not $trimmed) { return "" }
  if ($trimmed -notmatch "^https?://") { return "https://$trimmed" }
  return $trimmed
}

$normalizedPublicUrl = Normalize-ServerUrl $PublicUrl
if (-not $normalizedPublicUrl) {
  throw "PublicUrl cannot be empty."
}

$normalizedFallbacks = $FallbackUrl |
  ForEach-Object { Normalize-ServerUrl $_ } |
  Where-Object { $_ } |
  Select-Object -Unique

$config = [ordered]@{
  publicUrl = $normalizedPublicUrl
  fallbackUrls = @($normalizedFallbacks)
  autoProbe = $true
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$configPath = Join-Path $projectRoot "public\server-config.js"
$json = $config | ConvertTo-Json -Depth 4
Set-Content -LiteralPath $configPath -Value "window.FINANCE_SERVER_CONFIG = $json;" -Encoding UTF8

Write-Host "Configured mobile/public server URL:"
Write-Host "  $normalizedPublicUrl"
Write-Host ""
Write-Host "For mobile builds in this PowerShell session, run:"
Write-Host "  `$env:FINANCE_PUBLIC_URL = '$normalizedPublicUrl'"
Write-Host "  npm.cmd run android:sync"
Write-Host "  npm.cmd run ios:sync"
