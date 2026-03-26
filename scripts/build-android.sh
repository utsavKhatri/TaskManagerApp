#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"

MODE="${1:-apk}" # apk | aab | both
CLEAN="${2:-}"   # clean (optional)

if [[ ! -d "$ANDROID_DIR" ]]; then
  echo "Error: android directory not found at $ANDROID_DIR"
  exit 1
fi

if [[ "$MODE" != "apk" && "$MODE" != "aab" && "$MODE" != "both" ]]; then
  echo "Usage: ./scripts/build-android.sh [apk|aab|both] [clean]"
  exit 1
fi

cd "$ANDROID_DIR"

if [[ "$CLEAN" == "clean" ]]; then
  echo "Cleaning Android build..."
  ./gradlew clean
fi

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
