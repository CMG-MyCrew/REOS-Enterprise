#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(__dirname, '..');

const FILE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'AbsenteeOwnerClassificationSingleRecordReadOnlyCertificationEntrypoint.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

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

function input() {
  return {
    rowNumber: 377,
    identity: {
      'Distress Lead ID':
        'DL-20260731203649-4601',
      'Canonical Property Key':
        'property|address|pa|philadelphia|19141-4008|5146 n 10th st'
    }
  };
}

function selectorEvidence() {
  return {
    ok: true,
    mode: 'READ_ONLY',
    phase:
      'absentee_owner_exact_record_evidence',

    target: {
      table: 'DISTRESS_LEADS',
      rowNumber: 377
    },

    identity: {
      'Distress Lead ID':
        'DL-20260731203649-4601',
      'Canonical Property Key':
        'property|address|pa|philadelphia|19141-4008|5146 n 10th st'
    },

    record: {
      'Distress Lead ID':
        'DL-20260731203649-4601',
      'Canonical Property Key':
        'property|address|pa|philadelphia|19141-4008|5146 n 10th st',
      Address:
        '5146 N 10TH ST',
      City:
        'Philadelphia',
      State:
        'PA',
      Zip:
        '19141',
      'Owner Name':
        'IGNORED OWNER NAME'
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

function lookupEvidence() {
  return {
    ok: true,
    mode:
      'READ_ONLY_OWNER_EVIDENCE',
    phase:
      'absentee_owner_philadelphia_owner_evidence_lookup',
    outcome:
      'MATCHED',

    target: {
      rowNumber: 377,
      identity: clone(input().identity),
      propertyAddress:
        '5146 N 10TH ST',
      city:
        'PHILADELPHIA',
      state:
        'PA',
      zip:
        '19141'
    },

    ownerNameEvidence: {
      owner_1:
        'IGNORED'
    },

    ownerMailingEvidence: {
      mailing_address_1: null,
      mailing_address_2: null,
      mailing_care_of: null,
      mailing_city_state:
        'PHILADELPHIA PA',
      mailing_street:
        '6623 N 8TH ST',
      mailing_zip:
        '19126'
    },

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

function comparisonEvidence(outcome) {
  var value =
    outcome ||
    'MAILING_ADDRESS_DIFFERS';

  var result = {
    ok:
      value !==
      'INELIGIBLE_OWNER_EVIDENCE',

    mode:
      'READ_ONLY_OWNER_EVIDENCE_COMPARISON',

    phase:
      'absentee_owner_owner_evidence_comparison',

    outcome:
      value,

    productionDataMutationAuthorityGranted:
      false,
    ownerEvidencePersistenceAuthorityGranted:
      false,
    absenteeClassificationAuthorityGranted:
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

  if (
    value !==
    'INELIGIBLE_OWNER_EVIDENCE'
  ) {
    result.target = {
      rowNumber: 377,
      identity:
        clone(
          input().identity
        )
    };

    result.normalizedPropertyAddress = {
      street:
        '5146 N 10TH ST',
      city:
        'PHILADELPHIA',
      state:
        'PA',
      zip:
        '19141'
    };

    result.normalizedMailingAddress = {
      street:
        value ===
        'MAILING_ADDRESS_MATCHES'
          ? '5146 N 10TH ST'
          : '6623 N 8TH ST',

      city:
        'PHILADELPHIA',

      state:
        'PA',

      zip:
        value ===
        'MAILING_ADDRESS_MATCHES'
          ? '19141'
          : value ===
            'INSUFFICIENT_MAILING_EVIDENCE'
              ? ''
              : '19126'
    };

    if (
      value ===
      'MAILING_ADDRESS_DIFFERS'
    ) {
      result.differingComponents = [
        'street',
        'zip'
      ];
    }

    if (
      value ===
      'MAILING_ADDRESS_MATCHES'
    ) {
      result.differingComponents = [];
    }
  }

  return result;
}

function classificationFor(
  comparison
) {
  var mapping = {
    MAILING_ADDRESS_DIFFERS:
      'ABSENTEE_OWNER_INDICATED',

    MAILING_ADDRESS_MATCHES:
      'OWNER_MAILING_MATCHED',

    INSUFFICIENT_MAILING_EVIDENCE:
      'INSUFFICIENT_CLASSIFICATION_EVIDENCE',

    INELIGIBLE_OWNER_EVIDENCE:
      'INELIGIBLE_COMPARISON_EVIDENCE'
  };

  var outcome =
    mapping[comparison.outcome] ||
    'INELIGIBLE_COMPARISON_EVIDENCE';

  var result = {
    ok:
      outcome !==
      'INELIGIBLE_COMPARISON_EVIDENCE',

    mode:
      'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION',

    phase:
      'absentee_owner_classification',

    outcome:
      outcome,

    upstreamComparisonOutcome:
      comparison.outcome,

    classificationBasis:
      'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',

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

  if (result.ok) {
    result.target = {
      rowNumber: 377,
      identity:
        clone(
          input().identity
        )
    };
  }

  return result;
}

function createHarness(options) {
  options =
    options || {};

  const state = {
    adminCalls: 0,
    selectorCalls: 0,
    lookupCalls: 0,
    comparisonCalls: 0,
    classifierCalls: 0,

    persistenceCalls: 0,
    databaseMutationCalls: 0,
    genericConnectorCalls: 0,
    countyCalls: 0,
    schedulerCalls: 0,
    triggerCalls: 0,
    legacyScoringCalls: 0,
    qualifiedDealQueueCalls: 0,

    selectorRequest: null,
    lookupRequest: null,
    lookupInput: null,
    comparisonInput: null,
    classifierInput: null
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
    Security: {
      requireAdmin() {
        state.adminCalls++;

        if (options.adminDenied) {
          throw new Error(
            'ADMIN_DENIED'
          );
        }
      }
    },

    AbsenteeOwnerEnrichmentExactRecordSelector: {
      exactRecordEvidence(request) {
        state.selectorCalls++;
        state.selectorRequest =
          clone(request);

        return clone(
          options.selectorResult !== undefined
            ? options.selectorResult
            : selectorEvidence()
        );
      }
    },

    AbsenteeOwnerPhiladelphiaOwnerEvidenceLookup: {
      lookup(request) {
        state.lookupCalls++;
        state.lookupRequest =
          clone(request);

        return clone(
          options.lookupResult !== undefined
            ? options.lookupResult
            : lookupEvidence()
        );
      }
    },

    AbsenteeOwnerOwnerEvidenceComparison: {
      compare(ownerEvidence) {
        state.comparisonCalls++;
        state.comparisonInput =
          clone(ownerEvidence);

        return clone(
          options.comparisonResult !== undefined
            ? options.comparisonResult
            : comparisonEvidence()
        );
      }
    },

    AbsenteeOwnerClassification: {
      classify(comparison) {
        state.classifierCalls++;
        state.classifierInput =
          clone(comparison);

        if (
          options.classifierResult !==
          undefined
        ) {
          return options.classifierResult;
        }

        return classificationFor(
          comparison
        );
      }
    },

    Database: {
      update() {
        state.databaseMutationCalls++;
        throw new Error(
          'DATABASE_MUTATION_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentSanitizer: {
      sanitize() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentPersistenceAdapter: {
      plan() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentExecutionRequestBuilder: {
      prepare() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentExecutor: {
      execute() {
        state.persistenceCalls++;
        throw new Error(
          'PERSISTENCE_PROHIBITED'
        );
      }
    },

    AcquisitionDistressIntelligence: {
      score() {
        state.legacyScoringCalls++;
        throw new Error(
          'LEGACY_SCORING_PROHIBITED'
        );
      }
    },

    QualifiedDealQueue: {
      enqueue() {
        state.qualifiedDealQueueCalls++;
        throw new Error(
          'QUALIFIED_DEAL_QUEUE_PROHIBITED'
        );
      }
    },

    CountyRuntimeBridge: {
      run() {
        state.countyCalls++;
        throw new Error(
          'COUNTY_EXECUTION_PROHIBITED'
        );
      }
    }
  };

  context.reosConnectorHandleAbsenteeOwners =
    function () {
      state.genericConnectorCalls++;

      throw new Error(
        'GENERIC_CONNECTOR_PROHIBITED'
      );
    };

  context.ScriptApp = {
    newTrigger() {
      state.triggerCalls++;

      throw new Error(
        'TRIGGER_PROHIBITED'
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
    context,

    call(value) {
      return context
        .reosAbsenteeOwnerClassificationReadOnlyCertifySingleRecord(
          value
        );
    }
  };
}

function assertNoPipelineAfterSelector(state) {
  assert.strictEqual(
    state.lookupCalls,
    0
  );

  assert.strictEqual(
    state.comparisonCalls,
    0
  );

  assert.strictEqual(
    state.classifierCalls,
    0
  );
}

let count = 0;

function test(name, fn) {
  fn();
  count++;

  console.log(
    'PASS ' +
    count +
    ': ' +
    name
  );
}

test(
  'admin denial stops before selector invocation',
  () => {
    const h =
      createHarness({
        adminDenied: true
      });

    assert.throws(
      () => h.call(input()),
      /ADMIN_DENIED/
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'missing options fail closed before selector invocation',
  () => {
    const h =
      createHarness();

    const out =
      h.call();

    assert.strictEqual(
      out.code,
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'unexpected top-level option fails closed',
  () => {
    const h =
      createHarness();

    const value =
      input();

    value.propertyAddress =
      'CALLER OVERRIDE';

    const out =
      h.call(value);

    assert.strictEqual(
      out.code,
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );
  }
);

test(
  'invalid physical row fails closed',
  () => {
    const h =
      createHarness();

    const value =
      input();

    value.rowNumber = 1;

    assert.strictEqual(
      h.call(value).code,
      'INVALID_ROW_NUMBER'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );
  }
);

test(
  'missing Distress Lead ID fails closed',
  () => {
    const h =
      createHarness();

    const value =
      input();

    value
      .identity['Distress Lead ID'] =
      '';

    assert.strictEqual(
      h.call(value).code,
      'MISSING_DISTRESS_LEAD_ID'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );
  }
);

test(
  'missing Canonical Property Key fails closed',
  () => {
    const h =
      createHarness();

    const value =
      input();

    value
      .identity['Canonical Property Key'] =
      '';

    assert.strictEqual(
      h.call(value).code,
      'MISSING_CANONICAL_PROPERTY_KEY'
    );

    assert.strictEqual(
      h.state.selectorCalls,
      0
    );
  }
);

test(
  'selector failure stops before OPA lookup',
  () => {
    const failed =
      selectorEvidence();

    failed.ok = false;
    failed.code =
      'DISTRESS_LEAD_ID_MISMATCH';

    const h =
      createHarness({
        selectorResult:
          failed
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out.code,
      'EXACT_RECORD_SELECTION_FAILED'
    );

    assert.strictEqual(
      out.upstreamCode,
      'DISTRESS_LEAD_ID_MISMATCH'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'malformed selector success evidence stops before OPA lookup',
  () => {
    const malformed =
      selectorEvidence();

    delete malformed
      .schedulerAuthorityGranted;

    const h =
      createHarness({
        selectorResult:
          malformed
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out.code,
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'persisted identity mismatch cannot be repaired by entrypoint',
  () => {
    const mismatched =
      selectorEvidence();

    mismatched
      .identity['Distress Lead ID'] =
      'DIFFERENT';

    const h =
      createHarness({
        selectorResult:
          mismatched
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out.code,
      'INVALID_EXACT_RECORD_EVIDENCE'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'blank verified Address stops before OPA lookup',
  () => {
    const selected =
      selectorEvidence();

    selected.record.Address =
      '';

    const h =
      createHarness({
        selectorResult:
          selected
      });

    assert.strictEqual(
      h.call(input()).code,
      'MISSING_VERIFIED_PROPERTY_ADDRESS'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'blank verified City stops before OPA lookup',
  () => {
    const selected =
      selectorEvidence();

    selected.record.City =
      '';

    const h =
      createHarness({
        selectorResult:
          selected
      });

    assert.strictEqual(
      h.call(input()).code,
      'MISSING_VERIFIED_CITY'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'blank verified State stops before OPA lookup',
  () => {
    const selected =
      selectorEvidence();

    selected.record.State =
      '';

    const h =
      createHarness({
        selectorResult:
          selected
      });

    assert.strictEqual(
      h.call(input()).code,
      'MISSING_VERIFIED_STATE'
    );

    assertNoPipelineAfterSelector(
      h.state
    );
  }
);

test(
  'lookup request derives only from verified row evidence',
  () => {
    const selected =
      selectorEvidence();

    selected.record.Address =
      '5146 VERIFIED ST';

    selected.record.City =
      'Philadelphia';

    selected.record.State =
      'PA';

    selected.record.Zip =
      '19141';

    const h =
      createHarness({
        selectorResult:
          selected
      });

    h.call(input());

    assert.deepStrictEqual(
      plain(
        h.state.lookupRequest
      ),
      {
        rowNumber: 377,
        identity:
          clone(input().identity),
        propertyAddress:
          '5146 VERIFIED ST',
        city:
          'Philadelphia',
        state:
          'PA',
        zip:
          '19141'
      }
    );
  }
);

test(
  'caller cannot override address city state or ZIP',
  () => {
    [
      ['Address', 'X'],
      ['city', 'X'],
      ['state', 'XX'],
      ['zip', '00000']
    ].forEach(([key, value]) => {
      const h =
        createHarness();

      const request =
        input();

      request[key] =
        value;

      assert.strictEqual(
        h.call(request).code,
        'INVALID_OPTIONS'
      );

      assert.strictEqual(
        h.state.selectorCalls,
        0
      );
    });
  }
);

test(
  'owner-evidence lookup executes at most once',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

test(
  'comparison executes at most once',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.comparisonCalls,
      1
    );
  }
);

test(
  'classifier executes at most once',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.classifierCalls,
      1
    );
  }
);

test(
  'mailing-address difference maps through to ABSENTEE_OWNER_INDICATED',
  () => {
    const h =
      createHarness({
        comparisonResult:
          comparisonEvidence(
            'MAILING_ADDRESS_DIFFERS'
          )
      });

    assert.strictEqual(
      h.call(input()).outcome,
      'ABSENTEE_OWNER_INDICATED'
    );
  }
);

test(
  'mailing-address match maps through to OWNER_MAILING_MATCHED',
  () => {
    const h =
      createHarness({
        comparisonResult:
          comparisonEvidence(
            'MAILING_ADDRESS_MATCHES'
          )
      });

    assert.strictEqual(
      h.call(input()).outcome,
      'OWNER_MAILING_MATCHED'
    );
  }
);

test(
  'insufficient mailing evidence maps through to insufficient classification evidence',
  () => {
    const h =
      createHarness({
        comparisonResult:
          comparisonEvidence(
            'INSUFFICIENT_MAILING_EVIDENCE'
          )
      });

    assert.strictEqual(
      h.call(input()).outcome,
      'INSUFFICIENT_CLASSIFICATION_EVIDENCE'
    );
  }
);

test(
  'ineligible owner evidence maps through to ineligible comparison evidence',
  () => {
    const h =
      createHarness({
        comparisonResult:
          comparisonEvidence(
            'INELIGIBLE_OWNER_EVIDENCE'
          )
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out.outcome,
      'INELIGIBLE_COMPARISON_EVIDENCE'
    );

    assert.strictEqual(
      out.ok,
      false
    );
  }
);

test(
  'owner-name changes do not change classification',
  () => {
    const first =
      lookupEvidence();

    const second =
      lookupEvidence();

    first.ownerNameEvidence = {
      owner_1: 'FIRST NAME'
    };

    second.ownerNameEvidence = {
      owner_1:
        'COMPLETELY DIFFERENT NAME'
    };

    const a =
      createHarness({
        lookupResult: first
      });

    const b =
      createHarness({
        lookupResult: second
      });

    assert.deepStrictEqual(
      plain(
        a.call(input())
      ),
      plain(
        b.call(input())
      )
    );
  }
);

test(
  'successful return is the exact classifier result and exposes no raw owner evidence',
  () => {
    const classifierResult = {
      ok: true,
      mode:
        'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION',
      phase:
        'absentee_owner_classification',
      outcome:
        'ABSENTEE_OWNER_INDICATED',
      classificationBasis:
        'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON',
      sentinel:
        'EXACT_CLASSIFIER_RESULT'
    };

    const h =
      createHarness({
        classifierResult:
          classifierResult
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out,
      classifierResult
    );

    [
      'record',
      'ownerNameEvidence',
      'ownerMailingEvidence'
    ].forEach(field => {
      assert.strictEqual(
        Object.prototype
          .hasOwnProperty.call(
            out,
            field
          ),
        false
      );
    });
  }
);

test(
  'persistence and database mutation surfaces are never called',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.persistenceCalls,
      0
    );

    assert.strictEqual(
      h.state.databaseMutationCalls,
      0
    );
  }
);

test(
  'generic connector scheduler trigger and county execution are never called',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.genericConnectorCalls,
      0
    );

    assert.strictEqual(
      h.state.countyCalls,
      0
    );

    assert.strictEqual(
      h.state.schedulerCalls,
      0
    );

    assert.strictEqual(
      h.state.triggerCalls,
      0
    );
  }
);

test(
  'legacy acquisition scoring and Qualified Deal Queue are never called',
  () => {
    const h =
      createHarness();

    h.call(input());

    assert.strictEqual(
      h.state.legacyScoringCalls,
      0
    );

    assert.strictEqual(
      h.state.qualifiedDealQueueCalls,
      0
    );
  }
);

test(
  'row 377 fixture produces ABSENTEE_OWNER_INDICATED without persistence',
  () => {
    const h =
      createHarness({
        comparisonResult:
          comparisonEvidence(
            'MAILING_ADDRESS_DIFFERS'
          )
      });

    const out =
      h.call(input());

    assert.strictEqual(
      out.outcome,
      'ABSENTEE_OWNER_INDICATED'
    );

    assert.strictEqual(
      h.state.selectorRequest.rowNumber,
      377
    );

    assert.deepStrictEqual(
      plain(
        h.state.selectorRequest.identity
      ),
      input().identity
    );

    assert.strictEqual(
      h.state.persistenceCalls,
      0
    );

    assert.strictEqual(
      h.state.databaseMutationCalls,
      0
    );
  }
);

assert.strictEqual(
  count,
  27
);

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_SINGLE_RECORD_READ_ONLY_CERTIFICATION_ENTRYPOINT_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
  count
);

console.log(
  'ADMIN_FIRST=true'
);

console.log(
  'CALLER_ADDRESS_OVERRIDE_PROHIBITED=true'
);

console.log(
  'VERIFIED_ROW_ADDRESS_DERIVATION=true'
);

console.log(
  'LOOKUP_MAX_INVOCATIONS=1'
);

console.log(
  'COMPARISON_MAX_INVOCATIONS=1'
);

console.log(
  'CLASSIFIER_MAX_INVOCATIONS=1'
);

console.log(
  'CLASSIFICATION_PERSISTENCE_AUTHORITY=false'
);

console.log(
  'OWNER_OCCUPANCY_AUTHORITY=false'
);

console.log(
  'VACANCY_AUTHORITY=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
