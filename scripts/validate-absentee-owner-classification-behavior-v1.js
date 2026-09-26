#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const FILE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AbsenteeOwnerClassification.js'
);

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const AUTHORITY_FIELDS = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationPersistenceAuthorityGranted',
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

function comparisonEvidence() {
  return {
    ok: true,

    mode:
      'READ_ONLY_OWNER_EVIDENCE_COMPARISON',

    phase:
      'absentee_owner_owner_evidence_comparison',

    outcome:
      'MAILING_ADDRESS_DIFFERS',

    target: {
      rowNumber: 377,

      identity: {
        'Distress Lead ID':
          'DL-20260731203649-4601',

        'Canonical Property Key':
          'property|address|pa|philadelphia|19141-4008|5146 n 10th st'
      }
    },

    source: {
      agency:
        'Philadelphia Office of Property Assessment',

      table:
        'opa_properties_public',

      endpoint:
        'https://phl.carto.com/api/v2/sql',

      lookupQueryMode:
        'exact_property_address',

      parcelNumber:
        '776330000'
    },

    normalizedPropertyAddress: {
      street: '5146 N 10TH ST',
      city: 'PHILADELPHIA',
      state: 'PA',
      zip: '19141'
    },

    normalizedMailingAddress: {
      street: '6623 N 8TH ST',
      city: 'PHILADELPHIA',
      state: 'PA',
      zip: '19126'
    },

    differingComponents: [
      'street',
      'zip'
    ],

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
}

function createHarness() {
  const state = {
    externalHttpCalls: 0,
    persistenceCalls: 0,
    databaseCalls: 0,
    legacyScoringCalls: 0,
    genericConnectorCalls: 0,
    schedulerCalls: 0,
    triggerCalls: 0
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
      update() {
        state.databaseCalls++;

        throw new Error(
          'DATABASE_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentSanitizer: {
      sanitize() {
        state.persistenceCalls++;

        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentPersistenceAdapter: {
      plan() {
        state.persistenceCalls++;

        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentExecutionRequestBuilder: {
      prepare() {
        state.persistenceCalls++;

        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentExecutor: {
      execute() {
        state.persistenceCalls++;

        throw new Error(
          'PERSISTENCE_CALL_PROHIBITED'
        );
      }
    },

    AcquisitionDistressIntelligence: {
      score() {
        state.legacyScoringCalls++;

        throw new Error(
          'LEGACY_SCORING_CALL_PROHIBITED'
        );
      }
    },

    CountyRuntimeBridge: {
      run() {
        state.schedulerCalls++;

        throw new Error(
          'COUNTY_CALL_PROHIBITED'
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

  context.ScriptApp = {
    newTrigger() {
      state.triggerCalls++;

      throw new Error(
        'TRIGGER_CALL_PROHIBITED'
      );
    }
  };

  context.reosConnectorHandleAbsenteeOwners =
    function () {
      state.genericConnectorCalls++;

      throw new Error(
        'GENERIC_CONNECTOR_CALL_PROHIBITED'
      );
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
        .AbsenteeOwnerClassification
        .classify(input);
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
}

function assertOutcome(
  result,
  outcome,
  ok
) {
  assert.strictEqual(
    result.mode,
    'READ_ONLY_ABSENTEE_OWNER_CLASSIFICATION'
  );

  assert.strictEqual(
    result.phase,
    'absentee_owner_classification'
  );

  assert.strictEqual(
    result.classificationBasis,
    'OFFICIAL_OWNER_MAILING_ADDRESS_COMPARISON'
  );

  assert.strictEqual(
    result.outcome,
    outcome
  );

  assert.strictEqual(
    result.ok,
    ok
  );

  assertAuthoritiesFalse(result);
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
  'MAILING_ADDRESS_DIFFERS maps to ABSENTEE_OWNER_INDICATED',
  () => {
    const h = createHarness();

    const out =
      h.call(
        comparisonEvidence()
      );

    assertOutcome(
      out,
      'ABSENTEE_OWNER_INDICATED',
      true
    );

    assert.strictEqual(
      out.upstreamComparisonOutcome,
      'MAILING_ADDRESS_DIFFERS'
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['street', 'zip']
    );
  }
);

test(
  'MAILING_ADDRESS_MATCHES maps to OWNER_MAILING_MATCHED',
  () => {
    const input =
      comparisonEvidence();

    input.outcome =
      'MAILING_ADDRESS_MATCHES';

    input.normalizedMailingAddress =
      clone(
        input.normalizedPropertyAddress
      );

    input.differingComponents = [];

    const h = createHarness();

    const out =
      h.call(input);

    assertOutcome(
      out,
      'OWNER_MAILING_MATCHED',
      true
    );
  }
);

test(
  'insufficient mailing evidence maps to insufficient classification evidence',
  () => {
    const input =
      comparisonEvidence();

    input.outcome =
      'INSUFFICIENT_MAILING_EVIDENCE';

    delete input.differingComponents;

    input.normalizedMailingAddress.zip =
      '';

    const h = createHarness();

    const out =
      h.call(input);

    assertOutcome(
      out,
      'INSUFFICIENT_CLASSIFICATION_EVIDENCE',
      true
    );
  }
);

test(
  'ineligible comparison evidence maps to ineligible classification evidence',
  () => {
    const input =
      comparisonEvidence();

    input.ok = false;
    input.outcome =
      'INELIGIBLE_OWNER_EVIDENCE';

    delete input.target;
    delete input.source;
    delete input.normalizedPropertyAddress;
    delete input.normalizedMailingAddress;
    delete input.differingComponents;

    const h = createHarness();

    const out =
      h.call(input);

    assertOutcome(
      out,
      'INELIGIBLE_COMPARISON_EVIDENCE',
      false
    );
  }
);

test(
  'wrong upstream mode fails closed',
  () => {
    const input =
      comparisonEvidence();

    input.mode = 'WRONG_MODE';

    const h = createHarness();

    assertOutcome(
      h.call(input),
      'INELIGIBLE_COMPARISON_EVIDENCE',
      false
    );
  }
);

test(
  'wrong upstream phase fails closed',
  () => {
    const input =
      comparisonEvidence();

    input.phase = 'wrong_phase';

    const h = createHarness();

    assertOutcome(
      h.call(input),
      'INELIGIBLE_COMPARISON_EVIDENCE',
      false
    );
  }
);

test(
  'missing target identity fails closed',
  () => {
    const input =
      comparisonEvidence();

    delete input
      .target
      .identity['Distress Lead ID'];

    const h = createHarness();

    assertOutcome(
      h.call(input),
      'INELIGIBLE_COMPARISON_EVIDENCE',
      false
    );
  }
);

test(
  'unexpected true upstream authority fails closed',
  () => {
    const input =
      comparisonEvidence();

    input.schedulerAuthorityGranted =
      true;

    const h = createHarness();

    assertOutcome(
      h.call(input),
      'INELIGIBLE_COMPARISON_EVIDENCE',
      false
    );
  }
);

test(
  'owner names do not participate',
  () => {
    const a =
      comparisonEvidence();

    const b =
      comparisonEvidence();

    a.ownerNameEvidence = {
      owner_1: 'NAME A'
    };

    b.ownerNameEvidence = {
      owner_1: 'COMPLETELY DIFFERENT NAME'
    };

    const h = createHarness();

    const outA =
      plain(h.call(a));

    const outB =
      plain(h.call(b));

    assert.deepStrictEqual(
      outA,
      outB
    );

    assert.strictEqual(
      Object.prototype
        .hasOwnProperty.call(
          outA,
          'ownerNameEvidence'
        ),
      false
    );
  }
);

test(
  'external HTTP is never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
    );

    assert.strictEqual(
      h.state.externalHttpCalls,
      0
    );
  }
);

test(
  'persistence surfaces are never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
    );

    assert.strictEqual(
      h.state.persistenceCalls,
      0
    );
  }
);

test(
  'database mutation is never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
    );

    assert.strictEqual(
      h.state.databaseCalls,
      0
    );
  }
);

test(
  'no owner-occupancy field is produced',
  () => {
    const h = createHarness();

    const out =
      h.call(
        comparisonEvidence()
      );

    [
      'ownerOccupied',
      'ownerOccupiedConfirmed',
      'nonOwnerOccupied'
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
  'no vacancy field is produced',
  () => {
    const h = createHarness();

    const out =
      h.call(
        comparisonEvidence()
      );

    assert.strictEqual(
      Object.prototype
        .hasOwnProperty.call(
          out,
          'vacant'
        ),
      false
    );
  }
);

test(
  'no boolean absentee-owner field is produced',
  () => {
    const h = createHarness();

    const out =
      h.call(
        comparisonEvidence()
      );

    assert.strictEqual(
      Object.prototype
        .hasOwnProperty.call(
          out,
          'absenteeOwner'
        ),
      false
    );
  }
);

test(
  'legacy acquisition scoring is never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
    );

    assert.strictEqual(
      h.state.legacyScoringCalls,
      0
    );
  }
);

test(
  'generic absentee connector is never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
    );

    assert.strictEqual(
      h.state.genericConnectorCalls,
      0
    );
  }
);

test(
  'scheduler and trigger surfaces are never called',
  () => {
    const h = createHarness();

    h.call(
      comparisonEvidence()
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
  'row 377 certified fixture returns ABSENTEE_OWNER_INDICATED',
  () => {
    const input =
      comparisonEvidence();

    const h = createHarness();

    const out =
      h.call(input);

    assertOutcome(
      out,
      'ABSENTEE_OWNER_INDICATED',
      true
    );

    assert.strictEqual(
      out.target.rowNumber,
      377
    );

    assert.strictEqual(
      out.target.identity[
        'Distress Lead ID'
      ],
      'DL-20260731203649-4601'
    );

    assert.strictEqual(
      out.target.identity[
        'Canonical Property Key'
      ],
      'property|address|pa|philadelphia|19141-4008|5146 n 10th st'
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['street', 'zip']
    );
  }
);

test(
  'all downstream authority flags remain false',
  () => {
    const h = createHarness();

    const out =
      h.call(
        comparisonEvidence()
      );

    assertAuthoritiesFalse(out);
  }
);

assert.strictEqual(
  count,
  20,
  'behavior validator must execute exactly 20 cases'
);

console.log('');

console.log(
  'ABSENTEE_OWNER_CLASSIFICATION_BEHAVIOR_VALID=true'
);

console.log(
  'CLASSIFICATION_BEHAVIOR_CASE_COUNT=' +
    count
);

console.log(
  'ROW_377_EXPECTED_CLASSIFICATION=ABSENTEE_OWNER_INDICATED'
);

console.log(
  'OWNER_OCCUPANCY_DETERMINED=false'
);

console.log(
  'VACANCY_DETERMINED=false'
);

console.log(
  'EXTERNAL_HTTP_EXECUTED=false'
);

console.log(
  'PERSISTENCE_SURFACE_CALLED=false'
);

console.log(
  'DATABASE_MUTATION_EXECUTED=false'
);

console.log(
  'LEGACY_ACQUISITION_SCORING_CALLED=false'
);

console.log(
  'GENERIC_ABSENTEE_CONNECTOR_CALLED=false'
);

console.log(
  'SCHEDULER_OR_TRIGGER_CALLED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
