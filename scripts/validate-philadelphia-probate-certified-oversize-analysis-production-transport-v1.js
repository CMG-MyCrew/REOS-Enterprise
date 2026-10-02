'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const vm =
  require('vm');

const IMPLEMENTATION =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js';

const source =
  fs.readFileSync(
    IMPLEMENTATION,
    'utf8'
  );

const PUBLIC_RPC =
  'reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport';

const SOURCE_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const SOURCE_URL_SHA256 =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const PUBLICATION_DATE =
  '2026-09-30';

const EXPECTED_PDF_BYTES =
  4220387;

const EXPECTED_PDF_SHA256 =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const MAX_PDF_BYTES =
  26214400;

const NORMAL_EXTRACTION_LIMIT =
  250000;

const CERTIFIED_OVERSIZE_TEXT_LIMIT =
  600000;

const EXPECTED_TEXT_CHARACTER_COUNT =
  566435;

const EXPECTED_TEXT_SHA256 =
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

const NOTICE_PAGE_SIZE =
  25;

const REPRESENTATIVE_TEXT_LIMIT =
  500;

const CURSOR_DOMAIN =
  'PHL-PROBATE-PB1-V1';

function count(pattern) {
  return (
    source.match(
      pattern
    ) ||
    []
  ).length;
}

/*
 * Static authority.
 */
assert.strictEqual(
  count(
    /function\s+reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport\s*\(\s*noticeOffset\s*\)/g
  ),
  1,
  'Exactly one public one-argument transport RPC is required.'
);

assert.strictEqual(
  count(
    /UrlFetchApp\s*\.\s*fetch\s*\(/g
  ),
  1,
  'Exactly one executable HTTP fetch call site is required.'
);

assert.strictEqual(
  count(
    /\banalysis\s*\.\s*analyze\s*\(\s*blob\s*,\s*noticeOffset\s*\)/g
  ),
  1,
  'Exactly one certified analysis invocation call site is required.'
);

for (
  const token
  of [
    'followRedirects:',
    SOURCE_URL,
    SOURCE_URL_SHA256,
    PUBLICATION_DATE,
    EXPECTED_PDF_SHA256,
    EXPECTED_TEXT_SHA256,
    CURSOR_DOMAIN
  ]
) {
  assert(
    source.includes(
      token
    ),
    'Required runtime token missing: ' +
      token
  );
}

for (
  const token
  of [
    'reosPhiladelphiaProbateBoundedPdfFetch',
    'PhiladelphiaProbateBoundedPdfFetch.execute',
    'reosPhiladelphiaProbateBoundedSourceDiscovery',
    'PhiladelphiaProbateRecurringSource.resolve',
    'PAPhiladelphiaCountyConnector',
    'PhiladelphiaProbateBoundedTextExtraction',
    'PhiladelphiaProbateProductionOversizeTextEvidenceRecovery',
    'PhiladelphiaProbateBoundedOversizeTextEvidence',
    'Drive.Files.create',
    'DocumentApp.openById',
    'DriveApp.getFileById',
    'PropertiesService',
    'SpreadsheetApp',
    'newTrigger(',
    'getProjectTriggers(',
    'appendRow('
  ]
) {
  assert(
    !source.includes(
      token
    ),
    'Prohibited transport surface present: ' +
      token
  );
}

function hexToSignedBytes(hex) {
  const out =
    [];

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
      value -=
        256;
    }

    out.push(
      value
    );
  }

  return out;
}

function hashHex(value) {
  return crypto
    .createHash(
      'sha256'
    )
    .update(
      value,
      'utf8'
    )
    .digest(
      'hex'
    );
}

function makeBytes(
  length =
    EXPECTED_PDF_BYTES,
  validSignature =
    true
) {
  const bytes = {
    length
  };

  if (
    length >= 5
  ) {
    bytes[0] =
      validSignature
        ? 0x25
        : 0x00;

    bytes[1] = 0x50;
    bytes[2] = 0x44;
    bytes[3] = 0x46;
    bytes[4] = 0x2d;
  }

  return bytes;
}

