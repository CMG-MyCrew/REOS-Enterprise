#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const file =
  'build/apps-script-brand/' +
  'AbsenteeOwnerEnrichmentCertificationEntrypoint.js';

const source = fs.readFileSync(file, 'utf8');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeHarness(overrides) {
  const calls = [];
  const state = {
    mutationCalls: 0,
    getAllCalls: 0
  };

  const records = [
    {
      'Distress Lead ID': 'DL-100',
      'Canonical Property Key': 'CPK-100',
      'Owner Name': '',
      'Owner Mailing Address': '',
      _rowNumber: 7
    }
  ];

  const REOS = {
    Security: {
      requireAdmin() {
        calls.push('admin');
      }
    },

    Database: {
      getAll(table) {
        calls.push('read');
        state.getAllCalls += 1;
        assert.strictEqual(table, 'DISTRESS_LEADS');
        return clone(records);
      }
    },

    AbsenteeOwnerEnrichmentSanitizer: {
      sanitize(input) {
        calls.push('sanitize');

        /*
         * input originates in the vm context. Normalize through JSON so
         * prototype identity from different realms cannot make a
         * structurally exact payload fail deepStrictEqual().
         */
        assert.deepStrictEqual(clone(input), {
          outcome: 'MATCHED',
          identity: {
            'Distress Lead ID': 'DL-100',
            'Canonical Property Key': 'CPK-100'
          },
          attemptedPatch: {
            'Owner Name': 'Jane Owner'
          }
        });

        return {
          ok: true,
          outcome: 'MATCHED',
          identity: clone(input.identity),
          patch: {
            'Owner Name': 'Jane Owner'
          },
          persistenceAuthorized: false,
          dealCreationAuthorized: false,
          automaticOfferAuthorityGranted: false
        };
      }
    },

    AbsenteeOwnerEnrichmentPersistenceAdapter: {
      plan(input) {
        calls.push('plan');

        assert.strictEqual(
          input.records.length,
          1
        );

        assert.strictEqual(
          input.records[0]._rowNumber,
          7
        );

        return {
          ok: true,
          targetTable: 'DISTRESS_LEADS',
          identity: clone(input.sanitizedResult.identity),
          rowNumber: 7,
          patch: {
            'Owner Name': 'Jane Owner'
          },
          persistenceExecutionAuthorized: false,
          databaseUpdateAuthorized: false,
          databaseInsertAuthorized: false,
          databaseUpsertAuthorized: false,
          dealCreationAuthorized: false,
          maoGenerationAuthorized: false,
          automaticOfferAuthorityGranted: false
        };
      }
    },

    AbsenteeOwnerEnrichmentExecutionRequestBuilder: {
      prepare(plan) {
        calls.push('prepare');

        assert.strictEqual(plan.rowNumber, 7);

        return {
          ok: true,
          version: 1,
          targetTable: 'DISTRESS_LEADS',
          identity: clone(plan.identity),
          semanticPatch: clone(plan.patch),
          persistenceExecutionAuthorized: false,
          databaseUpdateAuthorized: false,
          databaseInsertAuthorized: false,
          databaseUpsertAuthorized: false,
          dealCreationAuthorized: false,
          maoGenerationAuthorized: false,
          automaticOfferAuthorityGranted: false,
          schedulerAuthority: false,
          productionMutationAuthority: false
        };
      }
    },

    AbsenteeOwnerEnrichmentExecutor: {
      execute(request) {
        calls.push('execute');
        state.mutationCalls += 1;

        return {
          ok: true,
          version: 1,
          classification:
            'ABSENTEE_OWNER_EXECUTION_VERIFIED',
          targetTable: request.targetTable,
          rowNumber: 7,
          identity: clone(request.identity),
          patchedHeaders: ['Owner Name'],
          persistenceExecutionAuthorized: false,
          databaseUpdateAuthorized: false,
          databaseInsertAuthorized: false,
          databaseUpsertAuthorized: false,
          dealCreationAuthorized: false,
          maoGenerationAuthorized: false,
          automaticOfferAuthorityGranted: false,
          schedulerAuthority: false,
          productionMutationAuthority: false
        };
      }
    }
  };

  Object.keys(overrides || {}).forEach(function (key) {
    REOS[key] = overrides[key];
  });

  const context = {
    REOS: REOS,
    console: console
  };

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: file
  });

  return {
    context,
    calls,
    state
  };
}

const validOptions = {
  outcome: 'MATCHED',
  identity: {
    'Distress Lead ID': ' DL-100 ',
    'Canonical Property Key': ' CPK-100 '
  },
  attemptedPatch: {
    'Owner Name': 'Jane Owner'
  }
};

/* Happy path. */
{
  const h = makeHarness();

  const receipt =
    h.context
      .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
        clone(validOptions)
      );

  assert.strictEqual(
    receipt.classification,
    'ABSENTEE_OWNER_EXECUTION_VERIFIED'
  );

  assert.deepStrictEqual(
    h.calls,
    ['admin', 'sanitize', 'read', 'plan', 'prepare', 'execute']
  );

  assert.strictEqual(h.state.getAllCalls, 1);
  assert.strictEqual(h.state.mutationCalls, 1);

  assert.strictEqual(
    receipt.automaticOfferAuthorityGranted,
    false
  );
}

/* Admin rejection occurs before read/pipeline execution. */
{
  const h = makeHarness({
    Security: {
      requireAdmin() {
        h.calls.push('admin');
        throw new Error('ADMIN_DENIED');
      }
    }
  });

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          clone(validOptions)
        );
    },
    /ADMIN_DENIED/
  );

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
}

