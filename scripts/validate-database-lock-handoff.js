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

function pass(message) {
  console.log(
    'PASS: ' + message
  );
}

function expectThrow(
  fn,
  pattern
) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert.ok(
    error,
    'Expected operation to throw'
  );

  assert.match(
    String(
      error.message ||
      error
    ),
    pattern
  );
}

function isolate(
  startMarker,
  endMarker
) {
  const start =
    source.indexOf(
      startMarker
    );

  const end =
    source.indexOf(
      endMarker,
      start
    );

  assert.ok(
    start >= 0 &&
    end > start,
    'Unable to isolate source block: ' +
      startMarker
  );

  return source.slice(
    start,
    end
  );
}

const ownerBlock =
  isolate(
    'function withScriptLockContext(work)',
    'function insert(sheetName, record, options)'
  );

const insertBlock =
  isolate(
    'function insert(sheetName, record, options)',
    'function update(sheetName, idField, idValue, changes)'
  );

assert.ok(
  source.includes(
    'var LOCK_CONTEXT_CAPABILITY_ = {};'
  )
);

assert.ok(
  source.includes(
    'function validateLockContext_(context)'
  )
);

assert.match(
  ownerBlock,
  /\.tryLock\s*\(\s*1000\s*\)/
);

assert.equal(
  /\.waitLock\s*\(/.test(
    ownerBlock
  ),
  false
);

assert.match(
  insertBlock,
  /\.waitLock\s*\(\s*30000\s*\)/
);

assert.equal(
  /\.tryLock\s*\(/.test(
    insertBlock
  ),
  false
);

assert.match(
  insertBlock,
  /hasOwnProperty\.call\s*\(\s*options\s*,\s*'lockContext'\s*\)/
);

assert.ok(
  insertBlock.includes(
    'validateLockContext_('
  )
);

assert.ok(
  insertBlock.includes(
    'if (!callerOwnsLock)'
  )
);

assert.ok(
  ownerBlock.includes(
    'SpreadsheetApp.flush();'
  )
);

assert.ok(
  ownerBlock.indexOf(
    'SpreadsheetApp.flush();'
  ) <
  ownerBlock.indexOf(
    'lock.releaseLock();'
  )
);

assert.ok(
  source.includes(
    'withScriptLockContext: withScriptLockContext'
  )
);

pass(
  'static lock-handoff topology is exact'
);


function createHarness(
  options = {}
) {
  const state = {
    events: [],
    waitCalls: [],
    tryCalls: [],
    hasLockCalls: 0,
    releaseCalls: 0,
    flushCalls: 0,
    appendCalls: 0,
    getScriptLockCalls: 0,
    getSheetCalls: 0
  };

  let held = false;

  const lock = {
    waitLock(timeout) {
      state.waitCalls.push(
        timeout
      );

      state.events.push(
        'wait:' + timeout
      );

      held = true;
    },

    tryLock(timeout) {
      state.tryCalls.push(
        timeout
      );

      state.events.push(
        'try:' + timeout
      );

      if (
        options.lockAvailable ===
        false
      ) {
        return false;
      }

      held = true;

      return true;
    },

    hasLock() {
      state.hasLockCalls += 1;

      return held;
    },

    releaseLock() {
      state.releaseCalls += 1;

      state.events.push(
        'release'
      );

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

      state.events.push(
        'append'
      );

      rows.push(
        row.slice()
      );
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
      assert.equal(
        row,
        1
      );

      assert.equal(
        column,
        1
      );

      assert.equal(
        rowCount,
        1
      );

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
      state.getSheetCalls += 1;

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

        state.events.push(
          'flush'
        );

        if (
          options.flushThrows ===
          true
        ) {
          throw new Error(
            'flush failure'
          );
        }
      }
    },

    LockService: {
      getScriptLock() {
        state.getScriptLockCalls += 1;

        return lock;
      }
    },

    console
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox
  );

  return {
    sandbox,
    state,
    rows,
    lock
  };
}


{
  const h =
    createHarness();

  const result =
    h.sandbox
      .REOS
      .Database
      .insert(
        'TEST',
        {
          Value: 'default'
        },
        {}
      );

  assert.equal(
    result.Value,
    'default'
  );

  assert.deepEqual(
    h.state.waitCalls,
    [30000]
  );

  assert.deepEqual(
    h.state.tryCalls,
    []
  );

  assert.equal(
    h.state.releaseCalls,
    1
  );

  assert.equal(
    h.state.flushCalls,
    0
  );

  assert.equal(
    h.state.appendCalls,
    1
  );
}

pass(
  'default Database.insert retains waitLock(30000) ownership behavior'
);


{
  const h =
    createHarness();

  const db =
    h.sandbox
      .REOS
      .Database;

  db.withScriptLockContext(
    (lockContext) => {
      assert.equal(
        Object.isFrozen(
          lockContext
        ),
        true
      );

      return db.insert(
        'TEST',
        {
          Value: 'handoff'
        },
        {
          lockContext
        }
      );
    }
  );

  assert.deepEqual(
    h.state.waitCalls,
    []
  );

  assert.deepEqual(
    h.state.tryCalls,
    [1000]
  );

  assert.equal(
    h.state.appendCalls,
    1
  );

  assert.equal(
    h.state.flushCalls,
    1
  );

  assert.equal(
    h.state.releaseCalls,
    1
  );

  assert.deepEqual(
    h.state.events,
    [
      'try:1000',
      'append',
      'flush',
      'release'
    ]
  );
}

pass(
  'valid caller-owned context avoids nested lock and releases only at outer owner'
);


for (
  const invalidContext
  of [
    true,
    false,
    {},
    {
      lock: {
        hasLock() {
          return true;
        }
      }
    }
  ]
) {
  const h =
    createHarness();

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .Database
        .insert(
          'TEST',
          {
            Value: 'invalid'
          },
          {
            lockContext:
              invalidContext
          }
        ),
    /lock context is invalid/
  );

  assert.equal(
    h.state.getScriptLockCalls,
    0
  );

  assert.equal(
    h.state.appendCalls,
    0
  );
}

