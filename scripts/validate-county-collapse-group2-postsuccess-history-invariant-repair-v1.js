'use strict';

const assert = require('assert');
const crypto = require('crypto');
const cp = require('child_process');
const fs = require('fs');
const vm = require('vm');

const BASE =
  '82d37a282098349dacd07d37bd9a6397e71bfaa0';

const BASE_TREE =
  '5dc6915644fb101baef601ecdb59bd82f58ddfea';

const RESIDUAL =
  'build/apps-script-brand/CountyCodeViolationCollapseResidualEvidence.js';

const SELF =
  'scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-v1.js';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DESIGN_VALIDATOR =
  'scripts/validate-county-collapse-group2-postsuccess-history-invariant-repair-design-v1.js';

const STORE =
  'build/apps-script-brand/CountyCollapseOperationIntentStore.js';

const PREFLIGHT =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflightV2.js';

const EXECUTOR =
  'build/apps-script-brand/CountyCodeViolationCollapseExecutor.js';

const POST_TERMINAL =
  'build/apps-script-brand/CountyCollapseGroup2PostTerminalReconciliation.js';

const INTEGRATION =
  'scripts/validate-county-runtime-integration.js';

const AUTHORITY_SHA =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const PLAN_SHA =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const TARGET =
  'DL-20260820181652-6183';

const WINNER =
  'DL-20260820181645-7130';

const HISTORICAL =
  '6ab40e74-43e0-4ce4-a2ce-83ea6c4620e8';

const PREPARED_EVENT_SHA =
  '843f8367f1554c71600be6e3139ea166d9f276e6ffc8941a893dd1e197e06153';

const PREPARED_PAYLOAD_SHA =
  '9c985a4d0b9b1e404a4d8cdc7729feaa81a8afb895f6de3e2b0d31b2bb31651c';

const TERMINAL_EVENT_SHA =
  '2e809d3ec9b59522671b13c3d498939eb05347c1ac08749f21beda8e4b1e4f89';

const TERMINAL_PAYLOAD_SHA =
  '10b54de7c6e39bb058e96f44c679d3e5420054219e059a60a1bf348d7085dbe2';

const HISTORICAL_RECOVERY =
  'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';

const EXPECTED_BASE_HASHES = {
  [RESIDUAL]:
    '3e66b2ac5d2bb7b9b25d5ed9121a92899c2c5cff319025931152b693bd7cc82d',
  [WORKFLOW]:
    'b88c00e8349b02d6a4c8e4ed16f7abf4cf145e81a24c2a1941f54498a196cdd2',
  [STORE]:
    'bfae3ae3edadc72e898064d4c9271329c36bb0c95bde6474fbe1fd9ca2498766',
  [PREFLIGHT]:
    'e805202ac89f827b27205f4f58bad71271f9c00a05ad5672c25ed4c05e802dac',
  [EXECUTOR]:
    'dd1d04f6c16dc127d1c5380cd7a92f325724bf37640a6ff4459a056ce87a78f4',
  [POST_TERMINAL]:
    '1cd09c1f2ad2cd5d8c4a3fd3c63075aa26be60914c5848b83cd5a38359062a27',
  [INTEGRATION]:
    'f703ab59019802e61e88b55f73a70e86b7e148a544e2d93c1b8e8a3f0caa297e'
};

const EXPECTED_SCOPE = [
  RESIDUAL,
  SELF,
  WORKFLOW
].sort();

function git(args) {
  return cp.execFileSync(
    'git',
    args,
    {
      encoding: 'utf8'
    }
  );
}

function gitText(args) {
  return git(args).trim();
}

function gitRaw(args) {
  return git(args);
}

function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

