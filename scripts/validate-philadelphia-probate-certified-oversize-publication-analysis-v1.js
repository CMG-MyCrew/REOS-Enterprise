'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const vm =
  require('vm');

const source =
  fs.readFileSync(
    'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysis.js',
    'utf8'
  );

const EXPECTED_PDF_BYTES =
  4220387;

const MAX_PDF_BYTES =
  26214400;

const NORMAL_LIMIT =
  250000;

const OVERSIZE_LIMIT =
  600000;

const EXPECTED_TEXT_COUNT =
  566435;

const NOTICE_PAGE_SIZE =
  25;

const REPRESENTATIVE_TEXT_LIMIT =
  500;

const PDF_SHA =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const TEXT_SHA =
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

function count(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

assert.strictEqual(
  count(
    /Drive\.Files\.create\s*\(/g
  ),
  1
);

assert.strictEqual(
  count(
    /DocumentApp\.openById\s*\(/g
  ),
  1
);

assert.strictEqual(
  count(
    /\.getText\s*\(\s*\)/g
  ),
  1
);

assert.strictEqual(
  count(
    /DriveApp\s*\.getFileById\s*\(/g
  ),
  1
);

for (
  const forbidden
  of [
    'UrlFetchApp',
    'PropertiesService',
    'SpreadsheetApp',
    'ScriptApp',
    'LockService',
    'GmailApp',
    'CalendarApp',
    'CountyAdapters',
    'PAPhiladelphiaCountyConnector'
  ]
) {
  assert(
    !source.includes(
      forbidden
    ),
    forbidden
  );
}

assert(
  !/function\s+reos[A-Za-z0-9_]*\s*\(/.test(
    source
  )
);

assert(
  !source.includes(
    'Drive.Files.list'
  )
);

assert(
  !source.includes(
    'Drive.Files.get'
  )
);

assert(
  !source.includes(
    'getFilesByName'
  )
);

assert(
  !source.includes(
    'searchFiles'
  )
);

assert(
  source.includes(
    'CURRENT_NORMAL_EXTRACTION_LIMIT =\n      250000'
  )
);

assert(
  source.includes(
    'CERTIFIED_OVERSIZE_TEXT_LIMIT =\n      600000'
  )
);

assert(
  source.includes(
    'EXPECTED_TEXT_CHARACTER_COUNT =\n      566435'
  )
);

assert(
  source.includes(
    TEXT_SHA
  )
);

assert(
  source.includes(
    'NOTICE_PAGE_SIZE =\n      25'
  )
);

assert(
  source.includes(
    'REPRESENTATIVE_TEXT_LIMIT =\n      500'
  )
);

assert(
  source.includes(
    "CURSOR_DOMAIN =\n      'PHL-PROBATE-PB1-V1'"
  )
);

assert(
  source.includes(
    'candidate.indexOf'
  )
);

assert(
  source.includes(
    '\\u2013'
  )
);

assert(
  source.includes(
    'ESTATE[\\s]+NOTICES'
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
        hex.slice(
          i,
          i + 2
        ),
        16
      );

    if (value > 127) {
      value -=
        256;
    }

    bytes.push(
      value
    );
  }

  return bytes;
}

function makePdfBytes(
  length,
  validSignature = true
) {
  const bytes =
    new Uint8Array(
      length
    );

  if (
    length >=
    5
  ) {
    bytes[0] =
      validSignature
        ? 0x25
        : 0x00;

    bytes[1] =
      0x50;

    bytes[2] =
      0x44;

    bytes[3] =
      0x46;

    bytes[4] =
      0x2d;
  }

  return bytes;
}

function basePublication(
  noticeCount = 30
) {
  const lines = [
    'SEPTEMBER 30, 2026',
    'ESTATE NOTICES',
    "ORPHANS' COURT DIVISION"
  ];

  for (
    let i = 1;
    i <= noticeCount;
    i += 1
  ) {
    lines.push(
      String(i) +
      '. SURNAME' +
      String(i) +
      ', JOHN A. – Jane Representative, Executor.'
    );
  }

  /*
   * Deliberately parseable-looking but unauthorized entries.
   * No comma => not a decedent.
   * No authorized representative role => not an estate notice.
   */
  lines.push(
    '31. ROBERT SCHAFFER JR. SPECIAL NEEDS TRUST – Jane Representative, Executor.'
  );

  lines.push(
    '32. FALSE, PERSON – Jane Representative, Counsel.'
  );

  return (
    lines.join('\n') +
    '\n'
  );
}

function exactText(
  options = {}
) {
  let prefix;

  if (
    options.missingMarker
  ) {
    prefix =
      'SEPTEMBER 30, 2026\n' +
      'NO AUTHORIZED PROBATE MARKER\n';
  } else if (
    options.wrongPublicationDate
  ) {
    prefix =
      basePublication(
        options.noticeCount === undefined
          ? 30
          : options.noticeCount
      )
        .replace(
          'SEPTEMBER 30, 2026',
          'SEPTEMBER 29, 2026'
        );
  } else if (
    options.noNotices
  ) {
    prefix =
      'SEPTEMBER 30, 2026\n' +
      'ESTATE NOTICES\n' +
      "ORPHANS' COURT DIVISION\n";
  } else {
    prefix =
      basePublication(
        options.noticeCount === undefined
          ? 30
          : options.noticeCount
      );
  }

  const target =
    options.targetLength === undefined
      ? EXPECTED_TEXT_COUNT
      : options.targetLength;

  assert(
    prefix.length <= target
  );

  return (
    prefix +
    'X'.repeat(
      target -
      prefix.length
    )
  );
}

function makeCase(
  overrides = {}
) {
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
    overrides.bytes !==
    undefined
      ? overrides.bytes
      : makePdfBytes(
          EXPECTED_PDF_BYTES,
          overrides.validSignature !==
            false
        );

  const blob = {
    getBytes() {
      return bytes;
    }
  };

  const text =
    overrides.text !==
    undefined
      ? overrides.text
      : exactText(
          overrides.textOptions ||
          {}
        );

  const documentId =
    'PB1-TEMP-DOC-1';

  const sandbox = {
    console,

    Utilities: {
      DigestAlgorithm: {
        SHA_256:
          'SHA_256'
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
          Object.prototype
            .hasOwnProperty
            .call(
              input,
              '__text'
            )
        ) {
          return signedDigest(
            overrides
              .wrongTextSha
              ? '0'.repeat(64)
              : TEXT_SHA
          );
        }

        return signedDigest(
          overrides
            .wrongPdfSha
            ? 'f'.repeat(64)
            : PDF_SHA
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
          state.driveCreates +=
            1;

          state.createdBlob =
            providedBlob;

          assert.strictEqual(
            metadata.mimeType,
            'application/vnd.google-apps.document'
          );

          assert.strictEqual(
            options.ocrLanguage,
            'en'
          );

          if (
            overrides.driveCreateThrows
          ) {
            throw new Error(
              'synthetic create failure'
            );
          }

          if (
            overrides.missingDocumentId
          ) {
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
        state.documentOpens +=
          1;

        state.openedId =
          id;

        if (
          overrides.documentOpenThrows
        ) {
          throw new Error(
            'synthetic open failure'
          );
        }

        return {
          getBody() {
            return {
              getText() {
                state.textReads +=
                  1;

                if (
                  overrides.textReadThrows
                ) {
                  throw new Error(
                    'synthetic text read failure'
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
        state.cleanupLookups +=
          1;

        state.cleanupId =
          id;

        return {
          setTrashed(value) {
            state.trashCalls +=
              1;

            assert.strictEqual(
              value,
              true
            );

            if (
              overrides.cleanupThrows
            ) {
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

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateCertifiedOversizePublicationAnalysis.js'
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

function analyze(
  testCase,
  offset
) {
  return testCase
    .sandbox
    .REOS
    .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
    .analyze(
      testCase.blob,
      offset
    );
}

function assertCleaned(
  testCase
) {
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
}

function failCase(
  overrides,
  offset,
  expectedState
) {
  const testCase =
    makeCase(
      overrides
    );

  assert.throws(
    () =>
      analyze(
        testCase,
        offset
      )
  );

  for (
    const [
      key,
      value
    ]
    of Object.entries(
      expectedState
    )
  ) {
    assert.strictEqual(
      testCase.state[key],
      value,
      key
    );
  }

  return testCase;
}

/*
 * Success: first bounded 25-notice page.
 */
{
  const testCase =
    makeCase();

  const result =
    analyze(
      testCase,
      0
    );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.analysisVersion,
    1
  );

  assert.strictEqual(
    result.publicationDate,
    '2026-09-30'
  );

  assert.strictEqual(
    result.pdfByteLength,
    EXPECTED_PDF_BYTES
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
    result.certifiedOversizeTextLimit,
    OVERSIZE_LIMIT
  );

  assert.strictEqual(
    result.observedTextCharacterCount,
    EXPECTED_TEXT_COUNT
  );

  assert.strictEqual(
    result.observedTextSha256,
    TEXT_SHA
  );

  assert.strictEqual(
    result.exactRecoveredTextIdentityConfirmed,
    true
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
    result.probateParsingExecuted,
    true
  );

  /*
   * The two deliberately unauthorized anchors do not parse.
   */
  assert.strictEqual(
    result.parsedNoticeCount,
    30
  );

  assert.strictEqual(
    result.noticeOffset,
    0
  );

  assert.strictEqual(
    result.noticePageSize,
    NOTICE_PAGE_SIZE
  );

  assert.strictEqual(
    result.selectedNoticeCount,
    25
  );

  assert.strictEqual(
    result.notices.length,
    25
  );

  assert.strictEqual(
    result.nextNoticeOffset,
    25
  );

  assert.strictEqual(
    result.hasMore,
    true
  );

  assert.strictEqual(
    result.cursorDomain,
    'PHL-PROBATE-PB1-V1'
  );

  assert.strictEqual(
    result.representativeTextLimit,
    REPRESENTATIVE_TEXT_LIMIT
  );

  result.notices
    .forEach(
      (notice) => {
        assert(
          notice.decedent.includes(',')
        );

        assert(
          notice.normalizedDecedent
        );

        assert.strictEqual(
          notice.publicationDate,
          '2026-09-30'
        );

        assert(
          notice.representativeText.length <=
          REPRESENTATIVE_TEXT_LIMIT
        );
      }
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
    result.textReadCount,
    1
  );

  for (
    const key
    of [
      'fullExtractedTextReturned',
      'textPreviewReturned',
      'pdfBytesReturned',
      'sourceDiscoveryExecuted',
      'httpFetchExecuted',
      'opaLookupExecuted',
      'propertyReconciliationExecuted',
      'leadCreationExecuted',
      'persistenceExecuted',
      'configurationExecuted',
      'schedulerInspectionExecuted',
      'schedulerMutationExecuted',
      'triggerMutationExecuted',
      'checkpointMutationExecuted',
      'countyDataMutationExecuted',
      'arvAuthorityGranted',
      'repairScopeAuthorityGranted',
      'maoAuthorityGranted',
      'offerAuthorityGranted'
    ]
  ) {
    assert.strictEqual(
      result[key],
      false,
      key
    );
  }

  for (
    const forbiddenKey
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
      !Object.prototype
        .hasOwnProperty
        .call(
          result,
          forbiddenKey
        )
    );
  }

  assertCleaned(
    testCase
  );
}

/*
 * Success: second/final bounded page.
 */
{
  const testCase =
    makeCase();

  const result =
    analyze(
      testCase,
      25
    );

  assert.strictEqual(
    result.parsedNoticeCount,
    30
  );

  assert.strictEqual(
    result.noticeOffset,
    25
  );

  assert.strictEqual(
    result.selectedNoticeCount,
    5
  );

  assert.strictEqual(
    result.notices.length,
    5
  );

  assert.strictEqual(
    result.nextNoticeOffset,
    30
  );

  assert.strictEqual(
    result.hasMore,
    false
  );

  assertCleaned(
    testCase
  );
}

/*
 * Invalid offset fails before any Drive mutation.
 */
failCase(
  {},
  -1,
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

failCase(
  {},
  1.5,
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

/*
 * PDF identity failures happen before Drive creation.
 */
failCase(
  {
    bytes:
      makePdfBytes(
        EXPECTED_PDF_BYTES - 1
      )
  },
  0,
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
      makePdfBytes(
        MAX_PDF_BYTES + 1
      )
  },
  0,
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
  0,
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
  0,
  {
    driveCreates: 0,
    documentOpens: 0,
    textReads: 0,
    cleanupLookups: 0,
    trashCalls: 0
  }
);

/*
 * Post-create failures must clean the exact created artifact.
 */
failCase(
  {
    documentOpenThrows:
      true
  },
  0,
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
  0,
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/*
 * Text evidence must exceed normal limit, remain under oversize
 * ceiling, and then exactly match certified count/SHA.
 */
failCase(
  {
    text:
      'X'.repeat(
        NORMAL_LIMIT
      )
  },
  0,
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
      'X'.repeat(
        OVERSIZE_LIMIT + 1
      )
  },
  0,
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
      exactText({
        targetLength:
          EXPECTED_TEXT_COUNT - 1
      })
  },
  0,
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
    wrongTextSha:
      true
  },
  0,
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/*
 * Exact count/SHA evidence may pass, while parser evidence still
 * independently fails closed.
 */
failCase(
  {
    text:
      exactText({
        missingMarker:
          true
      })
  },
  0,
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
      exactText({
        wrongPublicationDate:
          true
      })
  },
  0,
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
      exactText({
        noNotices:
          true
      })
  },
  0,
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/*
 * Offset outside parsed publication fails closed and cleans.
 */
failCase(
  {},
  30,
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/*
 * Cleanup failure makes otherwise valid analysis unsuccessful.
 */
failCase(
  {
    cleanupThrows:
      true
  },
  0,
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_PUBLICATION_ANALYSIS_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_PRODUCTION_RPC_PRESENT=false'
);

console.log(
  'HTTP_SURFACE_PRESENT=false'
);

console.log(
  'OPA_LOOKUP_SURFACE_PRESENT=false'
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
  'CLEANUP_FAILURE_FAILS_CLOSED=true'
);

console.log(
  'NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'CERTIFIED_OVERSIZE_TEXT_LIMIT=600000'
);

console.log(
  'EXPECTED_TEXT_CHARACTER_COUNT=566435'
);

console.log(
  'EXPECTED_TEXT_SHA256=' +
  TEXT_SHA
);

console.log(
  'EXACT_TEXT_IDENTITY_REQUIRED_BEFORE_PARSING=true'
);

console.log(
  'ESTATE_NOTICE_MARKER_AUTHORITY_PRESERVED=true'
);

console.log(
  'NUMBERED_EN_DASH_ENTRY_GRAMMAR_PRESERVED=true'
);

console.log(
  'SURNAME_FIRST_COMMA_REQUIREMENT_PRESERVED=true'
);

console.log(
  'REPRESENTATIVE_ROLE_REQUIREMENT_PRESERVED=true'
);

console.log(
  'REPRESENTATIVE_TEXT_LIMIT=500'
);

console.log(
  'PB1_NOTICE_PAGE_SIZE=25'
);

console.log(
  'PB1_CURSOR_DOMAIN=PHL-PROBATE-PB1-V1'
);

console.log(
  'BOUND_NOTICE_PAGE_CERTIFIED=true'
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
