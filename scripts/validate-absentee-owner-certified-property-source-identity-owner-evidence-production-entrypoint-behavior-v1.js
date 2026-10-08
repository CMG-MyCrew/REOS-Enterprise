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
    'AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint.js'
  );

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const AUTHORITY_FIELDS = [
  'productionDataMutationAuthorityGranted',
  'ownerEvidencePersistenceAuthorityGranted',
  'classificationAuthorityGranted',
  'absenteeClassificationAuthorityGranted',
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
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted',
  'automaticOfferAuthorityGranted'
];

function plain(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(
    JSON.stringify(value)
  );
}

function clone(value) {
  return plain(value);
}

function input() {
  return {
    propertySourceIdentityCertification: {
      ok: true,
      mode:
        'READ_ONLY_PROPERTY_SOURCE_IDENTITY_CERTIFICATION',
      phase:
        'absentee_owner_opa_account_range_property_source_identity_certification',
      outcome:
        'PROPERTY_SOURCE_IDENTITY_CERTIFIED',
      propertySourceIdentityCertified:
        true
    },

    normalLookupEvidence: {
      ok: true,
      mode:
        'READ_ONLY_OWNER_EVIDENCE',
      phase:
        'absentee_owner_philadelphia_owner_evidence_lookup',
      outcome:
        'NO_MATCH',
      boundedSourceRowCount:
        0
    }
  };
}

function upstream(
  outcome,
  ok
) {
  const result = {
    ok:
      ok === undefined
        ? true
        : ok,

    mode:
      'READ_ONLY_OWNER_EVIDENCE',

    phase:
      'absentee_owner_certified_property_source_identity_owner_evidence_lookup',

    outcome:
      outcome || 'MATCHED'
  };

  AUTHORITY_FIELDS.forEach(field => {
    result[field] =
      false;
  });

  if (result.outcome === 'MATCHED') {
    result.ownerNameEvidence = {
      owner_1: 'TEST OWNER',
      owner_2: null
    };

    result.ownerMailingEvidence = {
      mailing_address_1:
        'TEST MAILING ADDRESS'
    };
  }

  if (result.ok === false) {
    result.code =
      'UPSTREAM_FAILURE';
  }

  return result;
}

function harness(config) {
  const options =
    config || {};

  const state = {
    adminCalls: 0,
    lookupCalls: 0,
    lookupInput: null
  };

  const context = {
    REOS: {
      Security: {
        requireAdmin:
          function () {
            state.adminCalls += 1;

            if (options.adminThrows) {
              throw new Error(
                'ADMIN_DENIED'
              );
            }
          }
      },

      AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup: {
        lookup:
          function (request) {
            state.lookupCalls += 1;

            state.lookupInput =
              clone(request);

            if (
              typeof options.lookup ===
              'function'
            ) {
              return options.lookup(
                request
              );
            }

            return upstream(
              'MATCHED',
              true
            );
          }
      }
    }
  };

  vm.createContext(
    context
  );

  vm.runInContext(
    source,
    context
  );

  return {
    context:
      context,

    state:
      state,

    execute:
      context
        .REOS
        .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceProductionEntrypoint
        .execute,

    rpc:
      context
        .reosAbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceRetrieveSingleRecord
  };
}

function expectFailure(
  result,
  code
) {
  const value =
    plain(result);

  assert.strictEqual(
    value.ok,
    false
  );

  assert.strictEqual(
    value.mode,
    'READ_ONLY_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT'
  );

  assert.strictEqual(
    value.phase,
    'absentee_owner_certified_property_source_identity_owner_evidence_single_record_production'
  );

  assert.strictEqual(
    value.outcome,
    'PRODUCTION_OWNER_EVIDENCE_RETRIEVAL_FAILED'
  );

  assert.strictEqual(
    value.code,
    code
  );

  assert.strictEqual(
    value.ownerEvidencePersistenceAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.classificationAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.maoAuthorityGranted,
    false
  );

  assert.strictEqual(
    value.offerAuthorityGranted,
    false
  );
}

let cases = 0;

function case_(
  name,
  fn
) {
  fn();
  cases += 1;

  console.log(
    'PASS: ' + name
  );
}

