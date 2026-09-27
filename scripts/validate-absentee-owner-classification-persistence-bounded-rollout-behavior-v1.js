#!/usr/bin/env node
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(__dirname, '..');

const BUILD =
  path.join(
    ROOT,
    'build',
    'apps-script-brand'
  );

const RUNTIME_FILES = [
  'AbsenteeOwnerClassificationPersistencePlanner.js',
  'AbsenteeOwnerClassificationEvidenceStore.js',
  'AbsenteeOwnerClassificationPersistenceExecutor.js',
  'AbsenteeOwnerClassificationBoundedRollout.js'
];

const HEADERS = [
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

class FakeCellMatch {
  constructor(row) {
    this.row = row;
  }

  getRow() {
    return this.row;
  }
}

class FakeRange {
  constructor(
    sheet,
    row,
    column,
    numRows,
    numColumns
  ) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.numRows = numRows;
    this.numColumns = numColumns;
  }

  getValues() {
    const result = [];

    for (
      let r = 0;
      r < this.numRows;
      r += 1
    ) {
      const physicalRow =
        this.row + r;

      const source =
        physicalRow === 1
          ? this.sheet.headers
          : (
            this.sheet.rows[
              physicalRow - 2
            ] ||
            []
          );

      const row = [];

      for (
        let c = 0;
        c < this.numColumns;
        c += 1
      ) {
        const value =
          source[
            this.column - 1 + c
          ];

        row.push(
          value === undefined
            ? ''
            : value
        );
      }

      result.push(row);
    }

    return result;
  }

  getFormulas() {
    return Array.from(
      {
        length: this.numRows
      },
      () =>
        Array.from(
          {
            length:
              this.numColumns
          },
          () => ''
        )
    );
  }

  createTextFinder(text) {
    const range = this;
    let entire = false;

    return {
      matchEntireCell(value) {
        entire =
          value === true;

        return this;
      },

      findAll() {
        assert.strictEqual(
          entire,
          true
        );

        const matches = [];

        for (
          let r = 0;
          r < range.numRows;
          r += 1
        ) {
          const physicalRow =
            range.row + r;

          const value =
            range.sheet.rows[
              physicalRow - 2
            ][
              range.column - 1
            ];

          if (
            String(value) ===
            String(text)
          ) {
            matches.push(
              new FakeCellMatch(
                physicalRow
              )
            );
          }
        }

        return matches;
      }
    };
  }
}

class FakeSheet {
  constructor(
    headers,
    rows,
    state
  ) {
    this.headers =
      headers.slice();

    this.rows =
      (rows || [])
        .map(
          (row) =>
            row.slice()
        );

    this.state =
      state;

    this.failAppend =
      false;
  }

  getLastRow() {
    return (
      1 +
      this.rows.length
    );
  }

  getLastColumn() {
    return this.headers.length;
  }

  getRange(
    row,
    column,
    numRows,
    numColumns
  ) {
    return new FakeRange(
      this,
      row,
      column,
      numRows,
      numColumns
    );
  }

  appendRow(row) {
    this.state
      .appendAttempts += 1;

    this.state
      .timeline
      .push(
        'append'
      );

    if (this.failAppend) {
      throw new Error(
        'forced append failure'
      );
    }

    this.rows.push(
      Array.from(row)
    );

    return this;
  }
}

class FakeSpreadsheet {
  constructor(
    id,
    sheets
  ) {
    this.id = id;
    this.sheets = sheets;
  }

  getId() {
    return this.id;
  }

  getSheetByName(name) {
    return (
      this.sheets[name] ||
      null
    );
  }
}

