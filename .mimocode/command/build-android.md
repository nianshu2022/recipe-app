---
description: Build Android APK via Capacitor: typecheck, Vite build, Gradle release, and copy versioned APK to dist/
---

# Build Android APK Command

Build a release APK for the Android app using Capacitor + Gradle.

## Steps

1. **Build web assets and sync to Android**:
   ```bash
   cd "d:/project/nianshu/recipe-app" && npm run build:android 2>&1
   ```
   This runs `tsc -b && vite build && npx cap sync android`.

2. **Read current version from build.gradle**:
   ```powershell
   $gradle = Get-Content "android\app\build.gradle" -Raw
   $version = [regex]::Match($gradle, 'versionName\s+"([^"]+)"').Groups[1].Value
   Write-Host "Version: $version"
   ```

3. **Build release APK**:
   ```powershell
   cd "d:\project\nianshu\recipe-app\android" && .\gradlew.bat assembleRelease
   ```

4. **Copy APK to dist/ with versioned name**:
   ```powershell
   $src = "android\app\build\outputs\apk\release\app-release.apk"
   $dest = "dist\zhivei-$version-android-arm64-release.apk"
   Copy-Item $src $dest -Force
   Write-Host "APK saved: $dest"
   ```

## Usage

Run `$ARGUMENTS` to execute. Modes:
- `build` — full build + copy APK (default)
- `no-sync` — skip `cap sync`, just gradle build + copy (for quick rebuilds after web-only changes)

## Notes

- Version is defined in `android/app/build.gradle` (`versionName`)
- APK output: `android/app/build/outputs/apk/release/app-release.apk`
- Target: `dist/zhivei-{version}-android-arm64-release.apk`
- Requires: JDK 17+, Android SDK (via Android Studio or cmdline-tools)
- **Version must be updated in 4 places** for a release: `build.gradle` versionName, `build.gradle` versionCode, `src/utils/updater.ts` currentVersion, `src/pages/settings/SettingsPage.tsx` version display
