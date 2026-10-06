#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const SOURCE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'CountyProductionScheduler.js'
  );

const source =
  fs.readFileSync(
    SOURCE,
    'utf8'
  );

console.log(
  '=== PHILADELPHIA PROBATE SCHEDULER FEED4 + PB1 CHECKPOINT COMPATIBILITY ==='
);
console.log();

const properties =
  new Map();

const SHA =
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const PB1 =
  'PB1|' +
  SHA +
  '|2026-10-06|25';

const priorResults = [
  {
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'code_violations',
    ok:
      true,
    result: {
      ok:
        true
    }
  },
  {
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'vacant_properties',
    ok:
      true,
    result: {
      ok:
        true
    }
  },
  {
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'sheriff_tax_sales',
    ok:
      true,
    result: {
      ok:
        true
    }
  },
  {
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'sheriff_mortgage_sales',
    ok:
      true,
    result: {
      ok:
        true
    }
  }
];

let resolverMode =
  'normal';

const resolverCalls = [];
const syncCalls = [];

let syncNextCursor =
  PB1;

function setActiveProbateCheckpoint(
  cycleId,
  cursor
) {
  properties.set(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID',
    cycleId
  );

  properties.set(
    'REOS_COUNTY_SCHEDULER_CYCLE_STARTED_AT',
    '2026-10-06T06:00:00.000Z'
  );

  properties.set(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX',
    '4'
  );

  properties.set(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON',
    JSON.stringify(
      priorResults
    )
  );

  if (cursor) {
    properties.set(
      'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR',
      cursor
    );
  } else {
    properties.delete(
      'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
    );
  }
}

const managedTrigger = {
  getHandlerFunction() {
    return 'reosCountyProductionSchedulerRun';
  },

  getEventType() {
    return 'CLOCK';
  },

  getTriggerSource() {
    return 'CLOCK';
  },

  getUniqueId() {
    return 'probate-feed4-certification-trigger';
  }
};

