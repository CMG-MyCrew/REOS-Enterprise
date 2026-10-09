#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const runtimePath =
  path.join(
    ROOT,
    'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js'
  );

const runtimeSource =
  fs.readFileSync(
    runtimePath,
    'utf8'
  );

const PRECONDITION =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED';

const UNCERTAIN =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN';

const VERIFIED =
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED';

const ALREADY =
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED';

const V1_EQUIVALENT =
  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION';

const V1_HEADERS = [
  'Evidence Event ID',
  'Observed At UTC',
  'Persistence Contract Version',
  'Classification Contract Version',
  'Distress Lead ID',
  'Canonical Property Key',
  'Physical Row Number',
  'Classification Outcome',
  'Classification Basis',
  'Upstream Comparison Outcome',
  'Differing Components JSON',
  'Normalized Property Address JSON',
  'Normalized Mailing Address JSON',
  'Source Agency',
  'Source Dataset',
  'Source Table',
  'Source Endpoint',
  'Classifier Result SHA-256',
  'Previous Evidence SHA-256',
  'Evidence Event SHA-256'
];

const TARGET_DISTRESS =
  'DL-TEST-001';

const TARGET_KEY =
  'property|parcel|pa|philadelphia|1234567';

const V2_CLASSIFIER_SHA =
  'b'.repeat(64);

const OTHER_CLASSIFIER_SHA =
  'a'.repeat(64);

const GOOD_BUNDLE = {
  marker:
    'VALID_FIVE_ARTIFACT_BUNDLE'
};

const PLAN = {
  ok: true,
  persistenceContractVersion: 2,
  classificationContractVersion: 1,
  target: {
    rowNumber: 1530,
    identity: {
      'Distress Lead ID':
        TARGET_DISTRESS,

      'Canonical Property Key':
        TARGET_KEY
    }
  },
  classifierResultSha256:
    V2_CLASSIFIER_SHA,
  evidenceEventId:
    'AOCE2-' + 'c'.repeat(64)
};

function stable(value) {
  if (
    value === null ||
    typeof value !== 'object'
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return (
      '[' +
      value.map(stable).join(',') +
      ']'
    );
  }

  return (
    '{' +
    Object.keys(value)
      .sort()
      .map(key =>
        JSON.stringify(key) +
        ':' +
        stable(value[key])
      )
      .join(',') +
    '}'
  );
}

function sha(value) {
  return crypto
    .createHash('sha256')
    .update(stable(value))
    .digest('hex');
}

const v1Planner = {
  evidenceEventIdFor(details) {
    return 'AOCE-' + sha(details);
  },

  canonicalJson(value) {
    return stable(value);
  },

  hashCanonicalObject(value) {
    return sha(value);
  }
};

