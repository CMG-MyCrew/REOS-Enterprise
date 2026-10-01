'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const IMPLEMENTATION =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PhiladelphiaProbateProductionExtractionOrchestration.js'
  );

const source =
  fs.readFileSync(
    IMPLEMENTATION,
    'utf8'
  );

const SOURCE_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const SOURCE_URL_SHA256 =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const EXPECTED_BYTES =
  4220387;

const MAX_BYTES =
  26214400;

const PDF_SHA =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const MAX_TEXT_CHARS =
  250000;

function count(
  pattern
) {
  return (
    source.match(
      pattern
    ) || []
  ).length;
}

/*
 * STATIC AUTHORITY CHECKS
 */

assert.strictEqual(
  count(
    /UrlFetchApp\.fetch\s*\(/g
  ),
  1,
  'Expected exactly one executable UrlFetchApp.fetch call site.'
);

assert.strictEqual(
  count(
    /\.PhiladelphiaProbateBoundedTextExtraction\s*\.extract\s*\(/g
  ),
  1,
  'Expected exactly one bounded extractor invocation call site.'
);

assert(
  source.includes(
    'followRedirects: false'
  ),
  'followRedirects:false missing.'
);

assert(
  source.includes(
    "method: 'get'"
  ),
  'GET method missing.'
);

assert(
  source.includes(
    'EXPECTED_PDF_BYTES =\n    4220387'
  ),
  'Exact PDF byte-length constant missing.'
);

assert(
  source.includes(
    PDF_SHA
  ),
  'Pinned PDF content SHA missing.'
);

assert(
  source.includes(
    'MAX_PDF_BYTES =\n    26214400'
  ),
  'Maximum PDF size missing.'
);

assert(
  source.includes(
    'MAX_TEXT_CHARS =\n    250000'
  ),
  'Maximum text length missing.'
);

const prohibited = [
  'reosPhiladelphiaProbateBoundedPdfFetch',
  'PhiladelphiaProbateBoundedPdfFetch.execute',
  'reosPhiladelphiaProbateBoundedSourceDiscovery',
  'PhiladelphiaProbateRecurringSource.resolve',
  'PAPhiladelphiaCountyConnector.fetch_',
  'probateSourcePreflight_',
  'probateSourceAuthority',
  'CountyRuntimeBridge.registerConnectors',
  'Drive.Files.create',
  'DocumentApp.openById',
  'DriveApp.getFileById',
  'PropertiesService',
  'SpreadsheetApp'
];

for (
  const value
  of prohibited
) {
  assert(
    !source.includes(value),
    'Prohibited orchestration surface present: ' +
      value
  );
}

assert(
  source.includes(
    'global.REOS'
  ),
  'REOS extractor delegation missing.'
);

assert(
  source.includes(
    'reosPhiladelphiaProbateProductionExtractionOrchestration'
  ),
  'Production orchestration RPC surface missing.'
);

function hexToSignedBytes(
  hex
) {
  const out = [];

  for (
    let i = 0;
    i < hex.length;
    i += 2
  ) {
    let value =
      parseInt(
        hex.slice(
          i,
          i + 2
        ),
        16
      );

    if (
      value >
      127
    ) {
      value -= 256;
    }

    out.push(
      value
    );
  }

  return out;
}

function hashHex(
  value
) {
  return crypto
    .createHash('sha256')
    .update(
      value,
      'utf8'
    )
    .digest('hex');
}

function makeBytes(
  length,
  validSignature = true
) {
  const bytes =
    new Uint8Array(
      length
    );

  if (
    length >= 5
  ) {
    if (
      validSignature
    ) {
      bytes[0] = 0x25;
      bytes[1] = 0x50;
      bytes[2] = 0x44;
      bytes[3] = 0x46;
      bytes[4] = 0x2d;
    } else {
      bytes[0] = 0x00;
      bytes[1] = 0x50;
      bytes[2] = 0x44;
      bytes[3] = 0x46;
      bytes[4] = 0x2d;
    }
  }

  return bytes;
}

function defaultExtractionResult() {
  return {
    ok: true,
    extractionVersion: 1,

    pdfContentSha256:
      PDF_SHA,

    pdfByteLength:
      EXPECTED_BYTES,

    maxPdfBytes:
      MAX_BYTES,

    extractedTextCharacterCount:
      12345,

    maxExtractedTextCharacters:
      MAX_TEXT_CHARS,

    extractedTextSha256:
      'a'.repeat(64),

    temporaryArtifactCreated:
      true,

    temporaryArtifactCleanupAttempted:
      true,

    temporaryArtifactCleanupConfirmed:
      true,

    driveCreateCount:
      1,

    documentOpenCount:
      1,

    fullExtractedTextReturned:
      false,

    pdfBytesReturned:
      false,

    sourceDiscoveryExecuted:
      false,

    httpFetchExecuted:
      false,

    connectorFetchExecuted:
      false,

    connectorRegistrationExecuted:
      false,

    probateParsingExecuted:
      false,

    leadCreationExecuted:
      false,

    persistenceExecuted:
      false,

    configurationExecuted:
      false,

    schedulerMutationExecuted:
      false,

    triggerMutationExecuted:
      false,

    checkpointMutationExecuted:
      false,

    countyDataMutationExecuted:
      false,

    arvAuthorityGranted:
      false,

    repairScopeAuthorityGranted:
      false,

    maoAuthorityGranted:
      false,

    offerAuthorityGranted:
      false
  };
}

function createCase(
  overrides = {}
) {
  const state = {
    fetchCount: 0,
    extractionCount: 0,
    requestedUrl: null,
    requestOptions: null,
    responseBlob: null,
    extractorBlob: null
  };

  const bytes =
    overrides.bytes !==
    undefined
      ? overrides.bytes
      : makeBytes(
          EXPECTED_BYTES,
          overrides.validSignature !==
            false
        );

  const responseBlob = {
    getBytes() {
      return bytes;
    }
  };

  state.responseBlob =
    responseBlob;

  const response = {
    getResponseCode() {
      return (
        overrides.status !==
        undefined
          ? overrides.status
          : 200
      );
    },

    getBlob() {
      return (
        overrides.missingBlob
          ? null
          : responseBlob
      );
    },

    getAllHeaders() {
      if (
        overrides.noContentType
      ) {
        return {};
      }

      return {
        'Content-Type':
          overrides.contentType !==
          undefined
            ? overrides.contentType
            : 'application/pdf'
      };
    }
  };

  const Utilities = {
    DigestAlgorithm: {
      SHA_256:
        'SHA_256'
    },

    newBlob(value) {
      return {
        getBytes() {
          return {
            __stringValue:
              String(value)
          };
        }
      };
    },

    computeDigest(
      algorithm,
      input
    ) {
      assert.strictEqual(
        algorithm,
        'SHA_256'
      );

      if (
        input &&
        Object.prototype.hasOwnProperty.call(
          input,
          '__stringValue'
        )
      ) {
        return hexToSignedBytes(
          hashHex(
            input.__stringValue
          )
        );
      }

      if (
        overrides.wrongPdfSha
      ) {
        return hexToSignedBytes(
          '0'.repeat(64)
        );
      }

      return hexToSignedBytes(
        PDF_SHA
      );
    }
  };

  const UrlFetchApp = {
    fetch(
      url,
      options
    ) {
      state.fetchCount += 1;

      state.requestedUrl =
        url;

      state.requestOptions =
        options;

      if (
        overrides.fetchThrows
      ) {
        throw new Error(
          'synthetic fetch failure'
        );
      }

      return response;
    }
  };

  const extractionSurface =
    overrides.missingExtractor
      ? {}
      : {
          PhiladelphiaProbateBoundedTextExtraction: {
            extract(blob) {
              state.extractionCount += 1;

              state.extractorBlob =
                blob;

              if (
                overrides.extractThrows
              ) {
                throw new Error(
                  'synthetic extraction failure'
                );
              }

              const result =
                defaultExtractionResult();

              if (
                overrides.extractionPatch
              ) {
                Object.assign(
                  result,
                  overrides.extractionPatch
                );
              }

              return result;
            }
          }
        };

  const sandbox = {
    console,
    Utilities,
    UrlFetchApp,
    REOS:
      extractionSurface
  };

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateProductionExtractionOrchestration.js'
    }
  );

  return {
    sandbox,
    state
  };
}