function metadata() {
  return {
    analysisVersion:
      1,

    expectedPublicationDate:
      PUBLICATION_DATE,

    expectedPdfBytes:
      EXPECTED_PDF_BYTES,

    expectedPdfSha256:
      EXPECTED_PDF_SHA256,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    certifiedOversizeTextLimit:
      CERTIFIED_OVERSIZE_TEXT_LIMIT,

    expectedTextCharacterCount:
      EXPECTED_TEXT_CHARACTER_COUNT,

    expectedTextSha256:
      EXPECTED_TEXT_SHA256,

    noticePageSize:
      NOTICE_PAGE_SIZE,

    representativeTextLimit:
      REPRESENTATIVE_TEXT_LIMIT,

    cursorDomain:
      CURSOR_DOMAIN
  };
}

function notices(
  offset,
  count
) {
  return Array.from(
    {
      length:
        count
    },
    (
      _,
      index
    ) => ({
      decedent:
        'DOE, TEST ' +
        (
          offset +
          index +
          1
        ),

      normalizedDecedent:
        'DOE TEST ' +
        (
          offset +
          index +
          1
        ),

      representativeText:
        'Representative estate notice text',

      publicationDate:
        PUBLICATION_DATE
    })
  );
}

function defaultAnalysisResult(offset) {
  const parsedNoticeCount =
    30;

  const selectedNoticeCount =
    Math.min(
      NOTICE_PAGE_SIZE,
      parsedNoticeCount -
        offset
    );

  const nextNoticeOffset =
    offset +
    selectedNoticeCount;

  return {
    ok:
      true,

    analysisVersion:
      1,

    publicationDate:
      PUBLICATION_DATE,

    pdfContentSha256:
      EXPECTED_PDF_SHA256,

    pdfByteLength:
      EXPECTED_PDF_BYTES,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    certifiedOversizeTextLimit:
      CERTIFIED_OVERSIZE_TEXT_LIMIT,

    observedTextCharacterCount:
      EXPECTED_TEXT_CHARACTER_COUNT,

    observedTextSha256:
      EXPECTED_TEXT_SHA256,

    exceedsCurrentNormalExtractionLimit:
      true,

    acceptedForNormalExtraction:
      false,

    exactRecoveredTextIdentityConfirmed:
      true,

    probateParsingExecuted:
      true,

    parsedNoticeCount:
      parsedNoticeCount,

    noticeOffset:
      offset,

    noticePageSize:
      NOTICE_PAGE_SIZE,

    selectedNoticeCount:
      selectedNoticeCount,

    nextNoticeOffset:
      nextNoticeOffset,

    hasMore:
      nextNoticeOffset <
      parsedNoticeCount,

    cursorDomain:
      CURSOR_DOMAIN,

    representativeTextLimit:
      REPRESENTATIVE_TEXT_LIMIT,

    notices:
      notices(
        offset,
        selectedNoticeCount
      ),

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

    textReadCount:
      1,

    fullExtractedTextReturned:
      false,

    textPreviewReturned:
      false,

    pdfBytesReturned:
      false,

    sourceDiscoveryExecuted:
      false,

    httpFetchExecuted:
      false,

    opaLookupExecuted:
      false,

    propertyReconciliationExecuted:
      false,

    leadCreationExecuted:
      false,

    persistenceExecuted:
      false,

    configurationExecuted:
      false,

    schedulerInspectionExecuted:
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
  overrides =
    {}
) {
  const state = {
    fetchCount:
      0,

    analysisCount:
      0,

    requestedUrl:
      null,

    requestOptions:
      null,

    responseBlob:
      null,

    analysisBlob:
      null,

    analysisOffset:
      null
  };

  const bytes =
    overrides.bytes !==
    undefined
      ? overrides.bytes
      : makeBytes(
          EXPECTED_PDF_BYTES,
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

  const response =
    overrides.invalidResponse
      ? {}
      : {
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

  const Utilities =
    overrides.missingUtilities
      ? undefined
      : {
          DigestAlgorithm: {
            SHA_256:
              'SHA_256'
          },

          newBlob(value) {
            return {
              getBytes() {
                return {
                  __stringValue:
                    String(value),

                  length:
                    String(value).length
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
              if (
                overrides.wrongUrlSha &&
                input.__stringValue ===
                  SOURCE_URL
              ) {
                return hexToSignedBytes(
                  '0'.repeat(64)
                );
              }

              return hexToSignedBytes(
                hashHex(
                  input.__stringValue
                )
              );
            }

            return hexToSignedBytes(
              overrides.wrongPdfSha
                ? 'f'.repeat(64)
                : EXPECTED_PDF_SHA256
            );
          }
        };

  const UrlFetchApp =
    overrides.missingUrlFetch
      ? undefined
      : {
          fetch(
            url,
            options
          ) {
            state.fetchCount +=
              1;

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

  const analysisMetadata =
    metadata();

  if (
    overrides.metadataPatch
  ) {
    Object.assign(
      analysisMetadata,
      overrides.metadataPatch
    );
  }

  const analysis =
    overrides.missingAnalysis
      ? undefined
      : {
          ...analysisMetadata,

          analyze(
            blob,
            offset
          ) {
            state.analysisCount +=
              1;

            state.analysisBlob =
              blob;

            state.analysisOffset =
              offset;

            if (
              overrides.analysisThrows
            ) {
              throw new Error(
                'synthetic analysis failure'
              );
            }

            const result =
              defaultAnalysisResult(
                offset
              );

            if (
              overrides.analysisResultPatch
            ) {
              Object.assign(
                result,
                overrides.analysisResultPatch
              );
            }

            if (
              typeof overrides.analysisResultMutator ===
                'function'
            ) {
              overrides
                .analysisResultMutator(
                  result
                );
            }

            return result;
          }
        };

  const sandbox = {
    console,
    Utilities,
    UrlFetchApp,
    REOS:
      {}
  };

  if (analysis) {
    sandbox
      .REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis =
        analysis;
  }

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport.js'
    }
  );

  assert.strictEqual(
    typeof sandbox[
      PUBLIC_RPC
    ],
    'function'
  );

  assert.strictEqual(
    sandbox[
      PUBLIC_RPC
    ].length,
    1
  );

  return {
    sandbox,
    state
  };
}

function expectFailure(
  overrides,
  offset,
  fetches,
  analyses
) {
  const testCase =
    createCase(
      overrides
    );

  assert.throws(
    () => {
      testCase
        .sandbox[
          PUBLIC_RPC
        ](
          offset
        );
    }
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    fetches
  );

  assert.strictEqual(
    testCase.state.analysisCount,
    analyses
  );
}

/*
 * Successful first and second bounded pages.
 */
for (
  const offset
  of [
    0,
    25
  ]
) {
  const testCase =
    createCase();

  const result =
    testCase
      .sandbox[
        PUBLIC_RPC
      ](
        offset
      );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.analysisCount,
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
    testCase.state.analysisBlob,
    testCase.state.responseBlob
  );

  assert.strictEqual(
    testCase.state.analysisOffset,
    offset
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.transportVersion,
    1
  );

  assert.strictEqual(
    result.httpFetchCount,
    1
  );

  assert.strictEqual(
    result.analysisInvocationCount,
    1
  );

  assert.strictEqual(
    result.sameResponseBlobHandoffConfirmed,
    true
  );

  assert.strictEqual(
    result.pdfByteLength,
    EXPECTED_PDF_BYTES
  );

  assert.strictEqual(
    result.pdfContentSha256,
    EXPECTED_PDF_SHA256
  );

  assert.strictEqual(
    result.observedTextCharacterCount,
    EXPECTED_TEXT_CHARACTER_COUNT
  );

  assert.strictEqual(
    result.observedTextSha256,
    EXPECTED_TEXT_SHA256
  );

  assert.strictEqual(
    result.noticeOffset,
    offset
  );

  assert.strictEqual(
    result.notices.length,
    result.selectedNoticeCount
  );

  for (
    const key
    of [
      'text',
      'rawText',
      'fullText',
      'textPreview',
      'preview',
      'blob',
      'pdfBlob',
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
}

/*
 * Invalid notice offsets fail before transport.
 */
for (
  const offset
  of [
    -1,
    1.5,
    undefined,
    'not-a-number'
  ]
) {
  expectFailure(
    {},
    offset,
    0,
    0
  );
}

/*
 * Certified prerequisite failures occur before HTTP.
 */
expectFailure(
  {
    wrongUrlSha:
      true
  },
  0,
  0,
  0
);

expectFailure(
  {
    missingUtilities:
      true
  },
  0,
  0,
  0
);

expectFailure(
  {
    missingUrlFetch:
      true
  },
  0,
  0,
  0
);

expectFailure(
  {
    missingAnalysis:
      true
  },
  0,
  0,
  0
);

for (
  const [
    key,
    value
  ]
  of [
    ['analysisVersion', 2],
    ['expectedPublicationDate', '2026-09-29'],
    ['expectedPdfBytes', EXPECTED_PDF_BYTES - 1],
    ['expectedPdfSha256', '0'.repeat(64)],
    ['maxPdfBytes', MAX_PDF_BYTES - 1],
    ['currentNormalExtractionLimit', NORMAL_EXTRACTION_LIMIT - 1],
    ['certifiedOversizeTextLimit', CERTIFIED_OVERSIZE_TEXT_LIMIT - 1],
    ['expectedTextCharacterCount', EXPECTED_TEXT_CHARACTER_COUNT - 1],
    ['expectedTextSha256', 'f'.repeat(64)],
    ['noticePageSize', NOTICE_PAGE_SIZE - 1],
    ['representativeTextLimit', REPRESENTATIVE_TEXT_LIMIT - 1],
    ['cursorDomain', 'WRONG-DOMAIN']
  ]
) {
  expectFailure(
    {
      metadataPatch: {
        [key]:
          value
      }
    },
    0,
    0,
    0
  );
}

/*
 * Exactly one HTTP attempt; no retry.
 */
expectFailure(
  {
    fetchThrows:
      true
  },
  0,
  1,
  0
);

expectFailure(
  {
    status:
      302
  },
  0,
  1,
  0
);

expectFailure(
  {
    status:
      500
  },
  0,
  1,
  0
);

expectFailure(
  {
    invalidResponse:
      true
  },
  0,
  1,
  0
);

expectFailure(
  {
    missingBlob:
      true
  },
  0,
  1,
  0
);

/*
 * Exact PDF identity must pass before analysis.
 */
expectFailure(
  {
    bytes:
      makeBytes(0)
  },
  0,
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        EXPECTED_PDF_BYTES -
          1
      )
  },
  0,
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        MAX_PDF_BYTES +
          1
      )
  },
  0,
  1,
  0
);

expectFailure(
  {
    validSignature:
      false
  },
  0,
  1,
  0
);

expectFailure(
  {
    contentType:
      'text/html'
  },
  0,
  1,
  0
);

expectFailure(
  {
    wrongPdfSha:
      true
  },
  0,
  1,
  0
);

/*
 * Missing Content-Type remains acceptable because exact byte count,
 * signature and SHA still establish the certified PDF identity.
 */
{
  const testCase =
    createCase({
      noContentType:
        true
    });

  const result =
    testCase
      .sandbox[
        PUBLIC_RPC
      ](0);

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.analysisCount,
    1
  );
}

/*
 * Analysis failure must never trigger refetch or reanalysis.
 */
expectFailure(
  {
    analysisThrows:
      true
  },
  0,
  1,
  1
);

/*
 * Analysis evidence must fail closed.
 */
for (
  const patch
  of [
    {ok: false},
    {analysisVersion: 2},
    {publicationDate: '2026-09-29'},
    {pdfContentSha256: '0'.repeat(64)},
    {pdfByteLength: EXPECTED_PDF_BYTES - 1},
    {observedTextCharacterCount: EXPECTED_TEXT_CHARACTER_COUNT - 1},
    {observedTextSha256: '0'.repeat(64)},
    {exactRecoveredTextIdentityConfirmed: false},
    {probateParsingExecuted: false},
    {noticeOffset: 1},
    {noticePageSize: NOTICE_PAGE_SIZE - 1},
    {selectedNoticeCount: 0},
    {nextNoticeOffset: 24},
    {hasMore: false},
    {cursorDomain: 'WRONG-DOMAIN'},
    {representativeTextLimit: REPRESENTATIVE_TEXT_LIMIT - 1},
    {temporaryArtifactCleanupConfirmed: false},
    {driveCreateCount: 2},
    {documentOpenCount: 2},
    {textReadCount: 2},
    {fullExtractedTextReturned: true},
    {textPreviewReturned: true},
    {pdfBytesReturned: true},
    {sourceDiscoveryExecuted: true},
    {httpFetchExecuted: true},
    {opaLookupExecuted: true},
    {propertyReconciliationExecuted: true},
    {leadCreationExecuted: true},
    {persistenceExecuted: true},
    {schedulerMutationExecuted: true},
    {checkpointMutationExecuted: true},
    {countyDataMutationExecuted: true},
    {arvAuthorityGranted: true},
    {repairScopeAuthorityGranted: true},
    {maoAuthorityGranted: true},
    {offerAuthorityGranted: true}
  ]
) {
  expectFailure(
    {
      analysisResultPatch:
        patch
    },
    0,
    1,
    1
  );
}

expectFailure(
  {
    analysisResultMutator(
      result
    ) {
      result.notices =
        result.notices.slice(
          0,
          result.notices.length -
            1
        );
    }
  },
  0,
  1,
  1
);

expectFailure(
  {
    analysisResultMutator(
      result
    ) {
      result.notices[0]
        .representativeText =
          'X'.repeat(
            REPRESENTATIVE_TEXT_LIMIT +
              1
          );
    }
  },
  0,
  1,
  1
);

expectFailure(
  {
    analysisResultMutator(
      result
    ) {
      result.notices[0]
        .publicationDate =
          '2026-09-29';
    }
  },
  0,
  1,
  1
);

assert.strictEqual(
  hashHex(
    SOURCE_URL
  ),
  SOURCE_URL_SHA256
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ANALYSIS_PRODUCTION_TRANSPORT_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC=' +
  PUBLIC_RPC
);

console.log(
  'PUBLIC_RPC_ARGUMENT_COUNT=1'
);

console.log(
  'INITIAL_NOTICE_OFFSET=0'
);

console.log(
  'SOURCE_URL_SHA256=' +
  SOURCE_URL_SHA256
);

console.log(
  'EXPECTED_PDF_BYTES=' +
  EXPECTED_PDF_BYTES
);

console.log(
  'EXPECTED_PDF_SHA256=' +
  EXPECTED_PDF_SHA256
);

console.log(
  'MAX_PDF_BYTES=' +
  MAX_PDF_BYTES
);

console.log(
  'NORMAL_EXTRACTION_LIMIT=' +
  NORMAL_EXTRACTION_LIMIT
);

console.log(
  'CERTIFIED_OVERSIZE_TEXT_LIMIT=' +
  CERTIFIED_OVERSIZE_TEXT_LIMIT
);

console.log(
  'EXPECTED_TEXT_CHARACTER_COUNT=' +
  EXPECTED_TEXT_CHARACTER_COUNT
);

console.log(
  'EXPECTED_TEXT_SHA256=' +
  EXPECTED_TEXT_SHA256
);

console.log(
  'PB1_NOTICE_PAGE_SIZE=' +
  NOTICE_PAGE_SIZE
);

console.log(
  'REPRESENTATIVE_TEXT_LIMIT=' +
  REPRESENTATIVE_TEXT_LIMIT
);

console.log(
  'PB1_CURSOR_DOMAIN=' +
  CURSOR_DOMAIN
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
  'HTTP_RETRY_AUTHORIZED=false'
);

console.log(
  'SOURCE_DISCOVERY_AUTHORIZED=false'
);

console.log(
  'ANALYSIS_INVOCATION_CALL_SITE_COUNT=1'
);

console.log(
  'ANALYSIS_INVOCATION_MAX_PER_TRANSPORT=1'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_CERTIFIED=true'
);

console.log(
  'ANALYSIS_METADATA_VALIDATED_BEFORE_HTTP=true'
);

console.log(
  'PDF_BYTE_LENGTH_VALIDATED_BEFORE_ANALYSIS=true'
);

console.log(
  'PDF_SIGNATURE_VALIDATED_BEFORE_ANALYSIS=true'
);

console.log(
  'PDF_CONTENT_SHA_VALIDATED_BEFORE_ANALYSIS=true'
);

console.log(
  'ANALYSIS_FAILURE_REFETCH_COUNT=0'
);

console.log(
  'DIRECT_DRIVE_OCR_AUTHORITY=false'
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
  'OPA_LOOKUP_AUTHORIZED=false'
);

console.log(
  'PROPERTY_RECONCILIATION_AUTHORIZED=false'
);

console.log(
  'LEAD_CREATION_AUTHORIZED=false'
);

console.log(
  'PERSISTENCE_AUTHORIZED=false'
);

console.log(
  'SCHEDULER_MUTATION_AUTHORIZED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_AUTHORIZED=false'
);

console.log(
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);

console.log(
  'LIVE_HTTP_EXECUTED_BY_VALIDATOR=false'
);

console.log(
  'LIVE_OCR_EXECUTED_BY_VALIDATOR=false'
);
