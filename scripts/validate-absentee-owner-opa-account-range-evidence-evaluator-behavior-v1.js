#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const AUTHORITY_FIELDS = [
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
  'automaticOfferAuthorityGranted'
];

[
  'UrlFetchApp',
  'SpreadsheetApp',
  'PropertiesService',
  'ScriptApp',
  'LockService',
  'DriveApp',
  'GmailApp',
  'Jdbc',
  'owner_1',
  'owner_2',
  'mailing_address_1',
  'mailing_address_2',
  'mailing_care_of',
  'mailing_city_state',
  'mailing_street',
  'mailing_zip',
  'function reos'
].forEach(token => {
  assert.strictEqual(
    source.includes(token),
    false,
    'pure evaluator contains prohibited runtime token: ' +
      token
  );
});

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function plain(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function normalLookupEvidence() {
  return {
    ok: true,

    mode:
      'READ_ONLY_OWNER_EVIDENCE',

    phase:
      'absentee_owner_philadelphia_owner_evidence_lookup',

    outcome:
      'NO_MATCH',

    target: {
      rowNumber: 1530,

      identity: {
        'Distress Lead ID':
          'DL-20260825185532-4474',

        'Canonical Property Key':
          'property|parcel|pa|philadelphia|1473083'
      },

      propertyAddress:
        '1624 N Bodine St',

      city:
        'Philadelphia',

      state:
        'PA',

      zip:
        '19122-3034'
    },

    source: {
      agency:
        'Philadelphia Office of Property Assessment',

      dataset:
        'Philadelphia Properties and Assessment History',

      table:
        'opa_properties_public',

      endpoint:
        'https://phl.carto.com/api/v2/sql',

      lookupQueryMode:
        'exact_property_address'
    },

    boundedSourceRowCount: 0,

    productionDataMutationAuthorityGranted:
      false,

    ownerEvidencePersistenceAuthorityGranted:
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

function fixture() {
  return {
    normalLookupEvidence:
      normalLookupEvidence(),

    sourceObservations: [
      {
        sourceObservationId:
          'VIOLATIONS|383',

        propertyAddress:
          '1624 N BODINE ST',

        parcel_id_num:
          '1473083',

        opa_account_num:
          '183124510'
      },
      {
        sourceObservationId:
          'VIOLATIONS|384',

        propertyAddress:
          '1624 N BODINE ST',

        parcel_id_num:
          '1473083',

        opa_account_num:
          '183124510'
      }
    ],

    opaAccountRows: [
      {
        parcel_number:
          '183124510',

        location:
          '1616-42 N BODINE ST'
      }
    ]
  };
}

function createHarness() {
  const state = {
    externalHttpCalls: 0,
    databaseCalls: 0,
    spreadsheetCalls: 0,
    propertyCalls: 0,
    triggerCalls: 0,
    lockCalls: 0,
    classificationCalls: 0,
    persistenceCalls: 0,
    ownerLookupCalls: 0
  };

  const context = {
    console,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Math,
    Error,
    RegExp,
    Infinity,
    NaN,
    isFinite
  };

  context.REOS = {
    Database: {
      read() {
        state.databaseCalls++;
        throw new Error(
          'DATABASE_READ_PROHIBITED'
        );
      },

      update() {
        state.databaseCalls++;
        throw new Error(
          'DATABASE_WRITE_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup: {
      lookup() {
        state.ownerLookupCalls++;
        throw new Error(
          'OWNER_LOOKUP_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerClassification: {
      classify() {
        state.classificationCalls++;
        throw new Error(
          'CLASSIFICATION_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerClassificationPersistenceExecutor: {
      execute() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
      }
    }
  };

  context.UrlFetchApp = {
    fetch() {
      state.externalHttpCalls++;
      throw new Error(
        'EXTERNAL_HTTP_PROHIBITED'
      );
    }
  };

  context.SpreadsheetApp = {
    openById() {
      state.spreadsheetCalls++;
      throw new Error(
        'SPREADSHEET_CALL_PROHIBITED'
      );
    }
  };

  context.PropertiesService = {
    getScriptProperties() {
      state.propertyCalls++;
      throw new Error(
        'SCRIPT_PROPERTIES_PROHIBITED'
      );
    }
  };

  context.ScriptApp = {
    newTrigger() {
      state.triggerCalls++;
      throw new Error(
        'TRIGGER_CALL_PROHIBITED'
      );
    }
  };

  context.LockService = {
    getScriptLock() {
      state.lockCalls++;
      throw new Error(
        'LOCK_CALL_PROHIBITED'
      );
    }
  };

  vm.createContext(context);

  vm.runInContext(
    source,
    context
  );

  return {
    state,

    call(input) {
      return context
        .REOS
        .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator
        .evaluate(input);
    }
  };
}

function assertAuthoritiesFalse(result) {
  AUTHORITY_FIELDS.forEach(field => {
    assert.strictEqual(
      result[field],
      false,
      field + ' must remain false'
    );
  });

  assert.strictEqual(
    result.rangeContainmentCertifiedMatch,
    false
  );
}

function assertOutcome(
  result,
  outcome,
  ok
) {
  assert.strictEqual(
    result.mode,
    'READ_ONLY_OPA_ACCOUNT_RANGE_EVIDENCE_EVALUATION'
  );

  assert.strictEqual(
    result.phase,
    'absentee_owner_opa_account_range_evidence_evaluation'
  );

  assert.strictEqual(
    result.outcome,
    outcome
  );

  assert.strictEqual(
    result.ok,
    ok
  );

  assert.strictEqual(
    result.rangeContainmentDiagnosticCandidate,
    outcome ===
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE'
  );

  assertAuthoritiesFalse(result);
}

function run(input) {
  const h =
    createHarness();

  return {
    h,
    out:
      h.call(input)
  };
}

let count = 0;

function test(name, fn) {
  fn();
  count++;

  console.log(
    'PASS ' + count + ': ' + name
  );
}

test(
  'certified motivating diagnostic fixture becomes candidate only',
  () => {
    const { out } =
      run(
        fixture()
      );

    assertOutcome(
      out,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      true
    );

    assert.strictEqual(
      out.target.rowNumber,
      1530
    );

    assert.strictEqual(
      out.sourceParcelIdNum,
      '1473083'
    );

    assert.strictEqual(
      out.sourceOpaAccountNum,
      '183124510'
    );

    assert.strictEqual(
      out.corroboratingSourceObservationCount,
      2
    );

    assert.strictEqual(
      out.targetHouseNumber,
      1624
    );

    assert.strictEqual(
      out.rangeStart,
      1616
    );

    assert.strictEqual(
      out.rangeEnd,
      1642
    );

    assert.strictEqual(
      out.streetSuffixExact,
      true
    );

    assert.strictEqual(
      out.targetNumberNumericallyWithinRange,
      true
    );

    assert.strictEqual(
      out.targetParityCompatibleWithRange,
      true
    );
  }
);

test(
  'case and repeated whitespace normalization remains superficial',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '  1624   n   bodine   st  ';

    input.sourceObservations.forEach(
      observation => {
        observation.propertyAddress =
          '1624 n bodine st';
      }
    );

    input.opaAccountRows[0].location =
      '1616-42   n   bodine   st';

    const { out } =
      run(input);

    assertOutcome(
      out,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      true
    );
  }
);

test(
  'three independent corroborating source observations are accepted',
  () => {
    const input =
      fixture();

    input.sourceObservations.push({
      sourceObservationId:
        'VIOLATIONS|385',

      propertyAddress:
        '1624 N BODINE ST',

      parcel_id_num:
        '1473083',

      opa_account_num:
        '183124510'
    });

    const { out } =
      run(input);

    assertOutcome(
      out,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      true
    );

    assert.strictEqual(
      out.corroboratingSourceObservationCount,
      3
    );
  }
);

test(
  'normal lookup must be exact v1 NO_MATCH',
  () => {
    const input =
      fixture();

    input.normalLookupEvidence.outcome =
      'MATCHED';

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'unexpected upstream authority fails closed',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .schedulerAuthorityGranted =
        true;

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'fewer than two corroborating observations fails closed',
  () => {
    const input =
      fixture();

    input.sourceObservations =
      input.sourceObservations.slice(
        0,
        1
      );

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'duplicate source observation identity fails closed',
  () => {
    const input =
      fixture();

    input.sourceObservations[1]
      .sourceObservationId =
        input.sourceObservations[0]
          .sourceObservationId;

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'source property-address disagreement fails closed',
  () => {
    const input =
      fixture();

    input.sourceObservations[1]
      .propertyAddress =
        '1626 N BODINE ST';

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'source parcel_id_num disagreement fails closed',
  () => {
    const input =
      fixture();

    input.sourceObservations[1]
      .parcel_id_num =
        '9999999';

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'source opa_account_num disagreement fails closed',
  () => {
    const input =
      fixture();

    input.sourceObservations[1]
      .opa_account_num =
        '999999999';

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'OPA account must be exactly nine digits',
  () => {
    const input =
      fixture();

    input.sourceObservations.forEach(
      observation => {
        observation.opa_account_num =
          '18312451';
      }
    );

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'zero OPA account rows produces ACCOUNT_NO_MATCH',
  () => {
    const input =
      fixture();

    input.opaAccountRows = [];

    assertOutcome(
      run(input).out,
      'ACCOUNT_NO_MATCH',
      true
    );
  }
);

test(
  'multiple OPA account rows produces ACCOUNT_AMBIGUOUS',
  () => {
    const input =
      fixture();

    input.opaAccountRows.push(
      clone(
        input.opaAccountRows[0]
      )
    );

    assertOutcome(
      run(input).out,
      'ACCOUNT_AMBIGUOUS',
      true
    );
  }
);

test(
  'OPA row identifier must equal derived source OPA account',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0]
      .parcel_number =
        '999999999';

    assertOutcome(
      run(input).out,
      'INELIGIBLE',
      false
    );
  }
);

test(
  'alphanumeric target house number fails range parsing',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '1624A N BODINE ST';

    input.sourceObservations.forEach(
      observation => {
        observation.propertyAddress =
          '1624A N BODINE ST';
      }
    );

    assertOutcome(
      run(input).out,
      'RANGE_PARSE_FAILED',
      true
    );
  }
);

test(
  'slash-form range fails closed',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0].location =
      '1616/42 N BODINE ST';

    assertOutcome(
      run(input).out,
      'RANGE_PARSE_FAILED',
      true
    );
  }
);

test(
  'descending expanded range fails closed',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0].location =
      '1642-16 N BODINE ST';

    assertOutcome(
      run(input).out,
      'RANGE_PARSE_FAILED',
      true
    );
  }
);

test(
  'unit-bearing target fails closed',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '1624 N BODINE ST APT 2';

    input.sourceObservations.forEach(
      observation => {
        observation.propertyAddress =
          '1624 N BODINE ST APT 2';
      }
    );

    assertOutcome(
      run(input).out,
      'RANGE_PARSE_FAILED',
      true
    );
  }
);

test(
  'unit-bearing OPA range fails closed',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0].location =
      '1616-42 N BODINE ST UNIT 2';

    assertOutcome(
      run(input).out,
      'RANGE_PARSE_FAILED',
      true
    );
  }
);

test(
  'street suffix mismatch is deterministic',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0].location =
      '1616-42 N 2ND ST';

    const { out } =
      run(input);

    assertOutcome(
      out,
      'STREET_MISMATCH',
      true
    );

    assert.strictEqual(
      out.streetSuffixExact,
      false
    );
  }
);

test(
  'target outside range is deterministic',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '1650 N BODINE ST';

    input.sourceObservations.forEach(
      observation => {
        observation.propertyAddress =
          '1650 N BODINE ST';
      }
    );

    const { out } =
      run(input);

    assertOutcome(
      out,
      'OUTSIDE_RANGE',
      true
    );

    assert.strictEqual(
      out.targetNumberNumericallyWithinRange,
      false
    );
  }
);

test(
  'parity mismatch is deterministic',
  () => {
    const input =
      fixture();

    input
      .normalLookupEvidence
      .target
      .propertyAddress =
        '1625 N BODINE ST';

    input.sourceObservations.forEach(
      observation => {
        observation.propertyAddress =
          '1625 N BODINE ST';
      }
    );

    const { out } =
      run(input);

    assertOutcome(
      out,
      'PARITY_MISMATCH',
      true
    );

    assert.strictEqual(
      out.targetParityCompatibleWithRange,
      false
    );
  }
);

test(
  'fully expanded numeric range is accepted',
  () => {
    const input =
      fixture();

    input.opaAccountRows[0].location =
      '1616-1642 N BODINE ST';

    assertOutcome(
      run(input).out,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      true
    );
  }
);

test(
  'input envelope is not mutated',
  () => {
    const input =
      fixture();

    const before =
      clone(input);

    run(input);

    assert.deepStrictEqual(
      input,
      before
    );
  }
);

test(
  'pure evaluator calls no external or mutation surfaces',
  () => {
    const { h, out } =
      run(
        fixture()
      );

    assertOutcome(
      out,
      'RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE',
      true
    );

    assert.deepStrictEqual(
      plain(h.state),
      {
        externalHttpCalls: 0,
        databaseCalls: 0,
        spreadsheetCalls: 0,
        propertyCalls: 0,
        triggerCalls: 0,
        lockCalls: 0,
        classificationCalls: 0,
        persistenceCalls: 0,
        ownerLookupCalls: 0
      }
    );
  }
);

test(
  'result exposes no owner or mailing evidence',
  () => {
    const out =
      plain(
        run(
          fixture()
        ).out
      );

    const serialized =
      JSON.stringify(out);

    [
      'ownerNameEvidence',
      'ownerMailingEvidence',
      'owner_1',
      'owner_2',
      'mailing_address_1',
      'mailing_address_2',
      'mailing_care_of',
      'mailing_city_state',
      'mailing_street',
      'mailing_zip'
    ].forEach(field => {
      assert.strictEqual(
        serialized.includes(field),
        false,
        field + ' must not be emitted'
      );
    });

    assertAuthoritiesFalse(out);
  }
);

assert.strictEqual(
  count,
  26,
  'behavior validator must execute exactly 26 cases'
);

console.log('');

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_EVIDENCE_EVALUATOR_BEHAVIOR_VALID=true'
);

console.log(
  'RANGE_EVIDENCE_BEHAVIOR_CASE_COUNT=' +
    count
);

console.log(
  'MOTIVATING_ROW_1530_EXPECTED_OUTCOME=RANGE_CONTAINMENT_DIAGNOSTIC_CANDIDATE'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'SOURCE_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_AUTHORITY_GRANTED=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY_GRANTED=false'
);

console.log(
  'PERSISTENCE_AUTHORITY_GRANTED=false'
);

console.log(
  'ROLLOUT_AUTHORITY_GRANTED=false'
);

console.log(
  'IDENTITY_REPAIR_AUTHORITY_GRANTED=false'
);

console.log(
  'EXTERNAL_HTTP_EXECUTED=false'
);

console.log(
  'DATABASE_OR_SPREADSHEET_EXECUTED=false'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
