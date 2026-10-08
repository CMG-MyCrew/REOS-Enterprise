#!/usr/bin/env node
'use strict';

const fs =
  require('fs');

const path =
  require('path');

const repo =
  path.resolve(
    __dirname,
    '..'
  );

const designPath =
  path.join(
    repo,
    'docs',
    'absentee-owner-classification-persistence-certified-property-source-provenance-extension-design-v2.md'
  );

function fail(message) {
  process.stderr.write(
    'STOP=' +
    message +
    '\n'
  );

  process.exit(1);
}

if (!fs.existsSync(designPath)) {
  fail(
    'v2 certified-property-source persistence provenance design is missing'
  );
}

const text =
  fs.readFileSync(
    designPath,
    'utf8'
  );

const required = [
  '# Absentee-Owner Classification Persistence Certified Property-Source Provenance Extension v2',

  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2',

  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',

  'Persistence Contract Version:\n  `2`',

  'Classification Contract Version:\n  `1`',

  '`certified_opa_account`',

  '`EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT`',

  '`READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION`',

  '`PROPERTY_SOURCE_IDENTITY_CERTIFIED`',

  '`READ_ONLY_OWNER_EVIDENCE_COMPARISON`',

  '`READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION`',

  '`ABSENTEE_OWNER_INDICATED`',

  '`OWNER_MAILING_MATCHED`',

  '`INSUFFICIENT_CLASSIFICATION_EVIDENCE`',

  '`OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON`',

  '`AOCE2-`',

  'No public caller may manufacture or directly supply an arbitrary persistence\nplan.',

  'No OPA HTTP request may occur while the persistence lock is held.',

  'Version 2 MUST NOT add, update, clear, or overwrite any absentee-owner\nclassification field on `DISTRESS_LEADS`.',

  'A future bounded-rollout extension for the certified-account path requires a\nseparate contract',

  'Automatic MAO or offer authority remains blocked unless both adequate\ncomp-supported ARV and adequate repair scope are independently established.'
];

for (const marker of required) {
  if (!text.includes(marker)) {
    fail(
      'required v2 design marker missing: ' +
      JSON.stringify(marker)
    );
  }
}

const headerBlock = [
  '1. `Evidence Event ID`',
  '2. `Observed At UTC`',
  '3. `Persistence Contract Version`',
  '4. `Classification Contract Version`',
  '5. `Distress Lead ID`',
  '6. `Canonical Property Key`',
  '7. `Physical Row Number`',
  '8. `Classification Outcome`',
  '9. `Classification Basis`',
  '10. `Upstream Comparison Outcome`',
  '11. `Differing Components JSON`',
  '12. `Normalized Property Address JSON`',
  '13. `Normalized Mailing Address JSON`',
  '14. `Source Agency`',
  '15. `Source Dataset`',
  '16. `Source Table`',
  '17. `Source Endpoint`',
  '18. `Owner Evidence Lookup Mode`',
  '19. `Certified OPA Account`',
  '20. `Property Source Identity Certification Basis`',
  '21. `Property Source Identity Certification SHA-256`',
  '22. `Normal Lookup Evidence SHA-256`',
  '23. `Owner Evidence Result SHA-256`',
  '24. `Comparison Result SHA-256`',
  '25. `Classifier Result SHA-256`',
  '26. `Previous Evidence SHA-256`',
  '27. `Evidence Event SHA-256`'
];

for (const header of headerBlock) {
  if (!text.includes(header)) {
    fail(
      'exact v2 schema header missing: ' +
      header
    );
  }
}

const evidenceBundle = [
  '`propertySourceIdentityCertification`',
  '`normalLookupEvidence`',
  '`ownerEvidenceResult`',
  '`comparisonResult`',
  '`classificationResult`'
];

for (const field of evidenceBundle) {
  if (!text.includes(field)) {
    fail(
      'v2 evidence-bundle field missing: ' +
      field
    );
  }
}

const requiredSafety = [
  'The existing v1 evidence sheet remains exactly:',
  'Its exact 20-column schema MUST NOT be altered by this v2 extension.',
  'Raw owner-name fields may be present transiently in the certified upstream\nartifact but MUST NOT be written to the v2 classification evidence store.',
  'Caller-supplied artifact hashes MUST NOT be trusted.',
  'No owner-name-specific hash is authorized.',
  'The runtime MUST NOT silently create the workbook or the v2 sheet.',
  'Version 2 design does not authorize a production RPC.',
  'This design does not retrofit the existing v1 bounded rollout.',
  'This design grants no authority for:',
  'no production data is mutated;'
];

