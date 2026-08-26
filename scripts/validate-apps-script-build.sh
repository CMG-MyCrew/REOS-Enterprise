#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="${1:-build/apps-script-brand}"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "ERROR: Apps Script directory not found: $ROOT_DIR"
  exit 1
fi

ROOT_DIR_ABS="$(cd "$ROOT_DIR" && pwd -P)"
AUTHORITATIVE_ROOT_ABS="$(cd "build/apps-script-brand" && pwd -P)"

IS_AUTHORITATIVE_ROOT=false

if [[ "$ROOT_DIR_ABS" == "$AUTHORITATIVE_ROOT_ABS" ]]; then
  IS_AUTHORITATIVE_ROOT=true
fi

# The Git-tracked Apps Script application tree is authoritative for REOS v3.x.
# Prevent accidental deployment-root drift back to src/ or another directory.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" && -f ".clasp.json" ]]; then
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
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
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
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
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
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  GENERATED_COUNTY_CERTIFIER="scripts/validate-generated-county-connectors.js"

  if [[ ! -f "$GENERATED_COUNTY_CERTIFIER" ]]; then
    echo "ERROR: Generated county connector validator missing: $GENERATED_COUNTY_CERTIFIER"
    exit 1
  fi

  echo "Running generated county connector certification..."
  node "$GENERATED_COUNTY_CERTIFIER"
  echo
fi

# DISTRESS_LEADS county schema certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  DISTRESS_LEAD_SCHEMA_CERTIFIER="scripts/validate-distress-lead-county-schema.js"

  if [[ ! -f "$DISTRESS_LEAD_SCHEMA_CERTIFIER" ]]; then
    echo "ERROR: DISTRESS_LEADS county schema validator missing: $DISTRESS_LEAD_SCHEMA_CERTIFIER"
    exit 1
  fi

  echo "Running DISTRESS_LEADS county schema certification..."
  node "$DISTRESS_LEAD_SCHEMA_CERTIFIER"
  echo
fi

# Canonical property / source observation identity certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  CANONICAL_PROPERTY_IDENTITY_CERTIFIER="scripts/validate-canonical-property-upsert-identity.js"

  if [[ ! -f "$CANONICAL_PROPERTY_IDENTITY_CERTIFIER" ]]; then
    echo "ERROR: Canonical property identity validator missing: $CANONICAL_PROPERTY_IDENTITY_CERTIFIER"
    exit 1
  fi

  echo "Running canonical property / source observation identity certification..."
  node "$CANONICAL_PROPERTY_IDENTITY_CERTIFIER"
  echo
fi

# County runtime execution bridge certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  COUNTY_RUNTIME_BRIDGE_CERTIFIER="scripts/validate-county-runtime-bridge.js"

  if [[ ! -f "$COUNTY_RUNTIME_BRIDGE_CERTIFIER" ]]; then
    echo "ERROR: County runtime bridge validator missing: $COUNTY_RUNTIME_BRIDGE_CERTIFIER"
    exit 1
  fi

  echo "Running county runtime bridge certification..."
  node "$COUNTY_RUNTIME_BRIDGE_CERTIFIER"
  echo
fi

# Full county runtime integration certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  COUNTY_RUNTIME_INTEGRATION_CERTIFIER="scripts/validate-county-runtime-integration.js"

  if [[ ! -f "$COUNTY_RUNTIME_INTEGRATION_CERTIFIER" ]]; then
    echo "ERROR: County runtime integration validator missing: $COUNTY_RUNTIME_INTEGRATION_CERTIFIER"
    exit 1
  fi

  echo "Running county runtime integration certification..."
  node "$COUNTY_RUNTIME_INTEGRATION_CERTIFIER"
  echo
fi

# Zillow Gmail address parser certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  ZILLOW_GMAIL_ADDRESS_CERTIFIER="scripts/validate-zillow-gmail-address-parser.js"

  if [[ ! -f "$ZILLOW_GMAIL_ADDRESS_CERTIFIER" ]]; then
    echo "ERROR: Zillow Gmail address parser validator missing: $ZILLOW_GMAIL_ADDRESS_CERTIFIER"
    exit 1
  fi

  echo "Running Zillow Gmail address parser certification..."
  node "$ZILLOW_GMAIL_ADDRESS_CERTIFIER"
  echo
