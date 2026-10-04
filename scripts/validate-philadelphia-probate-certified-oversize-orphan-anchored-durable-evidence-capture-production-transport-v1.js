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
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport.js';

const source =
  fs.readFileSync(
    IMPLEMENTATION,
    'utf8'
  );

const PUBLIC_RPC =
  'reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport';

const SOURCE_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const SOURCE_URL_SHA256 =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const PUBLICATION_DATE =
  '2026-09-30';

const SOURCE_HOST =
  'assets.alm.com';

const SOURCE_BASENAME =
  'tlipn093026.pdf';

const EXPECTED_PDF_BYTES =
  4220387;

const MAX_PDF_BYTES =
  26214400;

const EXPECTED_PDF_SHA256 =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const NORMAL_EXTRACTION_LIMIT =
  250000;

const OVERSIZE_TEXT_LIMIT =
  600000;

const EXPECTED_TEXT_CHARACTER_COUNT =
  566435;

const EXPECTED_TEXT_SHA256 =
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

const MAX_CONTEXT_COUNT =
  8;

const MAX_CONTEXT_CHARACTERS =
  800;

const MAX_AGGREGATE_CONTEXT_CHARACTERS =
  6400;


/*
 * Durable-capture architectural boundary.
 *
 * The Apps Script transport returns the bounded RPC payload. The authorized
 * local invocation harness must durably capture raw stdout/stderr BEFORE
 * interpretation or JSON normalization.
 */
assert(
  source.includes(
    'Durable raw RPC stdout/stderr persistence is intentionally an'
  ),
  'external durable-capture boundary declaration missing'
);

assert.strictEqual(
  source.includes(
    'Drive.Files.create'
  ),
  false,
  'successor transport must not implement durable capture through Drive'
);

assert.strictEqual(
  source.includes(
    'PropertiesService'
  ),
  false,
  'successor transport must not persist capture through Script Properties'
);

