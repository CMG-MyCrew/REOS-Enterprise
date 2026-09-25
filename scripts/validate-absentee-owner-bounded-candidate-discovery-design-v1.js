#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-bounded-candidate-discovery-design-v1.md'
);

const IMPLEMENTATION = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerEnrichmentCandidateDiscovery.js'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  fs.existsSync(DESIGN),
  'candidate-discovery design document is missing'
);

assert(
  !fs.existsSync(IMPLEMENTATION),
  'implementation must not exist during design-only increment'
);

const text = fs.readFileSync(DESIGN, 'utf8');

const required = [
  '# Absentee-Owner Bounded Candidate Discovery Design v1',
  '`reosAbsenteeOwnerEnrichmentCandidateDiscovery(options)`',
  '`REOS.Security.requireAdmin()`',
  '`DISTRESS_LEADS`',
  '`startRow`',
  '`maxRows`',
  '`MAX_ROWS = 50`',
  '`REOS.Database.getAll`',
  '`REOS.Database.query`',
  '`REOS.Database.findById`',
  '`Distress Lead ID`',
  '`Canonical Property Key`',
  'Global uniqueness MUST NOT be inferred from a bounded window.',
  'The implementation MUST NOT automatically invoke another discovery window.',
  'Candidate discovery MUST NOT return the complete `DISTRESS_LEADS` record.',
  '`mode: "READ_ONLY"`',
  '`productionDataMutationAuthorityGranted: false`',
  '`canonicalIdentityRepairAuthorityGranted: false`',
  '`migrationAuthorityGranted: false`',
  '`schedulerAuthorityGranted: false`',
  '`triggerAuthorityGranted: false`',
  '`connectorExecutionAuthorityGranted: false`',
  '`certificationMutationAuthorityGranted: false`',
  '`automaticOfferAuthorityGranted: false`',
  '`reosAbsenteeOwnerEnrichmentCertifySingleRecord`',
  '`REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`',
  '`REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`',
  '`REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`',
  '`REOS.AbsenteeOwnerEnrichmentExecutor.execute`',
  '`reosAbsenteeOwnerEnrichmentExactRecordEvidence(options)`',
  'Persisted canonical identity is not owner evidence.',
  '`NO_MATCH` remains non-affirmative evidence.',
  'no candidate data-range read',
  'Automatic MAO or offer authority requires both adequate comp-supported ARV and',
  'an adequate repair scope through their independently certified paths.',
  'one bounded read-only discovery invocation',
  'separate exact-record selector verification of one chosen candidate.'
];

for (const marker of required) {
  assert(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const prohibitedAuthority = [
  'candidate discovery authorizes enrichment mutation',
  'candidate discovery grants automatic offer authority',
  'candidate discovery repairs canonical identity',
  'candidate discovery may scan the full table'
];

for (const marker of prohibitedAuthority) {
  assert(
    !text.toLowerCase().includes(marker),
    'prohibited authority language found: ' + marker
  );
}

assert(
  /maxRows > 50/.test(text),
  'hard maximum failure contract is missing'
);

assert(
  /zero rows inspected/.test(text),
  'end-of-sheet zero-read contract is missing'
);

assert(
  /physical `rowNumber`/.test(text),
  'physical row evidence contract is missing'
);

console.log(
  'ABSENTEE_OWNER_BOUNDED_CANDIDATE_DISCOVERY_DESIGN_VALID=true'
);
console.log('DESIGN_IMPLEMENTATION_SEPARATION_EXACT=true');
console.log('BOUNDED_WINDOW_MAX_50_REQUIRED=true');
console.log('FULL_TABLE_DATABASE_READS_PROHIBITED=true');
console.log('DUAL_PERSISTED_IDENTITY_ONLY=true');
console.log('IDENTITY_DERIVATION_PROHIBITED=true');
console.log('COMPLETE_ROW_DISCOVERY_READ_PROHIBITED=true');
console.log('AUTOMATIC_MULTIWINDOW_SCAN_PROHIBITED=true');
console.log('EXACT_SELECTOR_HANDOFF_REQUIRED=true');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
