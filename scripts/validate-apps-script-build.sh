#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="${1:-build/apps-script-brand}"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "ERROR: Apps Script directory not found: $ROOT_DIR"
  exit 1
fi

# The Git-tracked Apps Script application tree is authoritative for REOS v3.x.
# Prevent accidental deployment-root drift back to src/ or another directory.
if [[ "$ROOT_DIR" == "build/apps-script-brand" && -f ".clasp.json" ]]; then
  CLASP_ROOT="$(python3 -c 'import json; print(json.load(open(".clasp.json")).get("rootDir", ""))')"

  if [[ "$CLASP_ROOT" != "build/apps-script-brand" ]]; then
    echo "ERROR: .clasp.json rootDir drift detected: $CLASP_ROOT"
    echo "Expected authoritative Apps Script root: build/apps-script-brand"
    exit 1
  fi
fi

echo "Validating Apps Script build: $ROOT_DIR"

# ---------------------------------------------------------------------------
# REOS protected subsystem validation
#
# Critical production modules must never disappear as a side effect of an
# unrelated build, Deal Logic change, branding update, or deployment.
# ---------------------------------------------------------------------------

PROTECTED_FILES=(
  "ConnectorRegistry.js"
  "AcquisitionConnectorManager.js"
  "CSVImportEngine.js"
  "AcquisitionIngestionOrchestrator.js"
  "AcquisitionEngine.js"
  "AcquisitionAutomation.js"
  "ZillowGmailConnector.js"
  "ZillowImportConnector.js"
)

protected_errors=0

echo "Checking protected REOS acquisition subsystem..."

for required_file in "${PROTECTED_FILES[@]}"; do
  if [[ ! -f "$ROOT_DIR/$required_file" ]]; then
    echo "ERROR: Protected REOS file missing: $required_file"
    protected_errors=$((protected_errors + 1))
  fi
done

# Critical connector symbols must also survive the build.
declare -A REQUIRED_SYMBOLS=(
  ["ConnectorRegistry.js"]="REOS.ConnectorRegistry"
  ["AcquisitionConnectorManager.js"]="REOS.AcquisitionConnectorManager"
)

for required_file in "${!REQUIRED_SYMBOLS[@]}"; do
  required_symbol="${REQUIRED_SYMBOLS[$required_file]}"

  if [[ -f "$ROOT_DIR/$required_file" ]] &&
     ! grep -Fq "$required_symbol" "$ROOT_DIR/$required_file"; then
    echo "ERROR: Protected symbol missing: $required_symbol ($required_file)"
    protected_errors=$((protected_errors + 1))
  fi
done

CONNECTOR_REGISTRY="$ROOT_DIR/ConnectorRegistry.js"
CONNECTOR_MANAGER="$ROOT_DIR/AcquisitionConnectorManager.js"

COUNTY_CONNECTOR_KEYS=(
  "county_csv"
  "tax_delinquent"
  "probate"
  "code_violations"
  "vacant_properties"
  "absentee_owners"
)

if [[ -f "$CONNECTOR_REGISTRY" ]]; then
  for connector_key in "${COUNTY_CONNECTOR_KEYS[@]}"; do
    if ! grep -Fq "$connector_key" "$CONNECTOR_REGISTRY"; then
      echo "ERROR: Protected county connector registry entry missing: $connector_key"
      protected_errors=$((protected_errors + 1))
    fi
  done
fi

COUNTY_HANDLERS=(
  "reosConnectorHandleCountyCsv"
  "reosConnectorHandleTaxDelinquent"
  "reosConnectorHandleProbate"
  "reosConnectorHandleCodeViolations"
  "reosConnectorHandleVacantProperties"
  "reosConnectorHandleAbsenteeOwners"
)

if [[ -f "$CONNECTOR_MANAGER" ]]; then
  for handler in "${COUNTY_HANDLERS[@]}"; do
    if ! grep -Fq "$handler" "$CONNECTOR_MANAGER"; then
      echo "ERROR: Protected county connector handler missing: $handler"
      protected_errors=$((protected_errors + 1))
    fi
  done
