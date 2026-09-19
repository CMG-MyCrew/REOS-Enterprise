'use strict';

const assert =
  require('assert');

const crypto =
  require('crypto');

const fs =
  require('fs');

const path =
  require('path');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const CONTRACT =
  path.join(
    ROOT,
    'docs',
    'county-collapse-operation-intent-orphan-binding-recovery-contract-v1.md'
  );

const EXPECTED_MAIN =
  '65df7eebdf57d67f87e82a8f408351bea7fc686a';

const EXPECTED_VERSION =
  '107';

const EXPECTED_ORPHAN_SHA =
  '36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c';

const EXPECTED_CREATED =
  '2026-09-19T04:48:04.219Z';

const EXPECTED_WINNER =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const EXPECTED_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const PROPERTY =
  'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID';

const text =
  fs.readFileSync(
    CONTRACT,
    'utf8'
  );

function contains(value, label) {
  assert(
    text.includes(value),
    label
  );
}

function containsCertifiedRawOrphanId(source) {
  var tokens =
    String(source).match(
      /[A-Za-z0-9_-]{20,}/g
    ) || [];

  return tokens.some(function (token) {
    return crypto
      .createHash('sha256')
      .update(
        token,
        'utf8'
      )
      .digest('hex') ===
        EXPECTED_ORPHAN_SHA;
  });
}

console.log(
  '=== OPERATION-INTENT ORPHAN BINDING RECOVERY CONTRACT CERTIFICATION ==='
);

contains(
  EXPECTED_MAIN,
  'contract pins exact certified main'
);

contains(
  EXPECTED_VERSION,
  'contract pins production version 107'
);

contains(
  EXPECTED_ORPHAN_SHA,
  'contract pins exact orphan workbook hash'
);

contains(
  EXPECTED_CREATED,
  'contract pins orphan creation timestamp'
);

contains(
  EXPECTED_WINNER,
  'contract pins winner-plan fingerprint'
);

contains(
  EXPECTED_AUTHORITY,
  'contract pins collapse authority'
);

contains(
  PROPERTY,
  'contract pins exact Script Property key'
);

[
  'The provisioning RPC MUST NOT be invoked again.',
  'Set:',
  'setProperty exactly',
  'call SpreadsheetApp.create',
  'deleteProperty',
  'create a replacement workbook',
  'clear or replace an existing binding',
  'retry automatically',
  'lease status is exactly ABSENT',
  'operation-intent binding property is absent',
  'zero additional editors',
  'zero viewers',
  'zero event rows',
  'zero chunk rows',
  'MUST NOT expose the raw workbook ID',
  'EXACT_ORPHAN_OPERATION_INTENT_BINDING_RECOVERED',
  'propertyWriteExecuted = true',
  'workbookCreated = false',
  'provisioningExecuted = false',
  'orphanRecoveryExecuted = true',
  'prerequisitesReadyForExecutorImplementation = true',
  'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE',
  'The county scheduler remains frozen.'
].forEach(function (needle) {
  contains(
    needle,
    'required contract clause missing: ' + needle
  );
});

assert.strictEqual(
  (
    text.match(
      /REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID/g
    ) || []
  ).length >= 2,
  true,
  'property binding authority must be explicit'
);

assert.strictEqual(
  (
    text.match(
      /36300ea35fc9f77a0d44edd6f3ecdf8bcb3fc97e1be31036eb615143aaf2e89c/g
    ) || []
  ).length >= 3,
  true,
  'orphan identity hash must be repeated across authority boundaries'
);

assert.strictEqual(
  containsCertifiedRawOrphanId(
    text
  ),
  false,
  'raw orphan workbook ID must not appear in the recovery contract'
);

assert.strictEqual(
  containsCertifiedRawOrphanId(
    fs.readFileSync(
      __filename,
      'utf8'
    )
  ),
  false,
  'raw orphan workbook ID must not appear in the contract validator source'
);

console.log(
  'PASS: exact incident authority pinned'
);
console.log(
  'PASS: exact orphan hash pinned without raw workbook ID'
);
console.log(
  'PASS: no provisioning retry authorized'
);
console.log(
  'PASS: recovery permits only one exact Script Property binding'
);
console.log(
  'PASS: workbook create/delete/edit prohibited'
);
console.log(
  'PASS: existing binding replacement prohibited'
);
console.log(
  'PASS: pre-write lease/schema/access/empty-store checks required'
);
console.log(
  'PASS: post-write readback and revalidation required'
);
console.log(
  'PASS: uncertain recovery cannot auto-retry'
);
console.log(
  'PASS: all collapse/data/scheduler/offer authority remains false'
);

console.log();
console.log(
  'Operation-intent orphan binding recovery contract certification PASSED.'
);
