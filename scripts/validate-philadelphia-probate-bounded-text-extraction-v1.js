'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

const IMPLEMENTATION = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'PhiladelphiaProbateBoundedTextExtraction.js'
);

assert(
  fs.existsSync(IMPLEMENTATION),
  'Bounded text extraction implementation missing.'
);

const source =
  fs.readFileSync(
    IMPLEMENTATION,
    'utf8'
  );

const EXPECTED_PDF_SHA =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const EXPECTED_PDF_BYTES =
  4220387;

const MAX_PDF_BYTES =
  26214400;

const MAX_TEXT_CHARS =
  250000;

/*
 * Offline fixtures intentionally do not allocate the real 4.2 MiB PDF.
 * The digest mock recognizes the synthetic PDF fixture and returns the
 * certified production digest. This tests control flow and authority
 * boundaries without reproducing or fetching production content.
 */
function makePdfBytes(options = {}) {
  const length =
    options.length === undefined
      ? EXPECTED_PDF_BYTES
      : options.length;

  const bytes = {
    length,
    _fixture: 'pdf',
    _signature:
      options.signature === undefined
        ? true
        : options.signature,
    _sha:
      options.sha || EXPECTED_PDF_SHA
  };

  for (let i = 0; i < 5; i += 1) {
    const good = [
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d
    ];

    bytes[i] =
      bytes._signature
        ? good[i]
        : 0;
  }

  return bytes;
}