const context = {
  console,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Array,
  Error,
  RegExp,
  isNaN,

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          return properties.has(key)
            ? properties.get(key)
            : null;
        },

        setProperty(
          key,
          value
        ) {
          properties.set(
            key,
            String(value)
          );

          return this;
        },

        deleteProperty(
          key
        ) {
          properties.delete(
            key
          );

          return this;
        }
      };
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return [
        managedTrigger
      ];
    },

    deleteTrigger() {
      throw new Error(
        'Certification must not delete triggers.'
      );
    },

    newTrigger() {
      throw new Error(
        'Certification must not create triggers.'
      );
    }
  },

  LockService: {
    getScriptLock() {
      let held =
        false;

      return {
        tryLock() {
          held =
            true;

          return true;
        },

        hasLock() {
          return held;
        },

        releaseLock() {
          held =
            false;
        }
      };
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        return true;
      }
    },

    CountyMutationExclusionLease: {
      assertWriterAllowed(
        options
      ) {
        /*
         * `options` originates inside the vm context. Because this
         * validator imports node:assert/strict, deep object equality
         * would also compare realm-specific prototypes. Validate the
         * scheduler writer-guard contract through exact scalar fields
         * instead.
         */
        assert.ok(
          options &&
          typeof options === 'object',
          'writer-guard options object is required'
        );

        assert.equal(
          Object.keys(
            options
          ).length,
          1,
          'writer-guard request must contain exactly one field'
        );

        assert.equal(
          String(
            options.writerId ||
            ''
          ),
          'COUNTY_PRODUCTION_SCHEDULER',
          'writer-guard request must use exact county scheduler writer ID'
        );

        return {
          ok:
            true,
          allowed:
            true
        };
      }
    },

    PhiladelphiaProbateRecurringSource: {
      approvedSourceUrl(
        url
      ) {
        return (
          String(
            url ||
            ''
          ) ===
          'https://assets.alm.com/certification/tlipn100626.pdf'
        );
      },

      resolve(
        cursor
      ) {
        resolverCalls.push(
          String(
            cursor ||
            ''
          )
        );

        if (
          resolverMode ===
          'drift'
        ) {
          throw new Error(
            'Synthetic Philadelphia probate PB1 source drift detected.'
          );
        }

        const continuation =
          Boolean(
            String(
              cursor ||
              ''
            )
          );

        if (
          continuation
        ) {
          assert.equal(
            cursor,
            PB1,
            'continuation must receive the exact PB1 scheduler checkpoint'
          );
        }

        return {
          ok:
            true,
          cursorDomainId:
            'PHL-PROBATE-PB1-V1',
          publicationDate:
            '2026-10-06',
          articleUrl:
            'https://www.law.com/thelegalintelligencer/2026/10/06/tuesday-public-noticescalendars/',
          sourceUrl:
            'https://assets.alm.com/certification/tlipn100626.pdf',
          sourceSha256:
            SHA,
          noticeOffset:
            continuation
              ? 25
              : 0,
          noticePageSize:
            25,
          continuation:
            continuation
        };
      }
    },

    CountyRuntimeBridge: {
      sync(
        connectorId,
        dataset,
        options
      ) {
        assert.equal(
          connectorId,
          'PA-PHILADELPHIA'
        );

        assert.equal(
          dataset,
          'probate'
        );

        syncCalls.push({
          connectorId,
          dataset,
          options:
            JSON.parse(
              JSON.stringify(
                options
              )
            )
        });

        const nextCursor =
          syncNextCursor;

        syncNextCursor =
          '';

        return {
          ok:
            true,
          connectorId:
            connectorId,
          dataset:
            dataset,
          stats: {
            failed:
              0
          },
          nextCursor:
            nextCursor
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
      'CountyProductionScheduler.js'
  }
);

assert.ok(
  context.REOS
    .CountyProductionScheduler,
  'county scheduler API loads'
);

const allowlist =
  source.match(
    /const ALLOWLIST = Object\.freeze\(\[([\s\S]*?)\]\);/
  );

assert.ok(
  allowlist,
  'scheduler allowlist is inspectable'
);

const datasets =
  Array.from(
    allowlist[1]
      .matchAll(
        /dataset:\s*'([^']+)'/g
      )
  )
    .map(
      match =>
        match[1]
    );

assert.deepEqual(
  datasets,
  [
    'code_violations',
    'vacant_properties',
    'sheriff_tax_sales',
    'sheriff_mortgage_sales',
    'probate'
  ],
  'probate is appended as exact feed index 4 without reordering prior feeds'
);

console.log(
  'PASS: probate is exact scheduler feed index 4'
);


/*
 * Initial probate page:
 * - existing four feed results already complete;
 * - probate begins with empty CURRENT_FEED_CURSOR;
 * - PB1 resolver discovers current publication;
 * - non-terminal PB1 is stored as current scheduler checkpoint;
 * - feed index and completed-feed evidence cannot advance.
 */
setActiveProbateCheckpoint(
  'COUNTY-PROBATE-FEED4-A',
  ''
);

const first =
  context
    .reosCountyProductionSchedulerRun();

assert.equal(
  first.ok,
  true
);

assert.equal(
  first.status,
  'In Progress'
);

assert.equal(
  syncCalls.length,
  1
);

assert.equal(
  resolverCalls.length,
  1
);

assert.equal(
  resolverCalls[0],
  ''
);

assert.equal(
  syncCalls[0]
    .options
    .confirmLive,
  true
);

assert.equal(
  syncCalls[0]
    .options
    .limit,
  500
);

assert.equal(
  syncCalls[0]
    .options
    .cursor,
  ''
);

assert.deepEqual(
  syncCalls[0]
    .options
    .config,
  {
    endpoint:
      'https://assets.alm.com/certification/tlipn100626.pdf',
    probateRecurring:
      true,
    probatePublicationDate:
      '2026-10-06',
    probateSourceSha256:
      SHA,
    probateNoticeOffset:
      0,
    probateNoticePageSize:
      25
  }
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ),
  '4'
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  PB1
);