function sha256File(path) {
  return sha256(
    fs.readFileSync(path)
  );
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function lines(value) {
  return String(value || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function hex(value) {
  return crypto
    .createHash('sha256')
    .update(String(value))
    .digest('hex');
}

assert.equal(
  gitText([
    'rev-parse',
    BASE
  ]),
  BASE,
  'Certified source main is unavailable.'
);

assert.equal(
  gitText([
    'rev-parse',
    BASE + '^{tree}'
  ]),
  BASE_TREE,
  'Certified source tree drifted.'
);

Object.entries(
  EXPECTED_BASE_HASHES
).forEach(([path, expected]) => {
  assert.equal(
    sha256(
      gitRaw([
        'show',
        BASE + ':' + path
      ])
    ),
    expected,
    'Certified source hash drift: ' + path
  );
});

[
  STORE,
  PREFLIGHT,
  EXECUTOR,
  POST_TERMINAL,
  INTEGRATION
].forEach(path => {
  assert.equal(
    sha256File(path),
    EXPECTED_BASE_HASHES[path],
    'Protected current file drift: ' + path
  );
});

const residualSource =
  fs.readFileSync(
    RESIDUAL,
    'utf8'
  );

[
  TARGET,
  WINNER,
  HISTORICAL,
  PREPARED_EVENT_SHA,
  PREPARED_PAYLOAD_SHA,
  TERMINAL_EVENT_SHA,
  TERMINAL_PAYLOAD_SHA,
  'assertExactGroup2HistoricalHistory_',
  'assertExactGroup2PostSuccessHistorySet_',
  'historicalByTarget',
  'uncertainOperationCountByTarget',
  'Certified Group 2 post-success target does not bind exactly two strict operation histories.',
  'Certified Group 2 verified-success operation must be distinct from historical operation.',
  'Missing certified ID does not bind exactly one strict operation history: '
].forEach(marker => {
  assert.ok(
    residualSource.includes(marker),
    'Residual implementation missing marker: ' +
      marker
  );
});

assert.ok(
  residualSource.includes(
    "recovery.automaticRetryPermitted !==\n          false"
  ),
  'Historical automatic-retry false predicate missing.'
);

assert.ok(
  residualSource.includes(
    "recovery.rowRecreationPermitted !==\n          false"
  ),
  'Historical row-recreation false predicate missing.'
);

assert.ok(
  residualSource.includes(
    "recovery.journalMutationExecuted !==\n          false"
  ),
  'Historical journal-mutation false predicate missing.'
);

const baseWorkflow =
  gitRaw([
    'show',
    BASE + ':' + WORKFLOW
  ]);

const workflow =
  fs.readFileSync(
    WORKFLOW,
    'utf8'
  );

const designSyntax =
  '          node --check ' +
  DESIGN_VALIDATOR +
  '\n';

const implementationSyntax =
  '          node --check ' +
  SELF +
  '\n';

assert.equal(
  baseWorkflow
    .split(designSyntax)
    .length - 1,
  1,
  'Design syntax registration anchor drift.'
);

let expectedWorkflow =
  baseWorkflow.replace(
    designSyntax,
    designSyntax +
      implementationSyntax
  );

const directDesignStep =
  '      - name: Validate Group 2 post-success history-invariant repair design v1\n' +
  '        run: node ' +
  DESIGN_VALIDATOR +
  '\n\n';

assert.equal(
  baseWorkflow
    .split(directDesignStep)
    .length - 1,
  1,
  'Direct design-validator workflow anchor drift.'
);

const certifiedDesignStep =
  '      - name: Validate certified Group 2 post-success history-invariant repair design v1\n' +
  '        run: |\n' +
  '          root="$(mktemp -d)"\n' +
  '          wt="$root/certified"\n' +
  '          cleanup() {\n' +
  '            git worktree remove --force "$wt" >/dev/null 2>&1 || true\n' +
  '            rm -rf "$root"\n' +
  '          }\n' +
  '          trap cleanup EXIT\n\n' +
  '          git worktree add --detach "$wt" ' +
  BASE +
  '\n\n' +
  '          (\n' +
  '            cd "$wt"\n' +
  '            test "$(git rev-parse HEAD)" = "' +
  BASE +
  '"\n' +
  '            test "$(git rev-parse \'HEAD^{tree}\')" = "' +
  BASE_TREE +
  '"\n' +
  '            node ' +
  DESIGN_VALIDATOR +
  '\n' +
  '          )\n\n';

const implementationStep =
  '      - name: Validate Group 2 post-success history-invariant repair v1\n' +
  '        run: node ' +
  SELF +
  '\n\n';

expectedWorkflow =
  expectedWorkflow.replace(
    directDesignStep,
    certifiedDesignStep +
      implementationStep
  );

assert.equal(
  workflow,
  expectedWorkflow,
  'Workflow changed outside exact authorized lifecycle transition.'
);

const effective =
  new Set();

[
  gitText([
    'diff',
    '--name-only',
    BASE,
    'HEAD'
  ]),
  gitText([
    'diff',
    '--name-only'
  ]),
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  gitText([
    'ls-files',
    '--others',
    '--exclude-standard'
  ])
].forEach(value => {
  lines(value)
    .forEach(path => {
      effective.add(path);
    });
});

assert.deepEqual(
  Array.from(effective).sort(),
  EXPECTED_SCOPE,
  'Implementation candidate must remain exactly three files.'
);

assert.equal(
  gitText([
    'diff',
    '--cached',
    '--name-only'
  ]),
  '',
  'Implementation candidate must remain unstaged.'
);

const headers = [
  'Distress Lead ID',
  'Source',
  'Source Dataset',
  'Source Record ID',
  'Violation Number',
  'Canonical Property Key',
  'Source Observation Key',
  'Source Record Key',
  'Parcel ID'
];

function makeCertifiedRecords() {
  const ids = [
    TARGET,
    WINNER
  ];

  for (
    let index = 1;
    index <= 42;
    index++
  ) {
    ids.push(
      'DL-FIXTURE-' +
      String(index)
        .padStart(3, '0')
    );
  }

  assert.equal(
    ids.length,
    44
  );

  return ids.map(
    (id, index) => ({
      groupNumber:
        index === 0 ||
        index === 1
          ? 2
          : 21,
      distressLeadId:
        id,
      sourceRecordId:
        'SRC-' +
        String(index + 1),
      violationNumber:
        'VIOL-' +
        String(index + 1),
      parcelId:
        'PARCEL-' +
        String(index + 1),
      canonicalPropertyKey:
        'PROPERTY-' +
        String(index + 1),
      legacyObservationKey:
        'OBS-' +
        String(index + 1),
      proposedDurableKey:
        'DURABLE-' +
        String(index + 1)
    })
  );
}

function makeCatalog(records) {
  const groups = [];

  function id(index) {
    return records[index]
      .distressLeadId;
  }

  for (
    let group = 1;
    group <= 14;
    group++
  ) {
    let candidates;

    if (group === 1) {
      candidates = [
        id(2),
        id(3)
      ];
    } else if (group === 2) {
      candidates = [
        TARGET,
        id(4)
      ];
    } else {
      candidates = [
        id(group + 2)
      ];
    }

    const winner =
      group === 2
        ? WINNER
        : id(20 + group);

    candidates.forEach(
      candidateId => {
        const record =
          records.find(
            item =>
              item.distressLeadId ===
              candidateId
          );

        assert.ok(record);
        record.groupNumber =
          group;
      }
    );

    const winnerRecord =
      records.find(
        item =>
          item.distressLeadId ===
            winner
      );

    if (winnerRecord) {
      winnerRecord.groupNumber =
        group;
    }

    groups.push({
      groupNumber:
        group,
      winnerDistressLeadId:
        winner,
      deleteCandidateDistressLeadIds:
        candidates
    });
  }

  const count =
    groups.reduce(
      (
        total,
        group
      ) =>
        total +
        group
          .deleteCandidateDistressLeadIds
          .length,
      0
    );

  assert.equal(
    count,
    16
  );

  return groups;
}

function historicalHistory() {
  return {
    found:
      true,
    operationId:
      HISTORICAL,
    identity: {
      executorImplementationVersion:
        'GROUP2-HISTORICAL-V1',
      groupNumber:
        2,
      winnerDistressLeadId:
        WINNER,
      targetDeleteDistressLeadId:
        TARGET
    },
    events: [
      {
        manifest: {
          operationId:
            HISTORICAL,
          eventSequence:
            1,
          eventType:
            'INTENT_PREPARED',
          groupNumber:
            2,
          winnerDistressLeadId:
            WINNER,
          targetDeleteDistressLeadId:
            TARGET,
          payloadSha256:
            PREPARED_PAYLOAD_SHA,
          previousEventSha256:
            'GENESIS',
          eventSha256:
            PREPARED_EVENT_SHA
        }
      },
      {
        manifest: {
          operationId:
            HISTORICAL,
          eventSequence:
            2,
          eventType:
            'COLLAPSE_EXECUTOR_PRECONDITION_FAILED',
          groupNumber:
            2,
          winnerDistressLeadId:
            WINNER,
          targetDeleteDistressLeadId:
            TARGET,
          payloadSha256:
            TERMINAL_PAYLOAD_SHA,
          previousEventSha256:
            PREPARED_EVENT_SHA,
          eventSha256:
            TERMINAL_EVENT_SHA
        }
      }
    ]
  };
}

function historicalRecovery() {
  return {
    operationId:
      HISTORICAL,
    found:
      true,
    classification:
      HISTORICAL_RECOVERY,
    automaticRetryPermitted:
      false,
    rowRecreationPermitted:
      false,
    journalMutationExecuted:
      false,
    eventCount:
      2
  };
}

function successHistory(
  operationId,
  target,
  groupNumber,
  winner
) {
  const terminalSha =
    hex(
      operationId +
      ':terminal'
    );

  return {
    history: {
      found:
        true,
      operationId,
      identity: {
        executorImplementationVersion:
          'SUCCESS-V1',
        groupNumber,
        winnerDistressLeadId:
          winner,
        targetDeleteDistressLeadId:
          target
      },
      events: [
        {
          manifest: {
            operationId,
            eventSequence:
              1,
            eventType:
              'INTENT_PREPARED',
            groupNumber,
            winnerDistressLeadId:
              winner,
            targetDeleteDistressLeadId:
              target,
            payloadSha256:
              hex(
                operationId +
                ':prepared-payload'
              ),
            previousEventSha256:
              'GENESIS',
            eventSha256:
              hex(
                operationId +
                ':prepared'
              )
          }
        },
        {
          manifest: {
            operationId,
            eventSequence:
              2,
            eventType:
              'COLLAPSE_DELETE_VERIFIED',
            groupNumber,
            winnerDistressLeadId:
              winner,
            targetDeleteDistressLeadId:
              target,
            payloadSha256:
              hex(
                operationId +
                ':terminal-payload'
              ),
            previousEventSha256:
              hex(
                operationId +
                ':prepared'
              ),
            eventSha256:
              terminalSha
          }
        }
      ]
    },
    recovery: {
      operationId,
      found:
        true,
      classification:
        'VERIFIED_SUCCESS_JOURNAL',
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      journalMutationExecuted:
        false,
      eventCount:
        2,
      terminalEventSha256:
        terminalSha
    }
  };
}

function benignHistory(
  operationId,
  target,
  groupNumber,
  winner
) {
  return {
    history: {
      found:
        true,
      operationId,
      identity: {
        executorImplementationVersion:
          'BENIGN-V1',
        groupNumber,
        winnerDistressLeadId:
          winner,
        targetDeleteDistressLeadId:
          target
      },
      events: [
        {
          manifest: {
            operationId,
            eventSequence:
              1,
            eventType:
              'INTENT_PREPARED',
            groupNumber,
            winnerDistressLeadId:
              winner,
            targetDeleteDistressLeadId:
              target,
            payloadSha256:
              hex(operationId + ':payload'),
            previousEventSha256:
              'GENESIS',
            eventSha256:
              hex(operationId + ':event')
          }
        }
      ]
    },
    recovery: {
      operationId,
      found:
        true,
      classification:
        'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      journalMutationExecuted:
        false,
      eventCount:
        1
    }
  };
}

function uncertainHistory(
  operationId,
  target,
  groupNumber,
  winner
) {
  const item =
    benignHistory(
      operationId,
      target,
      groupNumber,
      winner
    );

  item.recovery.classification =
    'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL';

  return item;
}

function setOperation(
  fixture,
  operationId,
  item
) {
  fixture.histories[
    operationId
  ] =
    clone(item.history);

  fixture.recoveries[
    operationId
  ] =
    clone(item.recovery);
}

function removeOperation(
  fixture,
  operationId
) {
  delete fixture.histories[
    operationId
  ];

  delete fixture.recoveries[
    operationId
  ];
}

function renameOperation(
  fixture,
  oldId,
  newId
) {
  const history =
    fixture.histories[oldId];

  const recovery =
    fixture.recoveries[oldId];

  delete fixture.histories[oldId];
  delete fixture.recoveries[oldId];

  history.operationId =
    newId;

  history.events.forEach(
    event => {
      event.manifest.operationId =
        newId;
    }
  );

  recovery.operationId =
    newId;

  fixture.histories[newId] =
    history;

  fixture.recoveries[newId] =
    recovery;
}

function baseFixture() {
  const certified =
    makeCertifiedRecords();

  const catalog =
    makeCatalog(certified);

  const fixture = {
    certified,
    catalog,
    missing:
      new Set([
        TARGET
      ]),
    histories: {},
    recoveries: {}
  };

  fixture.otherTarget =
    certified[2]
      .distressLeadId;

  fixture.otherWinner =
    catalog[0]
      .winnerDistressLeadId;

  fixture.histories[
    HISTORICAL
  ] =
    historicalHistory();

  fixture.recoveries[
    HISTORICAL
  ] =
    historicalRecovery();

  setOperation(
    fixture,
    'verified-group2-success',
    successHistory(
      'verified-group2-success',
      TARGET,
      2,
      WINNER
    )
  );

  return fixture;
}

const runtimeReturn =
  "    return Object.freeze({\n" +
  "      read:\n" +
  "        read\n" +
  "    });\n" +
  "  })();";

const exposedReturn =
  "    return Object.freeze({\n" +
  "      read:\n" +
  "        read,\n" +
  "      __testIncidentHistorySet:\n" +
  "        assertExactGroup2PostSuccessHistorySet_\n" +
  "    });\n" +
  "  })();";

assert.equal(
  residualSource
    .split(runtimeReturn)
    .length - 1,
  1,
  'Residual test-exposure anchor drift.'
);

function loadResidual(
  fixture,
  exposeHelpers = false
) {
  const state = {
    adminCalls:
      0,
    mutationCalls:
      0
  };

  let source =
    residualSource;

  if (exposeHelpers) {
    source =
      source.replace(
        runtimeReturn,
        exposedReturn
      );
  }

  function currentRows() {
    let rowNumber = 2;

    return fixture.certified
      .filter(
        record =>
          !fixture
            .missing
            .has(
              record.distressLeadId
            )
      )
      .map(record => {
        const row = {
          _rowNumber:
            rowNumber++,
          'Distress Lead ID':
            record.distressLeadId,
          Source:
            'PA-PHILADELPHIA',
          'Source Dataset':
            'code_violations',
          'Source Record ID':
            record.sourceRecordId,
          'Violation Number':
            record.violationNumber,
          'Canonical Property Key':
            record.canonicalPropertyKey,
          'Source Observation Key':
            record.legacyObservationKey,
          'Source Record Key':
            record.legacyObservationKey,
          'Parcel ID':
            record.parcelId
        };

        return row;
      });
  }

  const context = {
    console,
    REOS: {
      Security: {
        requireAdmin() {
          state.adminCalls++;
          return true;
        }
      },

      Database: {
        getHeaders() {
          return headers.slice();
        },

        getAll() {
          return currentRows();
        }
      },

      CanonicalPropertyIdentity: {
        resolve(row) {
          return {
            canonicalPropertyKey:
              row[
                'Canonical Property Key'
              ],
            sourceObservationKey:
              row[
                'Source Observation Key'
              ]
          };
        }
      },

      CountyCodeViolationCollapseOnlyEvidenceAuthority: {
        metadata() {
          return {
            authoritySha256:
              AUTHORITY_SHA,
            groupCount:
              21,
            rowCount:
              44
          };
        },

        records() {
          return clone(
            fixture.certified
          );
        }
      },

      CountyCodeViolationCollapseDirectKeepExecutionAuthority: {
        metadata() {
          return {
            authoritySha256:
              AUTHORITY_SHA,
            winnerPlanFingerprintSha256:
              PLAN_SHA,
            directKeepGroupCount:
              14,
            directKeepDeleteCandidateCount:
              16
          };
        },

        catalog() {
          return clone(
            fixture.catalog
          );
        }
      },

      CountyCollapseOperationIntentStore: {
        listOperationIds() {
          return Object
            .keys(
              fixture.histories
            )
            .sort();
        },

        read(operationId) {
          const history =
            fixture.histories[
              operationId
            ];

          if (!history) {
            return {
              found:
                false,
              operationId
            };
          }

          return clone(history);
        },

        recover(operationId) {
          const recovery =
            fixture.recoveries[
              operationId
            ];

          if (!recovery) {
            return {
              found:
                false,
              operationId,
              classification:
                'NOT_FOUND',
              automaticRetryPermitted:
                false,
              rowRecreationPermitted:
                false,
              journalMutationExecuted:
                false
            };
          }

          return clone(recovery);
        },

        prepare() {
          state.mutationCalls++;
          throw new Error(
            'Unexpected journal mutation.'
          );
        },

        append() {
          state.mutationCalls++;
          throw new Error(
            'Unexpected journal mutation.'
          );
        }
      }
    }
  };

  vm.runInNewContext(
    source,
    context,
    {
      filename:
        RESIDUAL
    }
  );

  return {
    api:
      context
        .REOS
        .CountyCodeViolationCollapseResidualEvidence,
    state
  };
}

let caseCount = 0;

function passCase(
  number,
  name,
  mutate,
  verify
) {
  const fixture =
    baseFixture();

  if (mutate) {
    mutate(fixture);
  }

  const loaded =
    loadResidual(fixture);

  const result =
    loaded.api.read();

  assert.equal(
    result.ok,
    true
  );

  if (verify) {
    verify(
      result,
      loaded,
      fixture
    );
  }

  assert.equal(
    loaded.state.mutationCalls,
    0
  );

  caseCount++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

function failCase(
  number,
  name,
  mutate
) {
  const fixture =
    baseFixture();

  mutate(fixture);

  const loaded =
    loadResidual(fixture);

  assert.throws(
    () => loaded.api.read()
  );

  assert.equal(
    loaded.state.mutationCalls,
    0
  );

  caseCount++;

  console.log(
    'PASS ' +
    String(number)
      .padStart(2, '0') +
    ': ' +
    name
  );
}

passCase(
  1,
  'exact Group 2 two-history post-success set is accepted',
  null,
  result => {
    assert.equal(
      result.verifiedDeletedCount,
      1
    );

    assert.equal(
      result.currentCertifiedRowCount,
      43
    );

    assert.equal(
      result.executionBlocked,
      false
    );
  }
);

failCase(
  2,
  'exact one verified-success history is required',
  fixture => {
    removeOperation(
      fixture,
      'verified-group2-success'
    );
  }
);

failCase(
  3,
  'second verified-success history fails',
  fixture => {
    setOperation(
      fixture,
      'verified-group2-success-2',
      successHistory(
        'verified-group2-success-2',
        TARGET,
        2,
        WINNER
      )
    );
  }
);

failCase(
  4,
  'exact historical operation ID is required',
  fixture => {
    renameOperation(
      fixture,
      HISTORICAL,
      'historical-operation-renamed'
    );
  }
);

failCase(
  5,
  'historical Group number drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .identity
      .groupNumber = 3;
  }
);

failCase(
  6,
  'historical winner drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .identity
      .winnerDistressLeadId =
        'DL-WRONG-WINNER';
  }
);

failCase(
  7,
  'historical target drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .identity
      .targetDeleteDistressLeadId =
        'DL-WRONG-TARGET';
  }
);

failCase(
  8,
  'historical prepared event SHA drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events[0]
      .manifest
      .eventSha256 =
        '0'.repeat(64);
  }
);