function v1Row(options = {}) {
  const option = (
    name,
    fallback
  ) => (
    Object.prototype.hasOwnProperty.call(
      options,
      name
    )
      ? options[name]
      : fallback
  );

  const classifier =
    options.classifierResultSha256 ||
    OTHER_CLASSIFIER_SHA;

  const distress =
    options.distressLeadId ||
    TARGET_DISTRESS;

  const canonical =
    options.canonicalPropertyKey ||
    TARGET_KEY;

  const previous =
    options.previousEvidenceSha256 ||
    'GENESIS';

  const row = [
    '',
    options.observedAtUtc ||
      '2026-10-09T00:00:00.000Z',
    options.persistenceContractVersion === undefined
      ? 1
      : options.persistenceContractVersion,
    options.classificationContractVersion === undefined
      ? 1
      : options.classificationContractVersion,
    distress,
    canonical,
    1530,
    option(
      'classificationOutcome',
      'ABSENTEE_OWNER_INDICATED'
    ),
    option(
      'classificationBasis',
      'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON'
    ),
    option(
      'upstreamComparisonOutcome',
      'MAILING_ADDRESS_DIFFERS'
    ),
    option(
      'differingComponentsJson',
      '["street"]'
    ),
    option(
      'normalizedPropertyAddressJson',
      '{"city":"Philadelphia","state":"PA","street":"100 A ST","zip":"19100"}'
    ),
    option(
      'normalizedMailingAddressJson',
      '{"city":"Philadelphia","state":"PA","street":"200 B ST","zip":"19100"}'
    ),
    option(
      'sourceAgency',
      'Philadelphia Office of Property Assessment'
    ),
    option(
      'sourceDataset',
      'Philadelphia Properties and Assessment History'
    ),
    option(
      'sourceTable',
      'opa_properties_public'
    ),
    option(
      'sourceEndpoint',
      'https://phl.carto.com/api/v2/sql'
    ),
    classifier,
    previous,
    ''
  ];

  row[0] =
    v1Planner
      .evidenceEventIdFor({
        persistenceContractVersion:
          row[2],

        classificationContractVersion:
          row[3],

        distressLeadId:
          row[4],

        canonicalPropertyKey:
          row[5],

        classifierResultSha256:
          row[17]
      });

  const payload = {};

  V1_HEADERS
    .slice(0, -1)
    .forEach((header, index) => {
      payload[header] =
        row[index];
    });

  row[19] =
    v1Planner
      .hashCanonicalObject(
        payload
      );

  if (options.badEventId) {
    row[0] =
      'AOCE-' + '0'.repeat(64);
  }

  if (options.badEventSha) {
    row[19] =
      '0'.repeat(64);
  }

  if (options.uppercaseClassifierSha) {
    row[17] =
      row[17].toUpperCase();
  }

  return row;
}