for (const marker of requiredSafety) {
  if (!text.includes(marker)) {
    fail(
      'required fail-closed safety marker missing: ' +
      JSON.stringify(marker)
    );
  }
}

const forbiddenDesignClaims = [
  'PERSISTENCE_EXECUTION_AUTHORIZED=true',
  'CLASSIFICATION_PERSISTENCE_AUTHORIZED=true',
  'DISTRESS_LEADS_CLASSIFICATION_WRITE_AUTHORIZED=true',
  'BOUNDED_ROLLOUT_AUTHORIZED=true',
  'SCHEDULER_AUTHORIZED=true',
  'TRIGGER_AUTHORIZED=true',
  'MAO_AUTHORITY=true',
  'OFFER_AUTHORITY=true'
];

for (const marker of forbiddenDesignClaims) {
  if (text.includes(marker)) {
    fail(
      'design contains unauthorized authority claim: ' +
      marker
    );
  }
}

const schemaSectionStart =
  text.indexOf(
    '## 15. Exact v2 persisted schema'
  );

const schemaSectionEnd =
  text.indexOf(
    '## 16. Fixed provider provenance'
  );

if (
  schemaSectionStart < 0 ||
  schemaSectionEnd < 0 ||
  schemaSectionEnd <=
    schemaSectionStart
) {
  fail(
    'v2 exact-schema section boundary is invalid'
  );
}

const schemaSection =
  text.slice(
    schemaSectionStart,
    schemaSectionEnd
  );

const numberedHeaders =
  [...schemaSection.matchAll(
    /^(\d+)\. `([^`]+)`$/gm
  )];

if (numberedHeaders.length !== 27) {
  fail(
    'v2 exact schema does not contain exactly 27 numbered headers'
  );
}

for (
  let index = 0;
  index < numberedHeaders.length;
  index++
) {
  if (
    Number(
      numberedHeaders[index][1]
    ) !==
    index + 1
  ) {
    fail(
      'v2 exact schema header ordering is invalid'
    );
  }

  if (
    numberedHeaders[index][2] !==
    headerBlock[index]
      .replace(
        /^\d+\. `/,
        ''
      )
      .replace(
        /`$/,
        ''
      )
  ) {
    fail(
      'v2 exact schema header name/order mismatch at column ' +
      String(index + 1)
    );
  }
}

process.stdout.write(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_EXTENSION_V2_DESIGN_VALIDATED=true\n'
);

process.stdout.write(
  'PERSISTENCE_CONTRACT_VERSION=2\n'
);

process.stdout.write(
  'CLASSIFICATION_CONTRACT_VERSION=1\n'
);

process.stdout.write(
  'V1_EVIDENCE_SHEET=ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE\n'
);

process.stdout.write(
  'V1_EVIDENCE_SCHEMA_COLUMN_COUNT=20\n'
);

process.stdout.write(
  'V2_EVIDENCE_SHEET=ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_V2\n'
);

process.stdout.write(
  'V2_EVIDENCE_SCHEMA_COLUMN_COUNT=27\n'
);

process.stdout.write(
  'V2_EVIDENCE_EVENT_ID_PREFIX=AOCE2-\n'
);

process.stdout.write(
  'CERTIFIED_ACCOUNT_LOOKUP_MODE=certified_opa_account\n'
);

process.stdout.write(
  'V1_RUNTIME_MODIFICATION_AUTHORIZED=false\n'
);

process.stdout.write(
  'PUBLIC_RPC_AUTHORIZED=false\n'
);

process.stdout.write(
  'EVIDENCE_STORE_PROVISIONING_AUTHORIZED=false\n'
);

process.stdout.write(
  'PERSISTENCE_EXECUTION_AUTHORIZED=false\n'
);

process.stdout.write(
  'BOUNDED_ROLLOUT_AUTHORIZED=false\n'
);

process.stdout.write(
  'DISTRESS_LEADS_CLASSIFICATION_WRITE_AUTHORIZED=false\n'
);

process.stdout.write(
  'ARV_AUTHORITY=false\n'
);

process.stdout.write(
  'REPAIR_SCOPE_AUTHORITY=false\n'
);

process.stdout.write(
  'MAO_AUTHORITY=false\n'
);

process.stdout.write(
  'OFFER_AUTHORITY=false\n'
);
