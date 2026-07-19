$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = Join-Path $root "work\mobile-tools\jdk-21\jdk-21.0.11+10"
$env:ANDROID_HOME = Join-Path $root "work\mobile-tools\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Push-Location $root
try {
  npm.cmd run android:debug
  $outDir = Join-Path $root "mobile-builds"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  Copy-Item -LiteralPath (Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk") -Destination (Join-Path $outDir "Smart-Fin-365-Android-debug.apk") -Force
  Write-Host "APK ready: $(Join-Path $outDir "Smart-Fin-365-Android-debug.apk")"
} finally {
  Pop-Location
}