function harness(config = {}) {
  const state = {
    plannerCalls: 0,
    lockCalls: 0,
    assertLockCalls: 0,
    propertyGets: 0,
    propertySets: 0,
    openByIdCalls: 0,
    headerReads: 0,
    finderCalls: 0,
    matchEntireCellCalls: 0,
    findAllCalls: 0,
    storeCalls: 0,
    storeLockContext: null,
    storeWriteState: null,
    v1Mutations: 0,
    searchRangeArgs: null
  };

  const lockContext = {
    token:
      'LOCK'
  };

  const rows =
    (config.rows || [])
      .map(row => row.slice());

  const rowFormulas =
    (config.rowFormulas || rows.map(() =>
      new Array(20).fill('')
    ));

  function rangeFor(
    row,
    column,
    numRows,
    numColumns
  ) {
    if (
      row === 1 &&
      column === 1 &&
      numRows === 1 &&
      numColumns === 20
    ) {
      state.headerReads++;

      return {
        getValues() {
          return [
            config.headerValues ||
            V1_HEADERS.slice()
          ];
        },

        getFormulas() {
          return [
            config.headerFormulas ||
            new Array(20).fill('')
          ];
        }
      };
    }

    if (
      row === 2 &&
      column === 5 &&
      numColumns === 1
    ) {
      state.searchRangeArgs =
        [
          row,
          column,
          numRows,
          numColumns
        ];

      return {
        createTextFinder(value) {
          state.finderCalls++;

          assert.equal(
            value,
            TARGET_DISTRESS
          );

          return {
            matchEntireCell(flag) {
              state.matchEntireCellCalls++;

              assert.equal(
                flag,
                true
              );

              return this;
            },

            findAll() {
              state.findAllCalls++;

              let indexes;

              if (
                Array.isArray(
                  config.matchIndexes
                )
              ) {
                indexes =
                  config.matchIndexes.slice();
              } else {
                indexes =
                  rows
                    .map((item, index) => ({
                      item,
                      index
                    }))
                    .filter(entry =>
                      entry.item[4] ===
                      TARGET_DISTRESS
                    )
                    .map(entry =>
                      entry.index
                    );
              }

              return indexes.map(index => ({
                getRow() {
                  return index + 2;
                }
              }));
            }
          };
        }
      };
    }

    if (
      column === 1 &&
      numRows === 1 &&
      numColumns === 20 &&
      row >= 2
    ) {
      const index =
        row - 2;

      return {
        getValues() {
          return [
            rows[index].slice()
          ];
        },

        getFormulas() {
          return [
            rowFormulas[index]
              .slice()
          ];
        }
      };
    }

    throw new Error(
      'Unexpected getRange: ' +
      JSON.stringify([
        row,
        column,
        numRows,
        numColumns
      ])
    );
  }

  const sheet = {
    getLastRow() {
      return rows.length + 1;
    },

    getLastColumn() {
      return config.lastColumn || 20;
    },

    getRange:
      rangeFor,

    appendRow() {
      state.v1Mutations++;
      throw new Error(
        'V1 append is prohibited'
      );
    },

    deleteRow() {
      state.v1Mutations++;
      throw new Error(
        'V1 delete is prohibited'
      );
    },

    clear() {
      state.v1Mutations++;
      throw new Error(
        'V1 clear is prohibited'
      );
    }
  };

  const workbook = {
    getSheetByName(name) {
      assert.equal(
        name,
        'ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE'
      );

      return config.sheetMissing
        ? null
        : sheet;
    }
  };

  const properties = {
    getProperty(name) {
      state.propertyGets++;

      assert.equal(
        name,
        'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
      );

      return config.propertyMissing
        ? ''
        : 'evidence-workbook';
    },

    setProperty() {
      state.propertySets++;
      throw new Error(
        'property mutation prohibited'
      );
    }
  };

  const planner = {
    prepare(bundle) {
      state.plannerCalls++;

      if (config.plannerThrows) {
        throw new Error(
          'planner failure'
        );
      }

      if (
        config.planRejected ||
        !bundle ||
        bundle.marker !==
          GOOD_BUNDLE.marker
      ) {
        return {
          ok: false,
          code:
            'PLAN_REJECTED'
        };
      }

      return Object.assign(
        {},
        PLAN,
        {
          target: {
            rowNumber:
              PLAN.target.rowNumber,

            identity:
              Object.assign(
                {},
                PLAN.target.identity
              )
          }
        }
      );
    }
  };

  const store = {
    persist(plan, options) {
      state.storeCalls++;
      state.storeLockContext =
        options.lockContext;
      state.storeWriteState =
        options.writeState;

      assert.equal(
        plan.classifierResultSha256,
        V2_CLASSIFIER_SHA
      );

      if (
        config.storeMode ===
        'precondition_throw'
      ) {
        const error =
          new Error(
            'store precondition'
          );

        error.persistenceClassification =
          PRECONDITION;

        throw error;
      }

      if (
        config.storeMode ===
        'postwrite_throw'
      ) {
        options.writeState
          .writeAttempted =
          true;

        const error =
          new Error(
            'postwrite uncertainty'
          );

        error.persistenceClassification =
          UNCERTAIN;

        throw error;
      }

      if (
        config.storeMode ===
        'invalid_postwrite'
      ) {
        options.writeState
          .writeAttempted =
          true;

        return {
          ok: true,
          outcome:
            'INVALID_OUTCOME'
        };
      }

      if (
        config.storeMode ===
        'invalid_prewrite'
      ) {
        return {
          ok: true,
          outcome:
            'INVALID_OUTCOME'
        };
      }

      if (
        config.storeMode ===
        'already'
      ) {
        return {
          ok: true,
          outcome:
            ALREADY,
          disposition:
            'ALREADY_PERSISTED'
        };
      }

      options.writeState
        .writeAttempted =
        true;

      return {
        ok: true,
        outcome:
          VERIFIED,
        disposition:
          'PERSISTED'
      };
    }
  };

  const context = {
    console,
    Date,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    RegExp,
    JSON,

    REOS: {
      Database: {
        withScriptLockContext(work) {
          state.lockCalls++;

          if (config.lockThrows) {
            throw new Error(
              'lock unavailable'
            );
          }

          const result =
            work(
              lockContext
            );

          if (
            config.lockFinalizationThrows
          ) {
            throw new Error(
              'lock finalization failed'
            );
          }

          return result;
        },

        assertScriptLockContext(value) {
          state.assertLockCalls++;

          if (
            value !==
            lockContext
          ) {
            throw new Error(
              'invalid lock context'
            );
          }

          return true;
        }
      },

      AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2:
        planner,

      AbsenteeOwnerClassificationEvidenceStoreV2:
        store,

      AbsenteeOwnerClassificationEvidenceStore: {
        headers() {
          return config.exportedHeaders ||
            V1_HEADERS.slice();
        }
      },

      AbsenteeOwnerClassificationPersistencePlanner:
        v1Planner
    },

    PropertiesService: {
      getScriptProperties() {
        return properties;
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return {
          getId() {
            return config.activeAlias
              ? 'evidence-workbook'
              : 'active-reos';
          }
        };
      },

      openById(id) {
        state.openByIdCalls++;

        if (config.openThrows) {
          throw new Error(
            'cannot open'
          );
        }

        assert.equal(
          id,
          'evidence-workbook'
        );

        return workbook;
      }
    }
  };

  vm.createContext(context);

  vm.runInContext(
    runtimeSource,
    context,
    {
      filename:
        runtimePath
    }
  );

  const executor =
    context
      .REOS
      .AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2;

  return {
    state,
    execute(bundle = GOOD_BUNDLE) {
      return executor.execute(
        bundle
      );
    },
    lockContext
  };
}