function count(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

/*
 * Static authority/containment.
 */
assert.strictEqual(
  count(
    /function\s+reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport\s*\(\s*\)/g
  ),
  1
);

assert.strictEqual(
  count(
    /UrlFetchApp\s*\.\s*fetch\s*\(/g
  ),
  1
);

assert.strictEqual(
  count(
    /\bmarker\s*\.\s*recover\s*\(\s*blob\s*\)/g
  ),
  1
);

assert.strictEqual(
  count(
    /\bvar\s+blob\s*=\s*response\s*\.\s*getBlob\s*\(\s*\)\s*;/g
  ),
  1
);

for (
  const token
  of [
    SOURCE_URL,
    SOURCE_URL_SHA256,
    PUBLICATION_DATE,
    SOURCE_HOST,
    SOURCE_BASENAME,
    EXPECTED_PDF_SHA256,
    EXPECTED_TEXT_SHA256,
    'followRedirects:',
    'muteHttpExceptions:',
    "'application/pdf'",
    'sameResponseBlobHandoffConfirmed',
    'successorRecoveryInvocationCount'
  ]
) {
  assert(
    source.includes(token),
    'Required runtime token missing: ' +
      token
  );
}

for (
  const prohibited
  of [
    'Drive.Files.create',
    'Drive.Files.list',
    'Drive.Files.get',
    'DocumentApp.openById',
    'DriveApp.getFileById',
    'parseEstateNotices_',
    'PhiladelphiaProbateCertifiedOversizePublicationAnalysis.analyze',
    'PhiladelphiaProbateBoundedSourceDiscovery',
    'PhiladelphiaProbateRecurringSource.resolve',
    'PropertiesService',
    'SpreadsheetApp',
    'ScriptApp.newTrigger',
    'getProjectTriggers(',
    'appendRow('
  ]
) {
  assert(
    !source.includes(prohibited),
    'Prohibited runtime surface: ' +
      prohibited
  );
}


/*
 * Successor-only authority and ORPHAN containment.
 */
assert(
  source.includes(
    'PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery'
  ),
  'successor orphan-anchored component namespace missing'
);

assert.strictEqual(
  source.includes(
    'REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery.recover'
  ),
  false,
  'predecessor marker-evidence component invocation present'
);

assert(
  source.includes(
    'primaryEvidenceAnchor:'
  ),
  'primary ORPHAN evidence anchor output missing'
);

assert(
  source.includes(
    '!seenLabels.ORPHAN'
  ),
  'per-context ORPHAN requirement missing'
);

assert.strictEqual(
  source.includes("ORPHANS'?"),
  false,
  'production parser marker grammar unexpectedly present'
);

for (
  const forbiddenSelector
  of [
    'findLocatorHits_',
    'extractMarkerEvidence_',
    'rankCandidates_',
    'allocateCandidate',
    'selectEvidenceWindow_'
  ]
) {
  assert.strictEqual(
    source.includes(
      forbiddenSelector
    ),
    false,
    'second evidence selector/ranking surface present: ' +
      forbiddenSelector
  );
}

const sourceGateIndex =
  source.indexOf(
    'validatePinnedSource_();'
  );

const serviceGateIndex =
  source.indexOf(
    'assertTransportServices_();'
  );

const markerGateIndex =
  source.indexOf(
    'assertMarkerSurface_();'
  );

const fetchIndex =
  source.indexOf(
    'UrlFetchApp.fetch('
  );

const pdfShaIndex =
  source.indexOf(
    'pdfContentSha256 !=='
  );

const markerCallIndex =
  source.indexOf(
    'marker.recover(\n          blob'
  );

assert(sourceGateIndex >= 0);
assert(serviceGateIndex > sourceGateIndex);
assert(markerGateIndex > serviceGateIndex);
assert(fetchIndex > markerGateIndex);
assert(pdfShaIndex > fetchIndex);
assert(markerCallIndex > pdfShaIndex);

function signedDigest(hex) {
  const bytes = [];

  for (
    let i = 0;
    i < hex.length;
    i += 2
  ) {
    let value =
      parseInt(
        hex.slice(i, i + 2),
        16
      );

    if (value > 127) {
      value -= 256;
    }

    bytes.push(value);
  }

  return bytes;
}

function hashText(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}

function makeBytes(
  length = EXPECTED_PDF_BYTES,
  validSignature = true
) {
  const bytes = {
    length
  };

  if (length >= 5) {
    bytes[0] =
      validSignature
        ? 0x25
        : 0;

    bytes[1] = 0x50;
    bytes[2] = 0x44;
    bytes[3] = 0x46;
    bytes[4] = 0x2d;
  }

  return bytes;
}

function makeContext(
  raw = 'O R P H A N   C O U R T',
  start = 1000,
  labels = ['ORPHAN', 'COURT']
) {
  return {
    locatorLabels:
      labels,

    startOffset:
      start,

    endOffset:
      start + raw.length,

    rawOcrContext:
      raw,

    contextCharacterCount:
      raw.length,

    contextSha256:
      hashText(raw)
  };
}

function markerMetadata() {
  return {
    markerEvidenceVersion:
      1,

    expectedPdfBytes:
      EXPECTED_PDF_BYTES,

    expectedPdfSha256:
      EXPECTED_PDF_SHA256,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    certifiedOversizeTextLimit:
      OVERSIZE_TEXT_LIMIT,

    expectedTextCharacterCount:
      EXPECTED_TEXT_CHARACTER_COUNT,

    expectedTextSha256:
      EXPECTED_TEXT_SHA256,

    locatorFamilyCount:
      5,

    maxContextCount:
      MAX_CONTEXT_COUNT,

    maxContextCharacters:
      MAX_CONTEXT_CHARACTERS,

    maxAggregateContextCharacters:
      MAX_AGGREGATE_CONTEXT_CHARACTERS
  };
}

function defaultMarkerResult() {
  const item =
    makeContext();

  return {
    ok:
      true,

    markerEvidenceVersion:
      1,

    pdfContentSha256:
      EXPECTED_PDF_SHA256,

    pdfByteLength:
      EXPECTED_PDF_BYTES,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    certifiedOversizeTextLimit:
      OVERSIZE_TEXT_LIMIT,

    observedTextCharacterCount:
      EXPECTED_TEXT_CHARACTER_COUNT,

    observedTextSha256:
      EXPECTED_TEXT_SHA256,

    exactRecoveredTextIdentityConfirmed:
      true,

    locatorFamilyCount:
      5,

    maxContextCount:
      MAX_CONTEXT_COUNT,

    maxContextCharacters:
      MAX_CONTEXT_CHARACTERS,

    maxAggregateContextCharacters:
      MAX_AGGREGATE_CONTEXT_CHARACTERS,

    contextCount:
      1,

    aggregateContextCharacters:
      item.contextCharacterCount,

    contexts:
      [item],

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

    fullOcrTextReturned:
      false,

    genericTextPreviewReturned:
      false,

    pdfBytesReturned:
      false,

    temporaryDocumentIdReturned:
      false,

    sourceDiscoveryExecuted:
      false,

    httpFetchExecuted:
      false,

    priorDriveArtifactSearchExecuted:
      false,

    probateParsingExecuted:
      false,

    parserRepairExecuted:
      false,

    propertyLookupExecuted:
      false,

    opaLookupExecuted:
      false,

    propertyReconciliationExecuted:
      false,

    leadCreationExecuted:
      false,

    persistenceExecuted:
      false,

    schedulerInspectionExecuted:
      false,

    schedulerMutationExecuted:
      false,

    triggerMutationExecuted:
      false,

    checkpointMutationExecuted:
      false,

    cursorMutationExecuted:
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
    fetchCount:
      0,

    recoveryCount:
      0,

    requestedUrl:
      null,

    requestOptions:
      null,

    responseBlob:
      null,

    recoveryBlob:
      null
  };

  const bytes =
    overrides.bytes !== undefined
      ? overrides.bytes
      : makeBytes(
          EXPECTED_PDF_BYTES,
          overrides.validSignature !== false
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
              overrides.status !== undefined
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
            if (overrides.noContentType) {
              return {};
            }

            return {
              'Content-Type':
                overrides.contentType !== undefined
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
                return signedDigest(
                  '0'.repeat(64)
                );
              }

              return signedDigest(
                hashText(
                  input.__stringValue
                )
              );
            }

            return signedDigest(
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
            state.fetchCount += 1;

            state.requestedUrl =
              url;

            state.requestOptions =
              options;

            if (overrides.fetchThrows) {
              throw new Error(
                'synthetic fetch failure'
              );
            }

            return response;
          }
        };

  const metadata =
    markerMetadata();

  if (overrides.metadataPatch) {
    Object.assign(
      metadata,
      overrides.metadataPatch
    );
  }

  const marker =
    overrides.missingMarker
      ? undefined
      : {
          ...metadata,

          recover(blob) {
            state.recoveryCount += 1;

            state.recoveryBlob =
              blob;

            if (overrides.recoveryThrows) {
              throw new Error(
                'synthetic marker recovery failure'
              );
            }

            const result =
              defaultMarkerResult();

            if (overrides.markerResultPatch) {
              Object.assign(
                result,
                overrides.markerResultPatch
              );
            }

            if (
              typeof overrides.markerResultMutator ===
                'function'
            ) {
              overrides.markerResultMutator(
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
    REOS: {}
  };

  if (marker) {
    sandbox
      .REOS
      .PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery =
        marker;
  }

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateCertifiedOversizeOrphanAnchoredDurableEvidenceCaptureProductionTransport.js'
    }
  );

  assert.strictEqual(
    typeof sandbox[PUBLIC_RPC],
    'function'
  );

  assert.strictEqual(
    sandbox[PUBLIC_RPC].length,
    0
  );

  return {
    sandbox,
    state
  };
}

function expectFailure(
  overrides,
  expectedFetches,
  expectedRecoveries
) {
  const testCase =
    createCase(overrides);

  assert.throws(
    () =>
      testCase
        .sandbox[
          PUBLIC_RPC
        ]()
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    expectedFetches
  );

  assert.strictEqual(
    testCase.state.recoveryCount,
    expectedRecoveries
  );
}

/*
 * Successful bounded mechanics.
 */
{
  const testCase =
    createCase();

  const result =
    testCase
      .sandbox[
        PUBLIC_RPC
      ]();

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.recoveryCount,
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

  assert.strictEqual(
    testCase.state.recoveryBlob,
    testCase.state.responseBlob
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.httpFetchCount,
    1
  );

  assert.strictEqual(
    result.successorRecoveryInvocationCount,
    1
  );

  assert.strictEqual(
    result.sameResponseBlobHandoffConfirmed,
    true
  );

  assert.strictEqual(
    result.pdfContentSha256,
    EXPECTED_PDF_SHA256
  );

  assert.strictEqual(
    result.observedTextSha256,
    EXPECTED_TEXT_SHA256
  );

  assert.strictEqual(
    result.contextCount,
    1
  );

  assert.strictEqual(
    result.contexts.length,
    1
  );

  assert.strictEqual(
    result.primaryEvidenceAnchor,
    'ORPHAN'
  );

  assert(
    result.contexts.every(
      context =>
        context.locatorLabels.includes(
          'ORPHAN'
        )
    )
  );

  for (
    const forbidden
    of [
      'sourceUrl',
      'text',
      'fullText',
      'rawText',
      'textPreview',
      'preview',
      'blob',
      'pdfBlob',
      'bytes',
      'pdfBytes',
      'documentId',
      'temporaryDocumentId',
      'notices',
      'decedents'
    ]
  ) {
    assert(
      !Object.prototype.hasOwnProperty.call(
        result,
        forbidden
      ),
      forbidden
    );
  }

  for (
    const flag
    of [
      'sourceDiscoveryExecuted',
      'successorComponentHttpFetchExecuted',
      'priorDriveArtifactSearchExecuted',
      'probateParsingExecuted',
      'parserRepairExecuted',
      'propertyLookupExecuted',
      'opaLookupExecuted',
      'propertyReconciliationExecuted',
      'leadCreationExecuted',
      'persistenceExecuted',
      'schedulerInspectionExecuted',
      'schedulerMutationExecuted',
      'triggerMutationExecuted',
      'checkpointMutationExecuted',
      'cursorMutationExecuted',
      'countyDataMutationExecuted',
      'arvAuthorityGranted',
      'repairScopeAuthorityGranted',
      'maoAuthorityGranted',
      'offerAuthorityGranted'
    ]
  ) {
    assert.strictEqual(
      result[flag],
      false,
      flag
    );
  }
}

/*
 * Missing Content-Type is permitted because exact bytes/signature/SHA
 * independently certify the PDF.
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
      ]();

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.recoveryCount,
    1
  );
}

/*
 * Pre-HTTP failures.
 */
expectFailure(
  {wrongUrlSha: true},
  0,
  0
);

expectFailure(
  {missingUtilities: true},
  0,
  0
);

expectFailure(
  {missingUrlFetch: true},
  0,
  0
);

expectFailure(
  {missingMarker: true},
  0,
  0
);

for (
  const [key, value]
  of [
    ['markerEvidenceVersion', 2],
    ['expectedPdfBytes', EXPECTED_PDF_BYTES - 1],
    ['expectedPdfSha256', '0'.repeat(64)],
    ['maxPdfBytes', MAX_PDF_BYTES - 1],
    ['currentNormalExtractionLimit', NORMAL_EXTRACTION_LIMIT - 1],
    ['certifiedOversizeTextLimit', OVERSIZE_TEXT_LIMIT - 1],
    ['expectedTextCharacterCount', EXPECTED_TEXT_CHARACTER_COUNT - 1],
    ['expectedTextSha256', 'f'.repeat(64)],
    ['locatorFamilyCount', 4],
    ['maxContextCount', MAX_CONTEXT_COUNT - 1],
    ['maxContextCharacters', MAX_CONTEXT_CHARACTERS - 1],
    ['maxAggregateContextCharacters', MAX_AGGREGATE_CONTEXT_CHARACTERS - 1]
  ]
) {
  expectFailure(
    {
      metadataPatch: {
        [key]: value
      }
    },
    0,
    0
  );
}

/*
 * One HTTP attempt only.
 */
expectFailure(
  {fetchThrows: true},
  1,
  0
);

expectFailure(
  {invalidResponse: true},
  1,
  0
);

expectFailure(
  {status: 302},
  1,
  0
);

expectFailure(
  {status: 500},
  1,
  0
);

expectFailure(
  {missingBlob: true},
  1,
  0
);

/*
 * Exact PDF identity before marker recovery.
 */
expectFailure(
  {
    bytes:
      makeBytes(0)
  },
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        EXPECTED_PDF_BYTES - 1
      )
  },
  1,
  0
);