failCase(
  9,
  'historical prepared payload SHA drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events[0]
      .manifest
      .payloadSha256 =
        '0'.repeat(64);
  }
);

failCase(
  10,
  'historical terminal event SHA drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events[1]
      .manifest
      .eventSha256 =
        '0'.repeat(64);
  }
);

failCase(
  11,
  'historical terminal payload SHA drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events[1]
      .manifest
      .payloadSha256 =
        '0'.repeat(64);
  }
);

failCase(
  12,
  'historical event count drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events
      .push(
        clone(
          fixture
            .histories[
              HISTORICAL
            ]
            .events[1]
        )
      );
  }
);

failCase(
  13,
  'historical event ordering drift fails',
  fixture => {
    fixture
      .histories[
        HISTORICAL
      ]
      .events
      .reverse();
  }
);

failCase(
  14,
  'historical recovery-classification drift fails',
  fixture => {
    fixture
      .recoveries[
        HISTORICAL
      ]
      .classification =
        'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';
  }
);

failCase(
  15,
  'historical automatic-retry authority fails',
  fixture => {
    fixture
      .recoveries[
        HISTORICAL
      ]
      .automaticRetryPermitted =
        true;
  }
);

failCase(
  16,
  'historical row-recreation authority fails',
  fixture => {
    fixture
      .recoveries[
        HISTORICAL
      ]
      .rowRecreationPermitted =
        true;
  }
);

