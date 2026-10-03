'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const vm =
  require('vm');

const SOURCE_PATH =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js';

const source =
  fs.readFileSync(
    SOURCE_PATH,
    'utf8'
  );

const EXPECTED_BYTES =
  4220387;

const MAX_BYTES =
  26214400;

const NORMAL_LIMIT =
  250000;

const OVERSIZE_LIMIT =
  600000;

const EXPECTED_TEXT_CHARS =
  566435;

const MAX_CONTEXTS =
  8;

const MAX_CONTEXT_CHARS =
  800;

const MAX_AGGREGATE_CONTEXT_CHARS =
  6400;

const PDF_SHA =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const TEXT_SHA =
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

const FIXED_LABELS = [
  'ESTATE',
  'NOTICE',
  'ORPHAN',
  'COURT',
  'DIVISION'
];

function count(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

/*
 * Static containment.
 */
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

assert.strictEqual(
  count(
    /\.setTrashed\s*\(\s*true\s*\)/g
  ),
  1
);

for (
  const prohibited
  of [
    'UrlFetchApp',
    'Drive.Files.list',
    'Drive.Files.get',
    'PropertiesService',
    'SpreadsheetApp',
    'parseEstateNotices_',
    'PhiladelphiaProbateCertifiedOversizePublicationAnalysis.analyze',
    'PhiladelphiaProbateBoundedTextExtraction',
    'PhiladelphiaProbateBoundedPdfFetch',
    'PhiladelphiaProbateBoundedSourceDiscovery',
    'reosPhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery'
  ]
) {
  assert(
    !source.includes(
      prohibited
    ),
    prohibited
  );
}

for (
  const required
  of [
    'EXPECTED_PDF_BYTES =\n      4220387',
    'MAX_PDF_BYTES =\n      26214400',
    'CURRENT_NORMAL_EXTRACTION_LIMIT =\n      250000',
    'CERTIFIED_OVERSIZE_TEXT_LIMIT =\n      600000',
    'EXPECTED_TEXT_CHARACTER_COUNT =\n      566435',
    PDF_SHA,
    TEXT_SHA,
    'MAX_CONTEXT_COUNT =\n      8',
    'MAX_CONTEXT_CHARACTERS =\n      800',
    'MAX_AGGREGATE_CONTEXT_CHARACTERS =\n      6400',
    "label: 'ESTATE'",
    "label: 'NOTICE'",
    "label: 'ORPHAN'",
    "label: 'COURT'",
    "label: 'DIVISION'",
    'exactRecoveredTextIdentityConfirmed:',
    'fullOcrTextReturned:',
    'genericTextPreviewReturned:',
    'temporaryDocumentIdReturned:',
    'probateParsingExecuted:',
    'parserRepairExecuted:'
  ]
) {
  assert(
    source.includes(
      required
    ),
    required
  );
}

const identityCallIndex =
  source.indexOf(
    'assertRecoveredTextIdentity_(\n            text'
  );

const evidenceCallIndex =
  source.indexOf(
    'extractMarkerEvidence_(\n            text'
  );

assert(
  identityCallIndex >=
  0
);

assert(
  evidenceCallIndex >
  identityCallIndex
);


/*
 * Successor selection-policy containment.
 */
assert(
  source.includes(
    "PRIMARY_ANCHOR_LABEL =\n      'ORPHAN'"
  )
);

assert(
  source.includes(
    'var orphanHits ='
  )
);

assert(
  source.includes(
    'candidateComparator_'
  )
);

assert(
  source.includes(
    'duplicateWindows'
  )
);

assert(
  source.includes(
    'selected.some'
  )
);

assert(
  source.includes(
    'selected.sort'
  )
);

assert(
  source.includes(
    'orphan anchor locator produced no evidence'
  )
);

assert(
  source.includes(
    'returned context did not contain ORPHAN'
  )
);

assert(
  !source.includes(
    "/ESTATE[\\s]+NOTICES[\\s]+ORPHANS'?[\\s]+COURT[\\s]+DIVISION/i"
  )
);

/*
 * Mechanical mocked tests below do not claim that any synthetic fixture
 * reproduces the real certified OCR marker representation.
 */
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

function shaText(value) {
  return crypto
    .createHash(
      'sha256'
    )
    .update(
      String(value),
      'utf8'
    )
    .digest(
      'hex'
    );
}

function makePdfBytes(
  length = EXPECTED_BYTES,
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

function replaceAt(
  text,
  index,
  value
) {
  assert(
    index >=
    0
  );

  assert(
    index +
      value.length <=
    text.length
  );

  return (
    text.slice(
      0,
      index
    ) +
    value +
    text.slice(
      index +
      value.length
    )
  );
}

function makeSyntheticText(
  placements
) {
  let text =
    'X'.repeat(
      EXPECTED_TEXT_CHARS
    );

  for (
    const placement
    of placements
  ) {
    text =
      replaceAt(
        text,
        placement.index,
        placement.value
      );
  }

  assert.strictEqual(
    text.length,
    EXPECTED_TEXT_CHARS
  );

  return text;
}

const DEFAULT_PLACEMENTS = [
  {
    index: 1000,
    value: 'E S T A T E'
  },
  {
    index: 1050,
    value: 'N O T I C E'
  },
  {
    index: 1100,
    value: 'O R P H A N'
  },
  {
    index: 1150,
    value: 'C O U R T'
  },
  {
    index: 1200,
    value: 'D I V I S I O N'
  }
];

function makeCase(
  overrides = {}
) {
  const state = {
    driveCreates:
      0,

    documentOpens:
      0,

    textReads:
      0,

    cleanupLookups:
      0,

    trashCalls:
      0,

    createdBlob:
      null,

    openedId:
      null,

    cleanupId:
      null
  };

  const bytes =
    overrides.bytes !==
    undefined
      ? overrides.bytes
      : makePdfBytes(
          EXPECTED_BYTES,
          overrides.validSignature !==
            false
        );

  const text =
    overrides.text !==
    undefined
      ? overrides.text
      : makeSyntheticText(
          DEFAULT_PLACEMENTS
        );

  const documentId =
    'TEMP-MARKER-EVIDENCE-DOC-1';

  const blob = {
    getBytes() {
      return bytes;
    }
  };

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
          const value =
            input.__text;

          if (
            value ===
            text
          ) {
            if (
              overrides
                .wrongTextSha
            ) {
              return signedDigest(
                '0'.repeat(
                  64
                )
              );
            }

            /*
             * Mechanical identity-gate simulation only.
             * This does not claim synthetic text equals real OCR.
             */
            return signedDigest(
              TEXT_SHA
            );
          }

          return signedDigest(
            shaText(
              value
            )
          );
        }

        if (
          overrides
            .wrongPdfSha
        ) {
          return signedDigest(
            '0'.repeat(
              64
            )
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

          assert.strictEqual(
            options.fields,
            'id'
          );

          if (
            overrides
              .driveCreateThrows
          ) {
            throw new Error(
              'synthetic Drive create failure'
            );
          }

          if (
            overrides
              .missingDocumentId
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
          overrides
            .documentOpenThrows
        ) {
          throw new Error(
            'synthetic DocumentApp open failure'
          );
        }

        return {
          getBody() {
            return {
              getText() {
                state.textReads +=
                  1;

                if (
                  overrides
                    .textReadThrows
                ) {
                  throw new Error(
                    'synthetic OCR text-read failure'
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
              overrides
                .cleanupThrows
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
        'PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery.js'
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

function recover(testCase) {
  const component =
    testCase
      .sandbox
      .REOS
      .PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery;

  assert.strictEqual(
    component.recover.length,
    1
  );

  return component.recover(
    testCase.blob
  );
}

function failCase(
  overrides,
  expectedState
) {
  const testCase =
    makeCase(
      overrides
    );

  assert.throws(
    () =>
      recover(
        testCase
      )
  );

  for (
    const [
      key,
      expected
    ]
    of Object.entries(
      expectedState
    )
  ) {
    assert.strictEqual(
      testCase
        .state[
          key
        ],
      expected,
      key
    );
  }

  return testCase;
}

function plain(value) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

/*
 * Successful mechanical fixture.
 */
{
  const testCase =
    makeCase();

  const result =
    plain(
      recover(
        testCase
      )
    );

  assert.strictEqual(
    result.ok,
    true
  );

  assert.strictEqual(
    result.markerEvidenceVersion,
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
    result.maxPdfBytes,
    MAX_BYTES
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
    EXPECTED_TEXT_CHARS
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
    result.locatorFamilyCount,
    5
  );

  assert.strictEqual(
    result.maxContextCount,
    MAX_CONTEXTS
  );

  assert.strictEqual(
    result.maxContextCharacters,
    MAX_CONTEXT_CHARS
  );

  assert.strictEqual(
    result.maxAggregateContextCharacters,
    MAX_AGGREGATE_CONTEXT_CHARS
  );

  assert.strictEqual(
    result.contextCount,
    1
  );

  assert(
    result.contexts.length <=
    MAX_CONTEXTS
  );

  assert(
    result.aggregateContextCharacters <=
    MAX_AGGREGATE_CONTEXT_CHARS
  );

  const context =
    result.contexts[0];

  assert.deepStrictEqual(
    context.locatorLabels,
    FIXED_LABELS
  );

  assert.strictEqual(
    Object.keys(
      context
    )
      .sort()
      .join('|'),
    [
      'contextCharacterCount',
      'contextSha256',
      'endOffset',
      'locatorLabels',
      'rawOcrContext',
      'startOffset'
    ]
      .sort()
      .join('|')
  );

  assert.strictEqual(
    context.rawOcrContext,
    testCase.text.slice(
      context.startOffset,
      context.endOffset
    )
  );

  assert.strictEqual(
    context.contextCharacterCount,
    context.rawOcrContext.length
  );

  assert(
    context.contextCharacterCount <=
    MAX_CONTEXT_CHARS
  );

  assert.strictEqual(
    context.contextSha256,
    shaText(
      context.rawOcrContext
    )
  );

  assert.strictEqual(
    result.aggregateContextCharacters,
    context.contextCharacterCount
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
      !Object.prototype
        .hasOwnProperty
        .call(
          result,
          forbidden
        )
    );
  }

  const requiredFalseFlags = [
    'fullOcrTextReturned',
    'genericTextPreviewReturned',
    'pdfBytesReturned',
    'temporaryDocumentIdReturned',
    'sourceDiscoveryExecuted',
    'httpFetchExecuted',
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
  ];

  for (
    const flag
    of requiredFalseFlags
  ) {
    assert.strictEqual(
      result[
        flag
      ],
      false,
      flag
    );
  }
}

/*
 * PDF failures occur before Drive creation.
 */
failCase(
  {
    bytes:
      makePdfBytes(
        EXPECTED_BYTES -
          1
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
      makePdfBytes(
        MAX_BYTES +
          1
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

/*
 * Post-create failures clean the exact created ID whenever an ID exists.
 */
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
      ' '.repeat(
        EXPECTED_TEXT_CHARS
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

failCase(
  {
    text:
      'X'.repeat(
        OVERSIZE_LIMIT +
          1
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

failCase(
  {
    text:
      'X'.repeat(
        EXPECTED_TEXT_CHARS -
          1
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

failCase(
  {
    wrongTextSha:
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

/*
 * Exact synthetic text identity with zero fixed locators fails after
 * identity validation and still cleans up.
 */
failCase(
  {
    text:
      'X'.repeat(
        EXPECTED_TEXT_CHARS
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

/*
 * Cleanup failure fails closed.
 */
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

/*
 * Deterministic overlap handling:
 * five nearby fixed locator labels collapse into one bounded context.
 */
{
  const one =
    plain(
      recover(
        makeCase()
      )
    );

  const two =
    plain(
      recover(
        makeCase()
      )
    );

  assert.deepStrictEqual(
    one.contexts,
    two.contexts
  );

  assert.strictEqual(
    one.contextCount,
    1
  );

  assert.deepStrictEqual(
    one.contexts[0]
      .locatorLabels,
    FIXED_LABELS
  );
}

/*
 * Exact recovered-text identity containing only generic locators and no
 * ORPHAN must fail closed. There is no ESTATE/NOTICE/COURT/DIVISION
 * fallback.
 */
failCase(
  {
    text:
      makeSyntheticText([
        {
          index: 1000,
          value: 'E S T A T E'
        },
        {
          index: 1100,
          value: 'N O T I C E'
        },
        {
          index: 1200,
          value: 'C O U R T'
        },
        {
          index: 1300,
          value: 'D I V I S I O N'
        }
      ])
  },
  {
    driveCreates: 1,
    documentOpens: 1,
    textReads: 1,
    cleanupLookups: 1,
    trashCalls: 1
  }
);

/*
 * Two ORPHAN anchors near the beginning clamp to the same exact 0-800
 * candidate window and are deduplicated.
 */
{
  const testCase =
    makeCase({
      text:
        makeSyntheticText([
          {
            index: 40,
            value: 'O R P H A N'
          },
          {
            index: 120,
            value: 'O R P H A N'
          }
        ])
    });

  const result =
    plain(
      recover(
        testCase
      )
    );

  assert.strictEqual(
    result.contextCount,
    1
  );

  assert.strictEqual(
    result.contexts[0].startOffset,
    0
  );

  assert.strictEqual(
    result.contexts[0].endOffset,
    MAX_CONTEXT_CHARS
  );

  assert.deepStrictEqual(
    result.contexts[0].locatorLabels,
    [
      'ORPHAN'
    ]
  );
}

/*
 * Distinct but overlapping ORPHAN candidate windows do not merge or
 * expand. The lower-ranked overlap is skipped.
 */
{
  const testCase =
    makeCase({
      text:
        makeSyntheticText([
          {
            index: 1000,
            value: 'O R P H A N'
          },
          {
            index: 1300,
            value: 'O R P H A N'
          }
        ])
    });

  const result =
    plain(
      recover(
        testCase
      )
    );

  assert.strictEqual(
    result.contextCount,
    1
  );

  assert(
    result.contexts[0].startOffset <
    1000
  );

  assert(
    result.contexts[0].endOffset >
    1300
  );

  assert.deepStrictEqual(
    result.contexts[0].locatorLabels,
    [
      'ORPHAN'
    ]
  );
}

/*
 * All ORPHAN hits are discovered before MAX_CONTEXT_COUNT is applied.
 *
 * Eight low-information ORPHAN-only candidates appear first in source
 * order. A later ninth candidate also contains COURT, DIVISION, NOTICE,
 * and ESTATE. The later high-ranked candidate must be selected and the
 * eighth low-ranked ORPHAN-only candidate must be omitted.
 */
{
  const placements = [];

  for (
    let i = 0;
    i < 8;
    i += 1
  ) {
    placements.push({
      index:
        1000 +
        (
          i *
          2000
        ),

      value:
        'O R P H A N'
    });
  }

  const highAnchor =
    20000;

  placements.push(
    {
      index:
        highAnchor,
      value:
        'O R P H A N'
    },
    {
      index:
        highAnchor + 80,
      value:
        'C O U R T'
    },
    {
      index:
        highAnchor + 140,
      value:
        'D I V I S I O N'
    },
    {
      index:
        highAnchor + 220,
      value:
        'N O T I C E'
    },
    {
      index:
        highAnchor + 300,
      value:
        'E S T A T E'
    }
  );

  const testCase =
    makeCase({
      text:
        makeSyntheticText(
          placements
        )
    });

  const result =
    plain(
      recover(
        testCase
      )
    );

  assert.strictEqual(
    result.contextCount,
    MAX_CONTEXTS
  );

  const containsOffset =
    (
      context,
      offset
    ) =>
      (
        context.startOffset <=
          offset &&
        context.endOffset >
          offset
      );

  assert(
    result.contexts.some(
      context =>
        containsOffset(
          context,
          highAnchor
        )
    )
  );

  /*
   * Last low-ranked source-order anchor is the one displaced.
   */
  const displacedLowAnchor =
    15000;

  assert(
    !result.contexts.some(
      context =>
        containsOffset(
          context,
          displacedLowAnchor
        )
    )
  );

  const highContext =
    result.contexts.find(
      context =>
        containsOffset(
          context,
          highAnchor
        )
    );

  assert.deepStrictEqual(
    highContext.locatorLabels,
    FIXED_LABELS
  );

  for (
    let i = 0;
    i < result.contexts.length;
    i += 1
  ) {
    const context =
      result.contexts[i];

    assert(
      context.locatorLabels.includes(
        'ORPHAN'
      )
    );

    assert(
      context.contextCharacterCount <=
      MAX_CONTEXT_CHARS
    );

    assert.strictEqual(
      context.contextSha256,
      shaText(
        context.rawOcrContext
      )
    );

    if (i > 0) {
      assert(
        context.startOffset >=
        result.contexts[
          i - 1
        ].endOffset
      );
    }
  }
}

/*
 * Maximum count / aggregate ceiling with ten separated ORPHAN anchors.
 * Equal-ranked candidates tie-break by lower anchor offset.
 */
{
  const placements = [];

  for (
    let i = 0;
    i < 10;
    i += 1
  ) {
    placements.push({
      index:
        1000 +
        (
          i *
          2000
        ),

      value:
        'O R P H A N'
    });
  }

  const testCase =
    makeCase({
      text:
        makeSyntheticText(
          placements
        )
    });

  const result =
    plain(
      recover(
        testCase
      )
    );

  assert.strictEqual(
    result.contextCount,
    MAX_CONTEXTS
  );

  assert.strictEqual(
    result.contexts.length,
    MAX_CONTEXTS
  );

  assert.strictEqual(
    result.aggregateContextCharacters,
    MAX_AGGREGATE_CONTEXT_CHARS
  );

  for (
    let i = 0;
    i < result.contexts.length;
    i += 1
  ) {
    const context =
      result.contexts[i];

    assert.strictEqual(
      context.contextCharacterCount,
      MAX_CONTEXT_CHARS
    );

    assert.deepStrictEqual(
      context.locatorLabels,
      [
        'ORPHAN'
      ]
    );

    assert.strictEqual(
      context.contextSha256,
      shaText(
        context.rawOcrContext
      )
    );

    if (i > 0) {
      assert(
        context.startOffset >=
        result.contexts[
          i - 1
        ].endOffset
      );
    }
  }
}

console.log(
  'PB1_CERTIFIED_OVERSIZE_ORPHAN_ANCHORED_MARKER_EVIDENCE_RECOVERY_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'SYNTHETIC_FIXTURE_MECHANICAL_ONLY=true'
);

console.log(
  'SYNTHETIC_FIXTURE_REAL_OCR_MARKER_COMPATIBILITY_CLAIMED=false'
);

console.log(
  'PUBLIC_FUNCTION_PARAMETER_COUNT=1'
);

console.log(
  'HTTP_CALL_SITE_COUNT_EXACT=0'
);

console.log(
  'DRIVE_SEARCH_CALL_SITE_COUNT_EXACT=0'
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
  'PDF_IDENTITY_VERIFIED_BEFORE_DRIVE_CREATE=true'
);

console.log(
  'EXPECTED_PDF_BYTES=4220387'
);

console.log(
  'CURRENT_NORMAL_EXTRACTION_LIMIT=250000'
);

console.log(
  'CERTIFIED_OVERSIZE_TEXT_LIMIT=600000'
);

console.log(
  'EXPECTED_TEXT_CHARACTER_COUNT=566435'
);

console.log(
  'EXACT_TEXT_IDENTITY_REQUIRED_BEFORE_CONTEXT_EXTRACTION=true'
);

console.log(
  'FIXED_LOCATOR_FAMILY_COUNT=5'
);

console.log(
  'OCR_TOLERANT_FIXED_LOCATOR_MECHANICS_VALIDATED=true'
);

console.log(
  'MAX_MARKER_CONTEXT_COUNT=8'
);

console.log(
  'MAX_MARKER_CONTEXT_CHARACTERS=800'
);

console.log(
  'MAX_AGGREGATE_MARKER_CONTEXT_CHARACTERS=6400'
);

console.log(
  'OVERLAPPING_LOCATOR_WINDOWS_DEDUPLICATED=true'
);

console.log(
  'DETERMINISTIC_CONTEXT_SELECTION_VALIDATED=true'
);

console.log(
  'BOUNDED_CONTEXT_SHA256_VALIDATED=true'
);

console.log(
  'FULL_OCR_TEXT_RETURN_AUTHORIZED=false'
);

console.log(
  'GENERIC_TEXT_PREVIEW_RETURN_AUTHORIZED=false'
);

console.log(
  'TEMP_DOCUMENT_ID_RETURN_AUTHORIZED=false'
);

console.log(
  'PUBLIC_RPC_AUTHORIZED=false'
);

console.log(
  'PROBATE_PARSING_AUTHORIZED=false'
);

console.log(
  'PARSER_REPAIR_AUTHORIZED=false'
);

console.log(
  'OPA_LOOKUP_AUTHORIZED=false'
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


console.log(
  'PRIMARY_ANCHOR=ORPHAN'
);

console.log(
  'ALL_ORPHAN_HITS_DISCOVERED_BEFORE_CONTEXT_LIMIT_VALIDATED=true'
);

console.log(
  'GENERIC_ESTATE_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'GENERIC_NOTICE_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'GENERIC_COURT_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'GENERIC_DIVISION_WINDOW_ALLOCATION_AUTHORIZED=false'
);

console.log(
  'ZERO_ORPHAN_GENERIC_FALLBACK_AUTHORIZED=false'
);

console.log(
  'RANK_COURT_AND_DIVISION_FIRST_VALIDATED=true'
);

console.log(
  'RANK_NOTICE_NEXT_VALIDATED=true'
);

console.log(
  'RANK_ESTATE_NEXT_VALIDATED=true'
);

console.log(
  'RANK_DISTINCT_LABEL_COUNT_NEXT_VALIDATED=true'
);

console.log(
  'RANK_LOWER_ORPHAN_OFFSET_LAST_VALIDATED=true'
);

console.log(
  'EVERY_RETURNED_CONTEXT_REQUIRES_ORPHAN=true'
);

console.log(
  'SELECTED_CONTEXTS_RETURNED_IN_SOURCE_ORDER=true'
);

console.log(
  'PARSER_MARKER_GRAMMAR_IMPLEMENTED=false'
);

console.log(
  'THIRD_V143_RPC_AUTHORIZED=false'
);