expectFailure(
  {
    bytes:
      makeBytes(
        MAX_PDF_BYTES + 1
      )
  },
  1,
  0
);

expectFailure(
  {validSignature: false},
  1,
  0
);

expectFailure(
  {contentType: 'text/html'},
  1,
  0
);

expectFailure(
  {wrongPdfSha: true},
  1,
  0
);

/*
 * No recovery retry.
 */
expectFailure(
  {recoveryThrows: true},
  1,
  1
);

/*
 * Fail closed on unsafe evidence.
 */
for (
  const patch
  of [
    {ok: false},
    {markerEvidenceVersion: 2},
    {pdfContentSha256: '0'.repeat(64)},
    {pdfByteLength: EXPECTED_PDF_BYTES - 1},
    {observedTextCharacterCount: EXPECTED_TEXT_CHARACTER_COUNT - 1},
    {observedTextSha256: '0'.repeat(64)},
    {exactRecoveredTextIdentityConfirmed: false},
    {locatorFamilyCount: 4},
    {contextCount: 0},
    {temporaryArtifactCleanupConfirmed: false},
    {driveCreateCount: 2},
    {documentOpenCount: 2},
    {textReadCount: 2},
    {fullOcrTextReturned: true},
    {genericTextPreviewReturned: true},
    {pdfBytesReturned: true},
    {temporaryDocumentIdReturned: true},
    {sourceDiscoveryExecuted: true},
    {httpFetchExecuted: true},
    {priorDriveArtifactSearchExecuted: true},
    {probateParsingExecuted: true},
    {parserRepairExecuted: true},
    {propertyLookupExecuted: true},
    {opaLookupExecuted: true},
    {propertyReconciliationExecuted: true},
    {leadCreationExecuted: true},
    {persistenceExecuted: true},
    {schedulerInspectionExecuted: true},
    {schedulerMutationExecuted: true},
    {triggerMutationExecuted: true},
    {checkpointMutationExecuted: true},
    {cursorMutationExecuted: true},
    {countyDataMutationExecuted: true},
    {arvAuthorityGranted: true},
    {repairScopeAuthorityGranted: true},
    {maoAuthorityGranted: true},
    {offerAuthorityGranted: true}
  ]
) {
  expectFailure(
    {
      markerResultPatch:
        patch
    },
    1,
    1
  );
}

