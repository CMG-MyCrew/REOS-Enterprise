# REOS Enterprise Architecture

## Apps Script Source Authority

For the current REOS Enterprise v3.x architecture:

### Authoritative application tree

`build/apps-script-brand/` is the authoritative, Git-tracked REOS Enterprise
Google Apps Script application tree.

It contains the production application modules, including:

- Core platform services
- Acquisition and ingestion modules
- County connector infrastructure
- Zillow connectors
- Deal analysis and decision logic
- Offer review and execution workflows
- CRM, property, vendor, and operational modules
- Apps Script HTML user interfaces

The directory name `build/` is historical and MUST NOT be interpreted to mean
that `build/apps-script-brand/` can be deleted and regenerated from `src/`.

There is currently no build process that reconstructs the complete REOS
application tree from `src/`.

### Deployment authority

`.clasp.json` MUST use:

    "rootDir": "build/apps-script-brand"

Production Apps Script deployments MUST originate from this directory and MUST
pass:

    scripts/validate-apps-script-build.sh

before `clasp push`.

### src/ directory

`src/` is not the authoritative source for the complete REOS application.

It currently contains branding/UI SDK source artifacts such as:

- `BrandConfig.generated.gs`
- `BrandUi.gs`

Code must not assume that `src/` can be used to reconstruct the production
Apps Script application.

### Protected subsystems

Changes to one REOS subsystem must not silently remove another subsystem.

In particular, Deal Logic changes must preserve the Acquisition Connector
platform and required county connectors.

The deployment validator protects critical acquisition modules, county
connector registry entries, and county connector handlers.

### Change rule

When modifying REOS application behavior:

1. Modify the appropriate Git-tracked files under `build/apps-script-brand/`.
2. Preserve unrelated application modules.
3. Run `scripts/validate-apps-script-build.sh`.
4. Review the Git diff.
5. Commit through a feature/fix branch and pull request.
6. Deploy only through a validation-protected deployment path.

A future migration to a conventional `src/ -> build/` architecture must be
performed as an explicit repository-wide migration. Until that migration is
completed and verified, `build/apps-script-brand/` remains authoritative.
