#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const PLAN =
  'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js';

const AUTH =
  'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js';

const EXPECTED_AUTHORITY_SHA =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

console.log(
  '=== COUNTY CODE VIOLATION COLLAPSE WINNER PLAN V1 ==='
);

assert.ok(
  fs.existsSync(PLAN),
  'Winner plan module must exist.'
);

assert.ok(
  fs.existsSync(AUTH),
  'Collapse-only evidence authority must exist.'
);

const source =
  fs.readFileSync(PLAN, 'utf8');

const authoritySource =
  fs.readFileSync(AUTH, 'utf8');

/*
 * Structural safety contract.
 */
[
  'READ ONLY',
  'EXPECTED_ELIGIBLE_GROUPS',
  'EXPECTED_ELIGIBLE_ROWS',
  'EXPECTED_DIRECT_KEEP_GROUPS',
  'EXPECTED_OBSERVATION_MERGE_GROUPS',
  'EXPECTED_DELETE_CANDIDATES',
  'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN',
  'winnerSelectionAuthorityGranted',
  'collapseAuthorityGranted',
  'deleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted',
  'reosCountyCodeViolationCollapseWinnerPlan'
].forEach(token => {
  assert.ok(
    source.includes(token),
    'Required winner-plan contract token missing: ' +
      token
  );
});

/*
 * The read-only planner must not itself expose obvious production
 * mutation surfaces.
 */
