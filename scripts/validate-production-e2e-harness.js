#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const file = path.join(
  process.cwd(),
  'build/apps-script-brand/LivePipelineVerification.js'
);

if (!fs.existsSync(file)) {
  console.error(
    'ERROR: LivePipelineVerification.js is missing.'
  );
  process.exit(1);
}

const source = fs.readFileSync(file, 'utf8');

let failed = false;

function check(label, condition) {
  console.log(
    `${condition ? 'PASS' : 'FAIL'}: ${label}`
  );

  if (!condition) failed = true;
}

console.log(
  '=== PRODUCTION E2E HARNESS SAFETY CERTIFICATION ==='
);
console.log();

check(
  'legacy 742 Walnut test identity removed',
  !source.includes('742 Walnut Street')
);

check(
  'production certification marker is version-qualified',
  /REOS-PROD-E2E-CERT-V\d+/.test(source)
);

check(
  'synthetic certification address is version-qualified',
  /REOS E2E CERTIFICATION V\d+/.test(source)
);

check(
  'legacy Lead Source receives certification marker',
  source.includes("'Lead Source': MARKER")
);

check(
  'county Source receives certification marker',
  source.includes('Source: MARKER')
);

check(
  'test lookup accepts legacy Lead Source marker',
  source.includes("row['Lead Source']")
);

check(
  'ingestion disables connector execution',
  source.includes('runConnectors: false')
);

check(
  'acquisition intelligence certification is single-lead bounded',
  /REOS\.AcquisitionIntelligence,\s*'analyzeLead'/.test(source) &&
    !/REOS\.AcquisitionIntelligence,\s*'analyzeAll'/.test(source)
);

check(
  'deal intelligence certification is single-lead bounded',
  /REOS\.AcquisitionDealIntelligence,\s*'analyzeLead'/.test(source) &&
    !/REOS\.AcquisitionDealIntelligence,\s*'analyzeAll'/.test(source)
);

check(
  'bounded acquisition persistence is idempotent by Lead ID',
  source.includes('persistControlledAcquisitionDecision_') &&
    source.includes("'AI_ACQUISITION_DECISIONS'") &&
    source.includes("'Lead ID'")
);

check(
  'bounded deal persistence is idempotent by Distress Lead ID',
  source.includes('persistControlledDealIntelligence_') &&
    source.includes("'AI_DEAL_INTELLIGENCE'") &&
    source.includes("'Distress Lead ID'")
);

check(
  'live verifier does not call OfferDeliveryTransport',
  !source.includes('OfferDeliveryTransport')
);

check(
  'live verifier does not call GmailApp',
  !source.includes('GmailApp.')
);

check(
  'live verifier does not call MailApp',
  !source.includes('MailApp.')
);

check(
  'live verifier verifies execution authority isolation',
  source.includes('Execution authority isolation')
);

if (failed) {
  console.error();
  console.error(
    'Production E2E harness safety certification FAILED.'
  );
  process.exit(1);
}

console.log();
console.log(
  'Production E2E harness safety certification PASSED.'
);