/* Invalid dual identity fails after Admin but before read. */
[
  ['Distress Lead ID', ''],
  ['Canonical Property Key', '']
].forEach(function (fixture) {
  const h = makeHarness();
  const options = clone(validOptions);

  options.identity[fixture[0]] = fixture[1];

  assert.throws(function () {
    h.context
      .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
        options
      );
  });

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
});

/* Extra identity dimensions fail closed before sanitizer/read. */
[
  ['Lead ID', 'LEGACY-100'],
  ['Address', '123 Main St'],
  ['Owner Name', 'Caller Injected Owner']
].forEach(function (fixture) {
  const h = makeHarness();
  const options = clone(validOptions);

  options.identity[fixture[0]] = fixture[1];

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          options
        );
    },
    /ABSENTEE_OWNER_CERTIFICATION_IDENTITY_SHAPE_INVALID/
  );

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
});

/* Arrays / bulk-shaped top-level input fail before read. */
{
  const h = makeHarness();

  assert.throws(function () {
    h.context
      .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
        [clone(validOptions)]
      );
  });

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
}

/* Unknown top-level execution controls fail closed. */
[
  'records',
  'batch',
  'query',
  'cursor',
  'pageSize',
  'runAll',
  'scheduler'
].forEach(function (field) {
  const h = makeHarness();
  const options = clone(validOptions);
  options[field] = true;

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          options
        );
    },
    /ABSENTEE_OWNER_CERTIFICATION_OPTION_NOT_ALLOWED/
  );

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
});

/*
 * Downstream sanitizer failure remains before DISTRESS_LEADS read.
 * This also proves the entrypoint does not manufacture a sanitized result.
 */
{
  const h = makeHarness({
    AbsenteeOwnerEnrichmentSanitizer: {
      sanitize() {
        h.calls.push('sanitize');
        throw new Error('SANITIZER_REJECTED');
      }
    }
  });

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          clone(validOptions)
        );
    },
    /SANITIZER_REJECTED/
  );

  assert.deepStrictEqual(h.calls, ['admin', 'sanitize']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
}

/*
 * Adapter rejection propagates without builder/executor execution.
 * This is the expected boundary for NO_MATCH / AMBIGUOUS / FAILED or
 * any MATCHED result whose certified semantic patch is empty.
 */
{
  const h = makeHarness({
    AbsenteeOwnerEnrichmentPersistenceAdapter: {
      plan() {
        h.calls.push('plan');
        throw new Error('EMPTY_OWNER_PATCH');
      }
    }
  });

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          clone(validOptions)
        );
    },
    /EMPTY_OWNER_PATCH/
  );

  assert.deepStrictEqual(
    h.calls,
    ['admin', 'sanitize', 'read', 'plan']
  );

  assert.strictEqual(h.state.mutationCalls, 0);
}

/* Builder rejection prevents executor invocation. */
{
  const h = makeHarness({
    AbsenteeOwnerEnrichmentExecutionRequestBuilder: {
      prepare() {
        h.calls.push('prepare');
        throw new Error('BUILDER_REJECTED');
      }
    }
  });

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          clone(validOptions)
        );
    },
    /BUILDER_REJECTED/
  );

  assert.deepStrictEqual(
    h.calls,
    ['admin', 'sanitize', 'read', 'plan', 'prepare']
  );

  assert.strictEqual(h.state.mutationCalls, 0);
}

/*
 * Executor failure classification is propagated unchanged.
 * Entrypoint must not relabel an uncertain outcome or claim rollback.
 */
{
  const h = makeHarness({
    AbsenteeOwnerEnrichmentExecutor: {
      execute() {
        h.calls.push('execute');
        h.state.mutationCalls += 1;

        const error = new Error(
          'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN'
        );
        error.classification =
          'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN';
        throw error;
      }
    }
  });

  let observed;

  try {
    h.context
      .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
        clone(validOptions)
      );
  } catch (error) {
    observed = error;
  }

  assert(observed);
  assert.strictEqual(
    observed.classification,
    'ABSENTEE_OWNER_EXECUTION_OUTCOME_UNCERTAIN'
  );

  assert.deepStrictEqual(
    h.calls,
    ['admin', 'sanitize', 'read', 'plan', 'prepare', 'execute']
  );
}

/* Missing executor fails before DISTRESS_LEADS read. */
{
  const h = makeHarness({
    AbsenteeOwnerEnrichmentExecutor: {}
  });

  assert.throws(
    function () {
      h.context
        .reosAbsenteeOwnerEnrichmentCertifySingleRecord(
          clone(validOptions)
        );
    },
    /ABSENTEE_OWNER_EXECUTOR_UNAVAILABLE/
  );

  assert.deepStrictEqual(h.calls, ['admin']);
  assert.strictEqual(h.state.getAllCalls, 0);
  assert.strictEqual(h.state.mutationCalls, 0);
}

console.log(
  'PASS: Admin denial executes no DISTRESS_LEADS read or mutation.'
);
console.log(
  'PASS: exactly one DISTRESS_LEADS read supplies physical _rowNumber evidence to the adapter.'
);
console.log(
  'PASS: pipeline order is sanitizer -> read -> adapter -> builder -> executor.'
);
console.log(
  'PASS: invalid identity and bulk-shaped controls fail before record read.'
);
console.log(
  'PASS: sanitizer, adapter and builder failures prevent executor invocation.'
);
console.log(
  'PASS: executor VERIFIED receipt is returned without authority escalation.'
);
console.log(
  'PASS: executor OUTCOME_UNCERTAIN classification propagates unchanged.'
);
console.log(
  'PHASE1K_ENTRYPOINT_BEHAVIOR_VALIDATOR_PASSED=true'
);
