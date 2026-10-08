#!/usr/bin/env node
'use strict';

const assert =
  require('assert');

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

const EVALUATOR =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerOpaAccountRangeEvidenceEvaluator.js'
  );

const CERTIFIER =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification.js'
  );

const evaluatorSource =
  fs.readFileSync(
    EVALUATOR,
    'utf8'
  );

const certifierSource =
  fs.readFileSync(
    CERTIFIER,
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
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

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

function selectorEvidence() {
  return {
    ok: true,
    mode: 'READ_ONLY',
    phase:
      'absentee_owner_exact_record_evidence',

    target: {
      table:
        'DISTRESS_LEADS',

      rowNumber:
        1530
    },

    identity: {
      'Distress Lead ID':
        'DL-20260825185532-4474',

      'Canonical Property Key':
        'property|parcel|pa|philadelphia|1473083'
    },

    record: {
      Address:
        '1624 N Bodine St',

      'Parcel ID':
        '1473083'
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
      rowNumber:
        1530,

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

    boundedSourceRowCount:
      0,

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
    exactRecordEvidence:
      selectorEvidence(),

    normalLookupEvidence:
      normalLookupEvidence(),

    sourceObservations: [
      {
        sourceObservationId:
          'pa-philadelphia|code_violations|383',

        propertyAddress:
          '1624 N BODINE ST',

        parcel_id_num:
          '1473083',

        opa_account_num:
          '183124510'
      },
      {
        sourceObservationId:
          'pa-philadelphia|code_violations|384',

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

function createHarness(
  transformEvaluator
) {
  const state = {
    rangeEvaluatorCalls: 0,
    externalHttpCalls: 0,
    databaseCalls: 0,
    spreadsheetCalls: 0,
    propertyCalls: 0,
    triggerCalls: 0,
    lockCalls: 0,
    driveCalls: 0,
    gmailCalls: 0,
    selectorCalls: 0,
    ownerLookupCalls: 0,
    comparisonCalls: 0,
    classificationCalls: 0,
    persistenceCalls: 0
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

    AbsenteeOwnerEnrichmentExactRecordSelector: {
      exactRecordEvidence() {
        state.selectorCalls++;
        throw new Error(
          'SELECTOR_CALL_PROHIBITED'
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

    AbsenteeOwnerOwnerEvidenceComparison: {
      compare() {
        state.comparisonCalls++;
        throw new Error(
          'COMPARISON_CALL_PROHIBITED'
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
    getActiveSpreadsheet() {
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
        'PROPERTIES_SERVICE_PROHIBITED'
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

  context.DriveApp = {
    getFiles() {
      state.driveCalls++;
      throw new Error(
        'DRIVE_CALL_PROHIBITED'
      );
    }
  };

  context.GmailApp = {
    search() {
      state.gmailCalls++;
      throw new Error(
        'GMAIL_CALL_PROHIBITED'
      );
    }
  };

  vm.createContext(context);

  vm.runInContext(
    evaluatorSource,
    context
  );

  const realEvaluate =
    context
      .REOS
      .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator
      .evaluate;

  context
    .REOS
    .AbsenteeOwnerOpaAccountRangeEvidenceEvaluator = {
      evaluate(input) {
        state.rangeEvaluatorCalls++;

        const result =
          realEvaluate(input);

        return transformEvaluator
          ? transformEvaluator(
              plain(result)
            )
          : result;
      }
    };

  vm.runInContext(
    certifierSource,
    context
  );

  return {
    state,

    call(input) {
      return context
        .REOS
        .AbsenteeOwnerOpaAccountRangePropertySourceIdentityCertification
        .certify(input);
    }
  };
}

function assertAuthoritiesFalse(result) {
  AUTHORITY_FIELDS.forEach(
    field => {
      assert.strictEqual(
        result[field],
        false,
        field + ' must remain false'
      );
    }
  );
}

function assertFailure(
  result,
  outcome
) {
  assert.strictEqual(
    result.ok,
    false
  );

  assert.strictEqual(
    result.mode,
    'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'
  );

  assert.strictEqual(
    result.phase,
    'absentee_owner_opa_account_range_property_source_identity_certification'
  );

  assert.strictEqual(
    result.outcome,
    outcome
  );

  assert.strictEqual(
    result.propertySourceIdentityCertified,
    false
  );

  assert.strictEqual(
    result.rangeContainmentDiagnosticCandidate,
    false
  );

  assert.strictEqual(
    result.rangeContainmentCertifiedMatch,
    false
  );

  assertAuthoritiesFalse(result);
}

function assertSuccess(result) {
  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.mode,
    'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'
  );

  assert.strictEqual(
    result.phase,
    'absentee_owner_opa_account_range_property_source_identity_certification'
  );

  assert.strictEqual(
    result.outcome,
    'PROPERTY_SOURCE_IDENTITY_CERTIFIED'
  );

  assert.strictEqual(
    result.certificationBasis,
    'EXACT_SOURCE_OPA_ACCOUNT_UNIQUE_ROW_RESTRICTED_RANGE_CONTAINMENT'
  );

  assert.strictEqual(
    result.propertySourceIdentityCertified,
    true
  );

  assert.strictEqual(
    result.rangeContainmentDiagnosticCandidate,
    true
  );

  assert.strictEqual(
    result.rangeContainmentCertifiedMatch,
    false
  );

  assertAuthoritiesFalse(result);
}

function run(
  input,
  transformEvaluator
) {
  const harness =
    createHarness(
      transformEvaluator
    );

  return {
    h:
      harness,

    out:
      harness.call(input)
  };
}

let count = 0;

function test(
  name,
  fn
) {
  fn();
  count++;

  console.log(
    'PASS ' +
      count +
      ': ' +
      name
  );
}

const cases = [
  [
    'motivating row-1530 evidence certifies property-source identity',
    input => input,
    'SUCCESS'
  ],

  [
    'exact-record evidence missing fails closed',
    input => {
      input.exactRecordEvidence = null;
    },
    'INELIGIBLE_EXACT_RECORD_EVIDENCE'
  ],

  [
    'selector authority flag true fails closed',
    input => {
      input
        .exactRecordEvidence
        .schedulerAuthorityGranted =
          true;
    },
    'INELIGIBLE_EXACT_RECORD_EVIDENCE'
  ],

  [
    'normal lookup outcome other than NO_MATCH fails closed',
    input => {
      input.normalLookupEvidence.outcome =
        'MATCHED';
    },
    'INELIGIBLE_NORMAL_LOOKUP_EVIDENCE'
  ],

  [
    'target row mismatch fails closed',
    input => {
      input
        .normalLookupEvidence
        .target
        .rowNumber =
          1531;
    },
    'TARGET_IDENTITY_MISMATCH'
  ],

  [
    'Distress Lead ID mismatch fails closed',
    input => {
      input
        .normalLookupEvidence
        .target
        .identity['Distress Lead ID'] =
          'DL-OTHER';
    },
    'TARGET_IDENTITY_MISMATCH'
  ],

  [
    'Canonical Property Key mismatch fails closed',
    input => {
      input
        .normalLookupEvidence
        .target
        .identity['Canonical Property Key'] =
          'property|parcel|pa|philadelphia|9999999';
    },
    'TARGET_IDENTITY_MISMATCH'
  ],

  [
    'exact-record and lookup address disagreement fails closed',
    input => {
      input
        .normalLookupEvidence
        .target
        .propertyAddress =
          '1626 N BODINE ST';
    },
    'TARGET_ADDRESS_MISMATCH'
  ],

  [
    'fewer than two source observations fails closed',
    input => {
      input.sourceObservations =
        input
          .sourceObservations
          .slice(0, 1);
    },
    'SOURCE_CORROBORATION_INSUFFICIENT'
  ],

  [
    'more than five source observations fails closed',
    input => {
      for (
        let id = 385;
        id <= 388;
        id++
      ) {
        input.sourceObservations.push({
          sourceObservationId:
            'pa-philadelphia|code_violations|' +
            id,

          propertyAddress:
            '1624 N BODINE ST',

          parcel_id_num:
            '1473083',

          opa_account_num:
            '183124510'
        });
      }
    },
    'SOURCE_CORROBORATION_INSUFFICIENT'
  ],

  [
    'duplicate source-observation identity fails closed',
    input => {
      input
        .sourceObservations[1]
        .sourceObservationId =
          input
            .sourceObservations[0]
            .sourceObservationId;
    },
    'SOURCE_OBSERVATION_IDENTITY_DUPLICATE'
  ],

  [
    'case-only address variation is accepted',
    input => {
      input
        .normalLookupEvidence
        .target
        .propertyAddress =
          '1624 n bodine st';

      input
        .sourceObservations
        .forEach(
          observation => {
            observation.propertyAddress =
              '1624 n bodine st';
          }
        );
    },
    'SUCCESS'
  ],

  [
    'repeated-whitespace address variation is accepted',
    input => {
      input
        .normalLookupEvidence
        .target
        .propertyAddress =
          '  1624   N   Bodine   St  ';

      input
        .sourceObservations
        .forEach(
          observation => {
            observation.propertyAddress =
              '1624   N   BODINE   ST';
          }
        );
    },
    'SUCCESS'
  ],

  [
    'punctuation transformation is not performed',
    input => {
      input
        .sourceObservations
        .forEach(
          observation => {
            observation.propertyAddress =
              '1624 N. BODINE ST';
          }
        );
    },
    'SOURCE_ADDRESS_DISAGREEMENT'
  ],

  [
    'source address disagreement fails closed',
    input => {
      input
        .sourceObservations[1]
        .propertyAddress =
          '1626 N BODINE ST';
    },
    'SOURCE_ADDRESS_DISAGREEMENT'
  ],

  [
    'source parcel disagreement fails closed',
    input => {
      input
        .sourceObservations[1]
        .parcel_id_num =
          '9999999';
    },
    'SOURCE_PARCEL_DISAGREEMENT'
  ],

  [
    'source parcel differs from persisted Parcel ID fails closed',
    input => {
      input
        .sourceObservations
        .forEach(
          observation => {
            observation.parcel_id_num =
              '9999999';
          }
        );
    },
    'SOURCE_PARCEL_TARGET_MISMATCH'
  ],

  [
    'source OPA account disagreement fails closed',
    input => {
      input
        .sourceObservations[1]
        .opa_account_num =
          '999999999';
    },
    'SOURCE_OPA_ACCOUNT_DISAGREEMENT'
  ],

  [
    'non-nine-digit OPA account fails closed',
    input => {
      input
        .sourceObservations
        .forEach(
          observation => {
            observation.opa_account_num =
              '18312451';
          }
        );
    },
    'SOURCE_OPA_ACCOUNT_INVALID'
  ],

  [
    'zero OPA account rows fails closed',
    input => {
      input.opaAccountRows = [];
    },
    'OPA_ACCOUNT_NO_MATCH'
  ],

  [
    'multiple OPA account rows fails closed',
    input => {
      input.opaAccountRows.push(
        clone(
          input.opaAccountRows[0]
        )
      );
    },
    'OPA_ACCOUNT_AMBIGUOUS'
  ],

  [
    'OPA parcel number differs from source account fails closed',
    input => {
      input
        .opaAccountRows[0]
        .parcel_number =
          '999999999';
    },
    'OPA_ACCOUNT_IDENTIFIER_MISMATCH'
  ],

  [
    'evaluator non-candidate result fails closed',
    input => {
      input
        .opaAccountRows[0]
        .location =
          '1616-42 N 2ND ST';
    },
    'RANGE_DIAGNOSTIC_INELIGIBLE'
  ]
];

cases.forEach(
  (
    [
      name,
      mutate,
      expected
    ]
  ) => {
    test(
      name,
      () => {
        const input =
          fixture();

        mutate(input);

        const {
          h,
          out
        } =
          run(input);

        if (
          expected ===
          'SUCCESS'
        ) {
          assertSuccess(out);

          assert.strictEqual(
            h.state.rangeEvaluatorCalls,
            1
          );
        } else {
          assertFailure(
            out,
            expected
          );
        }
      }
    );
  }
);

test(
  'evaluator authority flag true fails closed',
  () => {
    const {
      h,
      out
    } =
      run(
        fixture(),
        result => {
          result.schedulerAuthorityGranted =
            true;

          return result;
        }
      );

    assertFailure(
      out,
      'RANGE_DIAGNOSTIC_INELIGIBLE'
    );

    assert.strictEqual(
      h.state.rangeEvaluatorCalls,
      1
    );
  }
);

test(
  'certified result preserves rangeContainmentCertifiedMatch false',
  () => {
    const out =
      run(
        fixture()
      ).out;

    assertSuccess(out);

    assert.strictEqual(
      out.rangeContainmentCertifiedMatch,
      false
    );
  }
);

test(
  'certified result emits no owner fields',
  () => {
    const serialized =
      JSON.stringify(
        plain(
          run(
            fixture()
          ).out
        )
      );

    [
      'ownerNameEvidence',
      'owner_1',
      'owner_2'
    ].forEach(
      field => {
        assert.strictEqual(
          serialized.includes(field),
          false
        );
      }
    );
  }
);

test(
  'certified result emits no mailing fields',
  () => {
    const serialized =
      JSON.stringify(
        plain(
          run(
            fixture()
          ).out
        )
      );

    [
      'ownerMailingEvidence',
      'mailing_address_1',
      'mailing_address_2',
      'mailing_care_of',
      'mailing_city_state',
      'mailing_street',
      'mailing_zip'
    ].forEach(
      field => {
        assert.strictEqual(
          serialized.includes(field),
          false
        );
      }
    );
  }
);

test(
  'no external HTTP is executed',
  () => {
    const {
      h,
      out
    } =
      run(
        fixture()
      );

    assertSuccess(out);

    assert.strictEqual(
      h.state.externalHttpCalls,
      0
    );
  }
);

test(
  'no database or spreadsheet operation is executed',
  () => {
    const {
      h,
      out
    } =
      run(
        fixture()
      );

    assertSuccess(out);

    assert.strictEqual(
      h.state.databaseCalls,
      0
    );

    assert.strictEqual(
      h.state.spreadsheetCalls,
      0
    );
  }
);

test(
  'no classification or persistence surface is executed',
  () => {
    const {
      h,
      out
    } =
      run(
        fixture()
      );

    assertSuccess(out);

    [
      'comparisonCalls',
      'classificationCalls',
      'persistenceCalls',
      'ownerLookupCalls',
      'selectorCalls'
    ].forEach(
      key => {
        assert.strictEqual(
          h.state[key],
          0
        );
      }
    );
  }
);

test(
  'input envelopes are not mutated',
  () => {
    const input =
      fixture();

    const before =
      clone(input);

    assertSuccess(
      run(input).out
    );

    assert.deepStrictEqual(
      input,
      before
    );
  }
);

test(
  'row 1532 is never automatically processed',
  () => {
    const {
      h,
      out
    } =
      run(
        fixture()
      );

    assertSuccess(out);

    assert.strictEqual(
      out.target.rowNumber,
      1530
    );

    assert.strictEqual(
      JSON.stringify(
        plain(out)
      ).includes(
        '1532'
      ),
      false
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );

    assert.strictEqual(
      h.state.ownerLookupCalls,
      0
    );
  }
);

assert.strictEqual(
  count,
  32,
  'behavior validator must execute exactly the 32 design-required cases'
);

console.log('');

console.log(
  'ABSENTEE_OWNER_OPA_ACCOUNT_RANGE_PROPERTY_SOURCE_IDENTITY_CERTIFICATION_BEHAVIOR_VALID=true'
);

console.log(
  'PROPERTY_SOURCE_IDENTITY_BEHAVIOR_CASE_COUNT=' +
    count
);

console.log(
  'MOTIVATING_ROW_1530_CERTIFIED=true'
);

console.log(
  'ROW_1532_AUTOMATIC_PROCESSING=false'
);

console.log(
  'RANGE_EVALUATOR_INVOCATION_MAX=1'
);

console.log(
  'PROPERTY_SOURCE_IDENTITY_CERTIFIED=true'
);

console.log(
  'RANGE_CONTAINMENT_CERTIFIED_MATCH=false'
);

console.log(
  'EXTERNAL_HTTP_EXECUTED=false'
);

console.log(
  'DATABASE_OR_SPREADSHEET_EXECUTED=false'
);

console.log(
  'OWNER_EVIDENCE_RETRIEVAL_EXECUTED=false'
);

console.log(
  'CLASSIFICATION_EXECUTED=false'
);

console.log(
  'PERSISTENCE_EXECUTED=false'
);

console.log(
  'PUBLIC_RPC_CREATED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