/*
 * Context contract failures.
 */
expectFailure(
  {
    markerResultMutator(result) {
      result.contexts[0]
        .locatorLabels =
          [];
    }
  },
  1,
  1
);

expectFailure(
  {
    markerResultMutator(result) {
      result.contexts[0]
        .locatorLabels =
          ['NOT-FIXED'];
    }
  },
  1,
  1
);

expectFailure(
  {
    markerResultMutator(result) {
      result.contexts[0]
        .locatorLabels =
          ['ESTATE', 'NOTICE'];
    }
  },
  1,
  1
);

expectFailure(
  {
    markerResultMutator(result) {
      result.contexts[0]
        .contextSha256 =
          '0'.repeat(64);
    }
  },
  1,
  1
);

expectFailure(
  {
    markerResultMutator(result) {
      result.contexts[0]
        .unexpectedField =
          true;
    }
  },
  1,
  1
);

/*
 * Multiple contexts must remain ordered/bounded.
 */
{
  const first =
    makeContext(
      'O R P H A N   E S T A T E',
      1000,
      ['ORPHAN', 'ESTATE']
    );

  const second =
    makeContext(
      'O R P H A N   C O U R T',
      3000,
      ['ORPHAN', 'COURT']
    );

  const testCase =
    createCase({
      markerResultMutator(result) {
        result.contexts =
          [
            first,
            second
          ];

        result.contextCount =
          2;

        result.aggregateContextCharacters =
          first.contextCharacterCount +
          second.contextCharacterCount;
      }
    });

  const result =
    testCase
      .sandbox[
        PUBLIC_RPC
      ]();

  assert.strictEqual(
    result.contextCount,
    2
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.recoveryCount,
    1
  );
}