function assertAllAuthorityFalse(result) {
  [
    'productionDataMutationAuthorityGranted',
    'ownerEvidencePersistenceAuthorityGranted',
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
    'offerGenerationAuthorityGranted',
    'offerSubmissionAuthorityGranted',
    'automaticOfferAuthorityGranted'
  ].forEach(field => {
    assert.strictEqual(
      result[field],
      false,
      `${field} must remain false`
    );
  });
}

let cases = 0;

function test(name, work) {
  work();
  cases++;
  console.log(
    `PASS ${cases}: ${name}`
  );
}

test('valid five-artifact bundle reaches verified V2 store result', () => {
  const h = harness();
  const result = h.execute();

  assert.equal(result.ok, true);
  assert.equal(result.outcome, VERIFIED);
});

test('invalid bundle is rejected before lock', () => {
  const h = harness();
  const result = h.execute({ arbitrary: true });

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.lockCalls, 0);
});

test('caller-supplied persistence-plan-shaped object is rejected', () => {
  const h = harness();
  const result = h.execute(PLAN);

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.lockCalls, 0);
});

test('exactly one ScriptLock acquisition occurs', () => {
  const h = harness();
  h.execute();

  assert.equal(h.state.lockCalls, 1);
});

test('V1 workbook Script Property is read only', () => {
  const h = harness();
  h.execute();

  assert.equal(h.state.propertyGets, 1);
  assert.equal(h.state.propertySets, 0);
});

test('exact V1 20-column headers are accepted', () => {
  const h = harness();
  const result = h.execute();

  assert.equal(result.ok, true);
  assert.equal(h.state.headerReads, 1);
});

