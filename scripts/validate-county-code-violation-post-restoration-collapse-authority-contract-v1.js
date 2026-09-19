'use strict';

const assert =
  require('assert');

const fs =
  require('fs');

const path =
  require('path');

const root =
  path.resolve(
    __dirname,
    '..'
  );

const DOC =
  path.join(
    root,
    'docs/county-code-violation-post-restoration-collapse-authority-v1.md'
  );

const AUTHORITY =
  path.join(
    root,
    'build/apps-script-brand/CountyCodeViolationCollapseOnlyEvidenceAuthority.js'
  );

const FULLROW =
  path.join(
    root,
    'build/apps-script-brand/CountyCodeViolationCollapseFullRowEvidence.js'
  );

const WINNER =
  path.join(
    root,
    'build/apps-script-brand/CountyCodeViolationCollapseWinnerPlan.js'
  );

const PREFLIGHT =
  path.join(
    root,
    'build/apps-script-brand/CountyCodeViolationCollapseExecutionPreflight.js'
  );

const LEASE =
  path.join(
    root,
    'build/apps-script-brand/CountyMutationExclusionLease.js'
  );

const GROUP3 =
  path.join(
    root,
    'build/apps-script-brand/CountyCodeViolationGroup3PostRestorationEvidence.js'
  );

const OLD_AUTHORITY =
  '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

const NEW_AUTHORITY =
  '8993da9619a9203182189cb8746eedf286a279b84db9342a53d9eb33de057ce7';

const OLD_FINGERPRINT =
  '848f517a03bbfc51e500a1b86a826dc1c9e1e12988a32f3a1c030ad3913624c9';

const NEW_FINGERPRINT =
  '9259978446e1423cf7d97414df62468734e64fbf68fcccd8936079e91e86a9ce';

const doc =
  fs.readFileSync(
    DOC,
    'utf8'
  );

const authority =
  fs.readFileSync(
    AUTHORITY,
    'utf8'
  );

const fullrow =
  fs.readFileSync(
    FULLROW,
    'utf8'
  );

const winner =
  fs.readFileSync(
    WINNER,
    'utf8'
  );

const preflight =
  fs.readFileSync(
    PREFLIGHT,
    'utf8'
  );

const lease =
  fs.readFileSync(
    LEASE,
    'utf8'
  );

const group3 =
  fs.readFileSync(
    GROUP3,
    'utf8'
  );

[
  'POST_RESTORATION_COLLAPSE_AUTHORITY_V1',
  'POST_RESTORATION_GROUP_COUNT=21',
  'POST_RESTORATION_ROW_COUNT=44',
  'POST_RESTORATION_ELIGIBLE_GROUP_COUNT=20',
  'POST_RESTORATION_ELIGIBLE_ROW_COUNT=42',
  'POST_RESTORATION_DIRECT_KEEP_GROUP_COUNT=14',
  'POST_RESTORATION_OBSERVATION_MERGE_GROUP_COUNT=6',
  'POST_RESTORATION_DELETE_CANDIDATE_ROW_COUNT=22',
  'POST_RESTORATION_BLOCKED_GROUP_COUNT=1',
  'POST_RESTORATION_CONFLICT_BLOCKED_GROUP=1',
  'POST_RESTORATION_REFERENCE_BLOCKED_GROUP=NONE',
  'requested ID count: `44`',
  'zero downstream references',
  'Group numbers must not be renumbered',
  'must not merely replace the two constants'
].forEach(fragment => {
  assert.ok(
    doc.includes(
      fragment
    ),
    'Design contract missing: ' +
      fragment
  );
});

assert.ok(
  authority.includes(
    "var AUTHORITY_SHA256 = '" +
      NEW_AUTHORITY +
      "';"
  )
);

assert.ok(
  authority.includes(
    'groupCount: 21'
  )
);

assert.ok(
  authority.includes(
    'rowCount: 44'
  )
);

assert.strictEqual(
  authority.includes(
    'DL-20260820181647-4170'
  ),
  false
);