console.log(
  'PB1_ORPHAN_ANCHORED_DURABLE_EVIDENCE_CAPTURE_PRODUCTION_TRANSPORT_VALIDATOR_PASSED=true'
);

console.log(
  'SYNTHETIC_FIXTURE_MECHANICAL_ONLY=true'
);

console.log(
  'LIVE_HTTP_EXECUTED=false'
);

console.log(
  'LIVE_OCR_EXECUTED=false'
);

console.log(
  'LIVE_DRIVE_EXECUTED=false'
);

console.log(
  'LIVE_DOCUMENT_APP_EXECUTED=false'
);

console.log(
  'PUBLIC_RPC_PARAMETER_COUNT=0'
);

console.log(
  'HTTP_FETCH_CALL_SITE_COUNT=1'
);

console.log(
  'HTTP_FETCH_MAX_PER_INVOCATION=1'
);

console.log(
  'HTTP_RETRY_COUNT=0'
);

console.log(
  'HTTP_FALLBACK_COUNT=0'
);

console.log(
  'SUCCESSOR_RECOVERY_CALL_SITE_COUNT=1'
);

console.log(
  'SUCCESSOR_RECOVERY_MAX_PER_INVOCATION=1'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_VALIDATED=true'
);

console.log(
  'DIRECT_DRIVE_OCR_CALL_SITE_COUNT=0'
);

