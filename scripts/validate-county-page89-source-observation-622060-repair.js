#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');

const FILE =
  'build/apps-script-brand/' +
  'CountyPage89SourceObservation622060Repair.js';

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

const source =
  fs.readFileSync(FILE, 'utf8');

[
  'RETIRED Page-89 ObjectID Repair',
  'pa-philadelphia|code_violations|622060',
  'DL-20260903195030-8061',
  'VI-2026-027246',
  'property|parcel|pa|philadelphia|518651',
  '622924',
  'SOURCE_CANONICAL_MATCH',
  'No Page-89 repair authority exists.',
  'reosCountyPage89SourceObservation622060Repair'
].forEach(function (text) {
  assert(
    source.includes(text),
    'Missing retirement authority: ' + text
  );
});

[
  '.setValues(',
  '.setValue(',
  '.deleteRow(',
  '.deleteRows(',
  'Database.insert(',
  'Database.update(',
  'Database.upsert(',
  'Database.delete(',
  'withScriptLockContext(',
  'SpreadsheetApp',
  'ScriptApp',
  'UrlFetchApp',
  'CountyCodeViolationSourceRecordDiagnostic',
  'CountyProductionScheduler',
  'CanonicalPropertyIdentity',
  'PropertiesService',
  'newTrigger('
].forEach(function (text) {
  assert(
    !source.includes(text),
    'Retired repair retains forbidden authority: ' +
      text
  );
});

assert(
  !source.includes(
    'repairAuthorityGranted: true'
  ),
  'Retired repair must grant no repair authority.'
);

const context = {
  REOS: {}
};

vm.createContext(context);

vm.runInContext(
  source,
  context,
  {
    filename: FILE
  }
);

assert(
  typeof context
    .reosCountyPage89SourceObservation622060Repair ===
    'function',
  'Compatibility RPC must remain present.'
);

let blocked = false;
let message = '';

try {
  context
    .reosCountyPage89SourceObservation622060Repair(
      {
        confirmRepair: true,
        sourceObservationKey:
          'pa-philadelphia|code_violations|622060'
      }
    );
} catch (error) {
  blocked = true;
  message =
    String(
      error &&
      error.message
        ? error.message
        : error
    );
}

assert(
  blocked,
  'Retired Page-89 RPC must always fail closed.'
);

assert(
  message.includes(
    'Page-89 repair retired'
  ),
  'Retired RPC must state retirement authority.'
);

assert(
  message.includes(
    'VI-2026-027246'
  ),
  'Retired RPC must identify durable observation authority.'
);

assert(
  message.includes(
    'No Page-89 repair authority exists'
  ),
  'Retired RPC must explicitly deny repair authority.'
);

console.log(
  'PASS: Page-89 ObjectID repair is permanently retired.'
);

console.log(
  'PASS: compatibility RPC fails before all production I/O.'
);

console.log(
  'PASS: durable VI-2026-027246 / parcel 518651 authority is preserved.'
);

console.log(
  'Page-89 retired repair contract PASSED.'
);