function makeEnvironment() {
  const state = {
    appendAttempts: 0,
    flushCount: 0,
    lockActive: false,
    lockContext: null,
    lockAcquisitions: 0,
    timeline: [],
    adminCalls: 0,
    selectorCalls: 0,
    lookupCalls: 0,
    comparisonCalls: 0,
    classifierCalls: 0,
    persistenceCalls: 0
  };

  const evidenceSheet =
    new FakeSheet(
      HEADERS,
      [],
      state
    );

  const evidenceBook =
    new FakeSpreadsheet(
      'evidence-book',
      {
        ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE:
          evidenceSheet
      }
    );

  const activeBook =
    new FakeSpreadsheet(
      'active-book',
      {}
    );

  const sandbox = {
    console:
      console,

    __state:
      state,

    REOS:
      {},

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
        text
      ) {
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        const bytes =
          crypto
            .createHash('sha256')
            .update(
              String(text),
              'utf8'
            )
            .digest();

        return Array.from(
          bytes,
          (value) =>
            value > 127
              ? value - 256
              : value
        );
      }
    },

    PropertiesService: {
      getScriptProperties() {
        return {
          getProperty(key) {
            assert.strictEqual(
              key,
              'REOS_ABSENTEE_OWNER_CLASSIFICATION_EVIDENCE_WORKBOOK_ID'
            );

            return 'evidence-book';
          }
        };
      }
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return activeBook;
      },

      openById(id) {
        if (
          id !==
          'evidence-book'
        ) {
          throw new Error(
            'unexpected workbook id'
          );
        }

        return evidenceBook;
      },

      flush() {
        state.flushCount += 1;
      }
    }
  };

  const context =
    vm.createContext(
      sandbox
    );

  vm.runInContext(`
    REOS.Database = {
      withScriptLockContext: function (work) {
        __state.lockAcquisitions += 1;
        __state.timeline.push('lock:start');
        __state.lockActive = true;

        var context = {
          capability: 'TEST_LOCK_CONTEXT'
        };

        __state.lockContext = context;

        try {
          return work(context);
        } finally {
          __state.lockContext = null;
          __state.lockActive = false;
          __state.timeline.push('lock:end');
        }
      },

      assertScriptLockContext: function (context) {
        if (
          !__state.lockActive ||
          context !== __state.lockContext
        ) {
          throw new Error(
            'invalid test lock context'
          );
        }

        return true;
      }
    };

    REOS.Security = {
      requireAdmin: function () {
        __state.adminCalls += 1;
        return true;
      }
    };

    function __classifier(
      outcome,
      rowNumber,
      distressLeadId,
      canonicalPropertyKey
    ) {
      var upstream = {
        ABSENTEE_OWNER_INDICATED:
          'MAILING_ADDRESS_DIFFERS',

        OWNER_MAILING_MATCHED:
          'MAILING_ADDRESS_MATCHES',

        INSUFFICIENT_CLASSIFICATION_EVIDENCE:
          'INSUFFICIENT_MAILING_EVIDENCE'
      };

      var result = {
        ok: true,
        mode:
          'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION',
        phase:
          'absentee_owner_classification',
        outcome:
          outcome,

        target: {
          rowNumber:
            rowNumber,

          identity: {
            'Distress Lead ID':
              distressLeadId,

            'Canonical Property Key':
              canonicalPropertyKey
          }
        },

        upstreamComparisonOutcome:
          upstream[outcome],

        classificationBasis:
          'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',

        normalizedPropertyAddress: {
          street:
            '5146 N 10TH ST',
          city:
            'PHILADELPHIA',
          state:
            'PA',
          zip:
            '19141'
        },

        normalizedMailingAddress: {
          street:
            outcome ===
              'OWNER_MAILING_MATCHED'
              ? '5146 N 10TH ST'
              : '6623 N 8TH ST',

          city:
            'PHILADELPHIA',

          state:
            'PA',

          zip:
            outcome ===
              'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
              ? ''
              : '19126'
        },

        productionDataMutationAuthorityGranted:
          false,

        ownerEvidencePersistenceAuthorityGranted:
          false,

        classificationPersistenceAuthorityGranted:
          false,

        canonicalIdentityRepairAuthorityGranted:
          false,

        migrationAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        triggerAuthorityGranted:
          false,

        connectorExecutionAuthorityGranted:
          false,

        certificationMutationAuthorityGranted:
          false,

        ownerOccupancyAuthorityGranted:
          false,

        vacancyAuthorityGranted:
          false,

        qualifiedDealQueueAuthorityGranted:
          false,

        acquisitionLifecycleAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      };

      if (
        outcome ===
        'ABSENTEE_OWNER_INDICATED'
      ) {
        result.differingComponents =
          [
            'street',
            'zip'
          ];
      }

      if (
        outcome ===
        'OWNER_MAILING_MATCHED'
      ) {
        result.differingComponents =
          [];

        result
          .normalizedMailingAddress
          .zip =
          '19141';
      }

      return result;
    }
  `, context);

  for (
    const file of
    RUNTIME_FILES
  ) {
    vm.runInContext(
      fs.readFileSync(
        path.join(
          BUILD,
          file
        ),
        'utf8'
      ),
      context,
      {
        filename:
          file
      }
    );
  }

  function classifier(
    outcome,
    rowNumber = 2,
    distressLeadId = 'DL-1',
    canonicalPropertyKey = 'property|1'
  ) {
    return vm.runInContext(
      `__classifier(
        ${JSON.stringify(outcome)},
        ${rowNumber},
        ${JSON.stringify(distressLeadId)},
        ${JSON.stringify(canonicalPropertyKey)}
      )`,
      context
    );
  }

  return {
    context:
      context,

    state:
      state,

    evidenceSheet:
      evidenceSheet,

    classifier:
      classifier
  };
}

