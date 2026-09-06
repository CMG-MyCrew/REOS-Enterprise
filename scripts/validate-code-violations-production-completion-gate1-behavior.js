#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const FILE =
  'build/apps-script-brand/CountyCodeViolationGate1Reconciliation.js';

const CERTIFIED_ENDPOINT =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';

const source = fs.readFileSync(FILE, 'utf8');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonical(row) {
  const parcel = String(row['Parcel ID'] || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (parcel) {
    return {
      ok: true,
      key: 'property|parcel|pa|philadelphia|' + parcel,
      authority: 'parcel'
    };
  }

  const address = String(row.Address || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const zip = String(row.Zip || '')
    .trim()
    .toLowerCase();

  if (address) {
    return {
      ok: true,
      key:
        'property|address|pa|philadelphia|' +
        zip +
        '|' +
        address,
      authority: 'address'
    };
  }

  return {
    ok: false,
    key: '',
    authority: '',
    error: 'identity unavailable'
  };
}

function sourceRow(index, options) {
  options = options || {};

  const number =
    options.violationNumber ||
    ('VI-TEST-' + String(index).padStart(6, '0'));

  return {
    objectid:
      options.objectId === undefined
        ? 700000 + index
        : options.objectId,

    violationnumber: number,
    violationdate: 1781000000000 + index * 1000,

    parcel_id_num:
      options.parcelId === undefined
        ? String(900000 + index)
        : options.parcelId,

    opa_account_num: '',
    address:
      options.address === undefined
        ? index + ' TEST ST'
        : options.address,

    zip: '19101',

    violationstatus:
      options.status || 'OPEN',

    caseprioritydesc:
      options.priority || 'UNSAFE'
  };
}

function persistedRow(options) {
  options = options || {};

  const sourceRecordId =
    String(options.sourceRecordId || '880001');

  return {
    _rowNumber: options.rowNumber || 10,
    Source: 'PA-PHILADELPHIA',
    'Source Dataset': 'code_violations',
    'Distress Lead ID':
      options.distressLeadId ||
      'DL-TEST-' + String(options.rowNumber || 10),

    'Source Record ID': sourceRecordId,
    'Violation Number': options.violationNumber,

    'Parcel ID': options.parcelId,
    Address: options.address || '100 TEST ST',
    City: 'Philadelphia',
    State: 'PA',
    County: 'Philadelphia',
    Zip: '19101',

    'Source Observation Key':
      options.sourceObservationKey ||
      (
        'pa-philadelphia|code_violations|' +
        sourceRecordId
      ),

    'Source Record Key':
      options.sourceRecordKey ||
      (
        'pa-philadelphia|code_violations|' +
        sourceRecordId
      )
  };
}

function basePopulation() {
  const rows = [];

  for (let i = 1; i <= 153; i += 1) {
    rows.push(sourceRow(i));
  }

  for (let i = 154; i <= 161; i += 1) {
    rows.push(
      sourceRow(i, {
        status: 'COMPLIED'
      })
    );
  }

  for (let i = 162; i <= 168; i += 1) {
    rows.push(
      sourceRow(i, {
        status: 'CLOSED'
      })
    );
  }

  return rows;
}

function harness(options) {
  options = options || {};

  const fetchCalls = [];
  const sourceRows =
    clone(options.sourceRows || basePopulation());

  const persistedRows =
    clone(options.persistedRows || []);

  const triggers = [];

  for (
    let i = 0;
    i < Number(options.triggerCount || 0);
    i += 1
  ) {
    triggers.push({
      getHandlerFunction() {
        return 'reosCountyProductionSchedulerRun';
      }
    });
  }

  const context = {
    console,

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty() {
            return (
              options.endpoint ||
              CERTIFIED_ENDPOINT
            );
          }
        };
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        return triggers;
      }
    },

    REOS: {
      Security: {
        requireAdmin() {
          return true;
        }
      },

      Database: {
        getAll() {
          return clone(persistedRows);
        },

        insert() {
          throw new Error(
            'Unexpected production insert.'
          );
        },

        update() {
          throw new Error(
            'Unexpected production update.'
          );
        },

        upsert() {
          throw new Error(
            'Unexpected production upsert.'
          );
        },

        delete() {
          throw new Error(
            'Unexpected production delete.'
          );
        }
      },

      CanonicalPropertyIdentity: {
        tryCanonicalPropertyIdentity:
          canonical
      },

      CountyAdapters: {
        ArcGIS: {
          fetch(request) {
            fetchCalls.push(clone(request));

            return {
              records: clone(sourceRows),
              metadata: {
                synthetic: true
              }
            };
          }
        }
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: FILE
  });

  return {
    context,
    fetchCalls,

    run() {
      return context
        .reosCountyCodeViolationGate1Reconciliation();
    }
  };
}

/*
 * Build one 153-OPEN population containing every required
 * reconciliation classification.
 *
 * Rows 7-153 remain intentionally unpersisted and therefore
 * classify MISSING.
 */
const population = basePopulation();

population[0] = sourceRow(1, {
  violationNumber: 'VI-SAFE-000001',
  objectId: 700001,
  parcelId: '100001'
});

population[1] = sourceRow(2, {
  violationNumber: 'VI-MISSING-000002',
  objectId: 700002,
  parcelId: '100002'
});