test('formula-bearing V1 headers fail closed', () => {
  const formulas =
    new Array(20).fill('');
  formulas[0] = '=1';

  const h = harness({
    headerFormulas:
      formulas
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('V1 discovery uses bounded Distress Lead ID TextFinder', () => {
  const h = harness({
    rows: [
      v1Row({
        canonicalPropertyKey:
          'other'
      })
    ]
  });

  h.execute();

  assert.deepEqual(
    h.state.searchRangeArgs,
    [2, 5, 1, 1]
  );
  assert.equal(h.state.finderCalls, 1);
  assert.equal(h.state.matchEntireCellCalls, 1);
  assert.equal(h.state.findAllCalls, 1);
});

test('Canonical Property Key filtering excludes other identities', () => {
  const h = harness({
    rows: [
      v1Row({
        canonicalPropertyKey:
          'other'
      })
    ]
  });

  h.execute();

  assert.equal(h.state.storeCalls, 1);
});

test('retained V1 dual identity mismatch fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        distressLeadId:
          'OTHER'
      })
    ],
    matchIndexes: [0]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('V1 contract versions must remain 1/1', () => {
  const h = harness({
    rows: [
      v1Row({
        persistenceContractVersion: 2
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('V1 classifier-result hash must be lowercase SHA-256', () => {
  const h = harness({
    rows: [
      v1Row({
        uppercaseClassifierSha: true
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('V1 deterministic Evidence Event ID is verified', () => {
  const h = harness({
    rows: [
      v1Row({
        badEventId: true
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('V1 deterministic event hash is verified', () => {
  const h = harness({
    rows: [
      v1Row({
        badEventSha: true
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('first retained V1 event must chain to GENESIS', () => {
  const h = harness({
    rows: [
      v1Row({
        previousEvidenceSha256:
          '1'.repeat(64)
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('later retained V1 event must chain to previous exact event', () => {
  const first =
    v1Row();

  const second =
    v1Row({
      classifierResultSha256:
        'c'.repeat(64),
      previousEvidenceSha256:
        first[19]
    });

  const h = harness({
    rows: [
      first,
      second
    ]
  });

  const result = h.execute();

  assert.equal(result.ok, true);
  assert.equal(h.state.storeCalls, 1);
});

test('malformed retained V1 row fails closed', () => {
  const formulas =
    new Array(20).fill('');
  formulas[4] = '=A1';

  const h = harness({
    rows: [
      v1Row()
    ],
    rowFormulas: [
      formulas
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('hash-consistent V1 row with invalid classification basis fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        classificationBasis:
          'INVALID_CLASSIFICATION_BASIS'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('hash-consistent V1 row with invalid upstream outcome mapping fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        upstreamComparisonOutcome:
          'MAILING_ADDRESS_MATCHES'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('hash-consistent V1 row with noncanonical differing-components JSON fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        differingComponentsJson:
          '[ "street" ]'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('hash-consistent V1 row with noncanonical normalized address JSON fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        normalizedPropertyAddressJson:
          '{"street":"100 A ST","city":"Philadelphia","state":"PA","zip":"19100"}'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('hash-consistent V1 row with invalid source provenance fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        sourceAgency:
          'INVALID SOURCE AGENCY'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('hash-consistent V1 row with unsafe spreadsheet text fails closed', () => {
  const h = harness({
    rows: [
      v1Row({
        sourceDataset:
          '=UNSAFE'
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
  assert.equal(h.state.storeCalls, 0);
});

test('V1-equivalent classifier evidence produces explicit reconciliation stop', () => {
  const h = harness({
    rows: [
      v1Row({
        classifierResultSha256:
          V2_CLASSIFIER_SHA
      })
    ]
  });

  const result = h.execute();

  assert.equal(result.ok, false);
  assert.equal(result.outcome, PRECONDITION);
  assert.equal(result.code, V1_EQUIVALENT);
});

test('V1 equivalence performs zero V2 writes', () => {
  const h = harness({
    rows: [
      v1Row({
        classifierResultSha256:
          V2_CLASSIFIER_SHA
      })
    ]
  });

  h.execute();

  assert.equal(h.state.storeCalls, 0);
});

test('V1 equivalence performs no migration mutation', () => {
  const h = harness({
    rows: [
      v1Row({
        classifierResultSha256:
          V2_CLASSIFIER_SHA
      })
    ]
  });

  h.execute();

  assert.equal(h.state.v1Mutations, 0);
});

test('no-equivalent-V1 path permits exactly one V2 store invocation', () => {
  const h = harness();
  h.execute();

  assert.equal(h.state.storeCalls, 1);
});

test('same active lock context reaches V2 store', () => {
  const h = harness();
  h.execute();

  assert.strictEqual(
    h.state.storeLockContext,
    h.lockContext
  );
});

test('one mutable write-state token reaches V2 store', () => {
  const h = harness();
  h.execute();

  assert.ok(
    h.state.storeWriteState &&
    typeof h.state.storeWriteState === 'object'
  );

  assert.strictEqual(
    h.state.storeWriteState.writeAttempted,
    true
  );
});

test('valid V2 duplicate is zero-new-write success', () => {
  const h = harness({
    storeMode:
      'already'
  });

  const result = h.execute();

  assert.equal(result.ok, true);
  assert.equal(result.outcome, ALREADY);
  assert.equal(
    h.state.storeWriteState.writeAttempted,
    false
  );
});

test('verified V2 append result is preserved', () => {
  const h = harness();
  const result = h.execute();

  assert.equal(result.outcome, VERIFIED);
});

test('V2 precondition exception before append is definite precondition failure', () => {
  const h = harness({
    storeMode:
      'precondition_throw'
  });

  const result = h.execute();

  assert.equal(result.outcome, PRECONDITION);
});

test('postwrite V2 exception becomes outcome uncertain', () => {
  const h = harness({
    storeMode:
      'postwrite_throw'
  });

  const result = h.execute();

  assert.equal(result.outcome, UNCERTAIN);
});

test('invalid postwrite store result becomes outcome uncertain', () => {
  const h = harness({
    storeMode:
      'invalid_postwrite'
  });

  const result = h.execute();

  assert.equal(result.outcome, UNCERTAIN);
});

test('postwrite uncertainty is never automatically retried', () => {
  const h = harness({
    storeMode:
      'postwrite_throw'
  });

  h.execute();

  assert.equal(h.state.storeCalls, 1);
});

test('executor contains no rollback or V1 deletion path', () => {
  assert.ok(
    !runtimeSource.includes('.deleteRow(')
  );
  assert.ok(
    !runtimeSource.includes('.clearContent(')
  );
});

test('executor contains no OPA HTTP path', () => {
  assert.ok(
    !runtimeSource.includes('UrlFetchApp')
  );
});

test('executor exposes no top-level public RPC', () => {
  assert.ok(
    !/function\s+reos[A-Z0-9_]/.test(
      runtimeSource
    )
  );
});

test('executor contains no DISTRESS_LEADS mutation path', () => {
  assert.ok(
    !runtimeSource.includes('DISTRESS_LEADS')
  );
});

test('V1 evidence store remains read-only during reconciliation', () => {
  const h = harness({
    rows: [
      v1Row()
    ]
  });

  h.execute();

  assert.equal(h.state.v1Mutations, 0);
});

test('Script Property remains read-only', () => {
  const h = harness();
  h.execute();

  assert.equal(h.state.propertySets, 0);
});

test('Qualified Deal Queue authority remains false', () => {
  const result = harness().execute();
  assert.strictEqual(
    result.qualifiedDealQueueAuthorityGranted,
    false
  );
});

test('acquisition lifecycle authority remains false', () => {
  const result = harness().execute();
  assert.strictEqual(
    result.acquisitionLifecycleAuthorityGranted,
    false
  );
});

test('occupancy and vacancy authority remain false', () => {
  const result = harness().execute();

  assert.strictEqual(
    result.ownerOccupancyAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.vacancyAuthorityGranted,
    false
  );
});

test('ARV authority remains false', () => {
  const result = harness().execute();
  assert.strictEqual(
    result.arvAuthorityGranted,
    false
  );
});

test('repair-scope authority remains false', () => {
  const result = harness().execute();
  assert.strictEqual(
    result.repairScopeAuthorityGranted,
    false
  );
});

test('MAO authority remains false', () => {
  const result = harness().execute();
  assert.strictEqual(
    result.maoAuthorityGranted,
    false
  );
});

test('offer-generation and submission authority remain false', () => {
  const result = harness().execute();

  assert.strictEqual(
    result.offerGenerationAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.offerSubmissionAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.automaticOfferAuthorityGranted,
    false
  );

  assertAllAuthorityFalse(result);
});

assert.ok(
  cases >= 48,
  `behavioral coverage must contain at least 48 cases; observed ${cases}`
);

console.log(
  `ABSENTEE_OWNER_V2_EXECUTOR_BEHAVIOR_CASE_COUNT=${cases}`
);

console.log(
  'ABSENTEE_OWNER_V2_EXECUTOR_BEHAVIOR_VALIDATION_PASS=true'
);
