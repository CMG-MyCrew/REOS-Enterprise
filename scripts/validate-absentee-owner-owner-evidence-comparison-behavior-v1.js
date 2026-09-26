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
  'AbsenteeOwnerOwnerEvidenceComparison.js'
);

const source = fs.readFileSync(
  FILE,
  'utf8'
);

const AUTHORITY_FIELDS = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
  'canonicalIdentityRepairAuthorityGranted',
  'migrationAuthorityGranted',
  'schedulerAuthorityGranted',
  'triggerAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'certificationMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

function plain(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function evidence() {
  return {
    schedulerAuthorityGranted: false,
    ownerEvidencePersistenceAuthorityGranted: false,
    triggerAuthorityGranted: false,
    connectorExecutionAuthorityGranted: false,

    ownerNameEvidence: {
      owner_1: 'OWNER ONE',
      owner_2: 'OWNER TWO'
    },

    migrationAuthorityGranted: false,

    target: {
      identity: {
        'Canonical Property Key':
          'property|address|pa|philadelphia|19141-4008|5146 n 10th st',
        'Distress Lead ID':
          'DL-20260731203649-4601'
      },
      state: 'PA',
      city: 'PHILADELPHIA',
      rowNumber: 377,
      propertyAddress: '5146 N 10TH ST',
      zip: '19141-4008'
    },

    source: {
      dataset:
        'Philadelphia Properties and Assessment History',
      agency:
        'Philadelphia Office of Property Assessment',
      propertyLocation:
        '5146 N 10TH ST',
      parcelNumber:
        '776330000',
      lookupQueryMode:
        'exact_property_address',
      table:
        'opa_properties_public',
      endpoint:
        'https://phl.carto.com/api/v2/sql'
    },

    boundedSourceRowCount: 1,

    ownerMailingEvidence: {
      mailing_street:
        '5146 N 10TH ST',
      mailing_care_of: null,
      mailing_address_1: null,
      mailing_address_2: null,
      mailing_zip:
        '19141',
      mailing_city_state:
        'PHILADELPHIA PA'
    },

    certificationMutationAuthorityGranted:
      false,
    productionDataMutationAuthorityGranted:
      false,
    canonicalIdentityRepairAuthorityGranted:
      false,

    lookupTimestamp:
      '2026-09-26T00:25:07.762Z',

    mode:
      'READ_ONLY_OWNER_EVIDENCE',
    phase:
      'absentee_owner_philadelphia_owner_evidence_lookup',
    automaticOfferAuthorityGranted:
      false,
    ok: true,
    outcome: 'MATCHED'
  };
}

function clone(value) {
  return JSON.parse(
    JSON.stringify(value)
  );
}

function createHarness() {
  const state = {
    externalHttpCalls: 0,
    persistenceCalls: 0,
    databaseCalls: 0
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
          'SANITIZER_CALL_PROHIBITED'
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
          'REQUEST_BUILDER_CALL_PROHIBITED'
        );
      }
    },

    AbsenteeOwnerEnrichmentExecutor: {
      execute() {
        state.persistenceCalls++;
        throw new Error(
          'EXECUTOR_CALL_PROHIBITED'
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
        .AbsenteeOwnerOwnerEvidenceComparison
        .compare(input);
    }
  };
}

function assertAuthorityFalse(result) {
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
    'READ_ONLY_OWNER_EVIDENCE_COMPARISON'
  );

  assert.strictEqual(
    result.phase,
    'absentee_owner_owner_evidence_comparison'
  );

  assert.strictEqual(
    result.outcome,
    outcome
  );

  assert.strictEqual(
    result.ok,
    ok
  );

  assertAuthorityFalse(result);
}

function run(input) {
  const h = createHarness();

  return {
    h,
    out: h.call(input)
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
  'exact complete address match',
  () => {
    const { out } = run(
      evidence()
    );

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      []
    );
  }
);

test(
  'superficial case-only match',
  () => {
    const input = evidence();

    input.target.propertyAddress =
      '5146 n 10th st';
    input.target.city =
      'philadelphia';
    input.target.state =
      'pa';

    input.ownerMailingEvidence.mailing_street =
      '5146 N 10TH ST';

    input.ownerMailingEvidence.mailing_city_state =
      'PHILADELPHIA PA';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );
  }
);

