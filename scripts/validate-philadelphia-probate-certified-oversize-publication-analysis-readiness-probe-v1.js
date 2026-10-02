'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const vm =
  require('vm');

const path =
  'build/apps-script-brand/PhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe.js';

const source =
  fs.readFileSync(
    path,
    'utf8'
  );

const PUBLIC_RPC =
  'reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe';

const ANALYSIS_VERSION =
  1;

const PUBLICATION_DATE =
  '2026-09-30';

const PDF_BYTES =
  4220387;

const PDF_SHA256 =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const MAX_PDF_BYTES =
  26214400;

const NORMAL_EXTRACTION_LIMIT =
  250000;

const OVERSIZE_TEXT_LIMIT =
  600000;

const TEXT_CHARACTER_COUNT =
  566435;

const TEXT_SHA256 =
  '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

const NOTICE_PAGE_SIZE =
  25;

const REPRESENTATIVE_TEXT_LIMIT =
  500;

const CURSOR_DOMAIN =
  'PHL-PROBATE-PB1-V1';

function countMatches(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

/*
 * Exactly one public zero-argument readiness RPC.
 */
assert.strictEqual(
  countMatches(
    /function\s+reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe\s*\(\s*\)/g
  ),
  1,
  'Exactly one zero-argument readiness-probe RPC is required.'
);

/*
 * No Apps Script service surface may appear.
 */
const forbiddenServices = [
  'UrlFetchApp',
  'Utilities',
  'Drive.Files',
  'DriveApp',
  'DocumentApp',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'LockService',
  'CalendarApp',
  'GmailApp'
];

for (
  const token
  of forbiddenServices
) {
  assert(
    !source.includes(token),
    'Forbidden service surface in readiness probe: ' +
      token
  );
}

/*
 * No transport, deployment, persistence, or scheduler API surface.
 */
const forbiddenSurfaces = [
  'fetch(',
  'getProjectTriggers',
  'newTrigger',
  'deleteTrigger',
  'openById(',
  'create(',
  'setProperty(',
  'setProperties(',
  'appendRow('
];

for (
  const token
  of forbiddenSurfaces
) {
  assert(
    !source.includes(token),
    'Forbidden readiness surface: ' +
      token
  );
}

/*
 * The analysis identity may be inspected but never invoked.
 */
assert(
  source.includes(
    'typeof analysis.analyze'
  ),
  'Analysis function identity inspection is missing.'
);

assert(
  !/analysis\.analyze\s*\(/.test(
    source
  ),
  'Analysis invocation is forbidden.'
);

assert(
  source.includes(
    '.PhiladelphiaProbateCertifiedOversizePublicationAnalysis'
  ),
  'Certified oversize analysis lookup is missing.'
);

/*
 * Readiness contains no Estate Notices parsing grammar.
 */
assert(
  !source.includes(
    'ESTATE NOTICES'
  ),
  'Estate Notices parsing marker is forbidden.'
);

assert(
  !source.includes(
    "ORPHANS' COURT DIVISION"
  ),
  'Orphans Court parsing marker is forbidden.'
);

assert(
  !source.includes(
    'noticeOffset'
  ),
  'Notice offset handling is forbidden.'
);

function defaultAnalysis(
  analyze
) {
  return {
    analysisVersion:
      ANALYSIS_VERSION,

    expectedPublicationDate:
      PUBLICATION_DATE,

    expectedPdfBytes:
      PDF_BYTES,

    expectedPdfSha256:
      PDF_SHA256,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    certifiedOversizeTextLimit:
      OVERSIZE_TEXT_LIMIT,

    expectedTextCharacterCount:
      TEXT_CHARACTER_COUNT,

    expectedTextSha256:
      TEXT_SHA256,

    noticePageSize:
      NOTICE_PAGE_SIZE,

    representativeTextLimit:
      REPRESENTATIVE_TEXT_LIMIT,

    cursorDomain:
      CURSOR_DOMAIN,

    analyze
  };
}

function createCase(
  mutator
) {
  const counters = {
    analyze:
      0
  };

  function forbiddenAnalyze() {
    counters.analyze +=
      1;

    throw new Error(
      'Readiness probe invoked forbidden analysis function.'
    );
  }

  const sandbox = {
    REOS: {
      PhiladelphiaProbateCertifiedOversizePublicationAnalysis:
        defaultAnalysis(
          forbiddenAnalyze
        )
    }
  };

  if (
    typeof mutator ===
    'function'
  ) {
    mutator(
      sandbox
    );
  }

  vm.createContext(
    sandbox
  );

  vm.runInContext(
    source,
    sandbox,
    {
      filename:
        'PhiladelphiaProbateCertifiedOversizePublicationAnalysisReadinessProbe.js'
    }
  );

  assert.strictEqual(
    typeof sandbox[
      PUBLIC_RPC
    ],
    'function',
    'Readiness RPC did not become a top-level function.'
  );

  assert.strictEqual(
    sandbox[
      PUBLIC_RPC
    ].length,
    0,
    'Readiness RPC must accept zero formal arguments.'
  );

  return {
    sandbox,
    counters
  };
}

function assertAnalyzeNeverInvoked(
  counters
) {
  assert.strictEqual(
    counters.analyze,
    0,
    'Analysis function was invoked.'
  );
}

function expectFailure(
  mutator,
  expectedMessage
) {
  const testCase =
    createCase(
      mutator
    );

  let error =
    null;

  try {
    testCase
      .sandbox[
        PUBLIC_RPC
      ]();
  } catch (caught) {
    error =
      caught;
  }

  assert(
    error,
    'Expected readiness failure: ' +
      expectedMessage
  );

  assert(
    String(
      error.message
    ).includes(
      expectedMessage
    ),
    'Unexpected readiness failure message: ' +
      error.message
  );

  assertAnalyzeNeverInvoked(
    testCase.counters
  );
}

/*
 * Successful deterministic zero-side-effect path.
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
    result.ok,
    true
  );

  assert.strictEqual(
    result.probeVersion,
    1
  );

  assert.strictEqual(
    result.runtimeLoaded,
    true
  );

  assert.strictEqual(
    result.runtimeSurfaceReady,
    true
  );

  assert.strictEqual(
    result.analysisPresent,
    true
  );

  assert.strictEqual(
    result.analysisVersion,
    ANALYSIS_VERSION
  );

  assert.strictEqual(
    result.expectedPublicationDate,
    PUBLICATION_DATE
  );

  assert.strictEqual(
    result.expectedPdfBytes,
    PDF_BYTES
  );

  assert.strictEqual(
    result.expectedPdfSha256,
    PDF_SHA256
  );

  assert.strictEqual(
    result.maxPdfBytes,
    MAX_PDF_BYTES
  );

  assert.strictEqual(
    result.currentNormalExtractionLimit,
    NORMAL_EXTRACTION_LIMIT
  );

  assert.strictEqual(
    result.certifiedOversizeTextLimit,
    OVERSIZE_TEXT_LIMIT
  );

  assert.strictEqual(
    result.expectedTextCharacterCount,
    TEXT_CHARACTER_COUNT
  );

  assert.strictEqual(
    result.expectedTextSha256,
    TEXT_SHA256
  );

  assert.strictEqual(
    result.noticePageSize,
    NOTICE_PAGE_SIZE
  );

  assert.strictEqual(
    result.representativeTextLimit,
    REPRESENTATIVE_TEXT_LIMIT
  );

  assert.strictEqual(
    result.cursorDomain,
    CURSOR_DOMAIN
  );

  assert.strictEqual(
    result.analyzePresent,
    true
  );

  assert.strictEqual(
    result.analysisExecuted,
    false
  );

  const falseFlags = [
    'deploymentInspectionExecuted',
    'externalHttpExecuted',
    'pdfFetchExecuted',
    'sourceDiscoveryExecuted',
    'driveCreateExecuted',
    'documentOpenExecuted',
    'driveCleanupExecuted',
    'temporaryArtifactCreated',
    'productionDataReadExecuted',
    'probateParsingExecuted',
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
  ];

  for (
    const key
    of falseFlags
  ) {
    assert.strictEqual(
      result[key],
      false,
      key + ' must be false'
    );
  }

  const forbiddenKeys = [
    'analyze',
    'blob',
    'pdfBlob',
    'bytes',
    'pdfBytes',
    'text',
    'rawText',
    'fullText',
    'textPreview',
    'preview',
    'notices',
    'noticeCandidates',
    'documentId',
    'temporaryDocumentId',
    'deploymentId',
    'deploymentVersion'
  ];

  for (
    const key
    of forbiddenKeys
  ) {
    assert(
      !Object.prototype
        .hasOwnProperty
        .call(
          result,
          key
        ),
      'Forbidden output key present: ' +
        key
    );
  }

  assertAnalyzeNeverInvoked(
    testCase.counters
  );
}

/*
 * Missing namespace / runtime failures.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS =
      null;
  },
  'REOS namespace is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis =
        null;
  },
  'certified oversize publication analysis is not loaded'
);

/*
 * Exact metadata mismatch failures.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .analysisVersion =
        2;
  },
  'analysis version mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .expectedPublicationDate =
        '2026-09-29';
  },
  'publication date metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .expectedPdfBytes =
        PDF_BYTES - 1;
  },
  'PDF byte-length metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .expectedPdfSha256 =
        '0'.repeat(64);
  },
  'PDF SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .maxPdfBytes =
        MAX_PDF_BYTES - 1;
  },
  'maximum PDF size metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .currentNormalExtractionLimit =
        NORMAL_EXTRACTION_LIMIT - 1;
  },
  'normal extraction limit metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .certifiedOversizeTextLimit =
        OVERSIZE_TEXT_LIMIT - 1;
  },
  'oversize text limit metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .expectedTextCharacterCount =
        TEXT_CHARACTER_COUNT - 1;
  },
  'expected text character-count metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .expectedTextSha256 =
        'f'.repeat(64);
  },
  'expected text SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .noticePageSize =
        NOTICE_PAGE_SIZE - 1;
  },
  'notice page-size metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .representativeTextLimit =
        REPRESENTATIVE_TEXT_LIMIT - 1;
  },
  'representative text-limit metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .cursorDomain =
        'WRONG-DOMAIN';
  },
  'cursor-domain metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .analyze =
        null;
  },
  'analysis symbol is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      .analyze =
        'not-a-function';
  },
  'analysis symbol is not loaded'
);

console.log(
  'PB1_CERTIFIED_OVERSIZE_ANALYSIS_READINESS_PROBE_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC_NAME=' +
  PUBLIC_RPC
);

console.log(
  'PUBLIC_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'ANALYSIS_METADATA_VALIDATED=true'
);

console.log(
  'ANALYZE_IDENTITY_VALIDATED=true'
);

console.log(
  'ANALYZE_INVOCATION_COUNT=0'
);

console.log(
  'FORBIDDEN_INSPECTED_FUNCTION_INVOCATION_COUNT=0'
);

console.log(
  'EXTERNAL_SERVICE_REFERENCE_COUNT=0'
);

console.log(
  'DEPLOYMENT_INSPECTION_EXECUTED=false'
);

console.log(
  'ANALYSIS_EXECUTED=false'
);

console.log(
  'PRODUCTION_HTTP_EXECUTED=false'
);

console.log(
  'PRODUCTION_PDF_FETCH_EXECUTED=false'
);

console.log(
  'PRODUCTION_DRIVE_CREATE_EXECUTED=false'
);

console.log(
  'PRODUCTION_OCR_EXECUTED=false'
);

console.log(
  'PRODUCTION_DOCUMENT_APP_EXECUTED=false'
);

console.log(
  'PROBATE_PARSING_EXECUTED=false'
);

console.log(
  'OPA_LOOKUP_EXECUTED=false'
);

console.log(
  'PROPERTY_RECONCILIATION_EXECUTED=false'
);

console.log(
  'PERSISTENCE_EXECUTED=false'
);

console.log(
  'SCHEDULER_INSPECTION_EXECUTED=false'
);

console.log(
  'COUNTY_DATA_MUTATION_EXECUTED=false'
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
  TEXT_SHA256
);

console.log(
  'PB1_NOTICE_PAGE_SIZE=25'
);

console.log(
  'REPRESENTATIVE_TEXT_LIMIT=500'
);

console.log(
  'PB1_CURSOR_DOMAIN=PHL-PROBATE-PB1-V1'
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
  'LIVE_RUNTIME_SIDE_EFFECT_EXECUTED=false'
);
