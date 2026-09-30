'use strict';

const fs = require('fs');
const crypto = require('crypto');

const FILE =
  'docs/philadelphia-probate-bounded-pdf-fetch-contract-v1.md';

const text = fs.readFileSync(FILE, 'utf8');

function requireText(value) {
  if (!text.includes(value)) {
    throw new Error(
      'Missing required contract text: ' +
      JSON.stringify(value)
    );
  }
}

[
  '# Philadelphia Probate PB1 — Single Bounded PDF Fetch Contract v1',

  'Design contract only.',
  'This contract does not authorize production execution.',

  '`2026-09-30`',
  '`https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf`',
  '`98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca`',
  '`tlipn093026.pdf`',

  '`reosPhiladelphiaProbateBoundedPdfFetch()`',

  'Maximum `UrlFetchApp.fetch` invocation count:',
  '`1`',
  'No retry is authorized.',
  'No fallback URL is authorized.',
  'No secondary source is authorized.',
  'No article discovery is authorized.',
  'No recurring-source resolver invocation is authorized.',
  '- `followRedirects: false`;',
  'Redirect following is prohibited.',
  'Any HTTP 3xx response must fail closed.',
  'A redirect response must not cause a retry, redirected request,',
  'fallback request, or secondary-source request.',

  'HTTP status in the 2xx range.',
  'PDF magic bytes beginning with `%PDF-`.',
  'SHA-256 computed over the exact returned PDF bytes.',

  '`httpFetchExecuted: true`',
  '`httpFetchCount: 1`',
  '`pdfSignatureValid: true`',
  '`pdfContentSha256`',
  '`pdfBytesReturned: false`',

  '`driveOcrExecuted: false`',
  '`documentAppExecuted: false`',
  '`connectorFetchExecuted: false`',
  '`connectorRegistrationExecuted: false`',
  '`sourceDiscoveryExecuted: false`',
  '`persistenceExecuted: false`',
  '`configurationExecuted: false`',
  '`schedulerMutationExecuted: false`',
  '`triggerMutationExecuted: false`',
  '`checkpointMutationExecuted: false`',
  '`countyDataMutationExecuted: false`',

  '`arvAuthorityGranted: false`',
  '`repairScopeAuthorityGranted: false`',
  '`maoAuthorityGranted: false`',
  '`offerAuthorityGranted: false`',

  '`DriveApp`',
  '`Drive.Files`',
  '`DocumentApp`',
  '`PropertiesService`',
  '`SpreadsheetApp`',
  '`ScriptApp`',
  '`LockService`',
  '`CountyRuntimeBridge.registerConnectors`',
  '`PAPhiladelphiaCountyConnector.fetch_`',
  '`probateSourceAuthority`',
  '`probateSourcePreflight_`',
  '`PhiladelphiaProbateRecurringSource.resolve`',

  'It grants no OCR authority.',
  'It grants no parsing authority.',
  'It grants no persistence authority.',
  'It grants no acquisition authority.',

  'This design contract itself grants no production PDF-fetch authority.'
].forEach(requireText);

const source =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const expectedSha =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const actualSha = crypto
  .createHash('sha256')
  .update(source, 'utf8')
  .digest('hex');

if (actualSha !== expectedSha) {
  throw new Error(
    'Certified source URL SHA mismatch: ' +
    actualSha
  );
}

const url = new URL(source);

if (url.protocol !== 'https:') {
  throw new Error('Certified source is not HTTPS');
}

if (![
  'assets.alm.com',
  'images.law.com'
].includes(url.hostname)) {
  throw new Error(
    'Certified source host is not approved: ' +
    url.hostname
  );
}

const basename =
  url.pathname.split('/').pop().toLowerCase();

if (basename !== 'tlipn093026.pdf') {
  throw new Error(
    'Certified source basename mismatch: ' +
    basename
  );
}

console.log(
  'PB1_BOUNDED_PDF_FETCH_CONTRACT_VALIDATOR_PASSED=true'
);
console.log(
  'CERTIFIED_SOURCE_URL_SHA_EXACT=true'
);
console.log(
  'CERTIFIED_SOURCE_HOST_APPROVED=true'
);
console.log(
  'CERTIFIED_SOURCE_BASENAME_EXACT=true'
);
console.log(
  'MAX_HTTP_FETCH_INVOCATIONS_CONTRACT=1'
);
console.log(
  'FOLLOW_REDIRECTS_CONTRACT=false'
);
console.log(
  'HTTP_3XX_FAIL_CLOSED_CONTRACT=true'
);
console.log(
  'REDIRECT_SECONDARY_REQUEST_AUTHORIZED=false'
);
console.log(
  'HTTP_RETRY_AUTHORIZED=false'
);
console.log(
  'FALLBACK_SOURCE_AUTHORIZED=false'
);
console.log(
  'SOURCE_DISCOVERY_AUTHORIZED=false'
);
console.log(
  'PDF_BYTES_RETURN_AUTHORIZED=false'
);
console.log(
  'DRIVE_OCR_AUTHORIZED=false'
);
console.log(
  'DOCUMENT_APP_AUTHORIZED=false'
);
console.log(
  'CONNECTOR_FETCH_AUTHORIZED=false'
);
console.log(
  'CONNECTOR_REGISTRATION_AUTHORIZED=false'
);
console.log(
  'PERSISTENCE_AUTHORIZED=false'
);
console.log(
  'CONFIGURATION_MUTATION_AUTHORIZED=false'
);
console.log(
  'SCHEDULER_MUTATION_AUTHORIZED=false'
);
console.log(
  'TRIGGER_MUTATION_AUTHORIZED=false'
);
console.log(
  'CHECKPOINT_MUTATION_AUTHORIZED=false'
);
console.log(
  'COUNTY_DATA_MUTATION_AUTHORIZED=false'
);
console.log(
  'ARV_AUTHORITY_GRANTED=false'
);
console.log(
  'REPAIR_SCOPE_AUTHORITY_GRANTED=false'
);
console.log(
  'MAO_AUTHORITY_GRANTED=false'
);
console.log(
  'OFFER_AUTHORITY_GRANTED=false'
);
console.log(
  'PRODUCTION_PDF_FETCH_AUTHORIZED_BY_CONTRACT=false'
);
