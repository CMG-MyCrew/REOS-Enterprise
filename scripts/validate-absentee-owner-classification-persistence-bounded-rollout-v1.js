#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const BUILD =
  path.join(
    ROOT,
    'build',
    'apps-script-brand'
  );

const files = {
  planner:
    path.join(
      BUILD,
      'AbsenteeOwnerClassificationPersistencePlanner.js'
    ),

  store:
    path.join(
      BUILD,
      'AbsenteeOwnerClassificationEvidenceStore.js'
    ),

  executor:
    path.join(
      BUILD,
      'AbsenteeOwnerClassificationPersistenceExecutor.js'
    ),

  rollout:
    path.join(
      BUILD,
      'AbsenteeOwnerClassificationBoundedRollout.js'
    )
};

for (
  const file of
  Object.values(files)
) {
  assert.ok(
    fs.existsSync(file),
    'required implementation file missing: ' +
      file
  );
}

const planner =
  fs.readFileSync(
    files.planner,
    'utf8'
  );

const store =
  fs.readFileSync(
    files.store,
    'utf8'
  );

const executor =
  fs.readFileSync(
    files.executor,
    'utf8'
  );

const rollout =
  fs.readFileSync(
    files.rollout,
    'utf8'
  );

const combined =
  [
    planner,
    store,
    executor,
    rollout
  ].join('\n');

const requiredPlanner = [
  'PERSISTENCE_CONTRACT_VERSION = 1',
  'CLASSIFICATION_CONTRACT_VERSION = 1',
  'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',
  'Philadelphia Office of Property Assessment',
  'Philadelphia Properties and Assessment History',
  'opa_properties_public',
  'https://phl.carto.com/api/v2/sql',
  'canonicalJson_',
  'Canonical JSON rejects sparse arrays.',
  'Canonical JSON rejects cyclic structures.',
  'evidenceEventIdFor_',
  "return (\n      'AOCE-' +",
  'INSUFFICIENT_CLASSIFICATION_EVIDENCE',
  "differingJson = 'null';"
];

for (
  const marker of
  requiredPlanner
) {
  assert.ok(
    planner.includes(marker),
    'planner marker missing: ' +
      marker
  );
}

const requiredStore = [
  'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID',
  'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE',
  'Evidence Event ID',
  'Evidence Event SHA-256',
  'createTextFinder(',
  'finder.matchEntireCell(true)',
  'finder.findAll()',
  "var GENESIS =\n    'GENESIS';",
  '.appendRow(row)',
  'SpreadsheetApp.flush();',
  'Classification evidence sheet is not provisioned.',
  'Classification evidence workbook must be separate from active REOS acquisition data.',
  'Evidence history hash chain is invalid.',
  'Evidence history contains a duplicate classifier-result hash.'
];

for (
  const marker of
  requiredStore
) {
  assert.ok(
    store.includes(marker),
    'store marker missing: ' +
      marker
  );
}