let cases = 0;

function check(
  condition,
  message
) {
  assert.ok(
    condition,
    message
  );

  cases += 1;
}

{
  const env =
    makeEnvironment();

  const planner =
    env.context.REOS
      .AbsenteeOwnerClassificationPersistencePlanner;

  const first =
    planner.prepare(
      env.classifier(
        'ABSENTEE_OWNER_INDICATED'
      )
    );

  const second =
    planner.prepare(
      env.classifier(
        'ABSENTEE_OWNER_INDICATED'
      )
    );

  check(
    first.ok === true,
    'eligible indicated classifier result plans successfully'
  );

  check(
    first.classifierResultSha256 ===
      second.classifierResultSha256,
    'classifier hash is deterministic'
  );

  check(
    first.evidenceEventId ===
      second.evidenceEventId,
    'event ID is deterministic'
  );

  check(
    /^AOCE-[0-9a-f]{64}$/.test(
      first.evidenceEventId
    ),
    'event ID has frozen format'
  );

  const matched =
    planner.prepare(
      env.classifier(
        'OWNER_MAILING_MATCHED'
      )
    );

  check(
    matched
      .differingComponentsJson ===
      '[]',
    'matched classification persists [] differences'
  );

  const insufficient =
    planner.prepare(
      env.classifier(
        'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
      )
    );

  check(
    insufficient
      .differingComponentsJson ===
      'null',
    'insufficient classification persists null differences'
  );

  const unsafe =
    env.classifier(
      'ABSENTEE_OWNER_INDICATED',
      2,
      '=FORMULA',
      'property|1'
    );

  check(
    planner.prepare(
      unsafe
    ).ok === false,
    'unsafe spreadsheet identity fails before persistence'
  );

  const unknown =
    env.classifier(
      'ABSENTEE_OWNER_INDICATED'
    );

  unknown.unexpected =
    true;

  check(
    planner.prepare(
      unknown
    ).ok === false,
    'unknown classifier fields fail closed'
  );
}

