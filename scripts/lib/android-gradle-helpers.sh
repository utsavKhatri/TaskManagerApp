# Shared Android / Gradle hygiene for this repo.
# Source from other scripts after setting ROOT_DIR to the repository root.
#
# Stale Gradle transform caches can break CMake with:
#   Imported target "ReactAndroid::jsi" includes non-existent path .../prefab/...
# That most often appears around ./gradlew clean or after failed native builds.
# Heavy cleanup runs only on clean paths (see build-android.sh), not every release build.

: "${ROOT_DIR:?ROOT_DIR must be set before sourcing android-gradle-helpers.sh}"

ANDROID_DIR="${ROOT_DIR}/android"
GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"

android__gradle_version_from_wrapper() {
  local props="$ANDROID_DIR/gradle/wrapper/gradle-wrapper.properties"
  [[ -f "$props" ]] || return 1
  sed -n 's/.*\/gradle-\([0-9][0-9.]*\)-[^/]*\.zip.*/\1/p' "$props" | head -1
}

android_gradle_stop() {
  if [[ ! -d "$ANDROID_DIR" ]]; then
    return 0
  fi
  (cd "$ANDROID_DIR" && ./gradlew --stop 2>/dev/null) || true
}

android_clear_gradle_transforms() {
  local ver
  ver="$(android__gradle_version_from_wrapper)" || return 0
  [[ -n "$ver" ]] || return 0
  local transforms="$GRADLE_USER_HOME/caches/${ver}/transforms"
  if [[ -d "$transforms" ]]; then
    echo ">>> Clearing Gradle ${ver} transforms cache (stale RN prefab paths)"
    rm -rf "$transforms"
  fi
}

android_clear_local_cmake() {
  rm -rf "$ANDROID_DIR/app/.cxx" 2>/dev/null || true
}

# Fast path for normal assemble/bundle (keeps Gradle transforms for incremental builds).
android_prepare_incremental_build() {
  android_gradle_stop
  android_clear_local_cmake
}

# When ANDROID_FORCE_REFRESH_TRANSFORMS=1, also nuke transforms on incremental builds.
android_maybe_force_refresh_transforms() {
  if [[ "${ANDROID_FORCE_REFRESH_TRANSFORMS:-}" == "1" ]]; then
    android_clear_gradle_transforms
  fi
}

# Full reset before gradlew clean / *:clean release builds — prevents prefab/CMake edge failures.
android_prepare_native_clean_slate() {
  android_gradle_stop
  android_clear_gradle_transforms
  android_clear_local_cmake
  echo ">>> Removing project Android build directories"
  rm -rf \
    "$ANDROID_DIR/app/build" \
    "$ANDROID_DIR/build" \
    "$ANDROID_DIR/.gradle" 2>/dev/null || true
}