assert.equal(
  JSON.parse(
    properties.get(
      'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
    )
  ).length,
  4
);

assert.equal(
  properties.has(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ),
  false
);

console.log(
  'PASS: non-terminal PB1 cursor persists without advancing feed authority'
);


/*
 * Continuation:
 * - scheduler supplies exact PB1 to resolver;
 * - resolver binds continuation to exact source;
 * - terminal page clears CURRENT_FEED_CURSOR;
 * - fifth feed completion closes the full cycle.
 */
const second =
  context
    .reosCountyProductionSchedulerRun();

assert.equal(
  second.ok,
  true
);

assert.equal(
  second.status,
  'Healthy'
);

assert.equal(
  second.total,
  5
);

assert.equal(
  second.succeeded,
  5
);

assert.equal(
  resolverCalls.length,
  2
);

assert.equal(
  resolverCalls[1],
  PB1
);

assert.equal(
  syncCalls.length,
  2
);

assert.equal(
  syncCalls[1]
    .options
    .cursor,
  PB1
);

assert.equal(
  syncCalls[1]
    .options
    .config
    .probateNoticeOffset,
  25
);

assert.equal(
  properties.has(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ),
  false
);

assert.equal(
  properties.has(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ),
  false
);

assert.equal(
  properties.has(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  false
);

assert.ok(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  )
);

const finalResult =
  JSON.parse(
    properties.get(
      'REOS_COUNTY_SCHEDULER_LAST_RESULT_JSON'
    )
  );

assert.equal(
  finalResult.total,
  5
);

assert.equal(
  finalResult.results.length,
  5
);

assert.equal(
  finalResult.results[4].dataset,
  'probate'
);

assert.equal(
  finalResult.results[4].ok,
  true
);

console.log(
  'PASS: terminal PB1 page completes probate and the five-feed cycle'
);


/*
 * Source drift / resolver failure:
 * checkpoint must remain exact. No sync call may occur and no feed
 * advancement may be manufactured.
 */
const lastSuccessBeforeDrift =
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  );

setActiveProbateCheckpoint(
  'COUNTY-PROBATE-FEED4-DRIFT',
  PB1
);

const resultsBeforeDrift =
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  );

const syncCountBeforeDrift =
  syncCalls.length;

resolverMode =
  'drift';

const drift =
  context
    .reosCountyProductionSchedulerRun();

assert.equal(
  drift.ok,
  false
);

assert.equal(
  drift.status,
  'Degraded'
);

assert.match(
  String(
    drift.error ||
    ''
  ),
  /checkpoint preserved/i
);

assert.equal(
  syncCalls.length,
  syncCountBeforeDrift,
  'source drift must fail before live county sync'
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_ID'
  ),
  'COUNTY-PROBATE-FEED4-DRIFT'
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_NEXT_FEED_INDEX'
  ),
  '4'
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CURRENT_FEED_CURSOR'
  ),
  PB1
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_CYCLE_RESULTS_JSON'
  ),
  resultsBeforeDrift
);

assert.equal(
  properties.get(
    'REOS_COUNTY_SCHEDULER_LAST_SUCCESS_AT'
  ),
  lastSuccessBeforeDrift
);

console.log(
  'PASS: PB1 source drift fails closed with exact checkpoint preservation'
);

console.log();
console.log(
  'PB1_PROBATE_SCHEDULER_FEED4_EXACT_ORDER_CERTIFIED=true'
);
console.log(
  'PB1_PROBATE_NONTERMINAL_CHECKPOINT_PERSISTENCE_CERTIFIED=true'
);
console.log(
  'PB1_PROBATE_TERMINAL_FEED_COMPLETION_CERTIFIED=true'
);
console.log(
  'PB1_PROBATE_SOURCE_DRIFT_CHECKPOINT_PRESERVATION_CERTIFIED=true'
);
console.log(
  'PB1_PROBATE_SCHEDULER_FEED4_CHECKPOINT_COMPATIBILITY_CERTIFIED=true'
);