{
  const env =
    makeEnvironment();

  const executor =
    env.context.REOS
      .AbsenteeOwnerClassificationPersistenceExecutor;

  const first =
    executor.execute(
      env.classifier(
        'ABSENTEE_OWNER_INDICATED'
      )
    );

  check(
    first.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED',
    'first append verifies'
  );

  check(
    first.disposition ===
      'PERSISTED',
    'verified append uses PERSISTED disposition'
  );

  check(
    env.evidenceSheet
      .rows.length === 1,
    'verified append creates exactly one evidence row'
  );

  check(
    env.evidenceSheet
      .rows[0][18] ===
      'GENESIS',
    'first event uses GENESIS previous hash'
  );

  check(
    env.state
      .flushCount === 1,
    'new event performs one store flush before readback'
  );

  const firstEventSha =
    env.evidenceSheet
      .rows[0][19];

  const duplicate =
    executor.execute(
      env.classifier(
        'ABSENTEE_OWNER_INDICATED'
      )
    );

  check(
    duplicate.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_ALREADY_PERSISTED',
    'duplicate returns canonical duplicate outcome'
  );

  check(
    duplicate.disposition ===
      'ALREADY_PERSISTED',
    'duplicate returns ALREADY_PERSISTED disposition'
  );

  check(
    env.evidenceSheet
      .rows.length === 1,
    'duplicate performs zero physical write'
  );

  const changed =
    executor.execute(
      env.classifier(
        'OWNER_MAILING_MATCHED'
      )
    );

  check(
    changed.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED',
    'changed classifier evidence appends'
  );

  check(
    env.evidenceSheet
      .rows.length === 2,
    'changed evidence creates one additional event'
  );

  check(
    env.evidenceSheet
      .rows[1][18] ===
      firstEventSha,
    'subsequent event links immediate prior event hash'
  );

  const insufficient =
    executor.execute(
      env.classifier(
        'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
      )
    );

  check(
    insufficient.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED',
    'insufficient evidence is persistence eligible'
  );

  check(
    env.evidenceSheet
      .rows[2][10] ===
      'null',
    'insufficient evidence stores null differences'
  );

  check(
    !env.evidenceSheet
      .rows
      .flat()
      .includes(
        'Owner Name'
      ),
    'owner-name field is not persisted'
  );

  check(
    !env.evidenceSheet
      .rows
      .flat()
      .includes(
        'PRIVATE OWNER'
      ),
    'raw owner name value is not persisted'
  );

  check(
    /^\d{4}-\d{2}-\d{2}T/.test(
      env.evidenceSheet
        .rows[0][1]
    ),
    'Observed At UTC is runtime-generated ISO text'
  );
}

{
  const env =
    makeEnvironment();

  env.evidenceSheet
    .headers[0] =
    'BROKEN HEADER';

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationPersistenceExecutor
      .execute(
        env.classifier(
          'ABSENTEE_OWNER_INDICATED'
        )
      );

  check(
    result.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED',
    'malformed storage fails as precondition'
  );

  check(
    env.state
      .appendAttempts === 0,
    'precondition failure performs zero append attempt'
  );
}

{
  const env =
    makeEnvironment();

  env.evidenceSheet
    .failAppend =
    true;

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationPersistenceExecutor
      .execute(
        env.classifier(
          'ABSENTEE_OWNER_INDICATED'
        )
      );

  check(
    result.outcome ===
      'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN',
    'append exception is outcome uncertain'
  );

  check(
    env.state
      .appendAttempts === 1,
    'uncertain append boundary is attempted exactly once'
  );
}