failCase(
  17,
  'historical journal-mutation authority fails',
  fixture => {
    fixture
      .recoveries[
        HISTORICAL
      ]
      .journalMutationExecuted =
        true;
  }
);

{
  const fixture =
    baseFixture();

  const loaded =
    loadResidual(
      fixture,
      true
    );

  assert.throws(
    () =>
      loaded
        .api
        .__testIncidentHistorySet(
          TARGET,
          {
            groupNumber:
              2,
            winnerDistressLeadId:
              WINNER
          },
          {
            operationId:
              HISTORICAL
          },
          {
            operationId:
              HISTORICAL
          },
          2,
          0
        )
  );

  caseCount++;

  console.log(
    'PASS 18: verified-success operation must be distinct from historical operation'
  );
}

failCase(
  19,
  'verified-success classification drift fails',
  fixture => {
    fixture
      .recoveries[
        'verified-group2-success'
      ]
      .classification =
        'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION';
  }
);

failCase(
  20,
  'verified-success terminal-type drift fails',
  fixture => {
    fixture
      .histories[
        'verified-group2-success'
      ]
      .events[1]
      .manifest
      .eventType =
        'RECONCILIATION_NOTE';
  }
);

failCase(
  21,
  'a third target-bound operation fails',
  fixture => {
    setOperation(
      fixture,
      'third-target-history',
      benignHistory(
        'third-target-history',
        TARGET,
        2,
        WINNER
      )
    );
  }
);

