#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const ROOT = process.cwd();

const MODULE =
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryPreflight.js';

const AUTHORITY =
  'build/apps-script-brand/CountyCodeViolationGate1RecoveryAuthority.js';

const MANIFEST =
  'certification/evidence/code-violations-production-completion/gate1-recovery/gate1-missing-recovery-authority-v1.json';

const source =
  fs.readFileSync(MODULE, 'utf8');

const authoritySource =
  fs.readFileSync(AUTHORITY, 'utf8');

const manifest =
  JSON.parse(
    fs.readFileSync(MANIFEST, 'utf8')
  );

console.log(
  '=== CODE VIOLATIONS GATE 1 RECOVERY PREFLIGHT CONTRACT ==='
);

/*
 * Static no-write boundary.
 */
[
  /REOS\.Database\.(insert|update|upsert|softDelete)\s*\(/,
  /\.setValues\s*\(/,
  /\.setValue\s*\(/,
  /\.deleteRow\s*\(/,
  /\.deleteRows\s*\(/,
  /ScriptApp\.newTrigger\s*\(/,
  /PropertiesService[^]*\.setProperty\s*\(/,
  /PropertiesService[^]*\.deleteProperty\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    `forbidden mutation surface: ${pattern}`
  );
});

assert.ok(
  source.includes(
    'REOS.CountyCodeViolationGate1Reconciliation'
  ),
  'preflight must reuse certified Gate 1 reconciliation'
);

assert.equal(
  (
    source.match(
      /CountyCodeViolationGate1Reconciliation\s*\.\s*run\s*\(/g
    ) || []
  ).length,
  1,
  'preflight must invoke exactly one certified Gate 1 reconciliation'
);

assert.equal(
  /CountyAdapters[^]*\.fetch\s*\(/.test(source),
  false,
  'preflight must not create a second independent source fetch'
);

console.log(
  'PASS: preflight is structurally read-only and reuses exactly one certified Gate 1 reconciliation.'
);

function buildReconciliation(
  overrides = {}
) {
  const candidateRecords =
    manifest.candidates.map(candidate => ({
      classification: 'MISSING',

      source: {
        objectId:
          String(candidate.evidenceObjectId),

        violationNumber:
          candidate.violationNumber,

        violationDate:
          candidate.evidenceViolationDate,

        parcelId:
          String(candidate.expectedParcelId),

        address:
          candidate.evidenceAddress,

        violationStatus:
          'OPEN',

        priority:
          candidate.priority,

        durableObservationKey:
          candidate.durableObservationKey,

        legacyObjectIdObservationKey:
          candidate.evidenceLegacyObjectIdObservationKey,

        canonicalPropertyKey:
          candidate.expectedCanonicalPropertyKey
      },

      persistedDurableRowCount: 0,
      persistedDurableRows: [],
      legacyCollisionRowCount: 0,
      legacyCollisionRows: []
    }));

  const safeRecords =
    Array.from(
      { length: 14 },
      (_, index) => ({
        classification:
          'ALREADY_SAFE',

        source: {
          objectId:
            String(900000 + index),

          violationNumber:
            `VI-SAFE-${index + 1}`,

          violationDate:
            1700000000000 + index,

          parcelId:
            String(800000 + index),

          address:
            `SAFE ${index + 1}`,

          violationStatus:
            'OPEN',

          priority:
            'UNSAFE',

          durableObservationKey:
            `pa-philadelphia|code_violations|vi-safe-${index + 1}`,

          legacyObjectIdObservationKey:
            `pa-philadelphia|code_violations|${900000 + index}`,

          canonicalPropertyKey:
            `property|parcel|pa|philadelphia|${800000 + index}`
        },

        persistedDurableRowCount: 1,
        persistedDurableRows: [{}],
        legacyCollisionRowCount: 0,
        legacyCollisionRows: []
      })
    );

  const result = {
    ok: true,
    readOnly: true,
    mode:
      'CODE_VIOLATIONS_PRODUCTION_COMPLETION_GATE_1',

    connectorId:
      'PA-PHILADELPHIA',

    dataset:
      'code_violations',

    records:
      candidateRecords.concat(
        safeRecords
      ),

    countySchedulerTriggerCount:
      0,

    productionDataMutationAuthorityGranted:
      false,

    connectorExecutionAuthorityGranted:
      false,

    checkpointMutationAuthorityGranted:
      false,

    schedulerAuthorityGranted:
      false,

    repairAuthorityGranted:
      false,

    migrationAuthorityGranted:
      false,

    automaticOfferAuthorityGranted:
      false
  };

  Object.assign(
    result,
    overrides.top || {}
  );

  if (overrides.records) {
    result.records =
      overrides.records(
        result.records
      );
  }

  return result;
}

function loadHarness(
  reconciliation,
  authorityOverride
) {
  const sandbox = {
    REOS: {}
  };

  vm.runInNewContext(
    authoritySource,
    sandbox,
    {
      filename: AUTHORITY
    }
  );

  if (authorityOverride) {
    sandbox.REOS
      .CountyCodeViolationGate1RecoveryAuthority =
      authorityOverride(
        sandbox.REOS
          .CountyCodeViolationGate1RecoveryAuthority
      );
  }

  let calls = 0;

  sandbox.REOS
    .CountyCodeViolationGate1Reconciliation = {
      run() {
        calls += 1;
        return reconciliation;
      }
    };

  vm.runInNewContext(
    source,
    sandbox,
    {
      filename: MODULE
    }
  );

  return {
    sandbox,
    calls() {
      return calls;
    }
  };
}

/*
 * Exact happy-path population.
 */
{
  const harness =
    loadHarness(
      buildReconciliation()
    );

  const result =
    harness.sandbox.REOS
      .CountyCodeViolationGate1RecoveryPreflight
      .run();

  assert.equal(
    harness.calls(),
    1
  );

  assert.equal(
    result.ok,
    true
  );

  assert.equal(
    result.readOnly,
    true
  );

  assert.equal(
    result.recoveryAuthorityCount,
    139
  );

  assert.equal(
    result.stillMissingCount,
    139
  );

  assert.equal(
    result.alreadyPresentCount,
    0
  );

  assert.equal(
    result.nonRecoveryAlreadySafeCount,
    14
  );

  assert.equal(
    result.writeReadyCount,
    0
  );

  assert.equal(
    result.executableWritePayloadGenerated,
    false
  );

  assert.equal(
    result.productionDataMutationAuthorityGranted,
    false
  );

  assert.equal(
    result.insertAuthorityGranted,
    false
  );

  assert.equal(
    result.checkpointMutationAuthorityGranted,
    false
  );

  assert.equal(
    result.schedulerAuthorityGranted,
    false
  );

  assert.equal(
    result.automaticOfferAuthorityGranted,
    false
  );

  console.log(
    'PASS: all 139 certified durable authorities reconcile as still-missing with no write authority.'
  );
}

/*
 * An independently repaired/replayed candidate must become
 * ALREADY_PRESENT rather than create duplicate insert authority.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[0].classification =
          'ALREADY_SAFE';

        records[0].persistedDurableRowCount =
          1;

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  const result =
    harness.sandbox.REOS
      .CountyCodeViolationGate1RecoveryPreflight
      .run();

  assert.equal(
    result.stillMissingCount,
    138
  );

  assert.equal(
    result.alreadyPresentCount,
    1
  );

  assert.equal(
    result.insertAuthorityGranted,
    false
  );

  console.log(
    'PASS: already-present certified recovery identity is idempotently excluded from future insertion.'
  );
}

/*
 * ObjectID drift is diagnostic only.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[0].source.objectId =
          '999999999';

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  const result =
    harness.sandbox.REOS
      .CountyCodeViolationGate1RecoveryPreflight
      .run();

  assert.equal(
    result.objectIdChangedCount,
    1
  );

  assert.equal(
    result.stillMissingCount,
    139
  );

  console.log(
    'PASS: ArcGIS ObjectID drift remains evidence-only and does not redefine durable recovery identity.'
  );
}

/*
 * Canonical-property drift blocks.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[0]
          .source
          .canonicalPropertyKey =
          'property|parcel|pa|philadelphia|999999';

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /canonical property identity drift/
  );

  console.log(
    'PASS: canonical-property drift fails closed.'
  );
}

/*
 * Violation-date consistency guard blocks.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[0]
          .source
          .violationDate += 1;

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /violation-date identity guard drift/
  );

  console.log(
    'PASS: violation-date identity-guard drift fails closed.'
  );
}

/*
 * Duplicate/conflict states cannot become recovery authority.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[0].classification =
          'PROPERTY_CONFLICT';

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /unsafe reconciliation state/
  );

  console.log(
    'PASS: conflict classification fails closed before any mutation authority.'
  );
}

/*
 * A previously-safe non-recovery observation becoming missing is
 * outside the certified 139-record recovery authority.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        records[139].classification =
          'MISSING';

        return records;
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /Non-recovery Gate 1 observation is no longer safely persisted/
  );

  console.log(
    'PASS: newly missing observation outside the certified 139-record authority fails closed.'
  );
}

/*
 * Missing certified authority from the fresh OPEN population blocks
 * complete recovery certification.
 */
{
  const reconciliation =
    buildReconciliation({
      records(records) {
        return records.slice(1);
      }
    });

  const harness =
    loadHarness(
      reconciliation
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /reconciliation contract drift|authority coverage drift/
  );

  console.log(
    'PASS: incomplete fresh authority population fails closed.'
  );
}

/*
 * Authority metadata drift blocks before reconciliation execution.
 */
{
  const reconciliation =
    buildReconciliation();

  const harness =
    loadHarness(
      reconciliation,
      authority => ({
        resolve:
          authority.resolve,

        metadata() {
          const metadata =
            authority.metadata();

          metadata.candidateCount =
            138;

          return metadata;
        }
      })
    );

  assert.throws(
    () =>
      harness.sandbox.REOS
        .CountyCodeViolationGate1RecoveryPreflight
        .run(),
    /authority metadata mismatch/
  );

  assert.equal(
    harness.calls(),
    0
  );

  console.log(
    'PASS: authority-catalog metadata drift fails before production reconciliation I/O.'
  );
}

console.log('');
console.log(
  'PASS: CODE VIOLATIONS GATE 1 RECOVERY PREFLIGHT VALIDATION COMPLETE.'
);
