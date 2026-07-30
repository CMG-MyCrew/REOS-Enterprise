#!/usr/bin/env bash

RUN_ID=""
RUN_LOG=""
RUN_REPORT=""
REOS_UI_DRY_RUN="${REOS_UI_DRY_RUN:-0}"

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

log() {
  local message="$*"

  if [[ -n "${RUN_LOG:-}" ]]; then
    printf '[%s] %s\n' "$(timestamp)" "$message" | tee -a "$RUN_LOG"
  else
    printf '[%s] %s\n' "$(timestamp)" "$message"
  fi
}

die() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 ||
    die "Required command not found: $1"
}

initialize_run() {
  RUN_ID="$(date '+%Y%m%d-%H%M%S')"

  mkdir -p "$LOG_ROOT" "$REPORT_ROOT"

  RUN_LOG="$LOG_ROOT/reos-ui-$RUN_ID.log"
  RUN_REPORT="$REPORT_ROOT/reos-ui-$RUN_ID.json"

  : > "$RUN_LOG"

  log "REOS UI pipeline initialized"
  log "Run ID: $RUN_ID"
  log "REOS root: $REOS_ROOT"

  if [[ "$REOS_UI_DRY_RUN" -eq 1 ]]; then
    log "Mode: DRY-RUN"
  else
    log "Mode: LIVE"
  fi
}

backup_file() {
  local file="$1"

  [[ "${CREATE_BACKUPS:-1}" -eq 1 ]] || return 0
  [[ -f "$file" ]] || return 0

  local backup="${file}.reos-ui-backup-${RUN_ID}"

  if [[ "$REOS_UI_DRY_RUN" -eq 1 ]]; then
    log "[DRY-RUN] Would back up: $file"
    return 0
  fi

  cp "$file" "$backup"
  log "Backup created: $backup"
}

finalize_run() {
  local status="$1"

  if [[ "$REOS_UI_DRY_RUN" -eq 1 ]]; then
    log "Dry run completed"
    return 0
  fi

  python3 - \
    "$RUN_REPORT" \
    "$RUN_ID" \
    "$status" \
    "$REOS_ROOT" \
    "$RUN_LOG" <<'PY'
from pathlib import Path
import json
import sys

report_file, run_id, status, root, log_file = sys.argv[1:]

payload = {
    "runId": run_id,
    "status": status,
    "reosRoot": root,
    "logFile": log_file,
}

Path(report_file).write_text(
    json.dumps(payload, indent=2) + "\n",
    encoding="utf-8",
)
PY

  log "Report: $RUN_REPORT"
  log "Pipeline status: $status"
}

run_or_preview() {
  if [[ "$REOS_UI_DRY_RUN" -eq 1 ]]; then
    log "[DRY-RUN] $*"
  else
    log "RUN: $*"
    "$@"
  fi
}