failCase(
  22,
  'an unrecognized second target-bound operation fails',
  fixture => {
    removeOperation(
      fixture,
      HISTORICAL
    );

    setOperation(
      fixture,
      'unrecognized-precondition-history',
      benignHistory(
        'unrecognized-precondition-history',
        TARGET,
        2,
        WINNER
      )
    );

    fixture
      .recoveries[
        'unrecognized-precondition-history'
      ]
      .classification =
        HISTORICAL_RECOVERY;
  }
);

failCase(
  23,
  'an uncertain target-bound operation fails',
  fixture => {
    setOperation(
      fixture,
      'uncertain-target-history',
      uncertainHistory(
        'uncertain-target-history',
        TARGET,
        2,
        WINNER
      )
    );
  }
);

failCase(
  24,
  'physically reappearing verified-deleted target fails',
  fixture => {
    fixture
      .missing
      .delete(TARGET);
  }
);

failCase(
  25,
  'missing candidate authority fails',
  fixture => {
    const group2 =
      fixture.catalog.find(
        group =>
          group.groupNumber === 2
      );

    const replacement =
      fixture.certified[17]
        .distressLeadId;

    assert.ok(
      !fixture.catalog.some(
        group =>
          group
            .deleteCandidateDistressLeadIds
            .includes(replacement)
      )
    );

    group2
      .deleteCandidateDistressLeadIds =
        group2
          .deleteCandidateDistressLeadIds
          .map(
            id =>
              id === TARGET
                ? replacement
                : id
          );
  }
);