function expectFailure(
  options,
  expectedFetches,
  expectedExtractions
) {
  const testCase =
    createCase(
      options
    );

  assert.throws(
    () => {
      testCase
        .sandbox
        .reosPhiladelphiaProbateProductionExtractionOrchestration();
    }
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    expectedFetches
  );

  assert.strictEqual(
    testCase.state.extractionCount,
    expectedExtractions
  );

  return testCase;
}

/*
 * SUCCESS PATH
 */

{
  const testCase =
    createCase();

  const result =
    testCase
      .sandbox
      .reosPhiladelphiaProbateProductionExtractionOrchestration();

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.extractionCount,
    1
  );

  assert.strictEqual(
    testCase.state.requestedUrl,
    SOURCE_URL
  );

  assert.strictEqual(
    testCase.state.requestOptions.method,
    'get'
  );

  assert.strictEqual(
    testCase.state.requestOptions.followRedirects,
    false
  );

  assert.strictEqual(
    testCase.state.requestOptions.muteHttpExceptions,
    true
  );

  assert.strictEqual(
    testCase.state.requestOptions.headers.Accept,
    'application/pdf'
  );

  /*
   * Critical same-response identity test:
   * exact Blob from the one HTTP response must be passed to extractor.
   */
  assert.strictEqual(
    testCase.state.extractorBlob,
    testCase.state.responseBlob
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.orchestrationVersion,
    1
  );

  assert.strictEqual(
    result.httpFetchCount,
    1
  );

  assert.strictEqual(
    result.extractionCount,
    1
  );

  assert.strictEqual(
    result.pdfByteLength,
    EXPECTED_BYTES
  );

  assert.strictEqual(
    result.pdfContentSha256,
    PDF_SHA
  );

  assert.strictEqual(
    result.extractedTextCharacterCount,
    12345
  );

  assert.strictEqual(
    result.temporaryArtifactCleanupConfirmed,
    true
  );

  assert.strictEqual(
    result.fullExtractedTextReturned,
    false
  );

  assert.strictEqual(
    result.pdfBytesReturned,
    false
  );

  for (
    const key
    of [
      'text',
      'fullText',
      'rawText',
      'blob',
      'bytes',
      'pdfBytes',
      'documentId',
      'temporaryDocumentId'
    ]
  ) {
    assert(
      !Object.prototype.hasOwnProperty.call(
        result,
        key
      ),
      'Forbidden output key present: ' +
        key
    );
  }

  const falseFlags = [
    'sourceDiscoveryExecuted',
    'connectorFetchExecuted',
    'connectorRegistrationExecuted',
    'probateParsingExecuted',
    'leadCreationExecuted',
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
  ];

  for (
    const key
    of falseFlags
  ) {
    assert.strictEqual(
      result[key],
      false,
      key
    );
  }
}

