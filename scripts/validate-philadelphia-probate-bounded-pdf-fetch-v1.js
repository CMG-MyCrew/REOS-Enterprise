'use strict';

const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

const FILE =
  'build/apps-script-brand/PhiladelphiaProbateBoundedPdfFetch.js';

const source = fs.readFileSync(FILE, 'utf8');

const EXPECTED_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const EXPECTED_URL_SHA =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const MAX_BYTES = 26214400;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(bytes) {
  return crypto
    .createHash('sha256')
    .update(Buffer.from(bytes))
    .digest('hex');
}

function digestBytes(bytes) {
  return Array.from(
    crypto
      .createHash('sha256')
      .update(Buffer.from(bytes))
      .digest()
  ).map(value => value > 127 ? value - 256 : value);
}

function newBlob(value) {
  const buffer = Buffer.from(String(value), 'utf8');

  return {
    getBytes() {
      return Array.from(buffer);
    }
  };
}

function throwingSurface(name, counters) {
  return new Proxy({}, {
    get() {
      counters[name] =
        (counters[name] || 0) + 1;

      throw new Error(
        'Forbidden surface invoked: ' + name
      );
    }
  });
}

function makeRuntime(options = {}) {
  const counters = {};
  const fetches = [];

  const body =
    options.body !== undefined
      ? options.body
      : Buffer.from(
          '%PDF-1.7\nPB1 bounded offline fixture\n',
          'ascii'
        );

  const status =
    options.status !== undefined
      ? options.status
      : 200;

  const contentType =
    options.contentType !== undefined
      ? options.contentType
      : 'application/pdf';

  const response = {
    getResponseCode() {
      return status;
    },

    getAllHeaders() {
      if (contentType === null) {
        return {};
      }

      return {
        'Content-Type': contentType
      };
    },

    getBlob() {
      return {
        getBytes() {
          return Array.from(body);
        }
      };
    }
  };

  const context = {
    console,

    REOS: {},

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      computeDigest(algorithm, bytes) {
        assert(
          algorithm === 'SHA_256',
          'Unexpected digest algorithm'
        );

        return digestBytes(bytes);
      },

      newBlob
    },

    UrlFetchApp: {
      fetch(url, request) {
        fetches.push({
          url,
          request
        });

        if (options.fetchError) {
          throw new Error(options.fetchError);
        }

        return response;
      }
    },

    DriveApp: throwingSurface(
      'DriveApp',
      counters
    ),

    Drive: throwingSurface(
      'Drive',
      counters
    ),

    DocumentApp: throwingSurface(
      'DocumentApp',
      counters
    ),

    PropertiesService: throwingSurface(
      'PropertiesService',
      counters
    ),

    SpreadsheetApp: throwingSurface(
      'SpreadsheetApp',
      counters
    ),

    ScriptApp: throwingSurface(
      'ScriptApp',
      counters
    ),

    LockService: throwingSurface(
      'LockService',
      counters
    )
  };

  vm.createContext(context);
  vm.runInContext(source, context, {
    filename: FILE
  });

  return {
    context,
    counters,
    fetches,
    body
  };
}

function expectFailure(name, options, expectedText) {
  const runtime = makeRuntime(options);

  let failed = false;

  try {
    runtime.context
      .reosPhiladelphiaProbateBoundedPdfFetch();
  } catch (error) {
    failed = true;

    assert(
      String(error.message).includes(expectedText),
      name +
        ': unexpected error: ' +
        error.message
    );
  }

  assert(failed, name + ': expected failure');

  assert(
    runtime.fetches.length <= 1,
    name + ': more than one HTTP fetch attempted'
  );

  assert(
    Object.keys(runtime.counters).length === 0,
    name + ': forbidden service invoked'
  );

  return runtime.fetches.length;
}

assert(
  !source.includes('Drive.Files'),
  'Implementation contains Drive.Files surface'
);

assert(
  !source.includes('DocumentApp.'),
  'Implementation contains DocumentApp surface'
);

assert(
  !source.includes('DriveApp.'),
  'Implementation contains DriveApp surface'
);

assert(
  !source.includes('PropertiesService.'),
  'Implementation contains PropertiesService surface'
);

assert(
  !source.includes('SpreadsheetApp.'),
  'Implementation contains SpreadsheetApp surface'
);

