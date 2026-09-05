'use strict';

const fs = require('fs');
const path = require('path');

const target = path.join(
  process.cwd(),
  'build/apps-script-brand/CountyPage89SourceObservation622060Repair.js'
);

const source = fs.readFileSync(
  target,
  'utf8'
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  source.includes(
    "var TARGET_OBJECT_ID = 622060;"
  ),
  'Target object 622060 must be immutable.'
);

assert(
  source.includes(
    "var TARGET_ROW = 5422;"
  ),
  'Target physical row 5422 must be immutable.'
);

assert(
  source.includes(
    "var TARGET_LEAD = 'DL-20260903195030-8061';"
  ),
  'Target distress lead must be immutable.'
);

assert(
  source.includes(
    "'pa-philadelphia|code_violations|622060'"
  ),
  'Source observation key must be immutable.'
);

assert(
  source.includes(
    "var OLD_PARCEL = '518651';"
  ),
  'Certified old parcel must be asserted.'
);

assert(
  source.includes(
    "var EXPECTED_PARCEL = '479933';"
  ),
  'Fresh source parcel must be asserted.'
);

assert(
  source.includes(
    "var EXPECTED_ADDRESS ="
  ) &&
  source.includes(
    "'5518 JEFFERSON ST'"
  ),
  'Fresh source address must be asserted.'
);

assert(
  source.includes(
    "typeof REOS.Security.requireAdmin !== 'function'"
  ) &&
  source.includes(
    "REOS.Security.requireAdmin();"
  ),
  'Repair must use canonical Security admin authority.'
);

assert(
  !source.includes(
    "REOS.Admin.requireAdmin"
  ),
  'Repair must not derive admin authority from REOS.Admin.'
);

assert(
  source.includes(
    "options.confirmRepair !== true"
  ),
  'Explicit repair confirmation must be required.'
);

assert(
  source.includes(
    "managedTriggerCount_() !== 0"
  ),
  'Repair must require scheduler quiescence.'
);

assert(
  source.includes(
    "requireCheckpointAuthority_();"
  ),
  'Repair must bind to certified checkpoint.'
);

assert(
  source.includes(
    "typeof REOS.CountyProductionScheduler.getCheckpoint !== 'function'"
  ) &&
  source.includes(
    "REOS.CountyProductionScheduler.getCheckpoint();"
  ),
  'Repair must use canonical county scheduler checkpoint API.'
);

assert(
  !source.includes(
    "REOS.CountyProductionScheduler.checkpoint"
  ),
  'Repair must not use nonexistent scheduler checkpoint API.'
);

assert(
  source.includes(
    '.CountyCodeViolationSourceRecordDiagnostic'
  ) &&
  source.includes(
    '.run(TARGET_OBJECT_ID)'
  ),
  'Repair must revalidate fresh source through certified diagnostic.'
);

assert(
  source.includes(
    '.withScriptLockContext('
  ),
  'Repair must execute under ScriptLock.'
);

assert(
  source.includes(
    'downstreamReferences_()'
  ),
  'Repair must re-prove downstream reference safety.'
);

assert(
  source.includes(
    'writePhysicalRow_('
  ),
  'Repair must use bounded physical-row mutation.'
);

assert(
  source.includes(
    'verifyPoststate_('
  ),
  'Repair must perform post-write verification.'
);

assert(
  source.includes(
    'function normalizeDateForSheet_('
  ) &&
  source.includes(
    "'Source Updated At'"
  ) &&
  source.includes(
    "'Last Sale Date'"
  ) &&
  source.includes(
    'normalizeDateForSheet_('
  ),
  'Repair must normalize source dates before physical Sheets write.'
);

assert(
  source.includes(
    'Page-89 repair fingerprint encountered invalid Date cell.'
  ),
  'Repair fingerprint must fail explicitly on invalid Date values.'
);

assert(
  source.includes(
    'function comparePoststateCells_('
  ) &&
  source.includes(
    'differences.length < 8'
  ) &&
  source.includes(
    "'detail='"
  ),
  'Repair must expose bounded per-column poststate mismatch evidence.'
);

assert(
  source.includes(
    'var afterFingerprint ='
  ) &&
  source.includes(
    'var expectedFingerprint ='
  ) &&
  source.includes(
    'afterFingerprint !=='
  ),
  'Repair must retain the physical fingerprint acceptance gate.'
);


assert(
  source.includes(
    "writePhysicalRow_("
  ) &&
  source.includes(
    "before.values"
  ),
  'Repair must support exact prestate rollback.'
);

assert(
  source.includes(
    'automatic retry prohibited'
  ),
  'Ambiguous rollback failures must prohibit automatic retry.'
);

assert(
  source.includes(
    'automaticOfferAuthorityGranted:'
  ) &&
  source.includes(
    'false'
  ),
  'Repair must not grant offer authority.'
);

assert(
  source.includes(
    'repairAuthorityGranted:'
  ),
  'Repair result must not retain mutation authority.'
);

console.log(
  'Page-89 source observation 622060 repair static contract PASSED.'
);