/*
 * FAIL CLOSED BEFORE HTTP IF EXTRACTOR IS UNAVAILABLE.
 */
expectFailure(
  {
    missingExtractor:
      true
  },
  0,
  0
);

/*
 * EXACTLY ONE TRANSPORT ATTEMPT.
 * A thrown transport error must not retry.
 */
expectFailure(
  {
    fetchThrows:
      true
  },
  1,
  0
);

/*
 * REDIRECTS AND NON-2XX FAIL BEFORE EXTRACTION.
 */
expectFailure(
  {
    status:
      302
  },
  1,
  0
);

expectFailure(
  {
    status:
      500
  },
  1,
  0
);

/*
 * EMPTY / WRONG-SIZE / OVERSIZED INPUT FAILS BEFORE EXTRACTION.
 */
expectFailure(
  {
    bytes:
      new Uint8Array(0)
  },
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        EXPECTED_BYTES - 1
      )
  },
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        MAX_BYTES + 1
      )
  },
  1,
  0
);

/*
 * BAD SIGNATURE FAILS BEFORE EXTRACTION.
 */
expectFailure(
  {
    bytes:
      makeBytes(
        EXPECTED_BYTES,
        false
      )
  },
  1,
  0
);

/*
 * BAD CONTENT TYPE FAILS BEFORE EXTRACTION.
 */
expectFailure(
  {
    contentType:
      'text/html'
  },
  1,
  0
);

/*
 * ABSENT CONTENT TYPE IS ALLOWED BY CONTRACT.
 */
{
  const testCase =
    createCase({
      noContentType:
        true
    });

  const result =
    testCase
      .sandbox
      .reosPhiladelphiaProbateProductionExtractionOrchestration();

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.extractionCount,
    1
  );
}

/*
 * WRONG PDF SHA FAILS BEFORE EXTRACTION.
 */