assert(
  !source.includes('ScriptApp.'),
  'Implementation contains ScriptApp surface'
);

assert(
  !source.includes('LockService.'),
  'Implementation contains LockService surface'
);

assert(
  !source.includes('registerConnectors'),
  'Implementation contains connector-registration surface'
);

assert(
  !source.includes('probateSourcePreflight_'),
  'Implementation contains broad probate preflight surface'
);

assert(
  !source.includes('probateSourceAuthority'),
  'Implementation contains probate source authority surface'
);

assert(
  !source.includes(
    'PhiladelphiaProbateRecurringSource.resolve'
  ),
  'Implementation contains source resolver surface'
);

assert(
  !source.includes('PAPhiladelphiaCountyConnector'),
  'Implementation contains Philadelphia connector surface'
);

const success = makeRuntime();

const result =
  success.context
    .reosPhiladelphiaProbateBoundedPdfFetch();

assert(result.ok === true, 'Success result not ok');
assert(result.fetchVersion === 1, 'Wrong fetchVersion');

assert(
  result.publicationDate === '2026-09-30',
  'Wrong publicationDate'
);

assert(
  result.sourceUrl === EXPECTED_URL,
  'Wrong sourceUrl'
);

assert(
  result.sourceUrlSha256 === EXPECTED_URL_SHA,
  'Wrong sourceUrlSha256'
);

assert(
  result.sourceHost === 'assets.alm.com',
  'Wrong sourceHost'
);

assert(
  result.sourceBasename === 'tlipn093026.pdf',
  'Wrong sourceBasename'
);

assert(
  result.maxResponseBytes === MAX_BYTES,
  'Wrong maxResponseBytes'
);

assert(
  result.responseSizeLimitIsPostFetch === true,
  'Post-fetch size-limit disclosure missing'
);

assert(
  success.fetches.length === 1,
  'Success did not execute exactly one fetch'
);

assert(
  success.fetches[0].url === EXPECTED_URL,
  'Fetch URL mismatch'
);

assert(
  success.fetches[0].request.method === 'get',
  'Fetch method mismatch'
);

assert(
  success.fetches[0].request.followRedirects === true,
  'followRedirects mismatch'
);

assert(
  success.fetches[0].request.muteHttpExceptions === true,
  'muteHttpExceptions mismatch'
);

assert(
  success.fetches[0].request.headers.Accept ===
    'application/pdf',
  'Accept header mismatch'
);

assert(
  result.httpFetchExecuted === true,
  'httpFetchExecuted mismatch'
);

assert(
  result.httpFetchCount === 1,
  'httpFetchCount mismatch'
);

assert(
  result.httpStatus === 200,
  'httpStatus mismatch'
);

assert(
  result.contentType === 'application/pdf',
  'contentType mismatch'
);

assert(
  result.contentLength === success.body.length,
  'contentLength mismatch'
);

assert(
  result.pdfSignatureValid === true,
  'pdfSignatureValid mismatch'
);

assert(
  result.pdfContentSha256 ===
    sha256(success.body),
  'PDF content SHA mismatch'
);

assert(
  result.pdfBytesReturned === false,
  'PDF bytes return authority mismatch'
);

[
  'driveOcrExecuted',
  'documentAppExecuted',
  'connectorFetchExecuted',
  'connectorRegistrationExecuted',
  'sourceDiscoveryExecuted',
  'persistenceExecuted',
  'configurationExecuted',
  'schedulerMutationExecuted',
  'triggerMutationExecuted',
  'checkpointMutationExecuted',
  'countyDataMutationExecuted',
  'arvAuthorityGranted',
  'repairScopeAuthorityGranted',
  'maoAuthorityGranted',
  'offerAuthorityGranted'
].forEach(key => {
  assert(
    result[key] === false,
    key + ' must be false'
  );
});

assert(
  Object.keys(success.counters).length === 0,
  'Forbidden service invoked during success'
);

const failCases = [
  [
    'http-404',
    { status: 404 },
    'HTTP status 404',
    1
  ],
  [
    'http-500',
    { status: 500 },
    'HTTP status 500',
    1
  ],
  [
    'empty-body',
    { body: Buffer.alloc(0) },
    'empty response body',
    1
  ],
  [
    'invalid-signature',
    { body: Buffer.from('NOT-PDF', 'ascii') },
    'invalid PDF signature',
    1
  ],
  [
    'wrong-content-type',
    {
      contentType: 'text/html',
      body: Buffer.from('%PDF-test', 'ascii')
    },
    'non-PDF Content-Type',
    1
  ],
  [
    'fetch-error',
    { fetchError: 'offline transport failure' },
    'offline transport failure',
    1
  ]
];