function installRolloutMocks(
  env,
  behavior
) {
  env.context.__behavior =
    behavior;

  vm.runInContext(`
    REOS.AbsenteeOwnerEnrichmentExactRecordSelector = {
      exactRecordEvidence: function (target) {
        __state.selectorCalls += 1;

        var index =
          __state.selectorCalls - 1;

        if (
          __behavior.selectorFailAt ===
          index
        ) {
          return {
            ok: false,
            code:
              'FORCED_SELECTOR_FAILURE'
          };
        }

        return {
          ok: true,
          mode:
            'READ_ONLY',
          phase:
            'absentee_owner_exact_record_evidence',

          target: {
            table:
              'DISTRESS_LEADS',
            rowNumber:
              target.rowNumber
          },

          identity: {
            'Distress Lead ID':
              target.identity[
                'Distress Lead ID'
              ],

            'Canonical Property Key':
              target.identity[
                'Canonical Property Key'
              ]
          },

          record: {
            Address:
              '5146 N 10TH ST',
            City:
              'PHILADELPHIA',
            State:
              'PA',
            Zip:
              '19141'
          },

          productionDataMutationAuthorityGranted:
            false,

          canonicalIdentityRepairAuthorityGranted:
            false,

          migrationAuthorityGranted:
            false,

          schedulerAuthorityGranted:
            false,

          triggerAuthorityGranted:
            false,

          connectorExecutionAuthorityGranted:
            false,

          certificationMutationAuthorityGranted:
            false,

          automaticOfferAuthorityGranted:
            false
        };
      }
    };

    REOS.AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup = {
      lookup: function (request) {
        __state.lookupCalls += 1;
        __state.timeline.push('http');

        if (__state.lockActive) {
          throw new Error(
            'OPA HTTP executed under persistence lock'
          );
        }

        var index =
          __state.lookupCalls - 1;

        if (
          __behavior.lookupFailAt ===
          index
        ) {
          return {
            ok: false,
            code:
              'FORCED_LOOKUP_FAILURE'
          };
        }

        return {
          ok: true,
          request:
            request,
          outcome:
            'MATCHED'
        };
      }
    };

    REOS.AbsenteeOwnerOwnerEvidenceComparison = {
      compare: function (ownerEvidence) {
        __state.comparisonCalls += 1;

        return {
          ok: true,
          ownerEvidence:
            ownerEvidence
        };
      }
    };

    REOS.AbsenteeOwnerClassification = {
      classify: function () {
        __state.classifierCalls += 1;

        var index =
          __state.classifierCalls - 1;

        if (
          __behavior.ineligibleAt ===
          index
        ) {
          return {
            ok: false,
            outcome:
              'INELIGIBLE_COMPARISON_EVIDENCE',
            upstreamComparisonOutcome:
              'INELIGIBLE_OWNER_EVIDENCE'
          };
        }

        return __classifier(
          'ABSENTEE_OWNER_INDICATED',
          __behavior
            .targets[index]
            .rowNumber,
          __behavior
            .targets[index]
            .identity[
              'Distress Lead ID'
            ],
          __behavior
            .targets[index]
            .identity[
              'Canonical Property Key'
            ]
        );
      }
    };

    REOS.AbsenteeOwnerClassificationPersistenceExecutor = {
      execute: function () {
        __state.persistenceCalls += 1;

        var index =
          __state.persistenceCalls - 1;

        if (
          __behavior.persistenceOutcomeAt &&
          Object.prototype.hasOwnProperty.call(
            __behavior.persistenceOutcomeAt,
            String(index)
          )
        ) {
          return {
            ok: false,
            outcome:
              __behavior
                .persistenceOutcomeAt[
                  index
                ],
            code:
              'FORCED_PERSISTENCE_RESULT'
          };
        }

        return {
          ok: true,
          outcome:
            'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_VERIFIED',
          disposition:
            'PERSISTED',
          classifierResultSha256:
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          evidenceEventId:
            'AOCE-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          evidenceEventSha256:
            'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
        };
      }
    };
  `, env.context);
}

function rolloutTargets() {
  return [
    {
      rowNumber: 2,

      identity: {
        'Distress Lead ID':
          'DL-1',

        'Canonical Property Key':
          'property|1'
      }
    },
    {
      rowNumber: 3,

      identity: {
        'Distress Lead ID':
          'DL-2',

        'Canonical Property Key':
          'property|2'
      }
    }
  ];
}

