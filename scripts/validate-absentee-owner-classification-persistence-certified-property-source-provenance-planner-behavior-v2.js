#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js'
);
const source = fs.readFileSync(FILE, 'utf8');

let count = 0;
function test(name, fn) {
  count++;
  try {
    fn();
    console.log('PASS: ' + name);
  } catch (error) {
    console.error('FAIL: ' + name);
    throw error;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null ||
    Object.prototype.toString.call(value) === '[object Object]';
}

function canonicalJson(value) {
  const stack = [];
  function encode(current) {
    if (current === null) return 'null';
    const type = typeof current;
    if (type === 'string') return JSON.stringify(current);
    if (type === 'boolean') return current ? 'true' : 'false';
    if (type === 'number') {
      if (!Number.isFinite(current)) throw new Error('non-finite');
      return current === 0 ? '0' : String(current);
    }
    if (type === 'undefined' || type === 'function' || type === 'symbol' || type === 'bigint') {
      throw new Error('unsupported');
    }
    if (stack.includes(current)) throw new Error('cycle');
    stack.push(current);
    try {
      if (Array.isArray(current)) {
        return '[' + current.map(encode).join(',') + ']';
      }
      if (!isPlainObject(current)) throw new Error('non-plain');
      return '{' + Object.keys(current).sort().map(key =>
        JSON.stringify(key) + ':' + encode(current[key])
      ).join(',') + '}';
    } finally {
      stack.pop();
    }
  }
  return encode(value);
}

function hashCanonicalObject(value) {
  return crypto.createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}

const PROPERTY_CERT_AUTH = [
  'productionDataMutationAuthorityGranted',
  'sourceEvidenceRetrievalAuthorityGranted',
  'ownerEvidenceRetrievalAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'rolloutAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const NORMAL_AUTH = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const OWNER_AUTH = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const COMPARISON_AUTH = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

const CLASSIFIER_AUTH = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'ownerOccupancyAuthorityGranted',
  'vacancyAuthorityGranted',
  'qualifiedDealQueueAuthorityGranted',
  'acquisitionLifecycleAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

function falseAuthority(fields) {
  return Object.fromEntries(fields.map(field => [field, false]));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixture(kind) {
  const comparisonOutcome = kind || 'MAILING_ADDRESS_DIFFERS';
  const classificationOutcome = {
    MAILING_ADDRESS_DIFFERS: 'ABSENTEE_OWNER_INDICATED',
    MAILING_ADDRESS_MATCHES: 'OWNER_MAILING_MATCHED',
    INSUFFICIENT_MAILING_EVIDENCE: 'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
  }[comparisonOutcome];

  const identity = {
    'Distress Lead ID': 'DL-20260825185532-4474',
    'Canonical Property Key': 'property|parcel|pa|philadelphia|1473083'
  };

  const lookupTarget = {
    rowNumber: 1530,
    identity: clone(identity),
    propertyAddress: '1624 N BODINE ST',
    city: 'PHILADELPHIA',
    state: 'PA',
    zip: '19122'
  };

  const ownerSource = {
    agency: 'Philadelphia Office of Property Assessment',
    dataset: 'Philadelphia Properties and Assessment History',
    table: 'opa_properties_public',
    endpoint: 'https://phl.carto.com/api/v2/sql',
    lookupQueryMode: 'certified_opa_account',
    certifiedOpaAccount: '183124510',
    parcelNumber: '183124510',
    propertyLocation: '1624-26 N BODINE ST'
  };

  const property = {
    street: '1624 N BODINE ST',
    city: 'PHILADELPHIA',
    state: 'PA',
    zip: '19122'
  };

  let mailing;
  let differences;

  if (comparisonOutcome === 'MAILING_ADDRESS_MATCHES') {
    mailing = clone(property);
    differences = [];
  } else if (comparisonOutcome === 'INSUFFICIENT_MAILING_EVIDENCE') {
    mailing = {
      street: '',
      city: 'PHILADELPHIA',
      state: 'PA',
      zip: ''
    };
  } else {
    mailing = {
      street: 'PO BOX 100',
      city: 'PHILADELPHIA',
      state: 'PA',
      zip: '19103'
    };
    differences = ['street', 'zip'];
  }

  const propertySourceIdentityCertification = Object.assign({
    ok: true,
    mode: 'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
    phase: 'absentee_owner_opa_account_range_property_source_identity_certification',
    outcome: 'PROPERTY_SOURCE_IDENTITY_CERTIFIED',
    certificationBasis: 'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT',
    target: {
      table: 'DISTRESS_LEADS',
      rowNumber: 1530,
      identity: clone(identity)
    },
    normalizedVerifiedTargetAddress: '1624 N BODINE ST',
    persistedParcelId: '1473083',
    corroboratingSourceObservationCount: 2,
    corroboratingSourceObservationIds: [
      'pa-philadelphia|code_violations|383',
      'pa-philadelphia|code_violations|384'
    ],
    sourceParcelIdNum: '1473083',
    sourceOpaAccountNum: '183124510',
    opaParcelNumber: '183124510',
    opaLocation: '1624-26 N BODINE ST',
    normalizedOpaRangeLocation: '1624-26 N BODINE ST',
    targetHouseNumber: 1624,
    rangeStart: 1624,
    rangeEnd: 1626,
    targetStreetSuffix: 'N BODINE ST',
    opaRangeStreetSuffix: 'N BODINE ST',
    streetSuffixExact: true,
    targetNumberNumericallyWithinRange: true,
    targetParityCompatibleWithRange: true,
    propertySourceIdentityCertified: true,
    rangeContainmentDiagnosticCandidate: true,
    rangeContainmentCertifiedMatch: false
  }, falseAuthority(PROPERTY_CERT_AUTH));

  const normalLookupEvidence = Object.assign({
    ok: true,
    mode: 'READ_ONLY_OWNER_EVIDENCE',
    phase: 'absentee_owner_philadelphia_owner_evidence_lookup',
    outcome: 'NO_MATCH',
    target: clone(lookupTarget),
    source: {
      agency: 'Philadelphia Office of Property Assessment',
      dataset: 'Philadelphia Properties and Assessment History',
      table: 'opa_properties_public',
      endpoint: 'https://phl.carto.com/api/v2/sql',
      lookupQueryMode: 'exact_property_address'
    },
    boundedSourceRowCount: 0,
    lookupTimestamp: '2026-10-08T15:00:00.000Z'
  }, falseAuthority(NORMAL_AUTH));

  const ownerEvidenceResult = Object.assign({
    ok: true,
    mode: 'READ_ONLY_OWNER_EVIDENCE',
    phase: 'absentee_owner_certified_property_source_identity_owner_evidence_lookup',
    outcome: 'MATCHED',
    target: clone(lookupTarget),
    source: clone(ownerSource),
    boundedSourceRowCount: 1,
    propertySourceIdentityCertified: true,
    certificationBasis: 'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT',
    certifiedOpaAccount: '183124510',
    rangeContainmentDiagnosticCandidate: true,
    rangeContainmentCertifiedMatch: false,
    lookupTimestamp: '2026-10-08T15:01:00.000Z',
    ownerNameEvidence: {
      owner_1: 'EXAMPLE OWNER',
      owner_2: ''
    },
    ownerMailingEvidence: {
      mailing_address_1: '',
      mailing_address_2: '',
      mailing_care_of: '',
      mailing_city_state: 'PHILADELPHIA PA',
      mailing_street: comparisonOutcome === 'MAILING_ADDRESS_MATCHES'
        ? '1624 N BODINE ST'
        : 'PO BOX 100',
      mailing_zip: comparisonOutcome === 'MAILING_ADDRESS_MATCHES'
        ? '19122'
        : comparisonOutcome === 'INSUFFICIENT_MAILING_EVIDENCE'
          ? ''
          : '19103'
    }
  }, falseAuthority(OWNER_AUTH));

  const comparisonResult = Object.assign({
    ok: true,
    mode: 'READ_ONLY_OWNER_EVIDENCE_COMPARISON',
    phase: 'absentee_owner_owner_evidence_comparison',
    outcome: comparisonOutcome,
    target: {
      rowNumber: 1530,
      identity: clone(identity)
    },
    source: clone(ownerSource),
    normalizedPropertyAddress: clone(property),
    normalizedMailingAddress: clone(mailing),
    propertySourceIdentityCertified: true,
    certificationBasis: 'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT',
    certifiedOpaAccount: '183124510',
    rangeContainmentDiagnosticCandidate: true,
    rangeContainmentCertifiedMatch: false
  }, falseAuthority(COMPARISON_AUTH));

  if (differences !== undefined) {
    comparisonResult.differingComponents = clone(differences);
  }

  const classificationResult = Object.assign({
    ok: true,
    mode: 'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION',
    phase: 'absentee_owner_classification',
    outcome: classificationOutcome,
    target: {
      rowNumber: 1530,
      identity: clone(identity)
    },
    upstreamComparisonOutcome: comparisonOutcome,
    classificationBasis: 'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',
    normalizedPropertyAddress: clone(property),
    normalizedMailingAddress: clone(mailing)
  }, falseAuthority(CLASSIFIER_AUTH));

  if (differences !== undefined) {
    classificationResult.differingComponents = clone(differences);
  }

  return {
    propertySourceIdentityCertification,
    normalLookupEvidence,
    ownerEvidenceResult,
    comparisonResult,
    classificationResult
  };
}

function createHarness(withHelpers = true) {
  const state = { canonicalCalls: 0, hashCalls: 0 };
  const planner = withHelpers
    ? {
        canonicalJson(value) {
          state.canonicalCalls++;
          return canonicalJson(value);
        },
        hashCanonicalObject(value) {
          state.hashCalls++;
          return hashCanonicalObject(value);
        }
      }
    : undefined;

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Date,
    Error,
    RegExp,
    Infinity,
    NaN,
    isFinite,
    REOS: {}
  };

  if (planner) {
    context.REOS.AbsenteeOwnerClassificationPersistencePlanner = planner;
  }

  vm.createContext(context);
  vm.runInContext(source, context, { filename: FILE });

  return {
    state,
    prepare(bundle) {
      return context.REOS
        .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2
        .prepare(bundle);
    }
  };
}

function assertRejected(out, code) {
  assert.strictEqual(out.ok, false);
  if (code) assert.strictEqual(out.code, code);
}

function assertPlan(out, comparisonOutcome, classificationOutcome) {
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.persistenceContractVersion, 2);
  assert.strictEqual(out.classificationContractVersion, 1);
  assert.strictEqual(out.target.rowNumber, 1530);
  assert.strictEqual(out.target.identity['Distress Lead ID'], 'DL-20260825185532-4474');
  assert.strictEqual(out.target.identity['Canonical Property Key'], 'property|parcel|pa|philadelphia|1473083');
  assert.strictEqual(out.classificationOutcome, classificationOutcome);
  assert.strictEqual(out.upstreamComparisonOutcome, comparisonOutcome);
  assert.strictEqual(out.ownerEvidenceLookupMode, 'certified_opa_account');
  assert.strictEqual(out.certifiedOpaAccount, '183124510');
  assert.match(out.propertySourceIdentityCertificationSha256, /^[0-9a-f]{64}$/);
  assert.match(out.normalLookupEvidenceSha256, /^[0-9a-f]{64}$/);
  assert.match(out.ownerEvidenceResultSha256, /^[0-9a-f]{64}$/);
  assert.match(out.comparisonResultSha256, /^[0-9a-f]{64}$/);
  assert.match(out.classifierResultSha256, /^[0-9a-f]{64}$/);
  assert.match(out.evidenceEventId, /^AOCE2-[0-9a-f]{64}$/);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(out, 'observedAtUtc'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(out, 'previousEvidenceSha256'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(out, 'evidenceEventSha256'), false);
  assert.strictEqual(JSON.stringify(out).includes('EXAMPLE OWNER'), false);
  assert.strictEqual(JSON.stringify(out).includes('owner_1'), false);
}

test('valid certified-account absentee indication produces pure v2 plan', () => {
  const h = createHarness();
  const out = h.prepare(fixture('MAILING_ADDRESS_DIFFERS'));
  assertPlan(out, 'MAILING_ADDRESS_DIFFERS', 'ABSENTEE_OWNER_INDICATED');
  assert.strictEqual(out.differingComponentsJson, '["street","zip"]');
  assert.ok(h.state.canonicalCalls > 0);
  assert.ok(h.state.hashCalls >= 6);
});

test('valid matched owner evidence produces matched v2 plan', () => {
  const out = createHarness().prepare(fixture('MAILING_ADDRESS_MATCHES'));
  assertPlan(out, 'MAILING_ADDRESS_MATCHES', 'OWNER_MAILING_MATCHED');
  assert.strictEqual(out.differingComponentsJson, '[]');
});

test('valid insufficient evidence produces null differing components', () => {
  const out = createHarness().prepare(fixture('INSUFFICIENT_MAILING_EVIDENCE'));
  assertPlan(out, 'INSUFFICIENT_MAILING_EVIDENCE', 'INSUFFICIENT_CLASSIFICATION_EVIDENCE');
  assert.strictEqual(out.differingComponentsJson, 'null');
});

test('same exact five-artifact bundle is deterministic', () => {
  const bundle = fixture();
  const h = createHarness();
  const a = h.prepare(clone(bundle));
  const b = h.prepare(clone(bundle));
  assert.strictEqual(a.evidenceEventId, b.evidenceEventId);
  assert.strictEqual(a.ownerEvidenceResultSha256, b.ownerEvidenceResultSha256);
});

test('changed whole owner-evidence provenance changes event identity without persisting owner name', () => {
  const h = createHarness();
  const first = fixture();
  const second = fixture();
  second.ownerEvidenceResult.ownerNameEvidence.owner_1 = 'DIFFERENT OWNER';
  const a = h.prepare(first);
  const b = h.prepare(second);
  assert.strictEqual(a.ok, true);
  assert.strictEqual(b.ok, true);
  assert.notStrictEqual(a.ownerEvidenceResultSha256, b.ownerEvidenceResultSha256);
  assert.notStrictEqual(a.evidenceEventId, b.evidenceEventId);
  assert.strictEqual(JSON.stringify(b).includes('DIFFERENT OWNER'), false);
});

test('normal lookup must fail closed as NO_MATCH', () => {
  const bundle = fixture();
  bundle.normalLookupEvidence.outcome = 'MATCHED';
  assertRejected(createHarness().prepare(bundle), 'INVALID_NORMAL_LOOKUP_EVIDENCE');
});

test('normal lookup must use exact-property-address mode', () => {
  const bundle = fixture();
  bundle.normalLookupEvidence.source.lookupQueryMode = 'other';
  assertRejected(createHarness().prepare(bundle), 'INVALID_NORMAL_LOOKUP_EVIDENCE');
});

test('certified owner evidence must use certified_opa_account', () => {
  const bundle = fixture();
  bundle.ownerEvidenceResult.source.lookupQueryMode = 'exact_property_address';
  assertRejected(createHarness().prepare(bundle), 'INVALID_CERTIFIED_OWNER_EVIDENCE');
});

test('certification account mismatch fails closed', () => {
  const bundle = fixture();
  bundle.propertySourceIdentityCertification.sourceOpaAccountNum = '999999999';
  bundle.propertySourceIdentityCertification.opaParcelNumber = '999999999';
  assertRejected(createHarness().prepare(bundle), 'CERTIFIED_OPA_ACCOUNT_MISMATCH');
});

test('certification basis mismatch fails closed', () => {
  const bundle = fixture();
  bundle.ownerEvidenceResult.certificationBasis = 'WRONG';
  assertRejected(createHarness().prepare(bundle), 'INVALID_CERTIFIED_OWNER_EVIDENCE');
});

test('target row mismatch across artifacts fails closed', () => {
  const bundle = fixture();
  bundle.comparisonResult.target.rowNumber = 1531;
  assertRejected(createHarness().prepare(bundle), 'TARGET_IDENTITY_MISMATCH');
});

test('Distress Lead ID mismatch across artifacts fails closed', () => {
  const bundle = fixture();
  bundle.classificationResult.target.identity['Distress Lead ID'] = 'DL-OTHER';
  assertRejected(createHarness().prepare(bundle), 'TARGET_IDENTITY_MISMATCH');
});

test('Canonical Property Key mismatch across artifacts fails closed', () => {
  const bundle = fixture();
  bundle.ownerEvidenceResult.target.identity['Canonical Property Key'] = 'property|other';
  assertRejected(createHarness().prepare(bundle), 'TARGET_IDENTITY_MISMATCH');
});

test('comparison/classification outcome mismatch fails closed', () => {
  const bundle = fixture();
  bundle.classificationResult.upstreamComparisonOutcome = 'MAILING_ADDRESS_MATCHES';
  assertRejected(createHarness().prepare(bundle), 'INVALID_CLASSIFICATION_RESULT');
});

test('normalized address mismatch fails closed', () => {
  const bundle = fixture();
  bundle.classificationResult.normalizedMailingAddress.street = 'OTHER';
  assertRejected(createHarness().prepare(bundle), 'COMPARISON_CLASSIFICATION_LINKAGE_MISMATCH');
});

test('differing-component mismatch fails closed', () => {
  const bundle = fixture();
  bundle.classificationResult.differingComponents = ['street'];
  assertRejected(createHarness().prepare(bundle), 'DIFFERING_COMPONENTS_MISMATCH');
});

test('unexpected true authority flag is rejected', () => {
  const bundle = fixture();
  bundle.ownerEvidenceResult.classificationPersistenceAuthorityGranted = true;
  assertRejected(createHarness().prepare(bundle), 'INVALID_CERTIFIED_OWNER_EVIDENCE');
});

test('unknown field in certified evidence is rejected', () => {
  const bundle = fixture();
  bundle.propertySourceIdentityCertification.unexpected = 'NO';
  assertRejected(createHarness().prepare(bundle), 'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION');
});

test('unknown top-level evidence artifact is rejected', () => {
  const bundle = fixture();
  bundle.extraArtifact = {};
  assertRejected(createHarness().prepare(bundle), 'INVALID_EVIDENCE_BUNDLE');
});

test('ineligible classification outcome cannot be persisted', () => {
  const bundle = fixture();
  bundle.classificationResult.outcome = 'INELIGIBLE_COMPARISON_EVIDENCE';
  assertRejected(createHarness().prepare(bundle), 'INVALID_CLASSIFICATION_RESULT');
});

test('v1 canonical helpers are mandatory', () => {
  assertRejected(
    createHarness(false).prepare(fixture()),
    'CANONICAL_HELPERS_UNAVAILABLE'
  );
});

test('caller cannot supply store-controlled observation time', () => {
  const bundle = fixture();
  bundle.observedAtUtc = '2026-10-08T15:00:00.000Z';
  assertRejected(createHarness().prepare(bundle), 'INVALID_EVIDENCE_BUNDLE');
});

test('unsafe persisted dual identity fails closed', () => {
  const bundle = fixture();
  for (const artifact of [
    bundle.propertySourceIdentityCertification.target,
    bundle.normalLookupEvidence.target,
    bundle.ownerEvidenceResult.target,
    bundle.comparisonResult.target,
    bundle.classificationResult.target
  ]) {
    artifact.identity['Distress Lead ID'] = '=FORMULA';
  }
  assertRejected(
    createHarness().prepare(bundle),
    'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_TARGET'
  );
});

console.log('');
console.log('ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_CERTIFIED_PROPERTY_SOURCE_PROVENANCE_PLANNER_BEHAVIOR_V2_VALID=true');
console.log('BEHAVIOR_CASES=' + count);
console.log('VALID_INDICATED=true');
console.log('VALID_MATCHED=true');
console.log('VALID_INSUFFICIENT=true');
console.log('DETERMINISTIC_ARTIFACT_HASHES=true');
console.log('DETERMINISTIC_AOCE2_EVENT_ID=true');
console.log('RAW_OWNER_NAME_PERSISTENCE=false');
console.log('STORE_CONTROLLED_FIELDS_CALLER_SUPPLIED=false');
console.log('V1_CANONICAL_HELPERS_REQUIRED=true');
console.log('DOWNSTREAM_AUTHORITY=false');
