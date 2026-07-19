$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = Join-Path $root "work\mobile-tools\jdk-21\jdk-21.0.11+10"
$env:ANDROID_HOME = Join-Path $root "work\mobile-tools\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

$buildTools = Join-Path $env:ANDROID_HOME "build-tools\36.0.0"
$zipalign = Join-Path $buildTools "zipalign.exe"
$apksigner = Join-Path $buildTools "apksigner.bat"
$keystore = Join-Path $root "work\mobile-signing\finance-records-release.jks"
$passwordFile = Join-Path $root "work\mobile-signing\keystore-password.txt"
$storePass = (Get-Content -LiteralPath $passwordFile -Raw).Trim()
$outDir = Join-Path $root "mobile-builds"
$unsignedApk = Join-Path $root "android\app\build\outputs\apk\release\app-release-unsigned.apk"
$alignedApk = Join-Path $outDir "Smart-Fin-365-Android-release-aligned.apk"
$signedApk = Join-Path $outDir "Smart-Fin-365-Android-release.apk"

Push-Location $root
try {
  npm.cmd run android:sync
  Push-Location (Join-Path $root "android")
  try {
    .\gradlew.bat assembleRelease
  } finally {
    Pop-Location
  }

  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  & $zipalign -p -f 4 $unsignedApk $alignedApk
  & $apksigner sign `
    --ks $keystore `
    --ks-key-alias "finance-records" `
    --ks-pass "pass:$storePass" `
    --key-pass "pass:$storePass" `
    --out $signedApk `
    $alignedApk
  & $apksigner verify --verbose --print-certs $signedApk
  Remove-Item -LiteralPath $alignedApk -Force -ErrorAction SilentlyContinue
  Write-Host "Release APK ready: $signedApk"
} finally {
  Pop-Location
}