{
  const env =
    makeEnvironment();

  const rollout =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout;

  check(
    rollout.run(null)
      .outcome ===
      'ROLLOUT_REQUEST_REJECTED',
    'missing options fail before target read'
  );

  check(
    rollout.run(
      vm.runInContext(
        '({targets:[]})',
        env.context
      )
    ).outcome ===
      'ROLLOUT_REQUEST_REJECTED',
    'empty targets fail before target read'
  );

  check(
    rollout.run(
      vm.runInContext(
        '({targets:Array.from({length:11},function(_,i){return {rowNumber:i+2,identity:{"Distress Lead ID":"DL-"+i,"Canonical Property Key":"property|"+i}};})})',
        env.context
      )
    ).outcome ===
      'ROLLOUT_REQUEST_REJECTED',
    'more than ten targets fail before target read'
  );

  check(
    env.state
      .selectorCalls === 0,
    'malformed batch performs zero selector reads'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets,

    selectorFailAt:
      0
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result
      .processedTargetCount ===
      2,
    'definite selector failure allows later explicit target'
  );

  check(
    env.state
      .lookupCalls === 1,
    'selector failure causes zero HTTP for failed target'
  );

  check(
    env.state
      .persistenceCalls === 1,
    'selector failure causes zero persistence for failed target'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets,

    lookupFailAt:
      0
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result
      .processedTargetCount ===
      2,
    'definite lookup failure allows later explicit target'
  );

  check(
    env.state
      .persistenceCalls === 1,
    'lookup failure causes zero persistence for failed target'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets,

    ineligibleAt:
      0
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result
      .processedTargetCount ===
      2,
    'ineligible classification allows later explicit target'
  );

  check(
    env.state
      .persistenceCalls === 1,
    'ineligible classifier result is never persisted'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets,

    persistenceOutcomeAt: {
      0:
        'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_PRECONDITION_FAILED'
    }
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result.halted === true &&
    result
      .processedTargetCount ===
      1,
    'persistence precondition failure halts rollout'
  );

  check(
    env.state
      .lookupCalls === 1,
    'halt prevents later OPA request'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets,

    persistenceOutcomeAt: {
      0:
        'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_OUTCOME_UNCERTAIN'
    }
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result.halted === true &&
    result
      .processedTargetCount ===
      1,
    'persistence uncertainty halts rollout'
  );

  check(
    env.state
      .persistenceCalls === 1,
    'uncertain target is not retried automatically'
  );
}

{
  const env =
    makeEnvironment();

  const targets =
    rolloutTargets();

  const behavior = {
    targets:
      targets
  };

  installRolloutMocks(
    env,
    behavior
  );

  const request =
    vm.runInContext(
      '(' +
      JSON.stringify({
        targets:
          targets
      }) +
      ')',
      env.context
    );

  const result =
    env.context.REOS
      .AbsenteeOwnerClassificationBoundedRollout
      .run(request);

  check(
    result.ok === true &&
    result
      .processedTargetCount ===
      2,
    'two explicit targets complete sequentially'
  );

  check(
    env.state
      .lookupCalls === 2,
    'OPA lookup executes at most once per target'
  );

  check(
    result
      .automaticOfferAuthorityGranted ===
      false &&
    result
      .arvAuthorityGranted ===
      false &&
    result
      .repairScopeAuthorityGranted ===
      false &&
    result
      .maoAuthorityGranted ===
      false,
    'acquisition safety authority remains false'
  );
}

assert.ok(
  cases >= 32,
  'behavior validator must retain at least 32 contract-grounded assertions'
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_BOUNDED_ROLLOUT_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_ASSERTION_COUNT=' +
  cases
);

console.log(
  'CONTRACT_BEHAVIOR_CASE_COUNT=32'
);

console.log(
  'MAX_TARGETS=10'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'OPA_HTTP_UNDER_PERSISTENCE_LOCK=false'
);

console.log(
  'DISTRESS_LEADS_CLASSIFICATION_WRITE_AUTHORIZED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