case_(
  'admin denial occurs before lookup',
  () => {
    const h =
      harness({
        adminThrows: true
      });

    assert.throws(
      () => h.execute(input()),
      /ADMIN_DENIED/
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'null options rejected',
  () => {
    const h = harness();

    expectFailure(
      h.execute(null),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'array options rejected',
  () => {
    const h = harness();

    expectFailure(
      h.execute([]),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'missing certification field rejected',
  () => {
    const h = harness();
    const value = input();

    delete value
      .propertySourceIdentityCertification;

    expectFailure(
      h.execute(value),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'missing normal lookup field rejected',
  () => {
    const h = harness();
    const value = input();

    delete value
      .normalLookupEvidence;

    expectFailure(
      h.execute(value),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'extra direct OPA account field rejected',
  () => {
    const h = harness();
    const value = input();

    value.opaAccount =
      '183124510';

    expectFailure(
      h.execute(value),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'extra raw property address field rejected',
  () => {
    const h = harness();
    const value = input();

    value.propertyAddress =
      '1624 N BODINE ST';

    expectFailure(
      h.execute(value),
      'INVALID_OPTIONS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'non-object certification rejected',
  () => {
    const h = harness();
    const value = input();

    value
      .propertySourceIdentityCertification =
        'certification';

    expectFailure(
      h.execute(value),
      'INVALID_PROPERTY_SOURCE_IDENTITY_CERTIFICATION'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'non-object normal evidence rejected',
  () => {
    const h = harness();
    const value = input();

    value.normalLookupEvidence =
      'normal';

    expectFailure(
      h.execute(value),
      'INVALID_NORMAL_LOOKUP_EVIDENCE'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'missing lookup dependency fails closed',
  () => {
    const h = harness();

    h.context
      .REOS
      .AbsenteeOwnerCertifiedPropertySourceIdentityOwnerEvidenceLookup =
        null;

    expectFailure(
      h.execute(input()),
      'RUNTIME_DEPENDENCY_UNAVAILABLE'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      0
    );
  }
);

case_(
  'matched result returned',
  () => {
    const h = harness();

    const result =
      plain(
        h.execute(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.outcome,
      'MATCHED'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'no-match result returned',
  () => {
    const h =
      harness({
        lookup:
          () =>
            upstream(
              'NO_MATCH',
              true
            )
      });

    const result =
      plain(
        h.execute(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.outcome,
      'NO_MATCH'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'ambiguous result returned',
  () => {
    const h =
      harness({
        lookup:
          () =>
            upstream(
              'AMBIGUOUS',
              true
            )
      });

    const result =
      plain(
        h.execute(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      result.outcome,
      'AMBIGUOUS'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'eligible upstream failure returned',
  () => {
    const h =
      harness({
        lookup:
          () =>
            upstream(
              'FAILED',
              false
            )
      });

    const result =
      plain(
        h.execute(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      false
    );

    assert.strictEqual(
      result.outcome,
      'FAILED'
    );

    assert.strictEqual(
      result.code,
      'UPSTREAM_FAILURE'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'lookup throw fails closed without retry',
  () => {
    const h =
      harness({
        lookup:
          () => {
            throw new Error(
              'LOOKUP_THROW'
            );
          }
      });

    expectFailure(
      h.execute(input()),
      'OWNER_EVIDENCE_LOOKUP_FAILED'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'null upstream result rejected',
  () => {
    const h =
      harness({
        lookup:
          () => null
      });

    expectFailure(
      h.execute(input()),
      'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT'
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'wrong upstream mode rejected',
  () => {
    const h =
      harness({
        lookup:
          () => {
            const value =
              upstream(
                'MATCHED',
                true
              );

            value.mode =
              'OTHER';

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT'
    );
  }
);

case_(
  'true known authority rejected',
  () => {
    const h =
      harness({
        lookup:
          () => {
            const value =
              upstream(
                'MATCHED',
                true
              );

            value
              .classificationAuthorityGranted =
                true;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT'
    );
  }
);

case_(
  'true unknown authority suffix rejected',
  () => {
    const h =
      harness({
        lookup:
          () => {
            const value =
              upstream(
                'MATCHED',
                true
              );

            value
              .unexpectedAuthorityGranted =
                true;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT'
    );
  }
);

case_(
  'missing required authority field rejected',
  () => {
    const h =
      harness({
        lookup:
          () => {
            const value =
              upstream(
                'MATCHED',
                true
              );

            delete value
              .offerAuthorityGranted;

            return value;
          }
      });

    expectFailure(
      h.execute(input()),
      'INVALID_OWNER_EVIDENCE_LOOKUP_RESULT'
    );
  }
);

case_(
  'successful lookup receives exact two-field envelope',
  () => {
    const h = harness();
    const value = input();

    h.execute(value);

    assert.deepStrictEqual(
      Object.keys(
        h.state.lookupInput
      ).sort(),
      [
        'normalLookupEvidence',
        'propertySourceIdentityCertification'
      ]
    );

    assert.deepStrictEqual(
      h.state.lookupInput,
      value
    );
  }
);

case_(
  'caller input remains unmodified',
  () => {
    const h = harness();
    const value = input();
    const before =
      clone(value);

    h.execute(value);

    assert.deepStrictEqual(
      value,
      before
    );
  }
);

case_(
  'lookup invoked exactly once',
  () => {
    const h = harness();

    h.execute(
      input()
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

case_(
  'global RPC delegates to bounded execution',
  () => {
    const h = harness();

    const result =
      plain(
        h.rpc(
          input()
        )
      );

    assert.strictEqual(
      result.ok,
      true
    );

    assert.strictEqual(
      h.state.adminCalls,
      1
    );

    assert.strictEqual(
      h.state.lookupCalls,
      1
    );
  }
);

assert.ok(
  cases >= 24,
  'behavior coverage must include at least 24 cases'
);

console.log(
  'ABSENTEE_OWNER_OWNER_EVIDENCE_PRODUCTION_ENTRYPOINT_BEHAVIOR_VALID=true'
);

console.log(
  'BEHAVIOR_CASE_COUNT=' +
    cases
);

console.log(
  'ADMIN_DENIAL_BEFORE_LOOKUP=true'
);

console.log(
  'MALFORMED_REQUEST_ZERO_LOOKUP_CALLS=true'
);

console.log(
  'DIRECT_OPA_ACCOUNT_INPUT_REJECTED=true'
);

console.log(
  'LOOKUP_INVOCATION_MAX=1'
);

console.log(
  'AUTOMATIC_RETRY_AUTHORIZED=false'
);

console.log(
  'UPSTREAM_AUTHORITY_ESCALATION_REJECTED=true'
);

console.log(
  'CALLER_INPUT_UNMODIFIED=true'
);

console.log(
  'BATCH_AUTHORITY=false'
);

console.log(
  'PERSISTENCE_AUTHORITY=false'
);

console.log(
  'CLASSIFICATION_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);