test(
  'repeated-whitespace match',
  () => {
    const input = evidence();

    input.target.propertyAddress =
      '  5146   N   10TH   ST  ';

    input.target.city =
      '  PHILADELPHIA  ';

    input.ownerMailingEvidence.mailing_street =
      '5146 N 10TH ST';

    input.ownerMailingEvidence.mailing_city_state =
      '  PHILADELPHIA    PA ';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );
  }
);

test(
  'ZIP versus equivalent ZIP+4 handling',
  () => {
    const input = evidence();

    input.target.zip =
      '19141-4008';

    input.ownerMailingEvidence.mailing_zip =
      '19141';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );

    assert.strictEqual(
      out.normalizedPropertyAddress.zip,
      '19141'
    );

    assert.strictEqual(
      out.normalizedMailingAddress.zip,
      '19141'
    );
  }
);

test(
  'street difference',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_street =
      '6623 N 8TH ST';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['street']
    );
  }
);

test(
  'city difference',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_city_state =
      'PITTSBURGH PA';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['city']
    );
  }
);

test(
  'state difference',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_city_state =
      'PHILADELPHIA NJ';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['state']
    );
  }
);

test(
  'ZIP difference',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_zip =
      '19126';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      ['zip']
    );
  }
);

test(
  'multiple differing components',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_street =
      '6623 N 8TH ST';

    input.ownerMailingEvidence.mailing_city_state =
      'PITTSBURGH PA';

    input.ownerMailingEvidence.mailing_zip =
      '15222';

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      [
        'street',
        'city',
        'zip'
      ]
    );
  }
);

test(
  'blank mailing street',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_street =
      '';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'blank mailing city/state',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_city_state =
      '';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'invalid mailing city/state',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_city_state =
      'PHILADELPHIA';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'blank mailing ZIP',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_zip =
      '';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'invalid mailing ZIP',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_zip =
      'INVALID';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'blank property component',
  () => {
    const input = evidence();

    input.target.city =
      '';

    const { out } = run(input);

    assertOutcome(
      out,
      'INSUFFICIENT_MAILING_EVIDENCE',
      true
    );
  }
);

