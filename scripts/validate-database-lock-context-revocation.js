'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const databasePath =
  'build/apps-script-brand/Database.js';

const source =
  fs.readFileSync(
    databasePath,
    'utf8'
  );

console.log(
  '=== DATABASE LOCK CONTEXT REVOCATION CONTRACT ==='
);

function createHarness() {
  const state = {
    tryCalls: [],
    waitCalls: [],
    releaseCalls: 0,
    flushCalls: 0,
    appendCalls: 0
  };

  let held = false;

  /*
   * Deliberately return the SAME lock object for every acquisition.
   *
   * This models the replay hazard:
   * a stale context still points at this object, and a later
   * tryLock() makes hasLock() true again.
   */
  const lock = {
    waitLock(timeout) {
      state.waitCalls.push(timeout);
      held = true;
    },

    tryLock(timeout) {
      state.tryCalls.push(timeout);
      held = true;
      return true;
    },

    hasLock() {
      return held;
    },

    releaseLock() {
      state.releaseCalls += 1;
      held = false;
    }
  };

  const headers = [
    'Record ID',
    'Value',
    'Created At',
    'Updated At'
  ];

  const rows = [];

  const sheet = {
    appendRow(row) {
      state.appendCalls += 1;
      rows.push(row.slice());
    },

    getLastRow() {
      return rows.length + 1;
    },

    getLastColumn() {
      return headers.length;
    },

    getRange(
      row,
      column,
      rowCount,
      columnCount
    ) {
      assert.equal(row, 1);
      assert.equal(column, 1);
      assert.equal(rowCount, 1);
      assert.equal(
        columnCount,
        headers.length
      );

      return {
        getValues() {
          return [
            headers.slice()
          ];
        }
      };
    }
  };

  const spreadsheet = {
    getSheetByName() {
      return sheet;
    }
  };

  const sandbox = {
    REOS: {
      generateId_() {
        return 'TEST-ID';
      },

      Logger: null
    },

    SpreadsheetApp: {
      getActiveSpreadsheet() {
        return spreadsheet;
      },

      flush() {
        state.flushCalls += 1;
      }
    },

    LockService: {
      getScriptLock() {
        return lock;
      }
    },

    console
  };

  vm.createContext(sandbox);

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'Database.js'
    }
  );

  return {
    sandbox,
    state
  };
}

const h =
  createHarness();

const db =
  h.sandbox
    .REOS
    .Database;

let staleContext = null;

/*
 * Acquisition epoch 1.
 */
db.withScriptLockContext(
  (lockContext) => {
    staleContext =
      lockContext;

    const inserted =
      db.insert(
        'TEST',
        {
          Value:
            'epoch-one'
        },
        {
          lockContext
        }
      );

    assert.equal(
      inserted.Value,
      'epoch-one'
    );
  }
);

assert.ok(
  staleContext,
  'First callback must expose a context.'
);

assert.equal(
  h.state.appendCalls,
  1
);

assert.equal(
  h.state.releaseCalls,
  1
);

/*
 * Acquisition epoch 2.
 *
 * The same ScriptLock object is reacquired. The context from
 * epoch 1 MUST remain permanently revoked.
 */
let freshContext = null;
let staleReplayError = null;

db.withScriptLockContext(
  (lockContext) => {
    freshContext =
      lockContext;

    assert.notStrictEqual(
      freshContext,
      staleContext,
      'Each callback must receive a distinct context.'
    );

    try {
      db.insert(
        'TEST',
        {
          Value:
            'stale-replay'
        },
        {
          lockContext:
            staleContext
        }
      );
    } catch (error) {
      staleReplayError =
        error;
    }

    assert.ok(
      staleReplayError,
      'STALE_LOCK_CONTEXT_REVIVED_AFTER_REACQUISITION'
    );

    assert.match(
      String(
        staleReplayError.message ||
        staleReplayError
      ),
      /lock context|revoked|originating|no longer owns/i
    );

    /*
     * Failed stale replay must occur before database mutation.
     */
    assert.equal(
      h.state.appendCalls,
      1
    );

    const inserted =
      db.insert(
        'TEST',
        {
          Value:
            'epoch-two'
        },
        {
          lockContext
        }
      );

    assert.equal(
      inserted.Value,
      'epoch-two'
    );
  }
);

assert.ok(
  freshContext
);

assert.equal(
  h.state.appendCalls,
  2
);

assert.deepEqual(
  h.state.tryCalls,
  [
    1000,
    1000
  ]
);

assert.deepEqual(
  h.state.waitCalls,
  []
);

assert.equal(
  h.state.flushCalls,
  2
);

assert.equal(
  h.state.releaseCalls,
  2
);

/*
 * Completion of epoch 2 must revoke its context as well.
 */
assert.throws(
  () =>
    db.insert(
      'TEST',
      {
        Value:
          'fresh-after-completion'
      },
      {
        lockContext:
          freshContext
      }
    ),
  /lock context|revoked|originating|no longer owns/i
);

assert.equal(
  h.state.appendCalls,
  2
);

console.log(
  'PASS: context is valid only during its originating callback'
);

console.log(
  'PASS: callback completion permanently revokes context'
);

console.log(
  'PASS: reacquiring the same ScriptLock does not revive stale context'
);

console.log(
  'Database lock-context revocation validation PASSED.'
);
