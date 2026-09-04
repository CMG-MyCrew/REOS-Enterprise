#!/usr/bin/env node

const fs = require('fs');

const file =
  'build/apps-script-brand/CountyArcGisPageRecordDiagnostic.js';

const src = fs.readFileSync(file, 'utf8');

function requireText(text, message) {
  if (!src.includes(text)) {
    throw new Error(message);
  }
}

requireText(
  'ARCGIS_PAGE_RECORD_DIAGNOSTIC',
  'Missing read-only diagnostic mode.'
);

requireText(
  'reosCountyArcGisPageRecordDiagnostic',
  'Missing exported RPC.'
);

requireText(
  "trigger.getHandlerFunction() ===\n            'reosCountyProductionSchedulerRun'",
  'Missing scheduler quiescence guard.'
);

requireText(
  'productionDataMutationAuthorityGranted:\n        false',
  'Production-data mutation authority must remain false.'
);

requireText(
  'checkpointMutationAuthorityGranted:\n        false',
  'Checkpoint mutation authority must remain false.'
);

requireText(
  'schedulerAuthorityGranted:\n        false',
  'Scheduler authority must remain false.'
);

requireText(
  'repairAuthorityGranted:\n        false',
  'Repair authority must remain false.'
);

requireText(
  'automaticOfferAuthorityGranted:\n        false',
  'Automatic offer authority must remain false.'
);

if (
  /REOS\.Database\.(insert|update|upsert)\s*\(/.test(src)
) {
  throw new Error(
    'Diagnostic must not mutate Database records.'
  );
}

if (
  /newTrigger\s*\(|deleteTrigger\s*\(/.test(src)
) {
  throw new Error(
    'Diagnostic must not mutate scheduler triggers.'
  );
}

console.log(
  'PASS: County ArcGIS page-record diagnostic contract validated.'
);
