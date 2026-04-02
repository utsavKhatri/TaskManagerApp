# TaskManagerApp

TaskManagerApp is a React Native mobile app with Supabase authentication and data storage. It supports task creation, filtering, soft delete, drag-and-drop ordering, and category management.

## Quick Navigation

- **Demo video (screen recording):** [`docs/demo/app-demo-2026-04-02.mp4`](docs/demo/app-demo-2026-04-02.mp4) — see [`docs/demo.md`](docs/demo.md) for notes
- Docs index: [`docs/README.md`](docs/README.md)
- Supabase setup and RLS: [`docs/supabase-setup-guide.md`](docs/supabase-setup-guide.md)
- Authentication flow: [`docs/authentication-flow.md`](docs/authentication-flow.md)
- CRUD and data flow: [`docs/crud-data-flow.md`](docs/crud-data-flow.md)
- Build and run (Android/iOS): [`docs/build-run-android-ios.md`](docs/build-run-android-ios.md)
- Architecture decisions: [`docs/architecture-decisions.md`](docs/architecture-decisions.md)
- Error handling strategy: [`docs/error-handling-strategy.md`](docs/error-handling-strategy.md)
- Optimistic UI approach: [`docs/optimistic-ui-approach.md`](docs/optimistic-ui-approach.md)

## Quick Start

1. Install dependencies:

```sh
npm install
```

2. Configure environment:

```sh
cp .env.example .env
```

3. Set values in `.env`:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

4. Start Metro:

```sh
npm run start
```

5. Run app:

- Android: `npm run android`
- iOS: `npm run ios`

## Full Setup and Build

For complete platform setup, troubleshooting, and build instructions:

- [`docs/build-run-android-ios.md`](docs/build-run-android-ios.md)

## Project Stack

- React Native 0.83
- React 19
- TypeScript
- Supabase (`@supabase/supabase-js`)
- TanStack Query (`@tanstack/react-query`)
- React Navigation

## Prerequisites (Summary)

- Node.js 20+
- npm 10+
- Xcode (for iOS)
- Android Studio + Android SDK (for Android)
- Ruby + Bundler + CocoaPods (for iOS native dependencies)

## Build Commands

- Android release build: `npm run android-build`
- Android clean: `npm run android-clean`

iOS release builds are typically created from Xcode using archive/export workflows.

## Lint and Format

- Lint: `npm run lint`
- Format: `npm run format`

## Documentation

Use [`docs/README.md`](docs/README.md) as the main index for all project documentation.
