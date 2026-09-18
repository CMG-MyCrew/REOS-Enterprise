#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');

const file =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentCertificationEntrypoint.js';

const text = fs.readFileSync(file, 'utf8');

function has(fragment, message) {
  assert(
    text.includes(fragment),
    message || ('missing required fragment: ' + fragment)
  );
}

has(
  'REOS.AbsenteeOwnerEnrichmentCertificationEntrypoint',
  'entrypoint namespace missing'
);

has(
  'function reosAbsenteeOwnerEnrichmentCertifySingleRecord(options)',
  'global certification RPC missing'
);

has(
  'REOS.Security.requireAdmin();',
  'Admin requirement missing'
);

has(
  "var TARGET_TABLE = 'DISTRESS_LEADS';",
  'target table must be DISTRESS_LEADS'
);

has("'Distress Lead ID'");
has("'Canonical Property Key'");

has(
  'var identityKeys = Object.keys(options.identity).sort();',
  'exact identity-key validation missing'
);

has(
  "'ABSENTEE_OWNER_CERTIFICATION_IDENTITY_SHAPE_INVALID'",
  'identity shape must fail closed'
);

const admin =
  text.indexOf('REOS.Security.requireAdmin();');

const read =
  text.indexOf('REOS.Database.getAll(TARGET_TABLE)');

const sanitize =
  text.indexOf(
    'REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize'
  );

const plan =
  text.indexOf(
    'REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan'
  );

const prepare =
  text.indexOf(
    'REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare'
  );

const execute =
  text.indexOf(
    'REOS.AbsenteeOwnerEnrichmentExecutor.execute'
  );

assert(admin !== -1, 'Admin call missing');
assert(read !== -1, 'DISTRESS_LEADS read missing');
assert(sanitize !== -1, 'sanitizer call missing');
assert(plan !== -1, 'adapter call missing');
assert(prepare !== -1, 'builder call missing');
assert(execute !== -1, 'executor call missing');

assert(
  admin < sanitize &&
  admin < read &&
  admin < plan &&
  admin < prepare &&
  admin < execute,
  'Admin authority must precede all pipeline/read operations'
);

assert(
  sanitize < read &&
  read < plan &&
  plan < prepare &&
  prepare < execute,
  'certified pipeline order is not exact'
);

[
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.replacePhysicalRowExact\s*\(/,
  /REOS\.Database\.patchPhysicalRowCellsExact\s*\(/,
  /\.setValue\s*\(/,
  /\.setValues\s*\(/,
  /reosConnectorHandleAbsenteeOwners\s*\(/,
  /CountyMutationExclusionLease/,
  /ScriptApp\.newTrigger/,
  /ScriptApp\.deleteTrigger/
].forEach(function (pattern) {
  assert(
    !pattern.test(text),
    'prohibited entrypoint surface found: ' + pattern
  );
});

[
  'dealCreationAuthorized: true',
  'maoGenerationAuthorized: true',
  'automaticOfferAuthorityGranted: true',
  'persistenceExecutionAuthorized: true',
  'productionMutationAuthority: true',
  'schedulerAuthority: true'
].forEach(function (fragment) {
  assert(
    !text.includes(fragment),
    'authority escalation found: ' + fragment
  );
});

assert(
  !/\b(runAll|batch|pagination|pageSize|cursor)\b/.test(
    text.replace(/\/\*[\s\S]*?\*\//g, '')
  ),
  'bulk or pagination execution surface detected'
);

console.log(
  'PASS: Phase 1K entrypoint is Admin-gated before read or pipeline execution.'
);
console.log(
  'PASS: exact sanitizer -> read -> adapter -> builder -> executor composition is present.'
);
console.log(
  'PASS: entrypoint owns no Database mutation or direct spreadsheet write primitive.'
);
console.log(
  'PASS: generic absentee connector, county lease, triggers and scheduler remain outside scope.'
);
console.log(
  'PASS: no downstream acquisition or automatic-offer authority is granted.'
);
console.log(
  'PHASE1K_ENTRYPOINT_STATIC_VALIDATOR_PASSED=true'
);
