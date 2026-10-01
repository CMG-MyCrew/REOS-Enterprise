'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const vm = require('vm');

const source =
  fs.readFileSync(
    'build/apps-script-brand/PhiladelphiaProbateBoundedOversizeTextEvidence.js',
    'utf8'
  );

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
  count(/Drive\.Files\.create\s*\(/g),
  1
);

assert.strictEqual(
  count(/DocumentApp\.openById\s*\(/g),
  1
);

assert.strictEqual(
  count(/\.getText\s*\(\s*\)/g),
  1
);

assert.strictEqual(
  count(/DriveApp\s*\.getFileById\s*\(/g),
  1
);

assert(
  !source.includes('UrlFetchApp')
);

assert(
  !source.includes('Drive.Files.list')
);

assert(
  !source.includes('Drive.Files.get')
);

assert(
  source.includes(
    'CURRENT_NORMAL_EXTRACTION_LIMIT =\n      250000'
  )
);

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

function shaText(value) {
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

function makeCase(overrides = {}) {
  const state = {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0,
    openedId: null,
    cleanupId: null,
    createdBlob: null
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

  const text =
    overrides.text !== undefined
      ? overrides.text
      : 'X'.repeat(
          NORMAL_LIMIT + 123
        );

  const documentId =
    'TEMP-DOC-1';

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
              __text:
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
            '__text'
          )
        ) {
          return signedDigest(
            shaText(input.__text)
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

    Drive: {
      Files: {
        create(
          metadata,
          providedBlob,
          options
        ) {
          state.driveCreates += 1;
          state.createdBlob =
            providedBlob;

          assert.strictEqual(
            options.ocrLanguage,
            'en'
          );

          if (overrides.driveCreateThrows) {
            throw new Error(
              'synthetic create failure'
            );
          }

          if (overrides.missingDocumentId) {
            return {};
          }

          return {
            id:
              documentId
          };
        }
      }
    },

    DocumentApp: {
      openById(id) {
        state.documentOpens += 1;
        state.openedId = id;

        if (overrides.documentOpenThrows) {
          throw new Error(
            'synthetic open failure'
          );
        }

        return {
          getBody() {
            return {
              getText() {
                state.textReads += 1;

                if (overrides.textReadThrows) {
                  throw new Error(
                    'synthetic text-read failure'
                  );
                }

                return text;
              }
            };
          }
        };
      }
    },

    DriveApp: {
      getFileById(id) {
        state.cleanupLookups += 1;
        state.cleanupId = id;

        return {
          setTrashed(value) {
            state.trashCalls += 1;

            assert.strictEqual(
              value,
              true
            );

            if (overrides.cleanupThrows) {
              throw new Error(
                'synthetic cleanup failure'
              );
            }

            return true;
          }
        };
      }
    },

    REOS: {}
  };

  vm.createContext(sandbox);

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateBoundedOversizeTextEvidence.js'
    }
  );

  return {
    sandbox,
    state,
    blob,
    text,
    documentId
  };
}

function inspect(testCase) {
  return testCase
    .sandbox
    .REOS
    .PhiladelphiaProbateBoundedOversizeTextEvidence
    .inspect(
      testCase.blob
    );
}

function failCase(
  overrides,
  expected
) {
  const testCase =
    makeCase(overrides);

  assert.throws(
    () => inspect(testCase)
  );

  for (
    const [key, value]
    of Object.entries(expected)
  ) {
    assert.strictEqual(
      testCase.state[key],
      value,
      key
    );
  }

  return testCase;
}

/* Success. */
{
  const testCase =
    makeCase();

  const result =
    inspect(testCase);

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.evidenceVersion,
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
    result.currentNormalExtractionLimit,
    NORMAL_LIMIT
  );

  assert.strictEqual(
    result.observedTextCharacterCount,
    testCase.text.length
  );

  assert.strictEqual(
    result.observedTextSha256,
    shaText(testCase.text)
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
    result.temporaryArtifactCleanupConfirmed,
    true
  );

  assert.strictEqual(
    testCase.state.driveCreates,
    1
  );

  assert.strictEqual(
    testCase.state.documentOpens,
    1
  );

  assert.strictEqual(
    testCase.state.textReads,
    1
  );

  assert.strictEqual(
    testCase.state.cleanupLookups,
    1
  );

  assert.strictEqual(
    testCase.state.trashCalls,
    1
  );

  assert.strictEqual(
    testCase.state.createdBlob,
    testCase.blob
  );

  assert.strictEqual(
    testCase.state.openedId,
    testCase.documentId
  );

  assert.strictEqual(
    testCase.state.cleanupId,
    testCase.documentId
  );

  for (
    const forbidden
    of [
      'text',
      'fullText',
      'rawText',
      'textPreview',
      'preview',
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
        forbidden
      )
    );
  }
}

/* PDF failures happen before Drive creation. */
failCase(
  {
    bytes:
      makeBytes(
        EXPECTED_BYTES - 1
      )
  },
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

failCase(
  {
    bytes:
      makeBytes(
        MAX_BYTES + 1
      )
  },
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

failCase(
  {
    validSignature:
      false
  },
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

failCase(
  {
    wrongPdfSha:
      true
  },
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

/* Post-create failures clean exact ID. */
failCase(
  {
    documentOpenThrows:
      true
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 0,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

failCase(
  {
    textReadThrows:
      true
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

failCase(
  {
    text:
      '   '
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/* <=250000 is contradictory, not evidence success. */
failCase(
  {
    text:
      'X'.repeat(
        NORMAL_LIMIT
      )
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/* Cleanup failure fails closed. */
failCase(
  {
    cleanupThrows:
      true
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

console.log(
  'PB1_BOUNDED_OVERSIZE_TEXT_EVIDENCE_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'URLFETCH_SURFACE_PRESENT=false'
);

console.log(
  'PRIOR_TEMP_ARTIFACT_SEARCH_SURFACE_PRESENT=false'
);

console.log(
  'PDF_IDENTITY_VERIFIED_BEFORE_DRIVE_CREATE=true'
);

console.log(
  'DRIVE_CREATE_SITE_COUNT_EXACT=1'
);

console.log(
  'DOCUMENT_OPEN_SITE_COUNT_EXACT=1'
);

console.log(
  'BODY_TEXT_READ_SITE_COUNT_EXACT=1'
);

console.log(
  'CLEANUP_SITE_COUNT_EXACT=1'
);

console.log(
  'CURRENT_NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT_CHANGED=false'
);

console.log(
  'SUCCESS_REQUIRES_OBSERVED_COUNT_GREATER_THAN_250000=true'
);

console.log(
  'COMPLETE_TEXT_SHA256_CERTIFIED=true'
);

console.log(
  'EXACT_CREATED_ID_OPEN_AND_CLEANUP_CERTIFIED=true'
);

console.log(
  'POST_CREATE_FAILURE_CLEANUP_CERTIFIED=true'
);

console.log(
  'CLEANUP_FAILURE_FAILS_CLOSED=true'
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