population[2] = sourceRow(3, {
  violationNumber: 'VI-DUP-000003',
  objectId: 700003,
  parcelId: '100003'
});

population[3] = sourceRow(4, {
  violationNumber: 'VI-CONFLICT-000004',
  objectId: 700004,
  parcelId: '100004'
});

population[4] = sourceRow(5, {
  violationNumber: 'VI-COLLISION-000005',
  objectId: 700005,
  parcelId: '100005'
});

population[5] = sourceRow(6, {
  violationNumber: 'VI-NOIDENTITY-000006',
  objectId: 700006,
  parcelId: '',
  address: ''
});

const persisted = [
  persistedRow({
    rowNumber: 10,
    sourceRecordId: '700001',
    violationNumber: 'VI-SAFE-000001',
    parcelId: '100001'
  }),

  persistedRow({
    rowNumber: 20,
    sourceRecordId: '880020',
    violationNumber: 'VI-DUP-000003',
    parcelId: '100003'
  }),

  persistedRow({
    rowNumber: 21,
    sourceRecordId: '880021',
    violationNumber: 'VI-DUP-000003',
    parcelId: '100003'
  }),

  persistedRow({
    rowNumber: 30,
    sourceRecordId: '880030',
    violationNumber: 'VI-CONFLICT-000004',
    parcelId: '999999'
  }),

  persistedRow({
    rowNumber: 40,
    sourceRecordId: '700005',
    violationNumber: 'VI-DIFFERENT-999999',
    parcelId: '100005',
    sourceObservationKey:
      'pa-philadelphia|code_violations|700005',
    sourceRecordKey:
      'pa-philadelphia|code_violations|700005'
  })
];

const h = harness({
  sourceRows: population,
  persistedRows: persisted
});

const result = h.run();

assert.strictEqual(result.ok, true);
assert.strictEqual(result.readOnly, true);

assert.strictEqual(
  result.sourceAuthority.observedPreboundaryExcluded,
  168
);

assert.strictEqual(
  result.sourceAuthority.observedOpenActionable,
  153
);

assert.strictEqual(
  result.sourceAuthority.filteredNonOpen,
  15
);

assert.strictEqual(
  result.classificationCounts.ALREADY_SAFE,
  1
);

assert.strictEqual(
  result.classificationCounts.DUPLICATE_DURABLE,
  1
);

assert.strictEqual(
  result.classificationCounts.PROPERTY_CONFLICT,
  1
);

assert.strictEqual(
  result.classificationCounts.LEGACY_OBJECTID_COLLISION,
  1
);

assert.strictEqual(
  result.classificationCounts.SOURCE_IDENTITY_UNAVAILABLE,
  1
);

/*
 * One explicit MISSING record plus rows 7-153:
 * 1 + 147 = 148.
 */
assert.strictEqual(
  result.classificationCounts.MISSING,
  148
);

assert.strictEqual(
  result.backfillCandidateCount,
  148
);

assert.strictEqual(
  result.unresolvedConflictCount,
  4
);

assert.strictEqual(
  result.records.length,
  153
);

assert.strictEqual(
  result.productionDataMutationAuthorityGranted,
  false
);

assert.strictEqual(
  result.connectorExecutionAuthorityGranted,
  false
);

assert.strictEqual(
  result.checkpointMutationAuthorityGranted,
  false
);

assert.strictEqual(
  result.schedulerAuthorityGranted,
  false
);

assert.strictEqual(
  result.migrationAuthorityGranted,
  false
);

assert.strictEqual(
  result.automaticOfferAuthorityGranted,
  false
);

assert.strictEqual(
  result.countySchedulerTriggerCount,
  0
);

/* Exact source query contract. */
assert.strictEqual(
  h.fetchCalls.length,
  1
);

const request = h.fetchCalls[0];

assert.ok(
  request.where.includes(
    'objectid > 636638'
  )
);

assert.ok(
  request.where.includes(
    "2026-06-27 07:28:16"
  )
);

assert.ok(
  request.where.includes(
    "VI-2026-047721"
  )
);

assert.strictEqual(
  request.orderByFields,
  'violationdate ASC, violationnumber ASC'
);

assert.strictEqual(
  request.context.limit,
  500
);

/* Scheduler trigger presence must fail closed before source read. */
const triggered = harness({
  triggerCount: 1
});

assert.throws(
  () => triggered.run(),
  /requires zero managed county scheduler triggers/
);

assert.strictEqual(
  triggered.fetchCalls.length,
  0
);

/* Certified endpoint drift must fail closed. */
const endpointDrift = harness({
  endpoint: 'https://example.invalid/query'
});

assert.throws(
  () => endpointDrift.run(),
  /certified endpoint authority mismatch/
);

assert.strictEqual(
  endpointDrift.fetchCalls.length,
  0
);

/* Total source population drift must fail closed. */
const shortPopulation = basePopulation();
shortPopulation.pop();

assert.throws(
  () =>
    harness({
      sourceRows: shortPopulation
    }).run(),
  /source population drift/
);

/* OPEN/actionable population drift must fail closed. */
const actionableDrift = basePopulation();
actionableDrift[0].violationstatus = 'CLOSED';

assert.throws(
  () =>
    harness({
      sourceRows: actionableDrift
    }).run(),
  /actionable population drift/
);

console.log(
  'PASS: Code Violations Production Completion Gate 1 behavioral validation PASSED.'
);