[
  /setValue\s*\(/,
  /setValues\s*\(/,
  /appendRow\s*\(/,
  /deleteRow\s*\(/,
  /insertRow/i,
  /REOS\.Database\.update\s*\(/,
  /REOS\.Database\.insert\s*\(/,
  /REOS\.Database\.upsert\s*\(/,
  /REOS\.Database\.softDelete\s*\(/,
  /ScriptApp\.newTrigger\s*\(/,
  /deleteTrigger\s*\(/
].forEach(pattern => {
  assert.doesNotMatch(
    source,
    pattern,
    'Winner plan must remain read-only: ' +
      pattern
  );
});

console.log(
  'PASS: winner-plan source is structurally read-only'
);

/*
 * Load the certified authority.
 */
const authoritySandbox = {
  REOS: {},
  Object
};

vm.createContext(authoritySandbox);

vm.runInContext(
  authoritySource,
  authoritySandbox,
  {
    filename:
      'CountyCodeViolationCollapseOnlyEvidenceAuthority.js'
  }
);

const authority =
  authoritySandbox.REOS
    .CountyCodeViolationCollapseOnlyEvidenceAuthority;

assert.ok(authority);

const metadata =
  authority.metadata();

const records =
  authority.records();

assert.strictEqual(
  metadata.authoritySha256,
  EXPECTED_AUTHORITY_SHA
);

assert.strictEqual(
  records.length,
  44
);

assert.strictEqual(
  metadata.groupCount,
  21
);

assert.strictEqual(
  metadata.rowCount,
  44
);

console.log(
  'PASS: exact post-restoration 21-group / 44-row certified authority loaded'
);

/*
 * Build deterministic synthetic full-row evidence from the certified
 * population.
 *
 * Group 1 intentionally reproduces the sole proven business-value blocker.
 * Groups 17-22 intentionally put the latest observation on the later
 * physical row.
 */
const byGroup = new Map();

records.forEach(record => {
  if (!byGroup.has(record.groupNumber)) {
    byGroup.set(record.groupNumber, []);
  }

  byGroup
    .get(record.groupNumber)
    .push(record);
});

assert.strictEqual(
  byGroup.size,
  21
);

for (const members of byGroup.values()) {
  members.sort(
    (a, b) =>
      Number(a.rowNumber) -
      Number(b.rowNumber)
  );
}

function isoFromRow(rowNumber, seconds) {
  const base =
    Date.UTC(
      2026,
      7,
      20,
      12,
      0,
      0,
      0
    );

  return new Date(
    base +
    Number(rowNumber) * 1000 +
    Number(seconds || 0) * 1000
  ).toISOString();
}

const fullRows = [];

for (
  const [groupNumber, members]
  of byGroup.entries()
) {
  members.forEach(
    (record, index) => {
      let createdAt =
        isoFromRow(
          record.rowNumber,
          0
        );

      let updatedAt =
        isoFromRow(
          record.rowNumber,
          100
        );

      let lastSeenAt =
        isoFromRow(
          record.rowNumber,
          90
        );

      let connectorRunId =
        'CCR-SYNTH-' +
        String(groupNumber)
          .padStart(2, '0') +
        '-' +
        String(index + 1);

      /*
       * Groups 2-16:
       * earliest/lowest lineage row also has latest observation.
       */
      if (
        groupNumber >= 2 &&
        groupNumber <= 16 &&
        groupNumber !== 3 &&
        index === 0
      ) {
        updatedAt =
          isoFromRow(
            record.rowNumber,
            100000
          );

        lastSeenAt =
          isoFromRow(
            record.rowNumber,
            99990
          );

        connectorRunId =
          'CCR-LATEST-G' +
          groupNumber;
      }

      /*
       * Groups 17-22:
       * later row owns latest observation provenance.
       */
      if (
        groupNumber >= 17 &&
        groupNumber <= 22 &&
        index ===
          members.length - 1
      ) {
        updatedAt =
          isoFromRow(
            record.rowNumber,
            100000
          );

        lastSeenAt =
          isoFromRow(
            record.rowNumber,
            99990
          );

        connectorRunId =
          'CCR-LATEST-G' +
          groupNumber;
      }

      const values = {
        'Distress Lead ID':
          record.distressLeadId,

        'Source':
          'PA-PHILADELPHIA',

        'Source Dataset':
          'code_violations',

        'Source Record ID':
          record.sourceRecordId,

        'Violation Number':
          record.violationNumber,

        'Canonical Property Key':
          '',

        'Source Observation Key':
          '',

        'Source Record Key':
          record.legacyObservationKey,

        'Parcel ID':
          record.parcelId,

        'Address':
          'Synthetic Address',

        'City':
          'Philadelphia',

        'State':
          'PA',

        'Zip':
          '19100',

        'County':
          'Philadelphia',

        'Distress Type':
          'Code Violation',

        'Violation Status':
          'OPEN',

        'Violation Type':
          'SYNTHETIC',

        'Status':
          '',

        'Tax Principal':
          100,

        'Tax Interest':
          10,

        'Tax Penalty':
          5,

        'Created At':
          createdAt,

        'Updated At':
          updatedAt,

        'Last Seen At':
          lastSeenAt,

        'Connector Run ID':
          connectorRunId
      };

      /*
       * Group 1 = genuine conflicting business values.
       */
      if (groupNumber === 1) {
        values['Tax Principal'] =
          index === 0
            ? 1984.85
            : 1011.19;

        values['Tax Interest'] =
          index === 0
            ? 1912.44
            : 129.57;

        values['Tax Penalty'] =
          index === 0
            ? 348.79
            : 66.83;
      }

      fullRows.push({
        groupNumber:
          record.groupNumber,

        rowNumber:
          record.rowNumber,

        distressLeadId:
          record.distressLeadId,

        sourceRecordId:
          record.sourceRecordId,

        violationNumber:
          record.violationNumber,

        canonicalPropertyKey:
          record.canonicalPropertyKey,

        legacyObservationKey:
          record.legacyObservationKey,

        proposedDurableKey:
          record.proposedDurableKey,

        derivedIdentity: {
          canonicalPropertyKey:
            record.canonicalPropertyKey,

          sourceObservationKey:
            record.legacyObservationKey
        },

        values:
          values
      });
    }
  );
}

assert.strictEqual(
  fullRows.length,
  44
);

const allIds =
  records.map(
    record =>
      record.distressLeadId
  );

assert.strictEqual(
  allIds.length,
  44
);

assert.strictEqual(
  allIds.includes(
    'DL-20260820181647-4170'
  ),
  false
);

assert.strictEqual(
  allIds.includes(
    'ZIL-20260820193920-1756'
  ),
  false
);

const referenceResult = {
  ok: true,
  mode: 'READ_ONLY',
  phase:
    'downstream_reference_audit',
  requestedIds:
    allIds.slice(),
  requestedIdCount:
    44,
  matchedIdCount:
    0,
  matchCount:
    0,
  retainedMatchCount:
    0,
  scanComplete:
    true,
  matchesTruncated:
    false,
  truncated:
    false,
  formulaTextScanned:
    false,
  referenceSurface:
    'CELL_VALUES_ONLY',
  unmatchedIds:
    allIds.slice(),
  matches: [],
  repairAuthorityGranted:
    false,
  migrationAuthorityGranted:
    false,
  repairPlanAuthorityGranted:
    false
};

const fullEvidenceResult = {
  ok: true,
  mode:
    'READ_ONLY_CERTIFIED_CODE_VIOLATION_COLLAPSE_FULL_ROW_EVIDENCE',
  authoritySha256:
    metadata.authoritySha256,
  sourceEvidenceSha256:
    metadata.sourceEvidenceSha256,
  certifiedGroupCount:
    21,
  certifiedRowCount:
    44,
  returnedRowCount:
    44,
  rows:
    fullRows,
  productionDataMutationAuthorityGranted:
    false,
  collapseAuthorityGranted:
    false,
  winnerSelectionAuthorityGranted:
    false,
  deleteAuthorityGranted:
    false,
  repairAuthorityGranted:
    false,
  migrationAuthorityGranted:
    false,
  connectorExecutionAuthorityGranted:
    false,
  checkpointMutationAuthorityGranted:
    false,
  schedulerAuthorityGranted:
    false,
  automaticOfferAuthorityGranted:
    false
};

/*
 * Execute the planner with read-only dependency stubs.
 */
let adminCalls = 0;
let fullEvidenceCalls = 0;
let referenceAuditCalls = 0;

const context = {
  console,

  REOS: {
    CountyCodeViolationCollapseOnlyEvidenceAuthority:
      authority,

    CountyCodeViolationCollapseFullRowEvidence: {
      exportEvidence(options) {
        fullEvidenceCalls++;

        assert.strictEqual(
          Object.keys(options || {}).length,
          0
        );

        return JSON.parse(
          JSON.stringify(
            fullEvidenceResult
          )
        );
      }
    },

    CountyIdentityReferenceAudit: {
      audit(options) {
        referenceAuditCalls++;

        assert.ok(
          options &&
          Array.isArray(
            options.distressLeadIds
          )
        );

        assert.strictEqual(
          options.distressLeadIds.length,
          44
        );

        assert.strictEqual(
          new Set(
            options.distressLeadIds
          ).size,
          44
        );

        return JSON.parse(
          JSON.stringify(
            referenceResult
          )
        );
      }
    },

    Security: {
      requireAdmin() {
        adminCalls++;
        return true;
      }
    }
  },

  Utilities: {
    DigestAlgorithm: {
      SHA_256: 'SHA_256'
    },

    Charset: {
      UTF_8: 'UTF_8'
    },

    computeDigest(algorithm, value, charset) {
      assert.strictEqual(
        algorithm,
        'SHA_256'
      );

      assert.strictEqual(
        charset,
        'UTF_8'
      );

      return Array.from(
        crypto
          .createHash('sha256')
          .update(
            String(value),
            'utf8'
          )
          .digest()
      ).map(byte =>
        byte > 127
          ? byte - 256
          : byte
      );
    }
  },

  Object,
  Array,
  String,
  Number,
  Date,
  JSON,
  Math,
  Set,
  Map
};

vm.createContext(context);

vm.runInContext(
  source,
  context,
  {
    filename:
      'CountyCodeViolationCollapseWinnerPlan.js'
  }
);

assert.strictEqual(
  typeof context
    .reosCountyCodeViolationCollapseWinnerPlan,
  'function'
);

const result =
  context
    .reosCountyCodeViolationCollapseWinnerPlan(
      {}
    );

assert.ok(
  result &&
  typeof result === 'object'
);

assert.strictEqual(
  adminCalls,
  1,
  'Admin authority must be required exactly once.'
);

assert.strictEqual(
  fullEvidenceCalls,
  1,
  'Full-row evidence must be read exactly once.'
);

assert.strictEqual(
  referenceAuditCalls,
  1,
  'Reference audit must be read exactly once.'
);

assert.strictEqual(
  result.ok,
  true
);

assert.strictEqual(
  result.mode,
  'READ_ONLY_CODE_VIOLATION_COLLAPSE_WINNER_PLAN'
);

function numeric(
  preferred,
  aliases
) {
  const names = [
    preferred
  ].concat(
    aliases || []
  );

  for (const name of names) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(result, name)
    ) {
      return Number(
        result[name]
      );
    }
  }

  throw new Error(
    'Missing result count: ' +
    preferred
  );
}

assert.strictEqual(
  numeric(
    'eligibleGroupCount',
    ['eligibleGroups']
  ),
  20
);

assert.strictEqual(
  numeric(
    'eligibleRowCount',
    ['eligibleRows']
  ),
  42
);

assert.strictEqual(
  numeric(
    'directKeepGroupCount',
    [
      'directKeepGroups',
      'directKeepCount'
    ]
  ),
  14
);

assert.strictEqual(
  numeric(
    'observationMergeGroupCount',
    [
      'observationMergeGroups',
      'observationMergeCount'
    ]
  ),
  6
);

assert.strictEqual(
  numeric(
    'deleteCandidateRowCount',
    [
      'deleteCandidateCount',
      'deleteCandidateRows',
      'deleteCandidates'
    ]
  ),
  22
);

[
  'winnerSelectionAuthorityGranted',
  'collapseAuthorityGranted',
  'deleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(field => {
  assert.strictEqual(
    result[field],
    false,
    field +
      ' must remain false.'
  );
});

console.log(
  'PASS: exact 20 eligible groups / 42 rows'
);

console.log(
  'PASS: exact 14 direct-keep / 6 observation-merge partition'
);

console.log(
  'PASS: exact 22 delete candidates'
);

console.log(
  'PASS: all mutation and winner authority remains false'
);

/*
 * Caller-defined population authority must be prohibited.
 */
assert.throws(
  () =>
    context
      .reosCountyCodeViolationCollapseWinnerPlan({
        distressLeadIds: [
          records[0]
            .distressLeadId
        ]
      }),
  /caller|distress|population|prohibited/i
);

console.log(
  'PASS: caller-defined population authority is prohibited'
);

/*
 * Downstream reference drift must fail closed.
 */
const originalReferenceAudit =
  context.REOS
    .CountyIdentityReferenceAudit
    .audit;

context.REOS
  .CountyIdentityReferenceAudit
  .audit =
  function (options) {
    const drift =
      originalReferenceAudit(
        options
      );

    const extra =
      drift.unmatchedIds[0];

    drift.unmatchedIds =
      drift.unmatchedIds.filter(
        id => id !== extra
      );

    drift.matches.push({
      columnNumber: 1,
      rowNumber: 2,
      distressLeadId:
        extra,
      sheet:
        'SYNTHETIC_REFERENCE_DRIFT'
    });

    drift.matchedIdCount =
      1;

    drift.matchCount =
      1;

    drift.retainedMatchCount =
      1;

    return drift;
  };

assert.throws(
  () =>
    context
      .reosCountyCodeViolationCollapseWinnerPlan(
        {}
      ),
  /reference|drift|blocked|eligible/i
);

context.REOS
  .CountyIdentityReferenceAudit
  .audit =
  originalReferenceAudit;

console.log(
  'PASS: new downstream reference fails closed'
);

/*
 * Incomplete reference evidence must fail closed.
 */
context.REOS
  .CountyIdentityReferenceAudit
  .audit =
  function () {
    return Object.assign(
      {},
      referenceResult,
      {
        scanComplete:
          false
      }
    );
  };

assert.throws(
  () =>
    context
      .reosCountyCodeViolationCollapseWinnerPlan(
        {}
      ),
  /complete|reference|scan/i
);

context.REOS
  .CountyIdentityReferenceAudit
  .audit =
  originalReferenceAudit;

console.log(
  'PASS: incomplete downstream scan fails closed'
);

/*
 * Certified full-row population drift must fail closed.
 */
const originalFullEvidence =
  context.REOS
    .CountyCodeViolationCollapseFullRowEvidence
    .exportEvidence;

context.REOS
  .CountyCodeViolationCollapseFullRowEvidence
  .exportEvidence =
  function () {
    const drift =
      JSON.parse(
        JSON.stringify(
          fullEvidenceResult
        )
      );

    drift.rows =
      drift.rows.slice(
        0,
        43
      );

    drift.returnedRowCount =
      43;

    return drift;
  };

assert.throws(
  () =>
    context
      .reosCountyCodeViolationCollapseWinnerPlan(
        {}
      ),
  /44|population|row|evidence|drift/i
);

context.REOS
  .CountyCodeViolationCollapseFullRowEvidence
  .exportEvidence =
  originalFullEvidence;

console.log(
  'PASS: certified full-row population drift fails closed'
);

/*
 * Group 1 business conflict must remain blocked.
 */
const group1 =
  fullRows.filter(
    row =>
      row.groupNumber === 1
  );

assert.strictEqual(
  group1.length,
  2
);

assert.notStrictEqual(
  group1[0].values[
    'Tax Principal'
  ],
  group1[1].values[
    'Tax Principal'
  ]
);

console.log(
  'PASS: group 1 conflict fixture remains review-blocked'
);

/*
 * Historical Group 3 must remain absent from the duplicate cohort.
 */
assert.strictEqual(
  records.some(
    record =>
      Number(record.groupNumber) === 3
  ),
  false
);

assert.strictEqual(
  result.blockedGroupCount,
  1
);

assert.deepStrictEqual(
  JSON.parse(
    JSON.stringify(
      result.blockedGroups.map(
        entry =>
          Number(entry.groupNumber)
      )
    )
  ),
  [1]
);

assert.strictEqual(
  result.referenceAudit.requestedIdCount,
  44
);

assert.strictEqual(
  result.referenceAudit.matchedIdCount,
  0
);

assert.strictEqual(
  result.referenceAudit.matchCount,
  0
);

assert.strictEqual(
  result.referenceAudit.retainedMatchCount,
  0
);

assert.strictEqual(
  result.referenceAudit.matchesTruncated,
  false
);

console.log(
  'PASS: historical Group 3 is absent and zero downstream references are certified'
);

console.log(
  'POST_RESTORATION_WINNER_FINGERPRINT_SHA256=' +
  result.planFingerprintSha256
);

console.log('');
console.log(
  'County code violation collapse winner plan v1 validation PASSED.'
);
