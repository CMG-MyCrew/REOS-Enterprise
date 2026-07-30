#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${REPO_ROOT}/.reos/deployment.env"
RESPONSE_FILE="/tmp/reos-production-response.html"
HEADER_FILE="/tmp/reos-production-headers.txt"

log() {
  printf '\n===== %s =====\n' "$1"
}

fail() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

trap 'printf "\nDeployment failed near line %s.\n" "$LINENO" >&2' ERR

cd "$REPO_ROOT"

command -v clasp >/dev/null 2>&1 ||
  fail "clasp is not installed or is not available in PATH."

command -v curl >/dev/null 2>&1 ||
  fail "curl is not installed."

[[ -f ".clasp.json" ]] ||
  fail ".clasp.json was not found in $REPO_ROOT."

[[ -f "$ENV_FILE" ]] ||
  fail "Deployment configuration was not found at $ENV_FILE."

# shellcheck disable=SC1090
source "$ENV_FILE"

: "${REOS_SCRIPT_ID:?REOS_SCRIPT_ID is missing}"
: "${REOS_DEPLOYMENT_ID:?REOS_DEPLOYMENT_ID is missing}"
: "${REOS_WEBAPP_URL:?REOS_WEBAPP_URL is missing}"

CONFIG_SCRIPT_ID="$(
  python3 - <<'PY'
import json
from pathlib import Path

config = json.loads(Path(".clasp.json").read_text())
print(config.get("scriptId", ""))
PY
)"

[[ "$CONFIG_SCRIPT_ID" == "$REOS_SCRIPT_ID" ]] ||
  fail "The .clasp.json Script ID does not match REOS_SCRIPT_ID."

TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"
RELEASE_DESCRIPTION="${1:-REOS Enterprise production release - ${TIMESTAMP}}"

log "DEPLOYMENT CONFIGURATION"
printf 'Repository:    %s\n' "$REPO_ROOT"
printf 'Script ID:     %s\n' "$REOS_SCRIPT_ID"
printf 'Deployment ID: %s\n' "$REOS_DEPLOYMENT_ID"
printf 'Live URL:      %s\n' "$REOS_WEBAPP_URL"
printf 'Description:   %s\n' "$RELEASE_DESCRIPTION"

log "LOCAL FILE STATUS"
clasp status

log "PUSH TO APPS SCRIPT"
clasp push

log "CREATE IMMUTABLE VERSION"
VERSION_OUTPUT="$(clasp create-version "$RELEASE_DESCRIPTION")"
printf '%s\n' "$VERSION_OUTPUT"

VERSION_NUMBER="$(
  printf '%s\n' "$VERSION_OUTPUT" |
    sed -nE 's/.*[Vv]ersion[^0-9]*([0-9]+).*/\1/p' |
    tail -1
)"

if [[ -z "$VERSION_NUMBER" ]]; then
  VERSION_NUMBER="$(
    clasp list-versions |
      sed -nE 's/^([0-9]+)[[:space:]]*-.*/\1/p' |
      sort -n |
      tail -1
  )"
fi

[[ "$VERSION_NUMBER" =~ ^[0-9]+$ ]] ||
  fail "Could not determine the newly created version number."

printf 'Created version: %s\n' "$VERSION_NUMBER"

log "REDEPLOY PRODUCTION WEB APP"
clasp create-deployment \
  --deploymentId "$REOS_DEPLOYMENT_ID" \
  --versionNumber "$VERSION_NUMBER" \
  --description "$RELEASE_DESCRIPTION"

log "VERIFY REMOTE DEPLOYMENT"
DEPLOYMENTS_OUTPUT="$(clasp list-deployments)"
printf '%s\n' "$DEPLOYMENTS_OUTPUT"

printf '%s\n' "$DEPLOYMENTS_OUTPUT" |
  grep -F "$REOS_DEPLOYMENT_ID" |
  grep -Eq "@${VERSION_NUMBER}([[:space:]]|$)" ||
  fail "Production deployment was not confirmed at version $VERSION_NUMBER."

log "TEST LIVE URL"
HTTP_RESULT="$(
  curl -sS -L \
    --connect-timeout 20 \
    --max-time 90 \
    -D "$HEADER_FILE" \
    -o "$RESPONSE_FILE" \
    -w $'HTTP_CODE=%{http_code}\nFINAL_URL=%{url_effective}\nCONTENT_TYPE=%{content_type}\nTOTAL_TIME=%{time_total}\n' \
    "$REOS_WEBAPP_URL"
)"

printf '%s\n' "$HTTP_RESULT"

HTTP_CODE="$(
  printf '%s\n' "$HTTP_RESULT" |
    awk -F= '/^HTTP_CODE=/{print $2}'
)"

[[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]] ||
  fail "Live web app returned HTTP $HTTP_CODE."

log "APPLICATION RESPONSE CHECKS"

python3 - "$RESPONSE_FILE" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
body = path.read_text(encoding="utf-8", errors="replace")
lower = body.lower()

checks = {
    "HTTP response body received": bool(body.strip()),
    "Old AppShell error absent": "appshell" not in lower,
    "Script function error absent": "script function not found" not in lower,
    "Generic exception absent": "exception:" not in lower,
}

positive_markers = {
    "REOS Enterprise branding": "reos enterprise" in lower,
    "Command Center content": "command center" in lower,
    "Google authentication page": (
        "accounts.google.com" in lower
        or "servicelogin" in lower
        or "sign in" in lower
    ),
}

failed = False

for label, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'}  {label}")
    failed = failed or not passed

for label, found in positive_markers.items():
    print(f"{'FOUND' if found else '---- '} {label}")

app_or_auth_found = any(positive_markers.values())

if not app_or_auth_found:
    print("WARN  Response did not contain expected application or authentication markers.")

if failed:
    sys.exit(1)
PY

cat > .reos/last-deployment.env <<EOF2
export REOS_LAST_VERSION="${VERSION_NUMBER}"
export REOS_LAST_DEPLOYED_AT="${TIMESTAMP}"
export REOS_LAST_DESCRIPTION="${RELEASE_DESCRIPTION}"
export REOS_LAST_WEBAPP_URL="${REOS_WEBAPP_URL}"
EOF2

log "DEPLOYMENT COMPLETE"
printf 'Version:  %s\n' "$VERSION_NUMBER"
printf 'Live URL: %s\n' "$REOS_WEBAPP_URL"
printf 'Response: %s\n' "$RESPONSE_FILE"
printf 'Headers:  %s\n' "$HEADER_FILE"
