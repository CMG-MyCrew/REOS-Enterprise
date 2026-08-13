#!/usr/bin/env bash

deploy_clasp() {
  if [[ "${ENABLE_CLASP_PUSH:-0}" -ne 1 ]]; then
    log "Clasp deployment disabled"
    return 0
  fi

  require_command clasp

  [[ -f "$REOS_ROOT/.clasp.json" ]] ||
    die "Missing clasp configuration: $REOS_ROOT/.clasp.json"

  local validator="$REOS_ROOT/scripts/validate-apps-script-build.sh"
  local apps_script_root="$REOS_ROOT/build/apps-script-brand"

  [[ -x "$validator" ]] ||
    die "Apps Script build validator is missing or not executable: $validator"

  log "Validating protected Apps Script build before clasp push"

  if [[ "${REOS_UI_DRY_RUN:-0}" -eq 1 ]]; then
    run_or_preview "$validator" "$apps_script_root"
  else
    "$validator" "$apps_script_root" ||
      die "Apps Script build validation failed. Clasp push blocked."
  fi

  log "Pushing Apps Script project with clasp"

  (
    cd "$REOS_ROOT"
    run_or_preview clasp push
  )
}

commit_git_changes() {
  if [[ "${ENABLE_GIT_COMMIT:-0}" -ne 1 ]]; then
    log "Automatic Git commit disabled"
    return 0
  fi

  require_command git

  (
    cd "$REOS_ROOT"

    git rev-parse --is-inside-work-tree >/dev/null 2>&1 ||
      die "REOS root is not a Git worktree"

    if [[ -z "$(git status --porcelain)" ]]; then
      log "No Git changes to commit"
      return 0
    fi

    run_or_preview git add \
      html/BrandStyles.html \
      html/BrandTheme.html \
      src/BrandUi.gs \
      src/BrandConfig.generated.gs \
      config/brand.json \
      branding/brand-assets-manifest.csv

    run_or_preview git commit \
      -m "$GIT_COMMIT_MESSAGE"
  )
}

deploy_optional_targets() {
  deploy_clasp
  commit_git_changes
}
