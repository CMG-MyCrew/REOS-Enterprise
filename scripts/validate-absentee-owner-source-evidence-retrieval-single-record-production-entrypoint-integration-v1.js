#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const DESIGN =
  'docs/absentee-owner-source-evidence-retriever-production-execution-boundary-design-v1.md';

const RUNTIME =
  'build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js';

const SELECTOR =
  'build/apps-script-brand/AbsenteeOwnerEnrichmentExactRecordSelector.js';

const RETRIEVER =
  'build/apps-script-brand/AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever.js';

const COUNTY =
  'scripts/validate-county-runtime-integration.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const EXPECTED_DESIGN_SHA =
  '5fd7322a97d4d6c8eb5030a400aa6dd73af0fdfa0acfa30ae50f33be6c9c93b6';

const EXPECTED_RETRIEVER_SHA =
  '4fa560a1e29715b4d7fac39154f1aa44428c8711cefdf1b6c1a4bc340d672844';

function full(relative) {
  return path.join(
    ROOT,
    relative
  );
}

function read(relative) {
  return fs.readFileSync(
    full(relative),
    'utf8'
  );
}

function sha256(relative) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        full(relative)
      )
    )
    .digest('hex');
}

[
  DESIGN,
  RUNTIME,
  SELECTOR,
  RETRIEVER,
  COUNTY,
  WORKFLOW
].forEach(relative => {
  assert.ok(
    fs.existsSync(
      full(relative)
    ),
    'required integration file missing: ' +
      relative
  );
});

assert.strictEqual(
  sha256(DESIGN),
  EXPECTED_DESIGN_SHA,
  'production execution design authority changed'
);

assert.strictEqual(
  sha256(RETRIEVER),
  EXPECTED_RETRIEVER_SHA,
  'merged retriever runtime changed'
);

const runtime =
  read(RUNTIME);

const county =
  read(COUNTY);

const workflow =
  read(WORKFLOW);

[
  'REOS.Security.requireAdmin',
  'REOS.AbsenteeOwnerEnrichmentExactRecordSelector',
  'REOS.AbsenteeOwnerPhiladelphiaCodeViolationSourceEvidenceRetriever'
].forEach(marker => {
  assert.ok(
    runtime.includes(marker),
    'authorized dependency missing: ' +
      marker
  );
});

[
  'REOS.Database',
  'SpreadsheetApp',
  'UrlFetchApp',
  'PropertiesService',
  'ScriptApp',
  'REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  'REOS.AbsenteeOwnerOpaAccountRangeEvidenceEvaluator'
].forEach(marker => {
  assert.strictEqual(
    runtime.includes(marker),
    false,
    'prohibited production dependency present: ' +
      marker
  );
});

const arrayCount =
  name => {
    const match =
      county.match(
        new RegExp(
          name +
          '\\s*=\\s*\\[(.*?)\\];',
          's'
        )
      );

    assert.ok(
      match,
      'county inventory missing: ' +
        name
    );

    return (
      match[1]
        .match(
          /'[^']+'/g
        ) || []
    ).length;
  };

assert.strictEqual(
  arrayCount(
    'POST_COUNTY_PRODUCTION_FILES'
  ),
  70
);

assert.strictEqual(
  arrayCount(
    'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_FILES'
  ),
  1
);

assert.strictEqual(
  arrayCount(
    'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_PRODUCTION_ENTRYPOINT_FILES'
  ),
  1
);

assert.strictEqual(
  arrayCount(
    'COMPONENT_VALIDATORS'
  ),
  97
);

assert.ok(
  county.includes(
    "'build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js'"
  ),
  'entrypoint missing from bounded county inventory'
);

[
  'node --check build/apps-script-brand/AbsenteeOwnerSourceEvidenceRetrievalSingleRecordProductionEntrypoint.js',

  'node --check scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-v1.js',

  'node --check scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-behavior-v1.js',

  'node --check scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-integration-v1.js',

  'run: node scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-v1.js',

  'run: node scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-behavior-v1.js',

  'run: node scripts/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-integration-v1.js'
].forEach(marker => {
  assert.ok(
    workflow.includes(marker),
    'CI registration missing: ' +
      marker
  );
});

assert.strictEqual(
  (
    workflow.match(
      /run: node scripts\/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-v1\.js/g
    ) || []
  ).length,
  1
);

assert.strictEqual(
  (
    workflow.match(
      /run: node scripts\/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-behavior-v1\.js/g
    ) || []
  ).length,
  1
);

assert.strictEqual(
  (
    workflow.match(
      /run: node scripts\/validate-absentee-owner-source-evidence-retrieval-single-record-production-entrypoint-integration-v1\.js/g
    ) || []
  ).length,
  1
);

console.log(
  'ABSENTEE_OWNER_SOURCE_EVIDENCE_RETRIEVAL_SINGLE_RECORD_PRODUCTION_ENTRYPOINT_INTEGRATION_VALID=true'
);

console.log(
  'AUTHORIZED_RUNTIME_DEPENDENCY_COUNT=3'
);

console.log(
  'POST_COUNTY_PRODUCTION_FILE_COUNT=70'
);

console.log(
  'BOUNDED_SOURCE_EVIDENCE_PRODUCTION_FILE_COUNT=1'
);

console.log(
  'BOUNDED_SOURCE_EVIDENCE_PRODUCTION_ENTRYPOINT_FILE_COUNT=1'
);

console.log(
  'COMPONENT_VALIDATOR_COUNT=97'
);

console.log(
  'HISTORICAL_INVENTORIES_PRESERVED=true'
);

console.log(
  'ENTRYPOINT_CI_REGISTRATION_EXACT=true'
);

console.log(
  'DIRECT_DATABASE_AUTHORITY=false'
);

console.log(
  'OWNER_EVIDENCE_AUTHORITY=false'
);

console.log(
  'EVALUATOR_AUTHORITY=false'
);

console.log(
  'DEPLOYMENT_AUTHORITY=false'
);

console.log(
  'PRODUCTION_INVOCATION_AUTHORITY=false'
);
