#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="${1:-build/apps-script-brand}"

if [[ ! -d "$ROOT_DIR" ]]; then
  echo "ERROR: Apps Script directory not found: $ROOT_DIR"
  exit 1
fi

echo "Validating Apps Script build: $ROOT_DIR"

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
