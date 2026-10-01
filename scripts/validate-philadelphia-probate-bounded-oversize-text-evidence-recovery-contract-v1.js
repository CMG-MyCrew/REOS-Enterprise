'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT =
  path.resolve(__dirname, '..');

const CONTRACT =
  path.join(
    ROOT,
    'docs',
    'philadelphia-probate-bounded-oversize-text-evidence-recovery-contract-v1.md'
  );

const EXTRACTOR =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PhiladelphiaProbateBoundedTextExtraction.js'
  );

const ORCHESTRATION =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PhiladelphiaProbateProductionExtractionOrchestration.js'
  );

assert(
  fs.existsSync(CONTRACT),
  'Oversize evidence recovery contract missing.'
);

assert(
  fs.existsSync(EXTRACTOR),
  'Current bounded extractor missing.'
);

assert(
  fs.existsSync(ORCHESTRATION),
  'Current production extraction orchestration missing.'
);

const text =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

const extractor =
  fs.readFileSync(
    EXTRACTOR,
    'utf8'
  );

const orchestration =
  fs.readFileSync(
    ORCHESTRATION,
    'utf8'
  );

const required = [
  'Bounded Oversize Text Evidence Recovery Contract v1',
  'Design contract only.',
  'does not authorize production execution',
  'does not raise the current normal extraction acceptance limit',
  '`250000`',
  '`4220387`',
  '`26214400`',
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028',
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca',
  'PhiladelphiaProbateBoundedOversizeTextEvidence.js',
  'REOS.PhiladelphiaProbateBoundedOversizeTextEvidence',
  '`inspect(blob)`',
  'PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js',
  '`reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery()`',
  'exactly one `UrlFetchApp.fetch` call site',
  'zero retries',
  '`followRedirects: false`',
  'same Blob',
  'one `Drive.Files.create` OCR conversion',
  'one `DocumentApp.openById`',
  'one body-text read',
  'actual `text.length`',
  'SHA-256 of the complete extracted text',
  '`observedTextCharacterCount > 250000`',
  '`acceptedForNormalExtraction: false`',
  '`exceedsCurrentNormalExtractionLimit: true`',
  '`fullExtractedTextReturned: false`',
  '`pdfBytesReturned: false`',
  'MUST NOT call:',
  '`reosPhiladelphiaProbateProductionExtractionOrchestration()`',
  '`REOS.PhiladelphiaProbateBoundedTextExtraction.extract()`',
  'No new normal extraction text limit is established',
  'cleanup MUST be attempted on every path',
  'no probate parsing authority',
  'no persistence authority',
  'ARV authority',
  'repair-scope authority',
  'MAO authority',
  'offer-generation authority',
  'historical reconciliation at',
  '`147`',
  'exactly one production oversize-evidence recovery RPC',
  'authorizes zero production HTTP requests and zero OCR'
];

for (const value of required) {
  assert(
    text.includes(value),
    'Missing recovery-contract requirement: ' +
      JSON.stringify(value)
  );
}

assert(
  /The recovery MUST NOT:\s*(?:\n\s*)?- search Drive for the temporary artifact created by the failed attempt;/.test(
    text
  ),
  'Prior temporary-artifact Drive-search prohibition missing.'
);


assert(
  /Cleanup failure MUST fail closed\./.test(
    text
  ),
  'Cleanup fail-closed requirement missing.'
);

assert(
  extractor.includes(
    'MAX_TEXT_CHARS'
  ),
  'Current extractor text bound missing.'
);

assert(
  extractor.includes(
    '250000'
  ),
  'Current extractor 250000 limit missing.'
);

assert(
  extractor.includes(
    'Bounded probate text extraction exceeded maximum text length.'
  ),
  'Current oversize failure message missing.'
);

assert(
  orchestration.includes(
    'PhiladelphiaProbateBoundedTextExtraction'
  ),
  'Current orchestration normal extractor reference missing.'
);

assert(
  orchestration.includes(
    '.extract('
  ),
  'Current orchestration normal extractor invocation missing.'
);

assert(
  text.includes(
    'The previous production orchestration MUST NOT be rerun merely to discover the'
  ),
  'Prior production orchestration rerun prohibition missing.'
);

assert(
  text.includes(
    'Choosing a larger acceptance limit before measuring the real count would be'
  ),
  'Unsupported larger-limit prohibition missing.'
);

console.log(
  'PB1_BOUNDED_OVERSIZE_TEXT_EVIDENCE_RECOVERY_CONTRACT_VALIDATOR_PASSED=true'
);

console.log(
  'CURRENT_NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT_CHANGE_AUTHORIZED=false'
);

console.log(
  'FUTURE_BLOB_EVIDENCE_COMPONENT=PhiladelphiaProbateBoundedOversizeTextEvidence'
);

console.log(
  'FUTURE_RECOVERY_RPC=reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery'
);

console.log(
  'FUTURE_RECOVERY_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'FUTURE_HTTP_FETCH_MAX=1'
);

console.log(
  'FUTURE_OCR_CREATE_MAX=1'
);

console.log(
  'FUTURE_DOCUMENT_OPEN_MAX=1'
);

console.log(
  'FULL_TEXT_RETURN_AUTHORIZED=false'
);

console.log(
  'TEXT_PREVIEW_RETURN_AUTHORIZED=false'
);

console.log(
  'PDF_BYTES_RETURN_AUTHORIZED=false'
);

console.log(
  'PRIOR_TEMP_ARTIFACT_RECOVERY_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_AUTHORIZED=false'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);

console.log(
  'PRODUCTION_HTTP_AUTHORIZED_BY_DESIGN=false'
);

console.log(
  'PRODUCTION_OCR_AUTHORIZED_BY_DESIGN=false'
);