pass(
  'boolean and forged lock bypasses fail before database I/O'
);


{
  const h =
    createHarness();

  const db =
    h.sandbox
      .REOS
      .Database;

  let stale = null;

  db.withScriptLockContext(
    (lockContext) => {
      stale =
        lockContext;
    }
  );

  expectThrow(
    () =>
      db.insert(
        'TEST',
        {
          Value: 'stale'
        },
        {
          lockContext:
            stale
        }
      ),
    /no longer owns ScriptLock/
  );

  assert.equal(
    h.state.appendCalls,
    0
  );
}

pass(
  'released lock capability cannot be reused'
);


{
  const h =
    createHarness({
      lockAvailable:
        false
    });

  let callbackCalled =
    false;

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .Database
        .withScriptLockContext(
          () => {
            callbackCalled =
              true;
          }
        ),
    /contended/
  );

  assert.equal(
    callbackCalled,
    false
  );

  assert.deepEqual(
    h.state.tryCalls,
    [1000]
  );

  assert.equal(
    h.state.appendCalls,
    0
  );

  assert.equal(
    h.state.flushCalls,
    0
  );

  assert.equal(
    h.state.releaseCalls,
    0
  );
}

pass(
  'lock contention fails fast before callback or mutation'
);


{
  const h =
    createHarness();

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .Database
        .withScriptLockContext(
          () => {
            throw new Error(
              'callback failure'
            );
          }
        ),
    /callback failure/
  );

  assert.deepEqual(
    h.state.events,
    [
      'try:1000',
      'flush',
      'release'
    ]
  );
}

pass(
  'outer owner flushes and releases when protected callback fails'
);


{
  const h =
    createHarness({
      flushThrows:
        true
    });

  expectThrow(
    () =>
      h.sandbox
        .REOS
        .Database
        .withScriptLockContext(
          () => 'ok'
        ),
    /flush failure/
  );

  assert.equal(
    h.state.flushCalls,
    1
  );

  assert.equal(
    h.state.releaseCalls,
    1
  );

  assert.deepEqual(
    h.state.events,
    [
      'try:1000',
      'flush',
      'release'
    ]
  );
}

pass(
  'lock release remains guaranteed if SpreadsheetApp.flush fails'
);


{
  const h =
    createHarness();

  const db =
    h.sandbox
      .REOS
      .Database;

  assert.equal(
    Object.prototype
      .hasOwnProperty
      .call(
        db,
        'LOCK_CONTEXT_CAPABILITY_'
      ),
    false
  );
}

pass(
  'private lock capability is not exported on REOS.Database'
);


console.log(
  '\nDatabase lock-handoff validation PASSED.'
);