test(
  'upstream NO_MATCH is ineligible',
  () => {
    const input = evidence();

    input.outcome = 'NO_MATCH';

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'upstream AMBIGUOUS is ineligible',
  () => {
    const input = evidence();

    input.outcome = 'AMBIGUOUS';

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'upstream FAILED is ineligible',
  () => {
    const input = evidence();

    input.outcome = 'FAILED';

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'wrong source endpoint is ineligible',
  () => {
    const input = evidence();

    input.source.endpoint =
      'https://example.invalid/api';

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'wrong source table is ineligible',
  () => {
    const input = evidence();

    input.source.table =
      'wrong_table';

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'source row count other than one is ineligible',
  () => {
    const input = evidence();

    input.boundedSourceRowCount =
      2;

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'missing persisted identity is ineligible',
  () => {
    const input = evidence();

    delete input.target.identity[
      'Canonical Property Key'
    ];

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'unexpected true authority flag is ineligible',
  () => {
    const input = evidence();

    input.productionDataMutationAuthorityGranted =
      true;

    const { out } = run(input);

    assertOutcome(
      out,
      'INELIGIBLE_OWNER_EVIDENCE',
      false
    );
  }
);

test(
  'owner names do not affect comparison',
  () => {
    const first = evidence();
    const second = evidence();

    first.ownerNameEvidence = {
      owner_1: 'ALPHA',
      owner_2: 'BETA'
    };

    second.ownerNameEvidence = {
      owner_1: 'COMPLETELY DIFFERENT',
      owner_2: ''
    };

    const a = run(first).out;
    const b = run(second).out;

    assert.deepStrictEqual(
      plain({
        outcome: a.outcome,
        property:
          a.normalizedPropertyAddress,
        mailing:
          a.normalizedMailingAddress,
        differences:
          a.differingComponents
      }),
      plain({
        outcome: b.outcome,
        property:
          b.normalizedPropertyAddress,
        mailing:
          b.normalizedMailingAddress,
        differences:
          b.differingComponents
      })
    );

    assert.strictEqual(
      Object.prototype.hasOwnProperty.call(
        a,
        'ownerNameEvidence'
      ),
      false
    );
  }
);

test(
  'no persistence surface is called',
  () => {
    const h = createHarness();

    const out = h.call(
      evidence()
    );

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );

    assert.strictEqual(
      h.state.persistenceCalls,
      0
    );

    assert.strictEqual(
      h.state.databaseCalls,
      0
    );
  }
);

test(
  'no external HTTP surface is called',
  () => {
    const h = createHarness();

    const out = h.call(
      evidence()
    );

    assertOutcome(
      out,
      'MAILING_ADDRESS_MATCHES',
      true
    );

    assert.strictEqual(
      h.state.externalHttpCalls,
      0
    );
  }
);

test(
  'no absentee classification field is produced',
  () => {
    const input = evidence();

    input.ownerMailingEvidence.mailing_street =
      '6623 N 8TH ST';

    const { out } = run(input);

    [
      'absenteeOwner',
      'ownerOccupied',
      'nonOwnerOccupied',
      'vacant',
      'acquisitionQualified'
    ].forEach(field => {
      assert.strictEqual(
        Object.prototype.hasOwnProperty.call(
          out,
          field
        ),
        false,
        field + ' must not be produced'
      );
    });

    assert.strictEqual(
      out.absenteeClassificationAuthorityGranted,
      false
    );
  }
);

test(
  'row 377 certified fixture differs on street and ZIP',
  () => {
    const input = evidence();

    input.target.propertyAddress =
      '5146 N 10th St';

    input.target.city =
      'PHILADELPHIA';

    input.target.state =
      'PA';

    input.target.zip =
      '19141-4008';

    input.ownerNameEvidence = {
      owner_2: 'WATSON EMMA',
      owner_1: 'WATSON RODERIC'
    };

    input.ownerMailingEvidence = {
      mailing_street:
        '6623 N 8TH ST',
      mailing_care_of: null,
      mailing_address_1: null,
      mailing_address_2: null,
      mailing_zip:
        '19126',
      mailing_city_state:
        'PHILADELPHIA PA'
    };

    const { out } = run(input);

    assertOutcome(
      out,
      'MAILING_ADDRESS_DIFFERS',
      true
    );

    assert.deepStrictEqual(
      plain(out.differingComponents),
      [
        'street',
        'zip'
      ]
    );

    assert.strictEqual(
      out.normalizedPropertyAddress.street,
      '5146 N 10TH ST'
    );

    assert.strictEqual(
      out.normalizedMailingAddress.street,
      '6623 N 8TH ST'
    );

    assert.strictEqual(
      out.normalizedPropertyAddress.zip,
      '19141'
    );

    assert.strictEqual(
      out.normalizedMailingAddress.zip,
      '19126'
    );

    assert.strictEqual(
      out.absenteeClassificationAuthorityGranted,
      false
    );
  }
);

assert.strictEqual(
  count,
  28,
  'behavior validator must execute exactly 28 cases'
);

console.log('');
console.log(
  'ABSENTEE_OWNER_EVIDENCE_COMPARISON_BEHAVIOR_VALID=true'
);
console.log(
  'COMPARISON_BEHAVIOR_CASE_COUNT=' + count
);
console.log(
  'ROW_377_EXPECTED_COMPARISON=MAILING_ADDRESS_DIFFERS'
);
console.log(
  'ROW_377_EXPECTED_DIFFERING_COMPONENTS=street,zip'
);
console.log(
  'EXTERNAL_HTTP_EXECUTED=false'
);
console.log(
  'PERSISTENCE_SURFACE_CALLED=false'
);
console.log(
  'ABSENTEE_CLASSIFICATION_AUTHORITY=false'
);
console.log(
  'AUTOMATIC_OFFER_AUTHORITY=false'
);