expectFailure(
  {
    wrongPdfSha:
      true
  },
  1,
  0
);

/*
 * EXTRACTION FAILURE MUST NOT REFETCH OR RETRY.
 */
expectFailure(
  {
    extractThrows:
      true
  },
  1,
  1
);

/*
 * INVALID CLEANUP EVIDENCE MUST FAIL CLOSED.
 */
expectFailure(
  {
    extractionPatch: {
      temporaryArtifactCleanupConfirmed:
        false
    }
  },
  1,
  1
);

/*
 * FULL TEXT RETURN EVIDENCE MUST FAIL CLOSED.
 */
expectFailure(
  {
    extractionPatch: {
      fullExtractedTextReturned:
        true
    }
  },
  1,
  1
);

/*
 * PDF BYTE RETURN EVIDENCE MUST FAIL CLOSED.
 */
expectFailure(
  {
    extractionPatch: {
      pdfBytesReturned:
        true
    }
  },
  1,
  1
);

/*
 * EXTRACTOR PDF IDENTITY MISMATCH MUST FAIL CLOSED.
 */
expectFailure(
  {
    extractionPatch: {
      pdfContentSha256:
        'f'.repeat(64)
    }
  },
  1,
  1
);

expectFailure(
  {
    extractionPatch: {
      pdfByteLength:
        EXPECTED_BYTES - 1
    }
  },
  1,
  1
);

/*
 * OVERSIZED OR EMPTY EXTRACTED TEXT EVIDENCE MUST FAIL CLOSED.
 */
expectFailure(
  {
    extractionPatch: {
      extractedTextCharacterCount:
        0
    }
  },
  1,
  1
);

expectFailure(
  {
    extractionPatch: {
      extractedTextCharacterCount:
        MAX_TEXT_CHARS + 1
    }
  },
  1,
  1
);

/*
 * ACQUISITION / PERSISTENCE AUTHORITY FLAGS MUST REMAIN FALSE.
 */
for (
  const unsafeFlag
  of [
    'probateParsingExecuted',
    'leadCreationExecuted',
    'persistenceExecuted',
    'countyDataMutationExecuted',
    'arvAuthorityGranted',
    'repairScopeAuthorityGranted',
    'maoAuthorityGranted',
    'offerAuthorityGranted'
  ]
) {
  expectFailure(
    {
      extractionPatch: {
        [unsafeFlag]:
          true
      }
    },
    1,
    1
  );
}

console.log(
  'PB1_PRODUCTION_EXTRACTION_ORCHESTRATION_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'EXECUTABLE_HTTP_FETCH_CALL_SITE_COUNT=1'
);

console.log(
  'HTTP_FETCH_MAX_PER_INVOCATION=1'
);

console.log(
  'FOLLOW_REDIRECTS=false'
);

console.log(
  'HTTP_RETRY_BEHAVIOR_PRESENT=false'
);

console.log(
  'OLD_BOUNDED_FETCH_RPC_CALL_SITE_COUNT=0'
);

console.log(
  'SOURCE_DISCOVERY_CALL_SITE_COUNT=0'
);

console.log(
  'DIRECT_DRIVE_CREATE_CALL_SITE_COUNT=0'
);

console.log(
  'DIRECT_DOCUMENT_OPEN_CALL_SITE_COUNT=0'
);

console.log(
  'DIRECT_DRIVE_CLEANUP_CALL_SITE_COUNT=0'
);

console.log(
  'EXTRACTOR_CALL_SITE_COUNT=1'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_CERTIFIED=true'
);

console.log(
  'PDF_BYTE_LENGTH_VALIDATED_BEFORE_EXTRACTION=true'
);

console.log(
  'PDF_SIGNATURE_VALIDATED_BEFORE_EXTRACTION=true'
);

console.log(
  'PDF_CONTENT_SHA_VALIDATED_BEFORE_EXTRACTION=true'
);

console.log(
  'EXTRACTION_FAILURE_REFETCH_COUNT=0'
);

console.log(
  'FULL_EXTRACTED_TEXT_RETURN_AUTHORIZED=false'
);

console.log(
  'PDF_BYTES_RETURN_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'LEAD_CREATION_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
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
  'LIVE_HTTP_EXECUTED_BY_VALIDATOR=false'
);

console.log(
  'LIVE_OCR_EXECUTED_BY_VALIDATOR=false'
);