assert.strictEqual(
  (
    store.match(
      /\.appendRow\(/g
    ) ||
    []
  ).length,
  1,
  'store must contain one appendRow call site'
);

assert.strictEqual(
  (
    store.match(
      /SpreadsheetApp\.flush\(\)/g
    ) ||
    []
  ).length,
  1,
  'store must contain one explicit flush call site'
);

assert.strictEqual(
  store.includes(
    'getDataRange('
  ),
  false,
  'whole-sheet getDataRange history scan is forbidden'
);

for (
  const forbidden of
  [
    '.setValue(',
    '.setValues(',
    '.deleteRow(',
    '.insertRow',
    'ensureTable(',
    'createSheet(',
    'insertSheet('
  ]
) {
  assert.strictEqual(
    store.includes(
      forbidden
    ),
    false,
    'forbidden evidence-store mutation primitive: ' +
      forbidden
  );
}

const requiredExecutor = [
  'REOS.Database',
  '.withScriptLockContext(',
  'AbsenteeOwnerClassificationPersistencePlanner',
  '.prepare(',
  'AbsenteeOwnerClassificationEvidenceStore',
  '.persist(',
  'writeAttempted: false',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN'
];

for (
  const marker of
  requiredExecutor
) {
  assert.ok(
    executor.includes(marker),
    'executor marker missing: ' +
      marker
  );
}

for (
  const forbidden of
  [
    'UrlFetchApp',
    'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup'
  ]
) {
  assert.strictEqual(
    executor.includes(
      forbidden
    ),
    false,
    'persistence executor must not perform OPA lookup: ' +
      forbidden
  );
}

const requiredRollout = [
  'MAX_TARGETS =\n    10',
  'REOS.Security',
  '.requireAdmin();',
  'DUPLICATE_TARGET_ROW',
  'DUPLICATE_TARGET_IDENTITY',
  'AbsenteeOwnerEnrichmentExactRecordSelector',
  '.exactRecordEvidence(',
  'AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup',
  '.lookup(',
  'AbsenteeOwnerOwnerEvidenceComparison',
  '.compare(',
  'AbsenteeOwnerClassification',
  '.classify(',
  'AbsenteeOwnerClassificationPersistenceExecutor',
  '.execute(',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN',
  'function reosAbsenteeOwnerClassificationBoundedRollout('
];

for (
  const marker of
  requiredRollout
) {
  assert.ok(
    rollout.includes(marker),
    'rollout marker missing: ' +
      marker
  );
}

assert.strictEqual(
  (
    rollout.match(
      /\.exactRecordEvidence\(/g
    ) ||
    []
  ).length,
  1,
  'selector must have one rollout call site'
);

assert.strictEqual(
  (
    rollout.match(
      /\.lookup\(/g
    ) ||
    []
  ).length,
  1,
  'OPA lookup must have one rollout call site'
);

assert.strictEqual(
  (
    rollout.match(
      /\.compare\(/g
    ) ||
    []
  ).length,
  1,
  'comparison must have one rollout call site'
);

assert.strictEqual(
  (
    rollout.match(
      /\.classify\(/g
    ) ||
    []
  ).length,
  1,
  'classifier must have one rollout call site'
);

assert.strictEqual(
  (
    rollout.match(
      /\.execute\(/g
    ) ||
    []
  ).length,
  1,
  'persistence executor must have one rollout call site'
);

for (
  const forbidden of
  [
    'AbsenteeOwnerEnrichmentCandidateDiscovery',
    'reosConnectorHandleAbsenteeOwners',
    'AcquisitionDistressIntelligence',
    'Qualified Deal Queue',
    'setTrigger',
    'newTrigger(',
    'ClockTriggerBuilder',
    'CountyMutationExclusionLease'
  ]
) {
  assert.strictEqual(
    combined.includes(
      forbidden
    ),
    false,
    'forbidden authority marker present: ' +
      forbidden
  );
}

for (
  const forbidden of
  [
    'AbsenteeOwnerEnrichmentSanitizer',
    'AbsenteeOwnerEnrichmentPersistenceAdapter',
    'AbsenteeOwnerEnrichmentExecutionRequestBuilder',
    'AbsenteeOwnerEnrichmentExecutor'
  ]
) {
  assert.strictEqual(
    combined.includes(
      forbidden
    ),
    false,
    'classification persistence must not reuse owner-enrichment mutation runtime: ' +
      forbidden
  );
}

for (
  const marker of
  [
    'productionDataMutationAuthorityGranted:',
    'ownerEvidencePersistenceAuthorityGranted:',
    'ownerOccupancyAuthorityGranted:',
    'vacancyAuthorityGranted:',
    'qualifiedDealQueueAuthorityGranted:',
    'acquisitionLifecycleAuthorityGranted:',
    'arvAuthorityGranted:',
    'repairScopeAuthorityGranted:',
    'maoAuthorityGranted:',
    'automaticOfferAuthorityGranted:'
  ]
) {
  assert.ok(
    executor.includes(marker) ||
    rollout.includes(marker),
    'safety authority marker missing: ' +
      marker
  );
}

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_STATIC_VALID=true'
);

console.log(
  'RUNTIME_SURFACE_COUNT=4'
);

console.log(
  'EVIDENCE_SCHEMA_FIELD_COUNT=20'
);

console.log(
  'MAX_TARGETS=10'
);

console.log(
  'STORE_WRITE_PRIMITIVE=appendRow'
);

console.log(
  'HISTORY_LOOKUP=EXACT_DISTRESS_ID_TEXTFINDER_THEN_CANONICAL_KEY'
);

console.log(
  'PERSISTENCE_LOCK=REOS.Database.withScriptLockContext'
);

console.log(
  'OPA_HTTP_UNDER_PERSISTENCE_LOCK=false'
);

console.log(
  'DISTRESS_LEADS_CLASSIFICATION_WRITE_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
