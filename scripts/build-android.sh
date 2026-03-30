#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
# shellcheck source=lib/android-gradle-helpers.sh
source "$ROOT_DIR/scripts/lib/android-gradle-helpers.sh"

# Modes:
#   ./scripts/build-android.sh clean              — Gradle clean only (safe preflight)
#   ./scripts/build-android.sh [apk|aab|both]     — release build (incremental-friendly)
#   ./scripts/build-android.sh [apk|aab|both] clean — deep reset, clean, then build

MODE="${1:-apk}"
CLEAN="${2:-}"

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Error: android directory not found at $ANDROID_DIR"
  exit 1
fi

if [[ "$MODE" != "apk" && "$MODE" != "aab" && "$MODE" != "both" && "$MODE" != "clean" ]]; then
  echo "Usage: ./scripts/build-android.sh [apk|aab|both|clean] [clean]"
  exit 1
fi

if [[ "$MODE" == "clean" ]]; then
  if [[ -n "$CLEAN" ]]; then
    echo "Usage: ./scripts/build-android.sh clean (no second argument)"
    exit 1
  fi
  android_prepare_native_clean_slate
  echo "Running Gradle clean..."
  (cd "$ANDROID_DIR" && ./gradlew clean)
  echo "Done."
  exit 0
fi

if [[ "$CLEAN" == "clean" ]]; then
  android_prepare_native_clean_slate
  echo "Running Gradle clean..."
  (cd "$ANDROID_DIR" && ./gradlew clean)
else
  android_prepare_incremental_build
  android_maybe_force_refresh_transforms
fi

cd "$ANDROID_DIR"

build_apk() {
  echo "Building release APK..."
  ./gradlew assembleRelease
  echo "APK output:"
  ls -1 "$ANDROID_DIR/app/build/outputs/apk/release" || true
}

build_aab() {
  echo "Building release AAB..."
  ./gradlew bundleRelease
  echo "AAB output:"
  ls -1 "$ANDROID_DIR/app/build/outputs/bundle/release" || true
}

case "$MODE" in
  apk)
    build_apk
    ;;
  aab)
    build_aab
    ;;
  both)
    build_apk
    build_aab
    ;;
esac

echo "Done."
