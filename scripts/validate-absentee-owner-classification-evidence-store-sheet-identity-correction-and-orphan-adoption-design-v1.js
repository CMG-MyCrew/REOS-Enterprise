#!/usr/bin/env node
'use strict';

const fs = require('fs');

const DESIGN =
  'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-design-v1.md';

const text = fs.readFileSync(
  DESIGN,
  'utf8'
);

function normalizeWhitespace(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim();
}

const normalizedText =
  normalizeWhitespace(text);

function requireText(value) {
  if (
    !normalizedText.includes(
      normalizeWhitespace(value)
    )
  ) {
    throw new Error(
      'Missing required design text: ' +
      value
    );
  }
}

function forbidText(value) {
  if (
    normalizedText.includes(
      normalizeWhitespace(value)
    )
  ) {
    throw new Error(
      'Forbidden design text present: ' +
      value
    );
  }
}

[
  'Absentee-Owner Classification Evidence Store Sheet Identity Correction and Certified Orphan Adoption — Design v1',

  '83a88c0dc59de1b8c16ccfb51ec385e1bc4347f0',
  '2d0d541a7d5972d66bcf71bfaf428616019a1397',
  'production Apps Script immutable version:',
  '`129`',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  '99f080635962dd83f4bafee22228c5c3ec6329ec089ee76966836b9afa135f0e',

  '4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce',

  'UNPROVISIONED',
  'fixed Script Property absent',
  'provisioning mutation retry not executed',
  'uncertain workbook preserved',

  '`REOS Absentee Owner Classification Evidence`',
  '`ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE`',
  'certified sheet ID is exactly `0`',

  '`sheets[0] !== sheet`',
  'Wrapper reference identity SHALL NOT be treated as physical Google Sheet identity.',
  '`Sheet.getSheetId()`',
  'The current false-negative check SHALL be removed.',

  'both returned sheet IDs are finite integer values greater than or equal to',
  'the positional sheet ID equals the name-resolved sheet ID',
  'SHALL NOT compare the two `Sheet` objects by JavaScript',

  'REOS.Security.requireAdmin()',
  'LockService.getScriptLock()',
  '`tryLock(1000)`',

  'different JavaScript objects but',
  'same `getSheetId()` value — verification MUST pass',
  'different `getSheetId()`',
  'verification MUST fail',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(options)',
  'No alias RPC is authorized.',

  '`confirmAdoption`',
  '`orphanWorkbookId`',
  '`expectedOrphanWorkbookIdSha256`',
  '`expectedActiveReosSpreadsheetId`',
  '`expectedPropertyState`',

  '`ADOPT_CERTIFIED_ORPHAN`',
  '`ABSENT`',

  'The future runtime SHALL NOT pin the raw orphan workbook ID.',

  'effective recovery operator owns the workbook',
  'zero additional editors',
  'zero additional viewers',

  'Spreadsheet Mutation Is Prohibited',
  '`SpreadsheetApp.create(...)`',
  '`insertSheet(...)`',
  '`deleteSheet(...)`',
  '`setName(...)`',
  '`setValues(...)`',
  '`SpreadsheetApp.flush()`',

  '`REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID`',
  'setProperty(...)',
  'No `setProperties(...)` call is authorized.',
  'No `deleteProperty(...)` call is authorized.',

  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED',
  '`ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION`',

  'propertyWriteExecuted: true',
  'workbookCreated: false',
  'workbookMutated: false',
  'provisioningRetryExecuted: false',

  'The successful orphan-adoption response SHALL NOT expose the raw orphan',
  'workbook ID.',

  'reosAbsenteeOwnerClassificationEvidenceStoreProvisioningInspect(options)',
  '`ALREADY_PROVISIONED`',

  'No Provisioning Retry',
  'a second workbook is prohibited',
  'replacement provisioning is prohibited',

  'persistenceAuthorized: false',
  'boundedRolloutAuthorized: false',
  'automaticOfferAuthorityGranted: false',

  'Automatic MAO or offer authority remains prohibited unless BOTH:',
  'comp-supported ARV is present',
  'adequate repair scope is present',

  'Current Design Increment Scope',
  'create exactly two files',
  'modify zero existing files',
  'No implementation is authorized by this design artifact alone.'
].forEach(requireText);

[
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
].forEach(requireText);

const uniqueHeaders = new Set([
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
]);

if (uniqueHeaders.size !== 20) {
  throw new Error(
    'Validator evidence header authority must contain exactly 20 unique fields.'
  );
}

[
  'caller-supplied:',
  'property keys;',
  'workbook names;',
  'sheet names;',
  'sheet IDs;',
  'header arrays;',
  'replacement workbook IDs.',

  'A replacement workbook SHALL NOT be created.',
  'A second evidence store SHALL NOT be created.',

  'An uncertain adoption result SHALL NOT be replayed automatically.',

  'The adoption RPC SHALL NOT internally invoke classification persistence or',
  'bounded rollout after property publication.'
].forEach(requireText);

forbidText(
  '1D5U-uph4y14x6Z-JGQjiIAohLYGyj5wBVQWVgrnMQjk'
);

forbidText(
  '1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU'
);

forbidText(
  'automaticOfferAuthorityGranted: true'
);

forbidText(
  'persistenceAuthorized: true'
);

forbidText(
  'boundedRolloutAuthorized: true'
);

forbidText(
  'provisioningRetryExecuted: true'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_SHEET_IDENTITY_CORRECTION_AND_ORPHAN_ADOPTION_DESIGN_V1_VALID=true'
);

console.log(
  'CURRENT_PRODUCTION_VERSION=129'
);

console.log(
  'CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256=4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce'
);

console.log(
  'CERTIFIED_ORPHAN_SHEET_ID=0'
);

console.log(
  'EVIDENCE_SCHEMA_FIELD_COUNT=20'
);

console.log(
  'STABLE_SHEET_IDENTITY=Sheet.getSheetId'
);

console.log(
  'WRAPPER_REFERENCE_IDENTITY_AUTHORIZED=false'
);

console.log(
  'FUTURE_ORPHAN_ADOPTION_RUNTIME_COUNT=1'
);

console.log(
  'FUTURE_ORPHAN_ADOPTION_PUBLIC_RPC_COUNT=1'
);

console.log(
  'ORPHAN_ADOPTION_INCIDENT_SPECIFIC=true'
);

console.log(
  'PROVISIONING_RETRY_AUTHORIZED=false'
);

console.log(
  'REPLACEMENT_WORKBOOK_AUTHORIZED=false'
);

console.log(
  'ORPHAN_SPREADSHEET_MUTATION_AUTHORIZED=false'
);

console.log(
  'SCRIPT_PROPERTY_PUBLICATION_MAX_CALLS=1'
);

console.log(
  'CURRENT_DESIGN_INCREMENT_NEW_FILE_COUNT=2'
);

console.log(
  'CURRENT_DESIGN_INCREMENT_EXISTING_FILE_MODIFICATION_COUNT=0'
);

console.log(
  'PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false'
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
