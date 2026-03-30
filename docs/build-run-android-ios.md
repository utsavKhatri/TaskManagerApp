# Build and Run Instructions (Android/iOS)

## Prerequisites

- Node.js 20+
- npm
- Java + Android SDK + emulator/device setup
- Xcode + iOS Simulator (macOS only)
- Ruby + Bundler + CocoaPods for iOS pods

## 1) Install JS Dependencies

```sh
npm install
```

## 2) Configure Environment

```sh
cp .env.example .env
```

Fill:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 3) iOS Native Setup

```sh
bundle install
bundle exec pod install --project-directory=ios
```

Run this at least once and again after native dependency changes.

## 4) Start Metro

```sh
npm run start
```

Keep Metro running in a separate terminal.

## 5) Run on Android

```sh
npm run android
```

Optional:

- Release APK/AAB build pipeline entry: `npm run android-build`
- Clean Gradle output: `npm run android-clean`

## 6) Run on iOS

```sh
npm run ios
```

For release/archive builds, use Xcode archive flow.

## Troubleshooting Notes

- If iOS build fails after native package changes, rerun pod install.
- If Metro cache issues occur, restart Metro and rebuild app.
- Verify `.env` values exist before debugging auth/network failures.
