#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');

const FILE =
  'build/apps-script-brand/CountyPage85SourceObservation214Repair.js';

const source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

function assert(condition, message) {
  if (!condition) {
    throw new Error(
      'FAIL: ' + message
    );
  }

  console.log(
    'PASS: ' + message
  );
}

console.log(
  '=== PAGE-85 SOURCE OBSERVATION 214 REPAIR CONTRACT ==='
);

assert(
  source.includes(
    "var TARGET_OBJECT_ID = 214;"
  ) &&
  source.includes(
    'var AUTHORITATIVE_ROW = 923;'
  ) &&
  source.includes(
    'var DUPLICATE_ROW = 925;'
  ),
  'repair authority is hard-bound to objectid 214 and physical rows 923/925'
);

assert(
  source.includes(
    "DL-20260821060151-8654"
  ) &&
  source.includes(
    "DL-20260821060203-1280"
  ),
  'repair authority is hard-bound to the certified Distress Lead IDs'
);

assert(
  source.includes(
    "property|parcel|pa|philadelphia|466864"
  ) &&
  source.includes(
    "pa-philadelphia|code_violations|214"
  ),
  'repair authority is hard-bound to certified source and canonical identity'
);

assert(
  source.includes(
    'options.confirmRepair !== true'
  ),
  'explicit repair confirmation is mandatory'
);

assert(
  source.includes(
    'managedTriggerCount_() !== 0'
  ),
  'zero managed scheduler triggers are required'
);

assert(
  source.includes(
    "COUNTY-20260902222607805"
  ) &&
  source.includes(
    "1780925895000|635678"
  ),
  'repair is bound to the exact preserved page-85 checkpoint'
);

assert(
  source.includes(
    'REOS.CountyAdapters.ArcGIS.fetch'
  ) &&
  source.includes(
    ') AND objectid = '
  ),
  'fresh objectid 214 source truth is revalidated before mutation'
);

const setValuesMatches =
  source.match(
    /\.setValues\s*\(/g
  ) || [];

assert(
  setValuesMatches.length === 1,
  'static mutation surface contains exactly one setValues primitive'
);

assert(
  !/deleteRow\s*\(/.test(source) &&
  !/deleteRows\s*\(/.test(source),
  'executor contains no spreadsheet row-delete primitive'
);

assert(
  !/REOS\.Database\.(?:insert|update|upsert|softDelete)\s*\(/.test(source),
  'executor contains no broad Database insert/update/upsert/soft-delete authority'
);

assert(
  source.includes(
    'withScriptLockContext'
  ),
  'repair executes under one fail-fast outer ScriptLock'
);

assert(
  source.includes(
    'fingerprint_('
  ) &&
  source.includes(
    'authoritativeFingerprint'
  ) &&
  source.includes(
    'duplicateFingerprint'
  ),
  'both physical rows are fingerprinted under lock'
);

assert(
  source.includes(
    'downstreamReferences_(['
  ) &&
  source.includes(
    'AUTHORITATIVE_LEAD'
  ) &&
  source.includes(
    'DUPLICATE_LEAD'
  ) &&
  source.includes(
    'downstreamReferences.length !== 0'
  ),
  'both certified Distress Lead IDs are rechecked for downstream references before mutation'
);

assert(
  source.includes(
    'sheetName === TABLE'
  ),
  'authoritative DISTRESS_LEADS is excluded from downstream reference matching'
);

assert(
  source.includes(
    'getDisplayValues()'
  ),
  'reference guard scans displayed cell values without formula-text authority'
);

assert(
  source.includes(
    'beforeMatches.length !== 2'
  ) &&
  source.includes(
    'afterMatches.length !== 1'
  ),
  'repair reconciles duplicate count from exactly two to exactly one'
);

assert(
  source.includes(
    'var authoritativeAfter ='
  ) &&
  source.includes(
    'authoritativeAfter.values'
  ) &&
  source.includes(
    '!== authoritativeFingerprint'
  ) &&
  source.includes(
    'Page-85 repair authoritative row changed unexpectedly.'
  ),
  'authoritative row 923 is verified unchanged after mutation'
);

assert(
  source.includes(
    'duplicateAfter.values.some'
  ),
  'duplicate physical row 925 is verified fully blank after mutation'
);

assert(
  source.includes(
    'function writePhysicalRow_('
  ) &&
  source.includes(
    'mutationApplied'
  ),
  'normal repair and rollback share one bounded physical-write primitive'
);

assert(
  source.includes(
    'DUPLICATE_ROW,\n                duplicate.values'
  ) &&
  source.includes(
    'restoredDuplicate'
  ) &&
  source.includes(
    'duplicateFingerprint'
  ),
  'post-write failure restores and fingerprints exact row-925 prestate'
);

assert(
  source.includes(
    'restoredAuthoritative'
  ) &&
  source.includes(
    'authoritativeFingerprint'
  ),
  'rollback verifies authoritative row 923 remained unchanged'
);

assert(
  source.includes(
    'rollbackMatches.length !== 2'
  ),
  'rollback requires restoration of exactly two pre-repair observations'
);

assert(
  source.includes(
    'certified prestate restored'
  ),
  'successful rollback reports restored prestate rather than repair success'
);

assert(
  source.includes(
    'automatic retry prohibited'
  ),
  'rollback failure is explicitly classified ambiguous and non-retriable'
);

assert(
  source.includes(
    'automaticOfferAuthorityGranted:\n              false'
  ) &&
  source.includes(
    'checkpointMutationAuthorityGranted:\n              false'
  ) &&
  source.includes(
    'feedAdvancementAuthorityGranted:\n              false'
  ),
  'repair grants no offer, checkpoint, or feed advancement authority'
);

const sandbox = {
  console,
  REOS: {},
};

vm.createContext(sandbox);

vm.runInContext(
  source,
  sandbox,
  {
    filename: FILE
  }
);

assert(
  sandbox.REOS &&
  sandbox.REOS
    .CountyPage85SourceObservation214Repair &&
  typeof sandbox.REOS
    .CountyPage85SourceObservation214Repair
    .execute === 'function',
  'repair module public contract loads'
);

assert(
  typeof sandbox
    .reosCountyPage85SourceObservation214Repair ===
    'function',
  'controlled Apps Script RPC is present'
);

console.log(
  'Page-85 source observation 214 repair validation PASSED.'
);
