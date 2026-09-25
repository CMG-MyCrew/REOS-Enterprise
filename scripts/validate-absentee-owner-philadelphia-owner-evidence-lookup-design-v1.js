#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'absentee-owner-philadelphia-owner-evidence-lookup-design-v1.md'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  fs.existsSync(DESIGN),
  'Philadelphia owner-evidence lookup design is missing'
);

const text = fs.readFileSync(DESIGN, 'utf8');

const required = [
  '# Absentee-Owner Philadelphia Owner Evidence Lookup Design v1',
  '`opa_properties_public`',
  '`parcel_number`',
  '`location`',
  '`owner_1`',
  '`owner_2`',
  '`mailing_address_1`',
  '`mailing_address_2`',
  '`mailing_care_of`',
  '`mailing_city_state`',
  '`mailing_street`',
  '`mailing_zip`',
  '`reosAbsenteeOwnerPhiladelphiaOwnerEvidenceLookup(options)`',
  '`REOS.Security.requireAdmin()`',
  '`MAX_SOURCE_ROWS = 5`',
  'One invocation MAY execute at most one external source request.',
  'No automatic pagination is permitted.',
  'No retry loop is permitted.',
  '`MATCHED`',
  '`NO_MATCH`',
  '`AMBIGUOUS`',
  '`FAILED`',
  '`MATCHED` means only:',
  'It MUST NOT perform fuzzy address matching.',
  'The caller MUST NOT provide an owner name to search for.',
  'Version 1 MUST NOT compare them to declare:',
  '`mode: "READ_ONLY_OWNER_EVIDENCE"`',
  '`productionDataMutationAuthorityGranted: false`',
  '`ownerEvidencePersistenceAuthorityGranted: false`',
  '`canonicalIdentityRepairAuthorityGranted: false`',
  '`schedulerAuthorityGranted: false`',
  '`triggerAuthorityGranted: false`',
  '`connectorExecutionAuthorityGranted: false`',
  '`certificationMutationAuthorityGranted: false`',
  '`automaticOfferAuthorityGranted: false`',
  '`REOS.CountyRuntimeBridge.registerConnectors`',
  '`REOS.CountyConnectorSDK.get`',
  '`REOS.PAPhiladelphiaCountyConnector.fetch`',
  '`REOS.AbsenteeOwnerEnrichmentSanitizer.sanitize`',
  '`REOS.AbsenteeOwnerEnrichmentPersistenceAdapter.plan`',
  '`REOS.AbsenteeOwnerEnrichmentExecutionRequestBuilder.prepare`',
  '`REOS.AbsenteeOwnerEnrichmentExecutor.execute`',
  '`reosAbsenteeOwnerEnrichmentCertifySingleRecord`',
  '`NO_MATCH` is non-affirmative evidence.',
  'The lookup itself MUST NOT create an attempted persistence patch.',
  'Automatic MAO or offer authority requires both adequate comp-supported ARV and',
  'an adequate repair scope through independently certified paths.',
  'one lookup for the separately certified exact target;',
  'No step implies authority for the next step.'
];

for (const marker of required) {
  assert(
    text.includes(marker),
    'missing required design marker: ' + marker
  );
}

const prohibited = [
  'owner evidence authorizes persistence',
  'owner evidence grants automatic offer authority',
  'matched means the owner is absentee',
  'no_match means owner occupied',
  'use the first source row when ambiguous',
  'automatically continue to the next candidate',
  'fuzzy matching is permitted'
];

const lower = text.toLowerCase();

for (const marker of prohibited) {
  assert(
    !lower.includes(marker),
    'prohibited design authority found: ' + marker
  );
}

assert(
  /return at most `5` source rows/.test(text),
  'bounded five-row source-result contract missing'
);

assert(
  /MUST NOT use `SELECT \*`/.test(text),
  'source projection boundary missing'
);

assert(
  /exactly one qualifying OPA source row/.test(text),
  'unique exact source-match contract missing'
);

assert(
  /owner mailing evidence and property-address evidence MUST remain distinct/i
    .test(text),
  'owner/property-address semantic separation missing'
);

assert(
  /first owner-evidence production lookup MUST be separately authorized/i
    .test(text),
  'first-production-target authorization boundary missing'
);

console.log(
  'ABSENTEE_OWNER_PHILADELPHIA_OWNER_EVIDENCE_LOOKUP_DESIGN_VALID=true'
);

console.log('OFFICIAL_OPA_SOURCE_REQUIRED=true');
console.log('OPA_PROPERTIES_PUBLIC_SOURCE_FIXED=true');
console.log('SOURCE_COLUMN_PROJECTION_REQUIRED=true');
console.log('MAX_SOURCE_ROWS=5');
console.log('MAX_EXTERNAL_REQUESTS_PER_INVOCATION=1');
console.log('AUTOMATIC_PAGINATION_AUTHORITY=false');
console.log('AUTOMATIC_RETRY_AUTHORITY=false');
console.log('FUZZY_ADDRESS_MATCHING_AUTHORITY=false');
console.log('OWNER_NAME_FALLBACK_SEARCH_AUTHORITY=false');
console.log('ABSENTEE_CLASSIFICATION_AUTHORITY=false');
console.log('OWNER_EVIDENCE_PERSISTENCE_AUTHORITY=false');
console.log('PRODUCTION_MUTATION_AUTHORITY=false');
console.log('COUNTY_EXECUTION_AUTHORITY=false');
console.log('SCHEDULER_AUTHORITY=false');
console.log('TRIGGER_AUTHORITY=false');
console.log('CANONICAL_IDENTITY_REPAIR_AUTHORITY=false');
console.log('AUTOMATIC_OFFER_AUTHORITY=false');
