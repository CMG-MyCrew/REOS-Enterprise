#!/usr/bin/env node
'use strict';

const fs = require('fs');

const FREEZE =
  'docs/absentee-owner-classification-evidence-store-sheet-identity-correction-and-orphan-adoption-implementation-freeze-v1.md';

const text = fs.readFileSync(
  FREEZE,
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
      'Missing required implementation-freeze text: ' +
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
      'Forbidden implementation-freeze text present: ' +
      value
    );
  }
}

[
  'Absentee-Owner Classification Evidence Store Sheet Identity Correction and Certified Orphan Adoption — Implementation Freeze v1',

  '503562df82ec5565c19d3c579657aa490b06d863',
  '3d0f3af0473bbd6ae861b044d98c690bff0c9e8f',

  '7df2d03a307a029840f06e192973b82a33fe9d8c8e2f883fd73ad0c7fb24a6c8',
  'eb3eebe8b7c7f218676555521d631ad223685b0548048178978805d3745006d3',
  '99f080635962dd83f4bafee22228c5c3ec6329ec089ee76966836b9afa135f0e',

  '4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce',
  'The certified orphan sheet ID is exactly:',
  '`0`',

  'IMPLEMENTATION_NEW_FILE_COUNT=4',
  'IMPLEMENTATION_MODIFIED_FILE_COUNT=10',
  'IMPLEMENTATION_TOTAL_FILE_COUNT=14',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',
  '.github/workflows/county-collapse-offline.yml',
  'scripts/validate-county-runtime-integration.js',
  'scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js',
  'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js',
  'scripts/validate-absentee-owner-classification-integration-v1.js',
  'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js',

  '`sheets[0] !== sheet`',
  '`Sheet.getSheetId()`',
  'Different JavaScript `Sheet` wrapper objects exposing the same valid sheet ID',
  'Different sheet IDs SHALL fail verification.',

  'exactly two provisioning',
  'exactly one `SpreadsheetApp.create(...)` call site',
  'exactly one explicit',
  '`SpreadsheetApp.flush()`',
  'exactly one fixed Script',
  'Property publication `setProperty(...)` call site',

  'reosAbsenteeOwnerClassificationEvidenceStoreAdoptCertifiedOrphan(options)',
  'No alias RPC is authorized.',
  'REOS.Security.requireAdmin()',
  'LockService.getScriptLock()',
  '`tryLock(1000)`',

  '`confirmAdoption`',
  '`orphanWorkbookId`',
  '`expectedOrphanWorkbookIdSha256`',
  '`expectedActiveReosSpreadsheetId`',
  '`expectedPropertyState`',
  '`ADOPT_CERTIFIED_ORPHAN`',
  '`ABSENT`',

  'ORPHAN_ADOPTION_WORKBOOK_MUTATION_AUTHORIZED=false',
  'REPLACEMENT_WORKBOOK_AUTHORIZED=false',
  'ORPHAN_ADOPTION_PROPERTY_PUBLICATION_MAX_CALLS=1',

  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_ORPHAN_ADOPTION_VERIFIED',
  '`ADMIN_EVIDENCE_STORE_ORPHAN_ADOPTION`',

  'The orphan static validator and orphan behavior validator SHALL also be',
  'registered in `COMPONENT_VALIDATORS`.',
  'The design validator and integration validator remain workflow-only.',

  'CURRENT_COMPONENT_VALIDATOR_COUNT=76',
  'FUTURE_COMPONENT_VALIDATOR_COUNT=78',

  'Exactly five existing absentee-owner integration validators are count-coupled',

  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=48',
  'FUTURE_POST_COUNTY_PRODUCTION_FILE_COUNT=49',

  'Exactly three existing absentee-owner integration validators are count-coupled',

  'historical county runtime inventory of 104 files SHALL remain unchanged',
  'historical reconciled production inventory of 147 files SHALL remain',

  'No production deployment or RPC execution is part of implementation validation.',

  'Implementation development, local validation, PR validation, merge validation,',
  'and postmerge validation SHALL NOT:',

  'Deployment Remains Separate',

  'No implementation is authorized by this freeze artifact alone.',

  'PERSISTENCE_AUTHORITY_GRANTED=false',
  'BOUNDED_ROLLOUT_AUTHORITY_GRANTED=false',
  'ARV_AUTHORITY_GRANTED=false',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false',
  'MAO_AUTHORITY_GRANTED=false',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false',

  'The current freeze increment SHALL create exactly two files:',
  'It SHALL modify zero existing files.'
].forEach(requireText);

const expectedNewFiles = [
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreOrphanAdoption.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-behavior-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-orphan-adoption-integration-v1.js'
];