assert.strictEqual(
  authority.includes(
    'ZIL-20260820193920-1756'
  ),
  false
);

assert.ok(
  fullrow.includes(
    'var EXPECTED_GROUP_COUNT = 21;'
  )
);

assert.ok(
  fullrow.includes(
    'var EXPECTED_ROW_COUNT = 44;'
  )
);

assert.ok(
  fullrow.includes(
    NEW_AUTHORITY
  )
);

assert.ok(
  winner.includes(
    'var EXPECTED_GROUP_COUNT = 21;'
  )
);

assert.ok(
  winner.includes(
    'var EXPECTED_ROW_COUNT = 44;'
  )
);

assert.ok(
  winner.includes(
    NEW_AUTHORITY
  )
);

assert.strictEqual(
  winner.includes(
    'REFERENCE_BLOCKED_GROUP'
  ),
  false
);

assert.ok(
  winner.includes(
    'matchedIdCount'
  )
);

assert.ok(
  winner.includes(
    'retainedMatchCount'
  )
);

assert.ok(
  preflight.includes(
    NEW_AUTHORITY
  )
);

assert.ok(
  preflight.includes(
    NEW_FINGERPRINT
  )
);

assert.strictEqual(
  preflight.includes(
    'CURRENT_AUTHORITY_LEASE_COMPATIBILITY_NOT_CERTIFIED'
  ),
  false
);

assert.ok(
  preflight.includes(
    'CERTIFIED_COLLAPSE_EXECUTOR_UNAVAILABLE'
  )
);

assert.ok(
  preflight.includes(
    'CountyCodeViolationGroup3PostRestorationEvidence'
  )
);

assert.ok(
  group3.includes(
    'READ_ONLY_GROUP3_POST_RESTORATION_EVIDENCE'
  )
);

assert.ok(
  lease.includes(
    OLD_AUTHORITY
  )
);

assert.ok(
  lease.includes(
    OLD_FINGERPRINT
  )
);

assert.ok(
  lease.includes(
    NEW_AUTHORITY
  )
);

assert.ok(
  lease.includes(
    NEW_FINGERPRINT
  )
);

assert.ok(
  lease.includes(
    'HISTORICAL'
  )
);

assert.ok(
  lease.includes(
    'CURRENT'
  )
);

assert.ok(
  lease.includes(
    'UNKNOWN'
  )
);

assert.ok(
  lease.includes(
    'Only CURRENT authority lease may satisfy owner readiness.'
  )
);

[
  'winnerSelectionAuthorityGranted',
  'collapseAuthorityGranted',
  'deleteAuthorityGranted',
  'productionDataMutationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(token => {
  assert.ok(
    winner.includes(
      token
    )
  );

  assert.ok(
    preflight.includes(
      token
    )
  );
});

console.log(
  'POST_RESTORATION_COLLAPSE_AUTHORITY_PHASE1_IMPLEMENTATION_VALIDATOR_PASS=true'
);

console.log(
  'POST_RESTORATION_AUTHORITY_SHA256=' +
  NEW_AUTHORITY
);

console.log(
  'POST_RESTORATION_WINNER_FINGERPRINT_SHA256=' +
  NEW_FINGERPRINT
);

console.log(
  'POST_RESTORATION_GROUP_COUNT=21'
);

console.log(
  'POST_RESTORATION_ROW_COUNT=44'
);

console.log(
  'POST_RESTORATION_BLOCKED_GROUP_COUNT=1'
);

console.log(
  'GROUP3_POST_RESTORATION_EVIDENCE_REQUIRED=true'
);

console.log(
  'LEASE_RUNTIME_AUTHORITY_COMPATIBILITY_PRESENT=true'
);

console.log(
  'COLLAPSE_EXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'GROUP3_REEXECUTION_AUTHORITY_GRANTED=false'
);

console.log(
  'AUTOMATIC_OFFER_AUTHORITY_GRANTED=false'
);