fi

if (( protected_errors > 0 )); then
  echo
  echo "REOS protected subsystem validation FAILED."
  echo "Deployment blocked to prevent acquisition/county connector regression."
  exit 1
fi

echo "Protected REOS acquisition subsystem PASSED."
echo

# County connector behavioral certification.
# Run only for the authoritative REOS Apps Script build root because the
# certification harness executes the production registry/manager contract
# from build/apps-script-brand.
if [[ "$ROOT_DIR" == "build/apps-script-brand" ]]; then
  COUNTY_CERTIFIER="scripts/validate-county-connector-certification.js"

  if [[ ! -f "$COUNTY_CERTIFIER" ]]; then
    echo "ERROR: County connector certification validator missing: $COUNTY_CERTIFIER"
    exit 1
  fi

  echo "Running county connector certification..."
  node "$COUNTY_CERTIFIER"
  echo
fi

# County runtime packaging certification.
if [[ "$ROOT_DIR" == "build/apps-script-brand" ]]; then
  COUNTY_RUNTIME_CERTIFIER="scripts/validate-county-runtime-packaging.js"

  if [[ ! -f "$COUNTY_RUNTIME_CERTIFIER" ]]; then
    echo "ERROR: County runtime packaging validator missing: $COUNTY_RUNTIME_CERTIFIER"
    exit 1
  fi

  echo "Running county runtime packaging certification..."
  node "$COUNTY_RUNTIME_CERTIFIER"
  echo
fi

# Generated county connector certification.
if [[ "$ROOT_DIR" == "build/apps-script-brand" ]]; then
  GENERATED_COUNTY_CERTIFIER="scripts/validate-generated-county-connectors.js"

  if [[ ! -f "$GENERATED_COUNTY_CERTIFIER" ]]; then
    echo "ERROR: Generated county connector validator missing: $GENERATED_COUNTY_CERTIFIER"
    exit 1
  fi

  echo "Running generated county connector certification..."
  node "$GENERATED_COUNTY_CERTIFIER"
  echo
fi

python3 - "$ROOT_DIR" <<'PY'
from collections import defaultdict
from pathlib import Path
import sys

root = Path(sys.argv[1])
errors = []
normalized_names = defaultdict(list)

for path in root.rglob("*"):
    if not path.is_file():
        continue

    relative = path.relative_to(root)
    name = path.name
    lower = name.lower()

    if lower == "appsscript.json":
        normalized_names["appsscript"].append(str(relative))
        continue

    if lower.endswith(".gs.js"):
        errors.append(
            f"Double Apps Script extension is not allowed: {relative}"
        )
        normalized = name[:-6]
    elif lower.endswith(".gs"):
        errors.append(
            f"Legacy .gs file is not allowed: {relative}"
        )
        normalized = name[:-3]
    elif lower.endswith(".js"):
        normalized = name[:-3]
    elif lower.endswith(".html"):
        normalized = name[:-5]
    else:
        continue

    normalized_names[normalized.lower()].append(str(relative))

for normalized, paths in sorted(normalized_names.items()):
    if len(paths) > 1:
        errors.append(
            "Conflicting Apps Script filename: "
            + normalized
            + "\n  - "
            + "\n  - ".join(paths)
        )

manifests = list(root.rglob("appsscript.json"))

if len(manifests) == 0:
    errors.append("Missing appsscript.json")
elif len(manifests) > 1:
    errors.append(
        "Multiple appsscript.json files found:\n  - "
        + "\n  - ".join(
            str(path.relative_to(root))
            for path in manifests
        )
    )

if errors:
    print("\nApps Script build validation FAILED.\n")

    for index, error in enumerate(errors, start=1):
        print(f"{index}. {error}\n")

    sys.exit(1)

print("Apps Script build validation PASSED.")
PY