function makeRuntime(options = {}) {
  const state = {
    driveCreates: [],
    documentOpens: [],
    cleanupLookups: [],
    trashCalls: [],
    httpFetches: 0
  };

  const pdfBytes =
    options.pdfBytes ||
    makePdfBytes();

  const text =
    options.text === undefined
      ? 'Estate of Example Decedent\nPhiladelphia probate notice'
      : options.text;

  const documentId =
    options.documentId === undefined
      ? 'TEMP-DOC-1'
      : options.documentId;

  const context = {
    console,

    REOS: {},

    Utilities: {
      DigestAlgorithm: {
        SHA_256: 'SHA_256'
      },

      computeDigest(algorithm, value) {
        assert.strictEqual(
          algorithm,
          'SHA_256'
        );

        if (
          value &&
          value._fixture === 'pdf'
        ) {
          return Array.from(
            Buffer.from(
              value._sha,
              'hex'
            )
          );
        }

        const buffer =
          Buffer.from(
            Array.from(value)
          );

        return Array.from(
          crypto
            .createHash('sha256')
            .update(buffer)
            .digest()
        );
      },

      newBlob(value) {
        return {
          getBytes() {
            return Array.from(
              Buffer.from(
                String(value),
                'utf8'
              )
            );
          }
        };
      }
    },

    Drive: {
      Files: {
        create(metadata, blob, request) {
          state.driveCreates.push({
            metadata,
            blob,
            request
          });

          if (options.driveCreateError) {
            throw new Error(
              options.driveCreateError
            );
          }

          if (options.missingDocumentId) {
            return {};
          }

          return {
            id: documentId,
            name: metadata.name,
            mimeType: metadata.mimeType
          };
        }
      }
    },

    DocumentApp: {
      openById(id) {
        state.documentOpens.push(id);

        if (options.documentOpenError) {
          throw new Error(
            options.documentOpenError
          );
        }

        return {
          getBody() {
            return {
              getText() {
                if (options.textReadError) {
                  throw new Error(
                    options.textReadError
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
        state.cleanupLookups.push(id);

        if (options.cleanupLookupError) {
          throw new Error(
            options.cleanupLookupError
          );
        }

        return {
          setTrashed(value) {
            state.trashCalls.push({
              id,
              value
            });

            if (options.cleanupError) {
              throw new Error(
                options.cleanupError
              );
            }

            return true;
          }
        };
      }
    },

    UrlFetchApp: {
      fetch() {
        state.httpFetches += 1;
        throw new Error(
          'UrlFetchApp.fetch must never execute.'
        );
      }
    }
  };

  if (options.noDrive) {
    delete context.Drive;
  }

  if (options.noDocumentApp) {
    delete context.DocumentApp;
  }

  if (options.noDriveApp) {
    delete context.DriveApp;
  }

  vm.createContext(context);

  vm.runInContext(
    source,
    context,
    {
      filename:
        'PhiladelphiaProbateBoundedTextExtraction.js'
    }
  );

  return {
    state,
    module:
      context.REOS
        .PhiladelphiaProbateBoundedTextExtraction,
    blob: {
      getBytes() {
        return pdfBytes;
      }
    }
  };
}

function expectFailure(
  name,
  options,
  expectedMessage,
  expected
) {
  const runtime =
    makeRuntime(options);

  let error = null;

  try {
    runtime.module.extract(
      runtime.blob
    );
  } catch (caught) {
    error =
      caught;
  }

  assert(
    error,
    name + ': expected failure'
  );

  assert(
    String(error.message).includes(
      expectedMessage
    ),
    name +
      ': wrong error: ' +
      String(error.message)
  );

  if (expected) {
    if (
      expected.driveCreates !== undefined
    ) {
      assert.strictEqual(
        runtime.state.driveCreates.length,
        expected.driveCreates,
        name + ': Drive create count'
      );
    }

    if (
      expected.documentOpens !== undefined
    ) {
      assert.strictEqual(
        runtime.state.documentOpens.length,
        expected.documentOpens,
        name + ': Document open count'
      );
    }

    if (
      expected.cleanupLookups !== undefined
    ) {
      assert.strictEqual(
        runtime.state.cleanupLookups.length,
        expected.cleanupLookups,
        name + ': cleanup lookup count'
      );
    }

    if (
      expected.trashCalls !== undefined
    ) {
      assert.strictEqual(
        runtime.state.trashCalls.length,
        expected.trashCalls,
        name + ': trash call count'
      );
    }
  }

  assert.strictEqual(
    runtime.state.httpFetches,
    0,
    name + ': HTTP must remain zero'
  );

  return runtime;
}

/* Static prohibitions. */
assert(
  !source.includes('UrlFetchApp.fetch'),
  'Implementation must have zero UrlFetchApp.fetch surface.'
);

assert(
  !source.includes('PhiladelphiaProbateRecurringSource'),
  'Implementation must have zero source-discovery surface.'
);

assert(
  !source.includes('probateSourcePreflight_'),
  'Implementation must not call broad probate preflight.'
);

assert(
  !source.includes('probateSourceAuthority'),
  'Implementation must not call probate source authority.'
);

assert(
  !source.includes('PropertiesService'),
  'Implementation must have zero PropertiesService surface.'
);

assert(
  !source.includes('SpreadsheetApp'),
  'Implementation must have zero SpreadsheetApp surface.'
);

assert(
  !source.includes('DISTRESS_LEADS'),
  'Implementation must not reference distress-lead persistence.'
);

assert.strictEqual(
  (
    source.match(
      /Drive\.Files\.create\s*\(/g
    ) || []
  ).length,
  1,
  'Implementation must contain exactly one executable Drive.Files.create call site.'
);

assert.strictEqual(
  (
    source.match(
      /DocumentApp\.openById\s*\(/g
    ) || []
  ).length,
  1,
  'Implementation must contain exactly one executable DocumentApp.openById call site.'
);

/* Success. */
{
  const runtime =
    makeRuntime();

  const result =
    runtime.module.extract(
      runtime.blob
    );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.pdfContentSha256,
    EXPECTED_PDF_SHA
  );

  assert.strictEqual(
    result.pdfByteLength,
    EXPECTED_PDF_BYTES
  );

  assert.strictEqual(
    result.maxPdfBytes,
    MAX_PDF_BYTES
  );

  assert.strictEqual(
    result.maxExtractedTextCharacters,
    MAX_TEXT_CHARS
  );

  assert.strictEqual(
    result.temporaryArtifactCreated,
    true
  );

  assert.strictEqual(
    result.temporaryArtifactCleanupAttempted,
    true
  );

  assert.strictEqual(
    result.temporaryArtifactCleanupConfirmed,
    true
  );

  assert.strictEqual(
    result.driveCreateCount,
    1
  );

  assert.strictEqual(
    result.documentOpenCount,
    1
  );

  assert.strictEqual(
    result.fullExtractedTextReturned,
    false
  );

  assert.strictEqual(
    result.pdfBytesReturned,
    false
  );

  assert.strictEqual(
    runtime.state.driveCreates.length,
    1
  );

  assert.strictEqual(
    runtime.state.documentOpens.length,
    1
  );

  assert.strictEqual(
    runtime.state.cleanupLookups.length,
    1
  );

  assert.strictEqual(
    runtime.state.trashCalls.length,
    1
  );

  assert.strictEqual(
    runtime.state.trashCalls[0].id,
    'TEMP-DOC-1'
  );

  assert.strictEqual(
    runtime.state.trashCalls[0].value,
    true
  );

  assert.strictEqual(
    runtime.state.httpFetches,
    0
  );

  assert.strictEqual(
    result.sourceDiscoveryExecuted,
    false
  );

  assert.strictEqual(
    result.connectorFetchExecuted,
    false
  );

  assert.strictEqual(
    result.connectorRegistrationExecuted,
    false
  );

  assert.strictEqual(
    result.probateParsingExecuted,
    false
  );

  assert.strictEqual(
    result.leadCreationExecuted,
    false
  );

  assert.strictEqual(
    result.persistenceExecuted,
    false
  );

  assert.strictEqual(
    result.countyDataMutationExecuted,
    false
  );

  assert.strictEqual(
    result.arvAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.repairScopeAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.maoAuthorityGranted,
    false
  );

  assert.strictEqual(
    result.offerAuthorityGranted,
    false
  );

  console.log(
    'SUCCESS_TEMP_ARTIFACT_COUNT_EXACT=1'
  );
  console.log(
    'SUCCESS_DOCUMENT_OPEN_COUNT_EXACT=1'
  );
  console.log(
    'SUCCESS_CLEANUP_COUNT_EXACT=1'
  );
}

/*
 * Pre-create failures:
 * zero Drive create and zero cleanup.
 */
/*
 * Direct missing-input call.
 */
{
  const runtime =
    makeRuntime();

  let error = null;

  try {
    runtime.module.extract(null);
  } catch (caught) {
    error = caught;
  }

  assert(error);
  assert(
    String(error.message).includes(
      'requires a PDF blob'
    )
  );

  assert.strictEqual(
    runtime.state.driveCreates.length,
    0
  );
}

expectFailure(
  'wrong length',
  {
    pdfBytes:
      makePdfBytes({
        length:
          EXPECTED_PDF_BYTES - 1
      })
  },
  'byte length mismatch',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'oversize',
  {
    pdfBytes:
      makePdfBytes({
        length:
          MAX_PDF_BYTES + 1
      })
  },
  'exceeds maximum size',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'invalid signature',
  {
    pdfBytes:
      makePdfBytes({
        signature: false
      })
  },
  'signature is invalid',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'wrong sha',
  {
    pdfBytes:
      makePdfBytes({
        sha:
          '0'.repeat(64)
      })
  },
  'SHA-256 mismatch',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'missing Drive',
  {
    noDrive: true
  },
  'requires Advanced Drive v3',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'missing DocumentApp',
  {
    noDocumentApp: true
  },
  'requires DocumentApp',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

expectFailure(
  'missing DriveApp',
  {
    noDriveApp: true
  },
  'requires DriveApp cleanup',
  {
    driveCreates: 0,
    cleanupLookups: 0
  }
);

/*
 * Create failure: no artifact ID exists, so no cleanup target exists.
 */
expectFailure(
  'Drive create failure',
  {
    driveCreateError:
      'synthetic Drive create failure'
  },
  'synthetic Drive create failure',
  {
    driveCreates: 1,
    documentOpens: 0,
    cleanupLookups: 0
  }
);

/*
 * A create response without an ID cannot be safely opened or cleaned.
 */
expectFailure(
  'missing document ID',
  {
    missingDocumentId: true
  },
  'conversion returned no document ID',
  {
    driveCreates: 1,
    documentOpens: 0,
    cleanupLookups: 0
  }
);

/*
 * All failures after a valid temporary ID must cleanup that exact ID.
 */
expectFailure(
  'Document open failure',
  {
    documentOpenError:
      'synthetic document open failure'
  },
  'synthetic document open failure',
  {
    driveCreates: 1,
    documentOpens: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

expectFailure(
  'text read failure',
  {
    textReadError:
      'synthetic text read failure'
  },
  'synthetic text read failure',
  {
    driveCreates: 1,
    documentOpens: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

expectFailure(
  'empty text',
  {
    text: '   '
  },
  'returned no text',
  {
    driveCreates: 1,
    documentOpens: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

expectFailure(
  'oversize text',
  {
    text:
      'X'.repeat(
        MAX_TEXT_CHARS + 1
      )
  },
  'exceeded maximum text length',
  {
    driveCreates: 1,
    documentOpens: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

expectFailure(
  'cleanup failure',
  {
    cleanupError:
      'synthetic cleanup failure'
  },
  'temporary artifact cleanup failed',
  {
    driveCreates: 1,
    documentOpens: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

console.log(
  'PB1_BOUNDED_TEXT_EXTRACTION_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PDF_IDENTITY_VERIFIED_BEFORE_DRIVE_CREATE=true'
);

console.log(
  'EXPECTED_PDF_BYTES=' +
  EXPECTED_PDF_BYTES
);

console.log(
  'MAX_PDF_BYTES=' +
  MAX_PDF_BYTES
);

console.log(
  'MAX_EXTRACTED_TEXT_CHARACTERS=' +
  MAX_TEXT_CHARS
);

console.log(
  'DRIVE_CREATE_SITE_COUNT_EXACT=1'
);

console.log(
  'DOCUMENT_OPEN_SITE_COUNT_EXACT=1'
);

console.log(
  'POST_CREATE_FAILURE_CLEANUP_CERTIFIED=true'
);

console.log(
  'CLEANUP_FAILURE_FAILS_CLOSED=true'
);

console.log(
  'URLFETCH_SURFACE_PRESENT=false'
);

console.log(
  'PRODUCTION_HTTP_EXECUTED=false'
);

console.log(
  'PRODUCTION_PDF_FETCH_EXECUTED=false'
);

console.log(
  'PRODUCTION_DRIVE_OCR_EXECUTED=false'
);

console.log(
  'PRODUCTION_DOCUMENT_APP_EXECUTED=false'
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
  'ARV_REPAIR_MAO_OFFER_AUTHORITY=false'
);
