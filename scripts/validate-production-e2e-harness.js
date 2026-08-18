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
  'ingestion certification does not invoke global ingestion orchestrator',
  !/REOS\.AcquisitionIngestionOrchestrator,\s*'run'/.test(source)
);

check(
  'ingestion certification does not invoke global dedup scan',
  !/REOS\.LeadDeduplication,\s*'scanSheet'/.test(source)
);

check(
  'ingestion normalization remains single-record bounded',
  /REOS\.LeadNormalization,\s*'normalize'/.test(source)
);

check(
  'controlled deduplication uses only bounded candidate comparison',
  /REOS\.LeadDeduplication,\s*'findBest'/.test(source) &&
    source.includes('findControlledIaRows_')
);

check(
  'bounded IA persistence is idempotent by External ID',
  source.includes(
    'persistControlledIntelligentAcquisitionLead_'
  ) &&
    source.includes("'IA_LEADS'") &&
    source.includes("'External ID'")
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
  'offer certification does not invoke bulk generateDrafts',
  !/REOS\.AcquisitionOfferAutomation,\s*'generateDrafts'/.test(source)
);

check(
  'offer review certification does not invoke bulk generateQueue',
  !/REOS\.OfferReviewWorkflow,\s*'generateQueue'/.test(source)
);

check(
  'offer publication certification does not invoke bulk publishApproved',
  !/REOS\.OfferReviewWorkflow,\s*'publishApproved'/.test(source)
);

check(
  'execution certification does not invoke global buildQueue',
  !/REOS\.OfferExecutionWorkflow,\s*'buildQueue'/.test(source)
);

check(
  'controlled offer queue persistence exists',
  source.includes('persistControlledOfferQueue_')
);

check(
  'controlled offer review persistence exists',
  source.includes('persistControlledOfferReview_')
);

check(
  'controlled offer publication persistence exists',
  source.includes('persistControlledPublishedOffer_')
);

check(
  'execution isolation uses qualified-deal authority validator',
  /REOS\.QualifiedDealQueue,\s*'validateAuthority'/.test(source)
);

check(
  'controlled review approval remains record-bounded',
  /REOS\.OfferReviewWorkflow,\s*'approve'/.test(source)
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
