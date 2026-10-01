'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const path =
  'build/apps-script-brand/PhiladelphiaProbateProductionExtractionReadinessProbe.js';

const source =
  fs.readFileSync(
    path,
    'utf8'
  );

const SOURCE_URL =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const SOURCE_URL_SHA256 =
  '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

const PDF_SHA256 =
  '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

const EXPECTED_PDF_BYTES =
  4220387;

const MAX_PDF_BYTES =
  26214400;

const MAX_TEXT_CHARACTERS =
  250000;

function countMatches(pattern) {
  return (
    source.match(pattern) ||
    []
  ).length;
}

/*
 * Exactly one zero-argument readiness RPC.
 */
assert.strictEqual(
  countMatches(
    /function\s+reosPhiladelphiaProbateProductionExtractionReadinessProbe\s*\(\s*\)/g
  ),
  1,
  'Exactly one zero-argument readiness-probe RPC is required.'
);

/*
 * No Apps Script or external-service surfaces may appear in the
 * readiness implementation.
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
 * The inspected execution symbols may be type-checked, but never called.
 */
assert(
  !/reosPhiladelphiaProbateProductionExtractionOrchestration\s*\(/.test(
    source
  ),
  'Production orchestration RPC invocation is forbidden.'
);

assert(
  !/\.PhiladelphiaProbateProductionExtractionOrchestration\s*\.execute\s*\(/.test(
    source
  ),
  'Production orchestration execute invocation is forbidden.'
);

assert(
  !/\.PhiladelphiaProbateBoundedTextExtraction\s*\.extract\s*\(/.test(
    source
  ),
  'Bounded extractor invocation is forbidden.'
);

assert(
  source.includes(
    'typeof orchestration.execute'
  ),
  'Orchestration execute identity inspection is missing.'
);

assert(
  source.includes(
    'typeof reosPhiladelphiaProbateProductionExtractionOrchestration'
  ),
  'Global orchestration RPC identity inspection is missing.'
);

assert(
  source.includes(
    'typeof extraction.extract'
  ),
  'Extractor identity inspection is missing.'
);

function defaultOrchestration(
  execute
) {
  return {
    orchestrationVersion:
      1,

    publicationDate:
      '2026-09-30',

    sourceUrl:
      SOURCE_URL,

    sourceUrlSha256:
      SOURCE_URL_SHA256,

    sourceBasename:
      'tlipn093026.pdf',

    expectedPdfBytes:
      EXPECTED_PDF_BYTES,

    expectedPdfSha256:
      PDF_SHA256,

    maxPdfBytes:
      MAX_PDF_BYTES,

    maxExtractedTextCharacters:
      MAX_TEXT_CHARACTERS,

    execute
  };
}

function defaultExtraction(
  extract
) {
  return {
    extractionVersion:
      1,

    expectedPdfSha256:
      PDF_SHA256,

    expectedPdfBytes:
      EXPECTED_PDF_BYTES,

    maxPdfBytes:
      MAX_PDF_BYTES,

    maxExtractedTextCharacters:
      MAX_TEXT_CHARACTERS,

    extract
  };
}

function createCase(
  mutator
) {
  const counters = {
    orchestrationExecute:
      0,

    productionOrchestrationRpc:
      0,

    extraction:
      0
  };

  function forbiddenCall(
    counter
  ) {
    return function () {
      counters[counter] +=
        1;

      throw new Error(
        'Readiness probe invoked forbidden function: ' +
          counter
      );
    };
  }

  const sandbox = {
    REOS: {
      PhiladelphiaProbateProductionExtractionOrchestration:
        defaultOrchestration(
          forbiddenCall(
            'orchestrationExecute'
          )
        ),

      PhiladelphiaProbateBoundedTextExtraction:
        defaultExtraction(
          forbiddenCall(
            'extraction'
          )
        )
    },

    reosPhiladelphiaProbateProductionExtractionOrchestration:
      forbiddenCall(
        'productionOrchestrationRpc'
      )
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
        'PhiladelphiaProbateProductionExtractionReadinessProbe.js'
    }
  );

  assert.strictEqual(
    typeof sandbox
      .reosPhiladelphiaProbateProductionExtractionReadinessProbe,
    'function',
    'Readiness RPC did not become a top-level function.'
  );

  assert.strictEqual(
    sandbox
      .reosPhiladelphiaProbateProductionExtractionReadinessProbe
      .length,
    0,
    'Readiness RPC must accept zero formal arguments.'
  );

  return {
    sandbox,
    counters
  };
}

function assertNoInspectedFunctionInvoked(
  counters
) {
  assert.strictEqual(
    counters.orchestrationExecute,
    0,
    'Orchestration execute function was invoked.'
  );

  assert.strictEqual(
    counters.productionOrchestrationRpc,
    0,
    'Production orchestration RPC was invoked.'
  );

  assert.strictEqual(
    counters.extraction,
    0,
    'Bounded extractor was invoked.'
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
      .sandbox
      .reosPhiladelphiaProbateProductionExtractionReadinessProbe();
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

  assertNoInspectedFunctionInvoked(
    testCase.counters
  );
}

/*
 * Successful zero-side-effect readiness path.
 */
{
  const testCase =
    createCase();

  const result =
    testCase
      .sandbox
      .reosPhiladelphiaProbateProductionExtractionReadinessProbe();

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
    result.orchestrationPresent,
    true
  );

  assert.strictEqual(
    result.orchestrationVersion,
    1
  );

  assert.strictEqual(
    result.publicationDate,
    '2026-09-30'
  );

  assert.strictEqual(
    result.sourceUrl,
    SOURCE_URL
  );

  assert.strictEqual(
    result.sourceUrlSha256,
    SOURCE_URL_SHA256
  );

  assert.strictEqual(
    result.sourceBasename,
    'tlipn093026.pdf'
  );

  assert.strictEqual(
    result.expectedPdfBytes,
    EXPECTED_PDF_BYTES
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
    result.maxExtractedTextCharacters,
    MAX_TEXT_CHARACTERS
  );

  assert.strictEqual(
    result.orchestrationExecutePresent,
    true
  );

  assert.strictEqual(
    result.productionOrchestrationRpcPresent,
    true
  );

  assert.strictEqual(
    result.extractionComponentPresent,
    true
  );

  assert.strictEqual(
    result.extractionVersion,
    1
  );

  assert.strictEqual(
    result.extractPresent,
    true
  );

  const falseFlags = [
    'orchestrationExecuted',
    'extractionExecuted',
    'deploymentInspectionExecuted',
    'externalHttpExecuted',
    'pdfFetchExecuted',
    'sourceDiscoveryExecuted',
    'driveCreateExecuted',
    'documentOpenExecuted',
    'driveCleanupExecuted',
    'temporaryArtifactCreated',
    'connectorFetchExecuted',
    'connectorRegistrationExecuted',
    'productionDataReadExecuted',
    'probateParsingExecuted',
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

  for (
    const forbiddenKey
    of [
      'execute',
      'extract',
      'blob',
      'bytes',
      'text',
      'documentId',
      'temporaryDocumentId'
    ]
  ) {
    assert(
      !Object.prototype.hasOwnProperty.call(
        result,
        forbiddenKey
      ),
      'Forbidden output key present: ' +
        forbiddenKey
    );
  }

  assertNoInspectedFunctionInvoked(
    testCase.counters
  );
}

/*
 * Missing namespace and runtime surfaces.
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
      .PhiladelphiaProbateProductionExtractionOrchestration =
        null;
  },
  'production extraction orchestration is not loaded'
);

/*
 * Orchestration metadata mismatch cases.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .orchestrationVersion =
        2;
  },
  'orchestration version mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .publicationDate =
        '2026-09-29';
  },
  'publication date mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .sourceUrl =
        'https://example.invalid/file.pdf';
  },
  'source URL mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .sourceUrlSha256 =
        '0'.repeat(64);
  },
  'source URL SHA-256 mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .sourceBasename =
        'wrong.pdf';
  },
  'source basename mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .expectedPdfBytes =
        EXPECTED_PDF_BYTES - 1;
  },
  'PDF byte-length metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .expectedPdfSha256 =
        'f'.repeat(64);
  },
  'PDF SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .maxPdfBytes =
        MAX_PDF_BYTES - 1;
  },
  'maximum PDF size mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .maxExtractedTextCharacters =
        MAX_TEXT_CHARACTERS - 1;
  },
  'maximum text length mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionExtractionOrchestration
      .execute =
        null;
  },
  'execute symbol is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox
      .reosPhiladelphiaProbateProductionExtractionOrchestration =
        null;
  },
  'RPC symbol is not loaded'
);

/*
 * Extractor metadata mismatch cases.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction =
        null;
  },
  'bounded text extraction component is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .extractionVersion =
        2;
  },
  'bounded text extraction version mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .expectedPdfBytes =
        EXPECTED_PDF_BYTES - 1;
  },
  'bounded text extraction PDF byte-length metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .expectedPdfSha256 =
        '0'.repeat(64);
  },
  'bounded text extraction PDF SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .maxPdfBytes =
        MAX_PDF_BYTES - 1;
  },
  'bounded text extraction maximum PDF size mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .maxExtractedTextCharacters =
        MAX_TEXT_CHARACTERS - 1;
  },
  'bounded text extraction maximum text length mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedTextExtraction
      .extract =
        null;
  },
  'bounded text extraction symbol is not loaded'
);

console.log(
  'PB1_PRODUCTION_EXTRACTION_READINESS_PROBE_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC_NAME=reosPhiladelphiaProbateProductionExtractionReadinessProbe'
);

console.log(
  'PUBLIC_RPC_ARGUMENT_COUNT=0'
);

console.log(
  'FORBIDDEN_INSPECTED_FUNCTION_INVOCATION_COUNT=0'
);

console.log(
  'EXTERNAL_SERVICE_REFERENCE_COUNT=0'
);

console.log(
  'ORCHESTRATION_METADATA_VALIDATED=true'
);

console.log(
  'EXTRACTOR_METADATA_VALIDATED=true'
);

console.log(
  'ORCHESTRATION_EXECUTED=false'
);

console.log(
  'EXTRACTION_EXECUTED=false'
);

console.log(
  'DEPLOYMENT_INSPECTION_EXECUTED=false'
);

console.log(
  'PRODUCTION_HTTP_EXECUTED=false'
);

console.log(
  'PRODUCTION_PDF_FETCH_EXECUTED=false'
);

console.log(
  'PRODUCTION_OCR_EXECUTED=false'
);

console.log(
  'PRODUCTION_DATA_READ_EXECUTED=false'
);

console.log(
  'SCHEDULER_INSPECTION_EXECUTED=false'
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
  'LIVE_RUNTIME_SIDE_EFFECT_EXECUTED=false'
);