failCase(
  26,
  'unrelated target with two histories fails',
  fixture => {
    fixture
      .missing
      .add(
        fixture.otherTarget
      );

    setOperation(
      fixture,
      'other-target-success',
      successHistory(
        'other-target-success',
        fixture.otherTarget,
        1,
        fixture.otherWinner
      )
    );

    setOperation(
      fixture,
      'other-target-second-history',
      benignHistory(
        'other-target-second-history',
        fixture.otherTarget,
        1,
        fixture.otherWinner
      )
    );
  }
);

passCase(
  27,
  'unrelated missing target still requires exactly one strict history',
  fixture => {
    fixture
      .missing
      .add(
        fixture.otherTarget
      );

    setOperation(
      fixture,
      'other-target-success',
      successHistory(
        'other-target-success',
        fixture.otherTarget,
        1,
        fixture.otherWinner
      )
    );
  },
  result => {
    assert.equal(
      result.verifiedDeletedCount,
      2
    );
  }
);

{
  const fixture =
    baseFixture();

  const loaded =
    loadResidual(fixture);

  assert.throws(
    () =>
      loaded.api.read({
        allowTwoHistories:
          true
      })
  );

  caseCount++;

  console.log(
    'PASS 28: no caller-controlled bypass exists'
  );
}

passCase(
  29,
  'no journal mutation occurs',
  null,
  (
    result,
    loaded
  ) => {
    assert.equal(
      loaded.state.mutationCalls,
      0
    );

    assert.equal(
      result.ok,
      true
    );
  }
);

passCase(
  30,
  'no execution authority is granted',
  null,
  (
    result,
    loaded
  ) => {
    assert.deepEqual(
      Object.keys(
        loaded.api
      ).sort(),
      [
        'read'
      ]
    );

    [
      'winnerSelectionAuthorityGranted',
      'collapseExecutionAuthorityGranted',
      'physicalDeleteAuthorityGranted',
      'productionDataMutationAuthorityGranted',
      'schedulerMutationAuthorityGranted',
      'checkpointMutationAuthorityGranted',
      'connectorExecutionAuthorityGranted',
      'automaticOfferAuthorityGranted'
    ].forEach(key => {
      assert.equal(
        result[key],
        false,
        key
      );
    });
  }
);

assert.equal(
  caseCount,
  30,
  'Exactly 30 behavior cases must execute.'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_BEHAVIOR_CASES=30'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_SCOPE_EXACT_THREE_FILES=true'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_NON_GROUP2_EXACT_ONE_PRESERVED=true'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_NO_JOURNAL_MUTATION=true'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_NO_EXECUTION_AUTHORITY=true'
);

console.log(
  'GROUP2_POSTSUCCESS_HISTORY_INVARIANT_REPAIR_VALIDATION_PASSED=true'
);
