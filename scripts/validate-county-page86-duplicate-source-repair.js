#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

const evidencePath = path.join(
  root,
  'build/apps-script-brand/CountyPage86DuplicateSourceRepairEvidence.js'
);

const executorPath = path.join(
  root,
  'build/apps-script-brand/CountyPage86DuplicateSourceRepair.js'
);

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
  pass(message);
}

function read(file) {
  if (!fs.existsSync(file)) {
    fail('missing required file: ' + path.relative(root, file));
  }
  return fs.readFileSync(file, 'utf8');
}

const evidence = read(evidencePath);
const executor = read(executorPath);

const combined = evidence + '\n' + executor;

const requiredObjectIds = [
  '230',
  '231',
  '232',
  '233',
  '236',
  '237',
  '249',
  '250'
];

requiredObjectIds.forEach((id) => {
  assert(
    new RegExp(`(?:sourceRecordId|objectid|objectId)[^\\n]{0,80}['"]?${id}['"]?`).test(combined),
    `repair contract contains source observation ${id}`
  );
});

const requiredZillowIds = [
  'ZIL-20260821042918-7288',
  'ZIL-20260821053422-1314',
  'ZIL-20260821045916-2245',
  'ZIL-20260821034917-9232',
  'ZIL-20260821050923-8742',
  'ZIL-20260821043420-6416',
  'ZIL-20260821054916-6026'
];

requiredZillowIds.forEach((id) => {
  assert(
    combined.includes(id),
    `repair contract contains Zillow provenance authority ${id}`
  );
});

assert(
  /ZILLOW_GMAIL_IMPORTS/.test(evidence),
  'evidence certifies Zillow import-ledger provenance'
);

assert(
  /DISTRESS_LEADS/.test(combined),
  'repair is bounded to DISTRESS_LEADS authority'
);

assert(
  /ScriptLock|withScriptLockContext/.test(executor),
  'executor requires ScriptLock authority'
);

assert(
  /\.setValues\s*\(/.test(executor),
  'executor contains bounded physical setValues mutation'
);

const setValuesCount =
  (executor.match(/\.setValues\s*\(/g) || []).length;

assert(
  setValuesCount === 1,
  'executor contains exactly one physical setValues primitive'
);

[
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /ScriptApp\.newTrigger\s*\(/
].forEach((pattern) => {
  assert(
    !pattern.test(executor),
    `executor forbids mutation surface ${pattern}`
  );
});

assert(
  /rollback/i.test(executor),
  'executor contains rollback path'
);

assert(
  /NO_RETRY|AMBIGUOUS/i.test(executor),
  'rollback failure exposes explicit ambiguous/no-retry state'
);

assert(
  /schedulerAuthorityGranted\s*:\s*false/.test(executor),
  'executor grants no scheduler authority'
);

assert(
  /automaticOfferAuthorityGranted\s*:\s*false/.test(executor),
  'executor grants no automatic offer authority'
);

assert(
  /insertAuthorityGranted\s*:\s*false/.test(executor),
  'executor grants no insert authority'
);

assert(
  /deleteAuthorityGranted\s*:\s*false/.test(executor),
  'executor grants no delete authority'
);

assert(
  /repairAuthorityGranted\s*:\s*false/.test(executor),
  'persistent repair authority remains false'
);

assert(
  /Source Observation Key/.test(combined),
  'repair operates on source-observation identity'
);

assert(
  /Canonical Property Key/.test(combined),
  'repair verifies canonical property identity'
);

assert(
  /sourceMatchesPersistedCanonicalRows|freshSource|sourceIdentity|ArcGIS/i.test(evidence),
  'evidence requires fresh county source identity'
);

assert(
  /Gmail Message ID/.test(evidence) ||
  /gmailMessageId/.test(evidence),
  'evidence binds Zillow provenance to Gmail message identity'
);

assert(
  /Import ID/.test(evidence) ||
  /importId/.test(evidence),
  'evidence binds Zillow provenance to import identity'
);

assert(
  /Created At/.test(executor),
  'executor preserves physical creation authority'
);

assert(
  /Distress Lead ID/.test(executor),
  'executor preserves physical Distress Lead ID authority'
);

assert(
  !/delete.*ZILLOW_GMAIL_IMPORTS/i.test(executor),
  'executor does not delete Zillow import history'
);

console.log();
console.log('Page-86 duplicate source repair static contract PASSED.');

(function validatePage86FreshSourceDiagnosticApiContract() {
  var fs = require('fs');
  var path = require('path');

  var evidencePath = path.join(
    process.cwd(),
    'build/apps-script-brand/CountyPage86DuplicateSourceRepairEvidence.js'
  );

  var source = fs.readFileSync(evidencePath, 'utf8');

  if (
    source.indexOf(
      "typeof REOS.CountyCodeViolationSourceRecordDiagnostic.run !== 'function'"
    ) === -1
  ) {
    throw new Error(
      'Page-86 evidence must require the certified source-record diagnostic run() API.'
    );
  }

  if (
    source.indexOf(
      '.run(Number(target.sourceRecordId));'
    ) === -1
  ) {
    throw new Error(
      'Page-86 fresh-source evidence must invoke the certified diagnostic run() API.'
    );
  }

  if (
    source.indexOf(
      'CountyCodeViolationSourceRecordDiagnostic.inspect'
    ) !== -1
  ) {
    throw new Error(
      'Page-86 evidence must not depend on nonexistent diagnostic inspect() authority.'
    );
  }

  console.log(
    'PASS: Page-86 evidence uses certified source-record diagnostic run() authority'
  );
})();
