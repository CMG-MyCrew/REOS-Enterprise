'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const source =
  fs.readFileSync(
    'build/apps-script-brand/PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js',
    'utf8'
  );

const SOURCE_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const EXPECTED_BYTES = 4220387;
const MAX_BYTES = 26214400;
const NORMAL_LIMIT = 250000;

const PDF_SHA =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

function count(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

assert.strictEqual(
  count(/UrlFetchApp\.fetch\s*\(/g),
  1
);

assert.strictEqual(
  count(
    /\.PhiladelphiaProbateBoundedOversizeTextEvidence\s*\.inspect\s*\(/g
  ),
  1
);

assert(
  source.includes(
    'followRedirects:\n            false'
  )
);

for (
  const prohibited
  of [
    'Drive.Files.create',
    'DocumentApp.openById',
    'DriveApp.getFileById',
    'PropertiesService',
    'SpreadsheetApp',
    'reosPhiladelphiaProbateProductionExtractionOrchestration',
    'PhiladelphiaProbateBoundedTextExtraction',
    'reosPhiladelphiaProbateBoundedPdfFetch',
    'reosPhiladelphiaProbateBoundedSourceDiscovery'
  ]
) {
  assert(
    !source.includes(prohibited),
    prohibited
  );
}

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

function sha(value) {
  return crypto
    .createHash('sha256')
    .update(
      String(value),
      'utf8'
    )
    .digest('hex');
}

function makeBytes(
  length,
  validSignature = true
) {
  const bytes =
    new Uint8Array(length);

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

function evidenceResult() {
  return {
    ok: true,
    evidenceVersion: 1,

    pdfContentSha256:
      PDF_SHA,

    pdfByteLength:
      EXPECTED_BYTES,

    maxPdfBytes:
      MAX_BYTES,

    currentNormalExtractionLimit:
      NORMAL_LIMIT,

    observedTextCharacterCount:
      NORMAL_LIMIT + 123,

    observedTextSha256:
      'a'.repeat(64),

    exceedsCurrentNormalExtractionLimit:
      true,

    acceptedForNormalExtraction:
      false,

    temporaryArtifactCreated:
      true,

    temporaryArtifactCleanupAttempted:
      true,

    temporaryArtifactCleanupConfirmed:
      true,

    driveCreateCount: 1,
    documentOpenCount: 1,
    textReadCount: 1,

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

function makeCase(overrides = {}) {
  const state = {
    fetchCount: 0,
    evidenceCount: 0,
    url: null,
    options: null,
    responseBlob: null,
    evidenceBlob: null
  };

  const bytes =
    overrides.bytes !== undefined
      ? overrides.bytes
      : makeBytes(
          EXPECTED_BYTES,
          overrides.validSignature !== false
        );

  const blob = {
    getBytes() {
      return bytes;
    }
  };

  state.responseBlob = blob;

  const sandbox = {
    console,

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      newBlob(value) {
        return {
          getBytes() {
            return {
              __string:
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
            '__string'
          )
        ) {
          return signedDigest(
            sha(input.__string)
          );
        }

        if (overrides.wrongPdfSha) {
          return signedDigest(
            '0'.repeat(64)
          );
        }

        return signedDigest(
          PDF_SHA
        );
      }
    },

    UrlFetchApp: {
      fetch(url, options) {
        state.fetchCount += 1;
        state.url = url;
        state.options = options;

        if (overrides.fetchThrows) {
          throw new Error(
            'synthetic fetch failure'
          );
        }

        return {
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
                : blob
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
      }
    },

    REOS:
      overrides.missingEvidence
        ? {}
        : {
            PhiladelphiaProbateBoundedOversizeTextEvidence: {
              inspect(providedBlob) {
                state.evidenceCount += 1;
                state.evidenceBlob =
                  providedBlob;

                if (overrides.evidenceThrows) {
                  throw new Error(
                    'synthetic evidence failure'
                  );
                }

                const result =
                  evidenceResult();

                if (overrides.evidencePatch) {
                  Object.assign(
                    result,
                    overrides.evidencePatch
                  );
                }

                return result;
              }
            }
          }
  };

  vm.createContext(sandbox);

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateProductionOversizeTextEvidenceRecovery.js'
    }
  );

  return {
    sandbox,
    state
  };
}

function execute(testCase) {
  return testCase
    .sandbox
    .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery();
}

function failCase(
  overrides,
  fetches,
  evidenceCalls
) {
  const testCase =
    makeCase(overrides);

  assert.throws(
    () => execute(testCase)
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    fetches
  );

  assert.strictEqual(
    testCase.state.evidenceCount,
    evidenceCalls
  );

  return testCase;
}

/* Success. */
{
  const testCase =
    makeCase();

  const result =
    execute(testCase);

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.evidenceCount,
    1
  );

  assert.strictEqual(
    testCase.state.url,
    SOURCE_URL
  );

  assert.strictEqual(
    testCase.state.options.method,
    'get'
  );

  assert.strictEqual(
    testCase.state.options.followRedirects,
    false
  );

  assert.strictEqual(
    testCase.state.options.muteHttpExceptions,
    true
  );

  assert.strictEqual(
    testCase.state.options.headers.Accept,
    'application/pdf'
  );

  assert.strictEqual(
    testCase.state.evidenceBlob,
    testCase.state.responseBlob
  );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.recoveryVersion,
    1
  );

  assert.strictEqual(
    result.httpFetchCount,
    1
  );

  assert.strictEqual(
    result.evidenceCount,
    1
  );

  assert.strictEqual(
    result.currentNormalExtractionLimit,
    NORMAL_LIMIT
  );

  assert.strictEqual(
    result.observedTextCharacterCount,
    NORMAL_LIMIT + 123
  );

  assert.strictEqual(
    result.exceedsCurrentNormalExtractionLimit,
    true
  );

  assert.strictEqual(
    result.acceptedForNormalExtraction,
    false
  );

  assert.strictEqual(
    result.fullExtractedTextReturned,
    false
  );

  assert.strictEqual(
    result.textPreviewReturned,
    false
  );

  assert.strictEqual(
    result.pdfBytesReturned,
    false
  );
}

/* Missing component fails before HTTP. */
failCase(
  {
    missingEvidence: true
  },
  0,
  0
);

/* One transport only, no retry. */
failCase(
  {
    fetchThrows: true
  },
  1,
  0
);

failCase(
  {
    status: 302
  },
  1,
  0
);

failCase(
  {
    status: 500
  },
  1,
  0
);

failCase(
  {
    bytes:
      new Uint8Array(0)
  },
  1,
  0
);

failCase(
  {
    bytes:
      makeBytes(
        EXPECTED_BYTES - 1
      )
  },
  1,
  0
);

failCase(
  {
    bytes:
      makeBytes(
        MAX_BYTES + 1
      )
  },
  1,
  0
);

failCase(
  {
    validSignature:
      false
  },
  1,
  0
);

failCase(
  {
    contentType:
      'text/html'
  },
  1,
  0
);

failCase(
  {
    wrongPdfSha:
      true
  },
  1,
  0
);

/* Missing Content-Type remains acceptable. */
{
  const testCase =
    makeCase({
      noContentType: true
    });

  const result =
    execute(testCase);

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    testCase.state.fetchCount,
    1
  );

  assert.strictEqual(
    testCase.state.evidenceCount,
    1
  );
}

/* Evidence failure never refetches. */
failCase(
  {
    evidenceThrows: true
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      observedTextCharacterCount:
        NORMAL_LIMIT
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      exceedsCurrentNormalExtractionLimit:
        false
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      acceptedForNormalExtraction:
        true
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      temporaryArtifactCleanupConfirmed:
        false
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      fullExtractedTextReturned:
        true
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      textPreviewReturned:
        true
    }
  },
  1,
  1
);

failCase(
  {
    evidencePatch: {
      pdfBytesReturned:
        true
    }
  },
  1,
  1
);

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
  failCase(
    {
      evidencePatch: {
        [unsafeFlag]:
          true
      }
    },
    1,
    1
  );
}

console.log(
  'PB1_PRODUCTION_OVERSIZE_TEXT_EVIDENCE_RECOVERY_BEHAVIOR_VALIDATOR_PASSED=true'
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
  'EVIDENCE_COMPONENT_CALL_SITE_COUNT=1'
);

console.log(
  'SAME_RESPONSE_BLOB_HANDOFF_CERTIFIED=true'
);

console.log(
  'PDF_IDENTITY_VALIDATED_BEFORE_EVIDENCE=true'
);

console.log(
  'EVIDENCE_FAILURE_REFETCH_COUNT=0'
);

console.log(
  'DIRECT_DRIVE_CREATE_CALL_SITE_COUNT=0'
);

console.log(
  'DIRECT_DOCUMENT_OPEN_CALL_SITE_COUNT=0'
);

console.log(
  'NORMAL_EXTRACTION_RUNTIME_CALL_SITE_COUNT=0'
);

console.log(
  'CURRENT_NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT_CHANGED=false'
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
  'LIVE_HTTP_EXECUTED_BY_VALIDATOR=false'
);

console.log(
  'LIVE_OCR_EXECUTED_BY_VALIDATOR=false'
);