let failClosedCount = 0;

for (const [
  name,
  options,
  message,
  expectedFetches
] of failCases) {
  const count =
    expectFailure(name, options, message);

  assert(
    count === expectedFetches,
    name + ': unexpected fetch count'
  );

  failClosedCount += 1;
}

// Missing Content-Type is permitted only when the PDF
// signature and all other transport checks pass.
const noContentType = makeRuntime({
  contentType: null
});

const noContentTypeResult =
  noContentType.context
    .reosPhiladelphiaProbateBoundedPdfFetch();

assert(
  noContentType.fetches.length === 1,
  'Missing Content-Type case fetch count mismatch'
);

assert(
  noContentTypeResult.ok === true,
  'Missing Content-Type should be accepted with PDF signature'
);

assert(
  noContentTypeResult.contentType === '',
  'Missing Content-Type result mismatch'
);

// Exercise the 25 MiB post-response limit with a tiny
// synthetic object rather than allocating >25 MiB.
// getBytes() returns an array-like object whose length
// exceeds the bound; execution must reject it before
// signature/hash processing.
{
  const runtime = makeRuntime();

  runtime.context.UrlFetchApp.fetch =
    function (url, request) {
      runtime.fetches.push({ url, request });

      return {
        getResponseCode() {
          return 200;
        },

        getAllHeaders() {
          return {
            'Content-Type': 'application/pdf'
          };
        },

        getBlob() {
          return {
            getBytes() {
              return {
                length: MAX_BYTES + 1
              };
            }
          };
        }
      };
    };

  let failed = false;

  try {
    runtime.context
      .reosPhiladelphiaProbateBoundedPdfFetch();
  } catch (error) {
    failed = true;

    assert(
      String(error.message).includes(
        'response exceeds maximum byte count'
      ),
      'Oversize case wrong error: ' +
        error.message
    );
  }

  assert(failed, 'Oversize case did not fail');
  assert(
    runtime.fetches.length === 1,
    'Oversize case executed wrong fetch count'
  );

  failClosedCount += 1;
}

assert(
  crypto
    .createHash('sha256')
    .update(EXPECTED_URL, 'utf8')
    .digest('hex') === EXPECTED_URL_SHA,
  'Certified URL SHA fixture mismatch'
);

console.log(
  'PB1_BOUNDED_PDF_FETCH_BEHAVIOR_VALIDATOR_PASSED=true'
);
console.log(
  'SUCCESS_FETCH_INVOCATION_COUNT_EXACT=1'
);
console.log(
  'FAIL_CLOSED_CASES_PASSED=' +
    failClosedCount
);
console.log(
  'MAX_RESPONSE_BYTES=' + MAX_BYTES
);
console.log(
  'SIZE_LIMIT_IS_POST_RESPONSE_VALIDATION=true'
);
console.log(
  'HTTP_RETRY_EXECUTED=false'
);
console.log(
  'FALLBACK_SOURCE_EXECUTED=false'
);
console.log(
  'SOURCE_DISCOVERY_EXECUTED=false'
);
console.log(
  'PDF_BYTES_RETURNED=false'
);
console.log(
  'DRIVE_OCR_EXECUTED=false'
);
console.log(
  'DOCUMENT_APP_EXECUTED=false'
);
console.log(
  'CONNECTOR_FETCH_EXECUTED=false'
);
console.log(
  'CONNECTOR_REGISTRATION_EXECUTED=false'
);
console.log(
  'PERSISTENCE_EXECUTED=false'
);
console.log(
  'CONFIGURATION_EXECUTED=false'
);
console.log(
  'SCHEDULER_MUTATION_EXECUTED=false'
);
console.log(
  'TRIGGER_MUTATION_EXECUTED=false'
);
console.log(
  'CHECKPOINT_MUTATION_EXECUTED=false'
);
console.log(
  'COUNTY_DATA_MUTATION_EXECUTED=false'
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
  'PRODUCTION_HTTP_EXECUTED=false'
);