fi

# Production E2E harness safety certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  PRODUCTION_E2E_HARNESS_CERTIFIER="scripts/validate-production-e2e-harness.js"

  if [[ ! -f "$PRODUCTION_E2E_HARNESS_CERTIFIER" ]]; then
    echo "ERROR: Production E2E harness safety validator missing: $PRODUCTION_E2E_HARNESS_CERTIFIER"
    exit 1
  fi

  echo "Running production E2E harness safety certification..."
  node "$PRODUCTION_E2E_HARNESS_CERTIFIER"
  echo
fi

# Production manifest reconciliation certification.
PRODUCTION_MANIFEST_CERTIFIER="scripts/validate-production-manifest-reconciliation.js"

if [ ! -f "$PRODUCTION_MANIFEST_CERTIFIER" ]; then
  echo "ERROR: Production manifest reconciliation validator missing: $PRODUCTION_MANIFEST_CERTIFIER"
  exit 1
fi

echo
echo "Running production manifest reconciliation certification..."
node "$PRODUCTION_MANIFEST_CERTIFIER"

# County deployment readiness certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  COUNTY_DEPLOYMENT_READINESS_CERTIFIER="scripts/validate-county-deployment-readiness.js"

  if [[ ! -f "$COUNTY_DEPLOYMENT_READINESS_CERTIFIER" ]]; then
    echo "ERROR: County deployment readiness validator missing: $COUNTY_DEPLOYMENT_READINESS_CERTIFIER"
    exit 1
  fi

  echo "Running county deployment readiness certification..."
  node "$COUNTY_DEPLOYMENT_READINESS_CERTIFIER"
  echo
fi

# Production operations scheduler / runtime-health certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  PRODUCTION_OPERATIONS_CERTIFIER="scripts/validate-production-operations-scheduler-health.js"

  if [[ ! -f "$PRODUCTION_OPERATIONS_CERTIFIER" ]]; then
    echo "ERROR: Production operations scheduler/runtime-health validator missing: $PRODUCTION_OPERATIONS_CERTIFIER"
    exit 1
  fi

  echo "Running production operations scheduler/runtime-health certification..."
  node "$PRODUCTION_OPERATIONS_CERTIFIER"
  echo
fi

# Controlled county production scheduler certification.
COUNTY_PRODUCTION_SCHEDULER_CERTIFIER="scripts/validate-county-production-scheduler.js"

if [ -f "$COUNTY_PRODUCTION_SCHEDULER_CERTIFIER" ]; then
  echo
  echo "Running county production scheduler certification..."
  node "$COUNTY_PRODUCTION_SCHEDULER_CERTIFIER"
else
  echo "ERROR: County production scheduler validator missing: $COUNTY_PRODUCTION_SCHEDULER_CERTIFIER"
  exit 1
fi

# Controlled county production endpoint preflight certification.
COUNTY_PRODUCTION_PREFLIGHT_CERTIFIER="scripts/validate-county-production-preflight.js"

if [ -f "$COUNTY_PRODUCTION_PREFLIGHT_CERTIFIER" ]; then
  echo
  echo "Running county production preflight certification..."
  node "$COUNTY_PRODUCTION_PREFLIGHT_CERTIFIER"
else
  echo "ERROR: County production preflight validator missing: $COUNTY_PRODUCTION_PREFLIGHT_CERTIFIER"
  exit 1
fi


# Philadelphia actionable tax-delinquency source-filter certification.
if [[ "$IS_AUTHORITATIVE_ROOT" == "true" ]]; then
  PHILADELPHIA_TAX_ACTIONABLE_CERTIFIER="scripts/validate-philadelphia-tax-actionable-filter.js"

  if [[ ! -f "$PHILADELPHIA_TAX_ACTIONABLE_CERTIFIER" ]]; then
    echo "ERROR: Philadelphia actionable tax filter validator missing: $PHILADELPHIA_TAX_ACTIONABLE_CERTIFIER"
    exit 1
  fi

  echo
  echo "Running Philadelphia actionable tax filter certification..."
  node "$PHILADELPHIA_TAX_ACTIONABLE_CERTIFIER"
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