console.log(
  'PROBATE_PARSING_AUTHORITY=false'
);

console.log(
  'PARSER_REPAIR_AUTHORITY=false'
);

console.log(
  'ARV_AUTHORITY=false'
);

console.log(
  'REPAIR_SCOPE_AUTHORITY=false'
);

console.log(
  'MAO_AUTHORITY=false'
);

console.log(
  'OFFER_AUTHORITY=false'
);
console.log(
  'IMPLEMENTATION_VALIDATION_REQUIREMENT_COUNT=70'
);

console.log(
  'PRIMARY_EVIDENCE_ANCHOR=ORPHAN'
);

console.log(
  'EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true'
);

console.log(
  'GENERIC_LOCATOR_FALLBACK_AUTHORIZED=false'
);

console.log(
  'SECOND_EVIDENCE_SELECTOR_AUTHORIZED=false'
);

console.log(
  'SECOND_CANDIDATE_RANKING_AUTHORIZED=false'
);

console.log(
  'SOURCE_DISCOVERY_CALL_SITE_COUNT=0'
);

console.log(
  'MAX_CONTEXT_COUNT=8'
);

console.log(
  'MAX_CONTEXT_CHARACTERS=800'
);

console.log(
  'MAX_AGGREGATE_CONTEXT_CHARACTERS=6400'
);

console.log(
  'FULL_OCR_TEXT_RETURNED=false'
);

console.log(
  'GENERIC_OCR_PREVIEW_RETURNED=false'
);

console.log(
  'PDF_BYTES_OR_BLOB_RETURNED=false'
);

console.log(
  'TEMPORARY_DOCUMENT_ID_RETURNED=false'
);

console.log(
  'THIRD_V143_RPC_AUTHORIZED=false'
);

console.log(
  'SUCCESSOR_PRODUCTION_RPC_AUTHORIZED=false'
);

console.log(
  'SYNTHETIC_FIXTURE_ESTABLISHES_NEW_OCR_BASELINE=false'
);

console.log(
  'SYNTHETIC_FIXTURE_ESTABLISHES_PARSER_GRAMMAR=false'
);


console.log(
  'DURABLE_LOCAL_RAW_RPC_CAPTURE_REQUIRED=true'
);

console.log(
  'DURABLE_CAPTURE_IMPLEMENTATION_BOUNDARY=EXTERNAL_INVOCATION_HARNESS'
);

console.log(
  'CAPTURE_BEFORE_INTERPRETATION_REQUIRED=true'
);

console.log(
  'CAPTURE_BEFORE_JSON_NORMALIZATION_REQUIRED=true'
);

console.log(
  'RUNTIME_LOCAL_DURABLE_CAPTURE_IMPLEMENTED=false'
);

console.log(
  'V144_RPC_RETRY_AUTHORIZED=false'
);

console.log(
  'AUTHORIZED_FURTHER_V144_PRODUCTION_RPC_COUNT=0'
);

console.log(
  'SUCCESSOR_VERSION_NUMBER_ASSIGNED=false'
);

console.log(
  'SUCCESSOR_LIVE_DIAGNOSTIC_ATTEMPT_AUTHORIZED=false'
);
