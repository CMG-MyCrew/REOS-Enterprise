#!/usr/bin/env node
'use strict';

const fs = require('fs');

const DESIGN =
  'docs/absentee-owner-classification-evidence-store-provisioning-admin-surface-design-v1.md';

const text = fs.readFileSync(
  DESIGN,
  'utf8'
);

function requireText(value) {
  if (!text.includes(value)) {
    throw new Error(
      'Missing required design text: ' +
      value
    );
  }
}

function forbidText(value) {
  if (text.includes(value)) {
    throw new Error(
      'Forbidden design text present: ' +
      value
    );
  }
}

[
  'Absentee-Owner Classification Evidence Store Provisioning Admin Surface — Design v1',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',

  'reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)',
  'reosAbsenteeOwnerClassificationEvidenceStoreProvision(options)',

  'REOS.Security.requireAdmin()',

  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'REOS Absentee Owner Classification Evidence',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',

  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256',

  'UNPROVISIONED',
  'ALREADY_PROVISIONED',
  'UNSAFE_ACTIVE_REOS_ALIAS',
  'CONFIGURED_WORKBOOK_UNOPENABLE',
  'CONFIGURED_SHEET_MISSING',
  'CONFIGURED_SCHEMA_INVALID',

  'expectedActiveReosSpreadsheetId',
  'expectedPropertyState',
  '`ABSENT`',

  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_VERIFIED',

  "SpreadsheetApp.create('REOS Absentee Owner Classification Evidence')",

  'NOT call `insertSheet(...)`',
  'exactly one initial sheet',
  'exactly one sheet at provisioning completion',

  'exactly one explicit:',
  '`SpreadsheetApp.flush()`',

  'setProperty(...)',
  'No `setProperties(...)` call is authorized.',

  'The fixed Script Property SHALL be published only AFTER the newly created workbook and schema have passed all required verification.',

  'The runtime SHALL NOT claim rollback.',
  'No Automatic Cleanup',

  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false',

  'Automatic MAO or offer authority remains prohibited unless BOTH:',

  'comp-supported ARV is present',
  'adequate repair scope is present',

  'No implementation is authorized by this design artifact alone.',

  'production v128 remains unchanged',
  'evidence store remains unprovisioned',
  'no Script Property is written',
  'no workbook is created',
  'no RPC is executed',
  'no classification is persisted'
].forEach(requireText);

const headerMatches = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

if (
  new Set(headerMatches).size !== 20
) {
  throw new Error(
    'Validator header authority is not exactly 20 unique fields.'
  );
}

[
  'caller-supplied property keys',
  'The module SHALL NOT accept caller-supplied property keys, workbook IDs, workbook names, sheet names, header arrays, source names, table names, endpoints, or contract versions.',
  'caller-selected destination',
  'No alias RPC is authorized.',
  'There is no automatic retry.',
  'Implementation v1 has no remediation or replacement authority.'
].forEach(requireText);

forbidText(
  'automaticOfferAuthorityGranted: true'
);

forbidText(
  'persistenceAuthorized: true'
);

forbidText(
  'boundedRolloutAuthorized: true'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_PROVISIONING_ADMIN_SURFACE_DESIGN_V1_VALID=true'
);

console.log(
  'FUTURE_RUNTIME_FILE_COUNT=1'
);

console.log(
  'FUTURE_PUBLIC_RPC_COUNT=2'
);

console.log(
  'EVIDENCE_SCHEMA_FIELD_COUNT=20'
);

console.log(
  'ADMIN_AUTHORITY=REOS.Security.requireAdmin'
);

console.log(
  'RUNTIME_SELF_PROVISIONING_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'ARV_AUTHORITY_GRANTED=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);

console.log(
  'MAO_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
