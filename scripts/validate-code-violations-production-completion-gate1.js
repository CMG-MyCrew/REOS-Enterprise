#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT =
  path.resolve(__dirname, '..');

const MODULE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGate1Reconciliation.js'
  );

const CATALOG =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationGate1PopulationAuthority.js'
  );

const MANIFEST =
  path.join(
    ROOT,
    'certification/evidence/code-violations-production-completion/gate1-population/gate1-certified-population-authority-v1.json'
  );

const CERTIFIED_ENDPOINT =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

const catalogSource =
  fs.readFileSync(
    CATALOG,
    'utf8'
  );

const manifest =
  JSON.parse(
    fs.readFileSync(
      MANIFEST,
      'utf8'
    )
  );

function requirePattern(
  pattern,
  message
) {
  assert.ok(
    pattern.test(source),
    message
  );
}

console.log(
  '=== CODE VIOLATIONS GATE 1 DURABLE POPULATION RECONCILIATION CONTRACT ==='
);

requirePattern(
  /CountyCodeViolationGate1PopulationAuthority/,
  'Gate 1 must consume certified durable population authority'
);

requirePattern(
  /EXPECTED_POPULATION_COUNT\s*=\s*168/,
  'Gate 1 must remain exactly 168 durable observations'
);

requirePattern(
  /EXPECTED_OPEN_COUNT\s*=\s*153/,
  'Gate 1 must remain exactly 153 OPEN observations'
);

requirePattern(
  /SOURCE_CHUNK_SIZE\s*=\s*20/,
  'Gate 1 source reads must remain bounded to 20 durable keys'
);

requirePattern(
  /violationnumber IN \(/,
  'Gate 1 source membership must use Violation Number'
);

assert.equal(
  /HISTORICAL_OBJECTID_CAP/.test(source),
  false
);

assert.equal(
  /BOUNDARY_VIOLATION_NUMBER/.test(source),
  false
);

assert.equal(
  /objectid\s*>/i.test(source),
  false,
  'current ObjectID cannot define cohort membership'
);

requirePattern(
  /currentObjectIdIsMembershipAuthority\s*:\s*false/,
  'current ObjectID membership authority must be false'
);

requirePattern(
  /currentObjectIdIsRecoveryAuthority\s*:\s*false/,
  'current ObjectID recovery authority must be false'
);

requirePattern(
  /certifiedEvidenceObjectId/,
  'certified historical ObjectID evidence must remain explicit'
);

requirePattern(
  /currentObjectIdObservationKey/,
  'current ObjectID telemetry must remain explicit'
);

[
  /Database\.insert\s*\(/,
  /Database\.update\s*\(/,
  /Database\.delete/i,
  /setProperty\s*\(/,
  /newTrigger\s*\(/,
  /deleteTrigger\s*\(/
].forEach(forbidden => {
  assert.equal(
    forbidden.test(source),
    false,
    'forbidden mutation authority: ' +
      forbidden
  );
});

assert.equal(
  manifest.records.length,
  168
);

const manifestByViolation =
  new Map(
    manifest.records.map(
      record => [
        String(
          record.violationNumber
        ).trim().toUpperCase(),
        record
      ]
    )
  );

const openRecords =
  manifest.records.filter(
    record =>
      String(
        record.evidenceStatus
      ).toUpperCase() ===
        'OPEN'
  );

assert.equal(
  openRecords.length,
  153
);

function makeSandbox(
  persistedRows
) {
  const requested = [];
  let fetchCount = 0;

  const sandbox = {
    console,
    JSON,
    String,
    Object,
    Array,

    REOS: {},

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return CERTIFIED_ENDPOINT;
          }
        };
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return [];
      }
    }
  };

  vm.createContext(sandbox);

  vm.runInContext(
    catalogSource,
    sandbox,
    {
      filename:
        CATALOG
    }
  );

  sandbox.REOS.Database = {
    getAll() {
      return persistedRows;
    }
  };

  sandbox.REOS.Security = {
    requireAdmin() {}
  };

  sandbox.REOS.CanonicalPropertyIdentity = {
    tryCanonicalPropertyIdentity(record) {
      const parcel =
        String(
          record &&
          record['Parcel ID'] !== undefined
            ? record['Parcel ID']
            : ''
        ).trim();

      return parcel
        ? {
            ok: true,
            key:
              'property|parcel|pa|philadelphia|' +
              parcel
          }
        : {
            ok: false
          };
    }
  };

  sandbox.REOS.CountyAdapters = {
    ArcGIS: {
      fetch(options) {
        fetchCount += 1;

        const where =
          String(
            options.where || ''
          );

        assert.equal(
          /objectid\s*>/i.test(
            where
          ),
          false
        );

        const violations =
          Array.from(
            where.matchAll(
              /'(VI-\d{4}-\d+)'/g
            )
          ).map(
            match =>
              match[1]
          );

        assert.ok(
          violations.length >= 1
        );

        assert.ok(
          violations.length <= 20
        );

        violations.forEach(
          violation => {
            assert.ok(
              manifestByViolation.has(
                violation
              )
            );

            requested.push(
              violation
            );
          }
        );

        return {
          records:
            violations.map(
              violation => {
                const record =
                  manifestByViolation.get(
                    violation
                  );

                /*
                 * Deliberately resequence current ObjectID.
                 * This must not change durable membership or recovery authority.
                 */
                const currentObjectId =
                  String(
                    Number(
                      record.evidenceObjectId
                    ) +
                    670
                  );

                return {
                  objectid:
                    currentObjectId,

                  violationnumber:
                    record.violationNumber,

                  violationdate:
                    record.evidenceViolationDate,

                  parcel_id_num:
                    record.expectedParcelId,

                  opa_account_num:
                    '',

                  address:
                    record.evidenceAddress,

                  zip:
                    '',

                  violationstatus:
                    record.evidenceStatus,

                  caseprioritydesc:
                    record.priority
                };
              }
            ),

          nextCursor:
            '',

          metadata: {
            adapter:
              'arcgis',

            status:
              200,

            durationMs:
              1,

            exceededTransferLimit:
              false
          }
        };
      }
    }
  };

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        MODULE
    }
  );

  return {
    sandbox,
    requested,
    getFetchCount() {
      return fetchCount;
    }
  };
}