const expectedModifiedFiles = [
  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreProvisioningAdmin.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-behavior-v1.js',
  'scripts/validate-absentee-owner-classification-evidence-store-provisioning-admin-integration-v1.js',
  '.github/workflows/county-collapse-offline.yml',
  'scripts/validate-county-runtime-integration.js',
  'scripts/validate-absentee-owner-philadelphia-owner-evidence-lookup-integration-v1.js',
  'scripts/validate-absentee-owner-owner-evidence-comparison-integration-v1.js',
  'scripts/validate-absentee-owner-classification-integration-v1.js',
  'scripts/validate-absentee-owner-classification-single-record-read-only-certification-entrypoint-integration-v1.js'
];

if (expectedNewFiles.length !== 4) {
  throw new Error(
    'New-file freeze authority must contain exactly four files.'
  );
}

if (expectedModifiedFiles.length !== 10) {
  throw new Error(
    'Modified-file freeze authority must contain exactly ten files.'
  );
}

const allImplementationFiles =
  expectedNewFiles.concat(
    expectedModifiedFiles
  );

if (
  new Set(allImplementationFiles).size !== 14
) {
  throw new Error(
    'Implementation freeze file scope must contain exactly 14 unique files.'
  );
}

allImplementationFiles.forEach(requireText);

const forbiddenRawOrphanWorkbookId = [
  '1D5U-uph4y14x6Z-JGQjiIA',
  'ohLYGyj5wBVQWVgrnMQjk'
].join('');

const forbiddenRawActiveReosSpreadsheetId = [
  '1N_5Saw8paJbUZ3FYWr2LmqM',
  'DV5qcHSNHda6RoxyqNTU'
].join('');

[
  forbiddenRawOrphanWorkbookId,
  forbiddenRawActiveReosSpreadsheetId,

  'PROVISIONING_RETRY_AUTHORIZED=true',
  'ORPHAN_ADOPTION_WORKBOOK_MUTATION_AUTHORIZED=true',
  'REPLACEMENT_WORKBOOK_AUTHORIZED=true',

  'PERSISTENCE_AUTHORITY_GRANTED=true',
  'BOUNDED_ROLLOUT_AUTHORITY_GRANTED=true',
  'ARV_AUTHORITY_GRANTED=true',
  'REPAIR_SCOPE_AUTHORITY_GRANTED=true',
  'MAO_AUTHORITY_GRANTED=true',
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=true'
].forEach(forbidText);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_STORE_SHEET_IDENTITY_CORRECTION_AND_ORPHAN_ADOPTION_IMPLEMENTATION_FREEZE_V1_VALID=true'
);

console.log(
  'FROZEN_BASE_MAIN=503562df82ec5565c19d3c579657aa490b06d863'
);

console.log(
  'FROZEN_BASE_MAIN_TREE=3d0f3af0473bbd6ae861b044d98c690bff0c9e8f'
);

console.log(
  'CERTIFIED_ORPHAN_WORKBOOK_ID_SHA256=4757b8774a8a6ec8b63ed835e43f1bff3f65c28cd7ef0cf5d868ac3525e3e5ce'
);

console.log(
  'CERTIFIED_ORPHAN_SHEET_ID=0'
);

console.log(
  'IMPLEMENTATION_NEW_FILE_COUNT=4'
);

console.log(
  'IMPLEMENTATION_MODIFIED_FILE_COUNT=10'
);

console.log(
  'IMPLEMENTATION_TOTAL_FILE_COUNT=14'
);

console.log(
  'CURRENT_COMPONENT_VALIDATOR_COUNT=76'
);

console.log(
  'FUTURE_COMPONENT_VALIDATOR_COUNT=78'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT_DELTA=2'
);

console.log(
  'COUNT_COUPLED_COMPONENT_VALIDATOR_FILE_COUNT=5'
);

console.log(
  'CURRENT_POST_COUNTY_PRODUCTION_FILE_COUNT=48'
);

console.log(
  'FUTURE_POST_COUNTY_PRODUCTION_FILE_COUNT=49'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT_DELTA=1'
);

console.log(
  'COUNT_COUPLED_POST_COUNTY_FILE_COUNT=3'
);

console.log(
  'PROVISIONING_CORRECTION_STABLE_IDENTITY=Sheet.getSheetId'
);

console.log(
  'PROVISIONING_RETRY_AUTHORIZED=false'
);

console.log(
  'ORPHAN_ADOPTION_PUBLIC_RPC_COUNT=1'
);

console.log(
  'ORPHAN_ADOPTION_WORKBOOK_MUTATION_AUTHORIZED=false'
);

console.log(
  'ORPHAN_ADOPTION_PROPERTY_PUBLICATION_MAX_CALLS=1'
);

console.log(
  'COMPONENT_REGISTER_ORPHAN_STATIC_VALIDATOR=true'
);

console.log(
  'COMPONENT_REGISTER_ORPHAN_BEHAVIOR_VALIDATOR=true'
);

console.log(
  'COMPONENT_REGISTER_DESIGN_VALIDATOR=false'
);

console.log(
  'COMPONENT_REGISTER_ORPHAN_INTEGRATION_VALIDATOR=false'
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
