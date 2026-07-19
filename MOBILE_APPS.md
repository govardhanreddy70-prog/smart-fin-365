# Mobile App Builds

The mobile apps are Capacitor wrappers around the Smart Fin 365 web server.
The Android app includes an editable **Finance Server URL** field, so you can update the laptop/server IP address inside the app without rebuilding.

For reliable Android/iPhone access, use one stable HTTPS public URL. A local Wi-Fi IP can change; a public domain/tunnel URL should not.

Configure the public URL before syncing or building mobile apps:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\configure-public-url.ps1 -PublicUrl "https://smartfin365.com"
$env:FINANCE_PUBLIC_URL = "https://smartfin365.com"
npm.cmd run android:sync
```

On macOS for iPhone/iPad:

```bash
export FINANCE_PUBLIC_URL="https://smartfin365.com"
npm run ios:sync
```

When `FINANCE_PUBLIC_URL` is set during `cap sync`, the APK/iOS app opens that public URL directly. If it is not set, the bundled app tries the configured public URL from `public/server-config.js`, then the saved in-app URL, then known local fallback URLs.

Current default app URL:

```text
http://192.168.0.5:3333
```

That URL works only while the laptop/server is powered on. For use after the laptop shuts down, deploy the server to an always-on HTTPS URL first, then configure that hosted URL as shown above.

To rebuild after code changes:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\build-android-debug.ps1
```

## Android

Installable release APK:

```text
mobile-builds\Smart-Fin-365-Android-release.apk
```

This APK is locally signed, so Android may ask you to allow installing from unknown sources.

Debug APK:

```text
mobile-builds\Smart-Fin-365-Android-debug.apk
```

To rebuild:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\build-android-debug.ps1
```

To generate an Android App Bundle for Play Console:

```powershell
npm.cmd run android:bundle
```

Output after signing configuration is expected under:

```text
android\app\build\outputs\bundle\release\
```

## iPhone / iPad

The iOS project has been generated here:

```text
ios\App\App.xcodeproj
```

Packaged copy:

```text
mobile-builds\Smart-Fin-365-iOS-Xcode-project.zip
```

Direct iPhone Home Screen install profile:

```text
mobile-builds\Smart-Fin-365-iOS-WebClip.mobileconfig
```

An installable `.ipa` cannot be created on this Windows machine. Apple requires macOS, Xcode, and an Apple Developer signing certificate/profile to build and install an iOS app on iPhone/iPad.

On a Mac:

```bash
npm install
export FINANCE_APP_URL="https://your-public-finance-url.example.com"
npx cap sync ios
npx cap open ios
```

Then archive/sign from Xcode to create an `.ipa` or install directly on your device.

For the production Smart Fin 365 app, use:

```bash
export FINANCE_APP_URL="https://smartfin365.com"
npm run ios:archive
```
