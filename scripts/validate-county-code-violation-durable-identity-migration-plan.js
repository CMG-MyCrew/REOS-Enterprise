#!/usr/bin/env node

'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const path =
  require('path');

const vm =
  require('vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const MODULE =
  path.join(
    ROOT,
    'build/apps-script-brand/CountyCodeViolationDurableIdentityMigrationPlan.js'
  );

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

console.log(
  '=== GATE 2B READ-ONLY DURABLE IDENTITY MIGRATION PLAN CONTRACT ==='
);


/*
 * Static authority boundary.
 */
[
  [/REOS\.Database\.insert\s*\(/, 'Database.insert'],
  [/REOS\.Database\.update\s*\(/, 'Database.update'],
  [/\.setValues\s*\(/, 'setValues'],
  [/\.deleteRow\s*\(/, 'deleteRow'],
  [/\.deleteRows\s*\(/, 'deleteRows'],
  [/UrlFetchApp/, 'UrlFetchApp'],
  [/CountyAdapters\s*\./, 'CountyAdapters'],
  [/ScriptApp\.newTrigger\s*\(/, 'newTrigger'],
  [/reosCountyProductionSchedulerRun\s*\(/, 'scheduler run']
].forEach(
  ([pattern, label]) => {
    assert.equal(
      pattern.test(source),
      false,
      `forbidden read-only surface: ${label}`
    );
  }
);

[
  'collapseAuthorityGranted',
  'reviewRepairAuthorityGranted',
  'winnerSelectionAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(
  field => {
    assert.match(
      source,
      new RegExp(
        field +
        ':\\s*false'
      ),
      `${field} must remain false`
    );
  }
);

assert.match(
  source,
  /migrationRequiredRecords:\s*migrationRequired/,
  'complete migration-required records must be returned'
);

assert.match(
  source,
  /alreadyDurableRecords:\s*alreadyDurable/,
  'complete already-durable records must be returned'
);

assert.match(
  source,
  /planBlockedRecords:\s*blocked/,
  'complete blocked records must be returned'
);

console.log(
  'PASS: module is structurally read-only and exposes complete plan populations'
);


function digestBytes(value) {
  return Array.from(
    crypto
      .createHash('sha256')
      .update(
        String(value),
        'utf8'
      )
      .digest()
  );
}


function makeHarness(
  rows,
  options = {}
) {
  const headers = [
    'Distress Lead ID',
    'Source',
    'Source Dataset',
    'Source Record ID',
    'Violation Number',
    'Parcel ID',
    'Address',
    'City',
    'State',
    'County',
    'Zip',
    'Source Observation Key',
    'Source Record Key',
    'Canonical Property Key'
  ];

  let adminCalls = 0;

  const context = {
    console,

    Utilities: {
      DigestAlgorithm: {
        SHA_256:
          'SHA_256'
      },

      Charset: {
        UTF_8:
          'UTF_8'
      },

      computeDigest(
        algorithm,
        value
      ) {
        assert.equal(
          algorithm,
          'SHA_256'
        );

        return digestBytes(
          value
        );
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        if (
          options.schedulerArmed ===
          true
        ) {
          return [
            {
              getHandlerFunction() {
                return 'reosCountyProductionSchedulerRun';
              }
            }
          ];
        }

        return [];
      }
    },

    REOS: {
      Database: {
        getHeaders(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          return headers.slice();
        },

        getAll(table) {
          assert.equal(
            table,
            'DISTRESS_LEADS'
          );

          return rows.map(
            row =>
              Object.assign(
                {},
                row
              )
          );
        }
      },

      Security: {
        requireAdmin() {
          adminCalls +=
            1;
        }
      },

      CanonicalPropertyIdentity: {
        tryCanonicalPropertyIdentity(
          row
        ) {
          if (
            row.__canonicalUnavailable ===
            true
          ) {
            return {
              ok: false
            };
          }

          const parcel =
            String(
              row['Parcel ID'] ||
              ''
            ).trim();

          if (!parcel) {
            return {
              ok: false
            };
          }

          return {
            ok: true,

            key:
              row.__canonicalOverride ||
              (
                'property|parcel|pa|philadelphia|' +
                parcel.toLowerCase()
              )
          };
        }
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context,
    {
      filename:
        MODULE
    }
  );

  return {
    run() {
      return context
        .REOS
        .CountyCodeViolationDurableIdentityMigrationPlan
        .build({});
    },

    adminCalls() {
      return adminCalls;
    }
  };
}


function legacyRow(
  n,
  parcel,
  options = {}
) {
  const objectId =
    String(
      options.objectId ||
      (100000 + n)
    );

  const violation =
    options.violationNumber ===
      undefined
      ? `V-${n}`
      : options.violationNumber;

  const legacyKey =
    `pa-philadelphia|code_violations|${objectId}`;

  const canonical =
    parcel
      ? (
          'property|parcel|pa|philadelphia|' +
          String(parcel).toLowerCase()
        )
      : '';

  return Object.assign(
    {
      _rowNumber:
        n + 1,

      'Distress Lead ID':
        `DL-${n}`,

      Source:
        'PA-PHILADELPHIA',

      'Source Dataset':
        'code_violations',

      'Source Record ID':
        objectId,

      'Violation Number':
        violation,

      'Parcel ID':
        parcel,

      Address:
        `${n} Market Street`,

      City:
        'Philadelphia',

      State:
        'PA',

      County:
        'Philadelphia',

      Zip:
        '19107',

      'Source Observation Key':
        legacyKey,

      'Source Record Key':
        legacyKey,

      'Canonical Property Key':
        canonical
    },
    options.extra ||
      {}
  );
}


function durableKey(
  violation
) {
  return (
    'pa-philadelphia|code_violations|' +
    String(violation)
      .trim()
      .toLowerCase()
  );
}


/*
 * Basic migration-ready legacy row.
 */
{
  const h =
    makeHarness([
      legacyRow(
        1,
        '881111001'
      )
    ]);

  const result =
    h.run();

  assert.equal(
    h.adminCalls(),
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
    result.countySchedulerTriggerCount,
    0
  );

  assert.equal(
    result.migrationReadyAuditRows,
    1
  );

  assert.equal(
    result.migrationRequiredRows,
    1
  );

  assert.equal(
    result.planBlockedRows,
    0
  );

  assert.equal(
    result.migrationRequiredRecords[0]
      .proposedDurableKey,
    durableKey('V-1')
  );

  assert.equal(
    result.migrationRequiredRecords[0]
      .alreadyDurable,
    false
  );

  console.log(
    'PASS: unique historical row becomes migration-required'
  );
}


/*
 * Already durable row is idempotently excluded from rewrite.
 */
{
  const row =
    legacyRow(
      2,
      '881111002'
    );

  const key =
    durableKey(
      'V-2'
    );

  row[
    'Source Observation Key'
  ] = key;

  row[
    'Source Record Key'
  ] = key;

  const result =
    makeHarness([
      row
    ]).run();

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  assert.equal(
    result.alreadyDurableRows,
    1
  );

  assert.equal(
    result.planBlockedRows,
    0
  );

  console.log(
    'PASS: already-durable row receives no rewrite request'
  );
}


/*
 * Durable duplicates remain collapse-required.
 */
{
  const result =
    makeHarness([
      legacyRow(
        3,
        '881111003',
        {
          violationNumber:
            'V-DUP'
        }
      ),

      legacyRow(
        4,
        '881111003',
        {
          violationNumber:
            'V-DUP'
        }
      )
    ]).run();

  assert.equal(
    result.collapseRequiredRows,
    2
  );

  assert.equal(
    result.migrationReadyAuditRows,
    0
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: collapse-required rows are excluded'
  );
}


/*
 * Durable-key property conflicts remain review-required.
 */
{
  const result =
    makeHarness([
      legacyRow(
        5,
        '881111005',
        {
          violationNumber:
            'V-CONFLICT'
        }
      ),

      legacyRow(
        6,
        '881111006',
        {
          violationNumber:
            'V-CONFLICT'
        }
      )
    ]).run();

  assert.equal(
    result.collapseRequiredRows,
    2
  );

  assert.equal(
    result.reviewRequiredRows,
    2
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: canonical-property conflicts remain outside migration authority'
  );
}


/*
 * Recycled legacy ObjectID across durable violations is review-required.
 */
{
  const result =
    makeHarness([
      legacyRow(
        7,
        '881111007',
        {
          violationNumber:
            'V-A',
          objectId:
            '700'
        }
      ),

      legacyRow(
        8,
        '881111007',
        {
          violationNumber:
            'V-B',
          objectId:
            '700'
        }
      )
    ]).run();

  assert.equal(
    result.reviewRequiredRows,
    2
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: legacy ObjectID reuse remains review-required'
  );
}


/*
 * Missing canonical identity remains review-required.
 */
{
  const row =
    legacyRow(
      9,
      '881111009'
    );

  row.__canonicalUnavailable =
    true;

  const result =
    makeHarness([
      row
    ]).run();

  assert.equal(
    result.reviewRequiredRows,
    1
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: missing canonical identity remains review-required'
  );
}


/*
 * Audit-ready row with invalid Gate 2A runtime Violation Number is
 * blocked rather than made executable.
 */
{
  const result =
    makeHarness([
      legacyRow(
        10,
        '881111010',
        {
          violationNumber:
            'BAD VALUE'
        }
      )
    ]).run();

  assert.equal(
    result.migrationReadyAuditRows,
    1
  );

  assert.equal(
    result.planBlockedRows,
    1
  );

  assert.ok(
    result.planBlockedRecords[0]
      .planBlockReasons
      .includes(
        'runtime_violation_number_invalid'
      )
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: stricter Gate 2A Violation Number domain blocks unsafe plan row'
  );
}


/*
 * Stored observation keys must agree.
 */
{
  const row =
    legacyRow(
      11,
      '881111011'
    );

  row[
    'Source Record Key'
  ] =
    'pa-philadelphia|code_violations|999999';

  const result =
    makeHarness([
      row
    ]).run();

  assert.equal(
    result.migrationReadyAuditRows,
    1
  );

  assert.equal(
    result.planBlockedRows,
    1
  );

  assert.ok(
    result.planBlockedRecords[0]
      .planBlockReasons
      .includes(
        'stored_observation_keys_disagree'
      )
  );

  console.log(
    'PASS: stored observation-key disagreement blocks execution planning'
  );
}


/*
 * Stored canonical key must already exist and agree.
 */
{
  const missing =
    legacyRow(
      12,
      '881111012'
    );

  missing[
    'Canonical Property Key'
  ] = '';

  const mismatch =
    legacyRow(
      13,
      '881111013'
    );

  mismatch[
    'Canonical Property Key'
  ] =
    'property|parcel|pa|philadelphia|DIFFERENT';

  const result =
    makeHarness([
      missing,
      mismatch
    ]).run();

  assert.equal(
    result.planBlockedRows,
    2
  );

  assert.equal(
    result.migrationRequiredRows,
    0
  );

  console.log(
    'PASS: stored canonical identity must exist and match before execution planning'
  );
}


/*
 * Plan is complete, not sample-limited.
 */
{
  const rows =
    [];

  for (
    let i = 1;
    i <= 300;
    i += 1
  ) {
    rows.push(
      legacyRow(
        1000 + i,
        String(
          990000000 + i
        ),
        {
          violationNumber:
            `VX-${i}`,
          objectId:
            String(
              800000 + i
            )
        }
      )
    );
  }

  const result =
    makeHarness(
      rows
    ).run();

  assert.equal(
    result.migrationReadyAuditRows,
    300
  );

  assert.equal(
    result.migrationRequiredRows,
    300
  );

  assert.equal(
    result.migrationRequiredRecords.length,
    300
  );

  assert.equal(
    result.planBlockedRows,
    0
  );

  console.log(
    'PASS: migration plan returns complete population beyond historical sample limit'
  );
}


/*
 * Ordering and hashes are deterministic independent of source row order.
 */
{
  const rows = [
    legacyRow(
      20,
      '881111020',
      {
        violationNumber:
          'V-Z'
      }
    ),

    legacyRow(
      21,
      '881111021',
      {
        violationNumber:
          'V-A'
      }
    ),

    legacyRow(
      22,
      '881111022',
      {
        violationNumber:
          'V-M'
      }
    )
  ];

  const forward =
    makeHarness(
      rows
    ).run();

  const reverse =
    makeHarness(
      rows
        .slice()
        .reverse()
    ).run();

  assert.equal(
    forward
      .migrationPlanSha256,
    reverse
      .migrationPlanSha256
  );

  assert.equal(
    forward
      .completePlanSha256,
    reverse
      .completePlanSha256
  );

  assert.deepEqual(
    forward
      .migrationRequiredRecords
      .map(
        record =>
          record.proposedDurableKey
      ),
    reverse
      .migrationRequiredRecords
      .map(
        record =>
          record.proposedDurableKey
      )
  );

  console.log(
    'PASS: migration-plan ordering and SHA-256 evidence are deterministic'
  );
}


/*
 * Scheduler quiescence is mandatory even though the module is read-only.
 */
{
  assert.throws(
    () => {
      makeHarness(
        [
          legacyRow(
            30,
            '881111030'
          )
        ],
        {
          schedulerArmed:
            true
        }
      ).run();
    },
    /zero managed county scheduler triggers/
  );

  console.log(
    'PASS: active county scheduler fails closed before plan authority'
  );
}


/*
 * All authority flags remain false.
 */
{
  const result =
    makeHarness([
      legacyRow(
        40,
        '881111040'
      )
    ]).run();

  [
    'collapseAuthorityGranted',
    'reviewRepairAuthorityGranted',
    'winnerSelectionAuthorityGranted',
    'productionDataMutationAuthorityGranted',
    'connectorExecutionAuthorityGranted',
    'checkpointMutationAuthorityGranted',
    'schedulerAuthorityGranted',
    'migrationAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(
    field => {
      assert.equal(
        result[field],
        false,
        `${field} must remain false`
      );
    }
  );

  console.log(
    'PASS: no mutation, collapse, review, scheduler, or offer authority is granted'
  );
}


console.log();
console.log(
  'Gate 2B durable identity migration plan validation PASSED.'
);
