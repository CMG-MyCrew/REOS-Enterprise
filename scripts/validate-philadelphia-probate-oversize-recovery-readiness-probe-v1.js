'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const path =
  'build/apps-script-brand/PhiladelphiaProbateOversizeRecoveryReadinessProbe.js';

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

const NORMAL_EXTRACTION_LIMIT =
  250000;

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
    /function\s+reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe\s*\(\s*\)/g
  ),
  1,
  'Exactly one zero-argument readiness-probe RPC is required.'
);

/*
 * The implementation must contain no Apps Script service surface.
 */
const forbiddenServices = [
  'UrlFetchApp',
  'Utilities',
  'Drive',
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
 * Execution symbols may be type-checked, never invoked.
 */
assert(
  !/reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery\s*\(/.test(
    source
  ),
  'Production recovery RPC invocation is forbidden.'
);

assert(
  !/\.PhiladelphiaProbateProductionOversizeTextEvidenceRecovery\s*\.execute\s*\(/.test(
    source
  ),
  'Recovery execute invocation is forbidden.'
);

assert(
  !/\.PhiladelphiaProbateBoundedOversizeTextEvidence\s*\.inspect\s*\(/.test(
    source
  ),
  'Bounded evidence inspect invocation is forbidden.'
);

assert(
  source.includes(
    'typeof recovery.execute'
  ),
  'Recovery execute identity inspection is missing.'
);

assert(
  source.includes(
    'typeof reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery'
  ),
  'Global recovery RPC identity inspection is missing.'
);

assert(
  source.includes(
    'typeof evidence.inspect'
  ),
  'Evidence inspect identity inspection is missing.'
);

function defaultRecovery(
  execute
) {
  return {
    recoveryVersion:
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

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    execute
  };
}

function defaultEvidence(
  inspect
) {
  return {
    evidenceVersion:
      1,

    expectedPdfSha256:
      PDF_SHA256,

    expectedPdfBytes:
      EXPECTED_PDF_BYTES,

    maxPdfBytes:
      MAX_PDF_BYTES,

    currentNormalExtractionLimit:
      NORMAL_EXTRACTION_LIMIT,

    inspect
  };
}

function createCase(
  mutator
) {
  const counters = {
    recoveryExecute:
      0,

    productionRecoveryRpc:
      0,

    evidenceInspect:
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
      PhiladelphiaProbateProductionOversizeTextEvidenceRecovery:
        defaultRecovery(
          forbiddenCall(
            'recoveryExecute'
          )
        ),

      PhiladelphiaProbateBoundedOversizeTextEvidence:
        defaultEvidence(
          forbiddenCall(
            'evidenceInspect'
          )
        )
    },

    reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery:
      forbiddenCall(
        'productionRecoveryRpc'
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
        'PhiladelphiaProbateOversizeRecoveryReadinessProbe.js'
    }
  );

  assert.strictEqual(
    typeof sandbox
      .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe,
    'function',
    'Readiness RPC did not become a top-level function.'
  );

  assert.strictEqual(
    sandbox
      .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe
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
    counters.recoveryExecute,
    0,
    'Recovery execute function was invoked.'
  );

  assert.strictEqual(
    counters.productionRecoveryRpc,
    0,
    'Production recovery RPC was invoked.'
  );

  assert.strictEqual(
    counters.evidenceInspect,
    0,
    'Bounded evidence inspect function was invoked.'
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
      .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe();
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
      .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe();

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
    result.recoveryPresent,
    true
  );

  assert.strictEqual(
    result.recoveryVersion,
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
    result.currentNormalExtractionLimit,
    NORMAL_EXTRACTION_LIMIT
  );

  assert.strictEqual(
    result.recoveryExecutePresent,
    true
  );

  assert.strictEqual(
    result.productionRecoveryRpcPresent,
    true
  );

  assert.strictEqual(
    result.evidenceComponentPresent,
    true
  );

  assert.strictEqual(
    result.evidenceVersion,
    1
  );

  assert.strictEqual(
    result.evidenceInspectPresent,
    true
  );

  const falseFlags = [
    'recoveryExecuted',
    'evidenceExecuted',
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
      'inspect',
      'blob',
      'bytes',
      'text',
      'documentId',
      'temporaryDocumentId',
      'observedTextCharacterCount',
      'observedTextSha256'
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
 * Missing namespace and recovery surface.
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
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery =
        null;
  },
  'oversize recovery orchestration is not loaded'
);

/*
 * Recovery metadata mismatch cases.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .recoveryVersion =
        2;
  },
  'recovery version mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .publicationDate =
        '2026-09-29';
  },
  'publication date mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .sourceUrl =
        'https://example.invalid/file.pdf';
  },
  'source URL mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .sourceUrlSha256 =
        '0'.repeat(64);
  },
  'source URL SHA-256 mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .sourceBasename =
        'wrong.pdf';
  },
  'source basename mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .expectedPdfBytes =
        EXPECTED_PDF_BYTES - 1;
  },
  'PDF byte-length metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .expectedPdfSha256 =
        'f'.repeat(64);
  },
  'PDF SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .maxPdfBytes =
        MAX_PDF_BYTES - 1;
  },
  'maximum PDF size mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .currentNormalExtractionLimit =
        NORMAL_EXTRACTION_LIMIT - 1;
  },
  'normal extraction limit mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery
      .execute =
        null;
  },
  'execute symbol is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox
      .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery =
        null;
  },
  'RPC symbol is not loaded'
);

/*
 * Evidence-component mismatch cases.
 */
expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence =
        null;
  },
  'bounded oversize text evidence component is not loaded'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .evidenceVersion =
        2;
  },
  'bounded oversize text evidence version mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .expectedPdfBytes =
        EXPECTED_PDF_BYTES - 1;
  },
  'bounded oversize text evidence PDF byte-length metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .expectedPdfSha256 =
        '0'.repeat(64);
  },
  'bounded oversize text evidence PDF SHA-256 metadata mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .maxPdfBytes =
        MAX_PDF_BYTES - 1;
  },
  'bounded oversize text evidence maximum PDF size mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .currentNormalExtractionLimit =
        NORMAL_EXTRACTION_LIMIT - 1;
  },
  'bounded oversize text evidence normal extraction limit mismatch'
);

expectFailure(
  (sandbox) => {
    sandbox.REOS
      .PhiladelphiaProbateBoundedOversizeTextEvidence
      .inspect =
        null;
  },
  'bounded oversize text evidence inspect symbol is not loaded'
);

console.log(
  'PB1_OVERSIZE_RECOVERY_READINESS_PROBE_BEHAVIOR_VALIDATOR_PASSED=true'
);

console.log(
  'PUBLIC_RPC_NAME=reosPhiladelphiaProbateProductionOversizeTextEvidenceRecoveryReadinessProbe'
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
  'RECOVERY_METADATA_VALIDATED=true'
);

console.log(
  'EVIDENCE_METADATA_VALIDATED=true'
);

console.log(
  'RECOVERY_EXECUTED=false'
);

console.log(
  'EVIDENCE_EXECUTED=false'
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