/*
 * CASE 1:
 * A persisted unrelated row owns the NEW/current resequenced ObjectID.
 * It must NOT block the certified durable recovery candidate.
 */
const target =
  openRecords[0];

const currentObjectId =
  String(
    Number(
      target.evidenceObjectId
    ) +
    670
  );

const currentOidCollisionRow = {
  Source:
    'PA-PHILADELPHIA',

  'Source Dataset':
    'code_violations',

  'Distress Lead ID':
    'TEST-CURRENT-OID-COLLISION',

  'Violation Number':
    'VI-2099-999999',

  'Parcel ID':
    '999999',

  'Source Observation Key':
    'pa-philadelphia|code_violations|' +
    currentObjectId,

  'Source Record Key':
    'pa-philadelphia|code_violations|' +
    currentObjectId
};

const currentCase =
  makeSandbox([
    currentOidCollisionRow
  ]);

const currentResult =
  currentCase
    .sandbox
    .REOS
    .CountyCodeViolationGate1Reconciliation
    .run();

assert.equal(
  currentResult.ok,
  true
);

assert.equal(
  currentCase.getFetchCount(),
  9
);

assert.equal(
  currentResult.sourceAuthority
    .membershipAuthority,
  'Violation Number'
);

assert.equal(
  currentResult.sourceAuthority
    .currentObjectIdIsMembershipAuthority,
  false
);

assert.equal(
  currentResult.sourceAuthority
    .currentObjectIdIsRecoveryAuthority,
  false
);

assert.equal(
  currentResult.records.length,
  153
);

for (
  let index = 1;
  index < currentResult.records.length;
  index += 1
) {
  const previous =
    currentResult.records[
      index - 1
    ].source;

  const current =
    currentResult.records[
      index
    ].source;

  const previousDate =
    Number(
      previous.violationDate
    );

  const currentDate =
    Number(
      current.violationDate
    );

  const previousViolation =
    String(
      previous.violationNumber
    ).toUpperCase();

  const currentViolation =
    String(
      current.violationNumber
    ).toUpperCase();

  assert.ok(
    currentDate >
      previousDate ||
    (
      currentDate ===
        previousDate &&
      currentViolation >
        previousViolation
    ),
    'Gate 1 returned OPEN population must be strictly ordered by violationDate + Violation Number'
  );
}


assert.equal(
  currentResult.classificationCounts.MISSING,
  153,
  'current ObjectID collision must not veto durable recovery'
);

assert.equal(
  currentResult
    .classificationCounts
    .LEGACY_OBJECTID_COLLISION,
  0,
  'current ObjectID resequencing must not create legacy collision authority'
);

/*
 * CASE 2:
 * A row owning the ORIGINAL certified historical ObjectID with a different
 * durable Violation Number still represents legacy compatibility ambiguity
 * and must fail closed.
 */
const certifiedLegacyCollisionRow = {
  Source:
    'PA-PHILADELPHIA',

  'Source Dataset':
    'code_violations',

  'Distress Lead ID':
    'TEST-CERTIFIED-LEGACY-COLLISION',

  'Violation Number':
    'VI-2099-888888',

  'Parcel ID':
    '888888',

  'Source Observation Key':
    'pa-philadelphia|code_violations|' +
    String(
      target.evidenceObjectId
    ),

  'Source Record Key':
    'pa-philadelphia|code_violations|' +
    String(
      target.evidenceObjectId
    )
};

const legacyCase =
  makeSandbox([
    certifiedLegacyCollisionRow
  ]);

const legacyResult =
  legacyCase
    .sandbox
    .REOS
    .CountyCodeViolationGate1Reconciliation
    .run();

assert.equal(
  legacyResult
    .classificationCounts
    .LEGACY_OBJECTID_COLLISION,
  1,
  'certified historical legacy-key collision must remain fail-closed'
);

assert.equal(
  legacyResult
    .classificationCounts
    .MISSING,
  152
);

assert.equal(
  legacyResult.unresolvedConflictCount,
  1
);

assert.equal(
  legacyResult.productionDataMutationAuthorityGranted,
  false
);

assert.equal(
  legacyResult.checkpointMutationAuthorityGranted,
  false
);

assert.equal(
  legacyResult.schedulerAuthorityGranted,
  false
);

assert.equal(
  legacyResult.migrationAuthorityGranted,
  false
);

assert.equal(
  legacyResult.automaticOfferAuthorityGranted,
  false
);

console.log(
  'PASS: exact 168-row cohort membership derives only from durable Violation Number authority.'
);

console.log(
  'PASS: durable population is fetched through exactly nine bounded GET chunks.'
);

console.log(
  'PASS: resequenced current ObjectID cannot create recovery veto authority.'
);

console.log(
  'PASS: certified historical ObjectID retains only fail-closed legacy compatibility evidence.'
);

console.log(
  'PASS: Gate 1 remains structurally and behaviorally read-only.'
);

console.log(
  'Code Violations Production Completion Gate 1 durable reconciliation validation PASSED.'
);
