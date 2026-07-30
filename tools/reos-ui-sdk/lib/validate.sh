#!/usr/bin/env bash

validate_tools() {
  log "Validating required commands"

  require_command bash
  require_command python3
  require_command rsync
  require_command grep
  require_command find
}

validate_paths() {
  log "Validating project paths"

  [[ -d "$REOS_ROOT" ]] ||
    die "REOS root does not exist: $REOS_ROOT"

  [[ -d "$SDK_ROOT" ]] ||
    die "SDK root does not exist: $SDK_ROOT"

  [[ -d "$UI_TEMPLATE_ROOT" ]] ||
    die "UI template root does not exist: $UI_TEMPLATE_ROOT"
}

validate_shell_scripts() {
  log "Validating shell syntax"

  bash -n "$SDK_ROOT/reos-ui"

  local script

  for script in "$SDK_ROOT"/lib/*.sh; do
    bash -n "$script"
  done

  bash -n "$BRAND_SYNC_SCRIPT"
}

validate_brand_json() {
  local config_file="$CONFIG_ROOT/brand.json"

  if [[ "$REOS_UI_DRY_RUN" -eq 1 && ! -f "$config_file" ]]; then
    log "[DRY-RUN] brand.json will be generated during live build"
    return 0
  fi

  [[ -f "$config_file" ]] ||
    die "Missing brand configuration: $config_file"

  python3 - "$config_file" <<'PY'
from pathlib import Path
import json
import sys

path = Path(sys.argv[1])
data = json.loads(path.read_text(encoding="utf-8"))

required = [
    "brand",
    "contact",
    "logos",
    "templates",
]

missing = [
    key
    for key in required
    if key not in data
]

if missing:
    raise SystemExit(
        "brand.json is missing keys: "
        + ", ".join(missing)
    )
PY

  log "Brand configuration is valid"
}

validate_html_includes() {
  log "Validating HTML includes"

  local basename
  local html_file
  local failures=0

  for basename in $HTML_ENTRY_FILES; do
    html_file="$HTML_ROOT/$basename"

    [[ -f "$html_file" ]] || continue

    grep -Fq \
      "<?!= include('BrandStyles'); ?>" \
      "$html_file" || {
        log "Missing BrandStyles include: $html_file"
        failures=1
      }

    grep -Fq \
      "<?!= include('BrandTheme'); ?>" \
      "$html_file" || {
        log "Missing BrandTheme include: $html_file"
        failures=1
      }
  done

  if [[ "$failures" -eq 1 ]]; then
    if [[ "$REOS_UI_DRY_RUN" -eq 1 ]]; then
      log "[DRY-RUN] Missing includes would be injected"
    elif [[ "${STRICT_VALIDATION:-1}" -eq 1 ]]; then
      die "HTML include validation failed"
    fi
  fi
}

validate_generated_files() {
  [[ "$REOS_UI_DRY_RUN" -eq 1 ]] && return 0

  local required_files=(
    "$HTML_ROOT/BrandStyles.html"
    "$HTML_ROOT/BrandTheme.html"
    "$SRC_ROOT/BrandUi.gs"
    "$SRC_ROOT/BrandConfig.generated.gs"
    "$CONFIG_ROOT/brand.json"
  )

  local file

  for file in "${required_files[@]}"; do
    [[ -f "$file" ]] ||
      die "Required generated file is missing: $file"
  done

  log "Generated files are present"
}

validate_template_rendering() {
  log "Checking Apps Script HTML rendering"

  local gs_file
  local failures=0

  while IFS= read -r -d '' gs_file; do
    if grep -Eq "createHtmlOutputFromFile[[:space:]]*\\([[:space:]]*['\"][^'\"]+['\"][[:space:]]*\\)" "$gs_file"; then
      log "WARNING: Static HTML entry-point rendering found: $gs_file"
      log "Use createTemplateFromFile(...).evaluate() for pages containing server-side includes"
      failures=1
    fi
  done < <(
    find "$SRC_ROOT" -type f -name '*.gs' -print0 2>/dev/null
  )

  if [[ "$failures" -eq 1 && "${STRICT_VALIDATION:-1}" -eq 1 ]]; then
    log "WARNING: Template-rendering validation needs attention"
  fi
}

validate_all() {
  validate_tools
  validate_paths
  validate_shell_scripts
  validate_brand_json
  validate_html_includes
  validate_generated_files
  validate_template_rendering

  log "Validation completed"
}
