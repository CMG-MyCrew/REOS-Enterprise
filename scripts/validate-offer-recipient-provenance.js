#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(
  __dirname,
  '../build/apps-script-brand'
);

function read(name) {
  return fs.readFileSync(
    path.join(ROOT, name),
    'utf8'
  );
}

function pass(message) {
  console.log('PASS:', message);
}

const dealAnalyzer =
  read('DealAnalyzer.js');

assert(
  /['"]Lead ID['"]/.test(
    dealAnalyzer
  ) &&
  /['"]Seller Email['"]/.test(
    dealAnalyzer
  ),
  'DEALS schema must carry Lead ID and Seller Email.'
);

assert(
  /['"]Lead ID['"]\s*:\s*input\.leadId/.test(
    dealAnalyzer
  ) &&
  /input\.sellerEmail/.test(
    dealAnalyzer
  ),
  'DealAnalyzer.createDeal must persist recipient provenance.'
);

pass(
  'DEALS carries canonical lead and seller-email provenance'
);

const distress =
  read('DistressReportImporter.js');

assert(
  /['"]Owner Email['"]/.test(
    distress
  ),
  'DISTRESS_LEADS importer schema must preserve Owner Email when supplied.'
);

assert(
  /leadId\s*:\s*lead\[['"]Distress Lead ID['"]\]/.test(
    distress
  ) &&
  /sellerEmail\s*:\s*lead\[['"]Owner Email['"]\]/.test(
    distress
  ),
  'Distress promotion must preserve exact lead/contact provenance.'
);

pass(
  'distress promotion preserves exact recipient provenance'
);

const intelligent =
  read('IntelligentAcquisitionPlatform.js');

assert(
  /['"]Owner Email['"]/.test(
    intelligent
  ),
  'IA_LEADS must carry Owner Email.'
);

assert(
  /['"]Lead ID['"]\s*:\s*lead\[['"]Lead ID['"]\]/.test(
    intelligent
  ) &&
  /['"]Seller Email['"]/.test(
    intelligent
  ),
  'Intelligent Acquisition promotion must preserve exact lead and seller email.'
);

pass(
  'Intelligent Acquisition no longer drops owner email'
);

const dealIntelligence =
  read('DealIntelligenceDashboard.js');

assert(
  /safeAll_\(['"]DISTRESS_LEADS['"]\)/.test(
    dealIntelligence
  ) &&
  /lead\[['"]Distress Lead ID['"]\][\s\S]{0,180}row\[['"]Distress Lead ID['"]\]/.test(
    dealIntelligence
  ),
  'Deal Intelligence must resolve source contact using exact Distress Lead ID.'
);

assert(
  /['"]Lead ID['"]\s*:[\s\S]{0,120}row\[['"]Distress Lead ID['"]\]/.test(
    dealIntelligence
  ) &&
  /sourceLead\[['"]Owner Email['"]\]/.test(
    dealIntelligence
  ),
  'Deal Intelligence promotion must persist exact source recipient provenance.'
);

pass(
  'Deal Intelligence uses exact lead-ID provenance rather than address matching'
);

const dealLogic =
  read('DealLogicVersioning.js');

assert(
  /findById\([\s\S]{0,100}['"]DEALS['"][\s\S]{0,100}['"]Deal ID['"]/.test(
    dealLogic
  ),
  'Canonical Deal Logic must resolve the persisted DEALS row.'
);

assert(
  /['"]Lead ID['"]\s*:\s*deal\[['"]Lead ID['"]\]/.test(
    dealLogic
  ),
  'Canonical qualified offer must inherit Deal Lead ID.'
);

pass(
  'canonical qualified OFFERS preserve Lead ID'
);

const execution =
  read('OfferExecutionWorkflow.js');

assert(
  /offer\[['"]Lead ID['"]\][\s\S]{0,100}deal\[['"]Lead ID['"]\]/.test(
    execution
  ),
  'Execution queue must retain Lead ID from offer or canonical deal.'
);

assert(
  /['"]Recipient Email['"]\s*:\s*deal\[['"]Seller Email['"]\]/.test(
    execution
  ),
  'Execution Recipient Email must originate from DEALS.Seller Email.'
);

pass(
  'execution recipient originates from canonical DEALS provenance'
);

const evidence =
  read('OfferDeliveryEvidence.js');

assert(
  /persistedRecipientEmail/.test(
    evidence
  ) &&
  /requestedRecipientEmail/.test(
    evidence
  ) &&
  /Email recipient override is not allowed/.test(
    evidence
  ),
  'Email delivery must reject a caller-provided alternate recipient.'
);

assert(
  /var\s+recipientEmail\s*=[\s\S]{0,180}method\s*===\s*['"]Email['"][\s\S]{0,100}\?[\s\S]{0,80}persistedRecipientEmail/.test(
    evidence
  ),
  'Email delivery must select the persisted execution Recipient Email.'
);

assert(
  /requestedRecipientEmail[\s\S]{0,180}requestedRecipientEmail\s*!==[\s\S]{0,100}persistedRecipientEmail[\s\S]{0,300}Email recipient override is not allowed/.test(
    evidence
  ),
  'An alternate caller-provided Email recipient must fail closed.'
);

pass(
  'controlled Email delivery rejects recipient substitution'
);

console.log();
console.log(
  'Offer Recipient Provenance contract validation PASSED.'
);
