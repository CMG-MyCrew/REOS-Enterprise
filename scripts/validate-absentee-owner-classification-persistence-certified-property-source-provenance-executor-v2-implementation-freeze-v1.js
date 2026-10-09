'use strict';

const fs = require('fs');
const crypto = require('crypto');
const childProcess = require('child_process');

const BASE = '9d52a78af5ecb6910e459034c108b69ded6643c4';
const BASE_TREE = '1bf5f64f6dd82bc5df3f1362bc291035137e7ff8';

const WORKFLOW =
  '.github/workflows/county-collapse-offline.yml';

const DOC =
  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2-implementation-freeze-v1.md';

const SELF =
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2-implementation-freeze-v1.js';

const EXECUTOR =
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js';

const EXPECTED_BLOBS = Object.freeze({
  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenancePlannerV2.js':
    'fd034b1b367a5720da58ab26703e1e4a2bf7e937',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStoreV2.js':
    '3e8175c31763a8cc3f0f6fe665edd8eb3ff377cb',

  'build/apps-script-brand/AbsenteeOwnerClassificationPersistencePlanner.js':
    '0d6c94026101f72fcb713825d086813b999056e1',

  'build/apps-script-brand/AbsenteeOwnerClassificationEvidenceStore.js':
    '392e5aa4ad99cefba59ebc60f41dc8557c454b66',

  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceExecutor.js':
    'a13b6eb2ab100726e0996b4d2b3e35972a675ac5',

  'build/apps-script-brand/AbsenteeOwnerClassificationBoundedRollout.js':
    '4c19474a66315b5277a8ebdd2864a0827e5a1595',

  'build/apps-script-brand/Database.js':
    '7488594963b8e95574d2235091c0751941484914',

  'docs/absentee-owner-classification-persistence-certified-property-source-provenance-extension-design-v2.md':
    '548437343a516482d87a21c893bff7f37ccfaf90',

  'scripts/validate-county-runtime-integration.js':
    '652daa5534b8d3ef54e8de59b67dd49224eaa14d'
});

const BASE_WORKFLOW_BLOB =
  'ffaa9b751c139fb5221e8047853d5da05797fefa';

const WORKFLOW_INSERTION =
  '\n' +
  '      - name: Validate absentee-owner certified property-source provenance executor v2 implementation freeze v1\n' +
  '        run: node scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-executor-v2-implementation-freeze-v1.js\n';

function fail(message) {
  process.stderr.write('STOP=' + message + '\n');
  process.exit(1);
}

function requireCondition(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function gitBlobSha(content) {
  const body = Buffer.from(content, 'utf8');
  const header = Buffer.from(
    'blob ' + body.length + '\0',
    'utf8'
  );

  return crypto
    .createHash('sha1')
    .update(header)
    .update(body)
    .digest('hex');
}

function gitHashObject(path) {
  return childProcess
    .execFileSync(
      'git',
      ['hash-object', '--', path],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    .trim();
}

function countOccurrences(text, needle) {
  let count = 0;
  let offset = 0;

  while (true) {
    const index = text.indexOf(
      needle,
      offset
    );

    if (index === -1) {
      return count;
    }

    count++;
    offset = index + needle.length;
  }
}

requireCondition(
  fs.existsSync(DOC),
  'implementation-freeze document is missing'
);

requireCondition(
  fs.existsSync(SELF),
  'implementation-freeze validator is missing'
);

requireCondition(
  !fs.existsSync(EXECUTOR),
  'executor runtime must remain absent during freeze'
);

Object.keys(EXPECTED_BLOBS)
  .forEach((path) => {
    requireCondition(
      fs.existsSync(path),
      'frozen dependency missing: ' + path
    );

    requireCondition(
      gitHashObject(path) === EXPECTED_BLOBS[path],
      'frozen dependency changed: ' + path
    );
  });

const doc = read(DOC);

const requiredDocMarkers = [
  BASE,
  BASE_TREE,

  'REOS.AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2',

  'build/apps-script-brand/AbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2.js',

  'propertySourceIdentityCertification',
  'normalLookupEvidence',
  'ownerEvidenceResult',
  'comparisonResult',
  'classificationResult',

  'REOS.Database.withScriptLockContext(...)',

  'V1-equivalence reconciliation and the subsequent V2 evidence-store',
  'persistence attempt must occur inside the same lock authority.',

  'V1_EQUIVALENT_EVIDENCE_REQUIRES_RECONCILIATION',

  'createTextFinder(distressLeadId)',
  'matchEntireCell(true)',
  'findAll()',

  'REOS.AbsenteeOwnerClassificationPersistencePlanner.evidenceEventIdFor(...)',
  'REOS.AbsenteeOwnerClassificationPersistencePlanner.hashCanonicalObject(...)',

  'REOS.AbsenteeOwnerClassificationEvidenceStoreV2.persist(...)',

  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_PRECONDITION_FAILED',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_OUTCOME_UNCERTAIN',
  'ABSENTEE_OWNER_CLASSIFICATION_PERSISTENCE_V2_VERIFIED',
  'ABSENTEE_OWNER_CLASSIFICATION_V2_ALREADY_PERSISTED',

  'No rollback claim is permitted.',
  'No automatic retry is permitted.',

  'No top-level Apps Script RPC is authorized by this capability.',

  'Automatic MAO or offer authority remains blocked unless adequate comp-supported',
  'ARV and adequate repair scope are independently established.',

  'V2 executor runtime does not yet exist;',
  'no executor implementation authority is granted;',
  'no production persistence authority is granted;'
];

requiredDocMarkers.forEach((marker) => {
  requireCondition(
    doc.includes(marker),
    'freeze document marker missing: ' + marker
  );
});

requireCondition(
  !doc.includes(
    'reosAbsenteeOwnerClassificationPersistenceCertifiedPropertySourceProvenanceExecutorV2('
  ),
  'freeze document must not authorize a public executor RPC'
);

const workflow = read(WORKFLOW);

requireCondition(
  countOccurrences(
    workflow,
    WORKFLOW_INSERTION
  ) === 1,
  'freeze workflow insertion must occur exactly once'
);

requireCondition(
  countOccurrences(
    workflow,
    SELF
  ) === 1,
  'freeze validator workflow path must occur exactly once'
);

const reconstructedWorkflow =
  workflow.replace(
    WORKFLOW_INSERTION,
    ''
  );

requireCondition(
  gitBlobSha(reconstructedWorkflow) ===
    BASE_WORKFLOW_BLOB,
  'workflow differs from certified base by more than the exact freeze-validator registration'
);

[
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-extension-design-v2.js',
  'scripts/validate-absentee-owner-classification-persistence-certified-property-source-provenance-planner-v2.js',
  'scripts/validate-absentee-owner-classification-evidence-store-v2.js',
  'scripts/validate-absentee-owner-classification-evidence-store-v2-provisioning-admin-v1.js',
  'scripts/validate-county-runtime-integration.js'
].forEach((path) => {
  requireCondition(
    workflow.includes(path),
    'existing workflow coverage disappeared: ' + path
  );
});

process.stdout.write(
  [
    'ABSENTEE_OWNER_V2_PERSISTENCE_EXECUTOR_IMPLEMENTATION_FREEZE_VALIDATION_PASS=true',
    'CERTIFIED_BASE=' + BASE,
    'CERTIFIED_BASE_TREE=' + BASE_TREE,
    'EXECUTOR_RUNTIME_PRESENT=false',
    'FROZEN_DEPENDENCY_IDENTITIES_EXACT=true',
    'FREEZE_DOCUMENT_REQUIRED_BOUNDARIES_EXACT=true',
    'WORKFLOW_CHANGE_EXACTLY_ONE_FREEZE_VALIDATOR_REGISTRATION=true',
    'EXECUTOR_IMPLEMENTATION_AUTHORIZED=false',
    'PRODUCTION_EXECUTION_AUTHORIZED=false',
    'V2_PERSISTENCE_EXECUTION_AUTHORIZED=false',
    'V2_BOUNDED_ROLLOUT_AUTHORIZED=false',
    'V2_ORCHESTRATOR_AUTHORIZED=false',
    'ARV_AUTHORITY_GRANTED=false',
    'REPAIR_SCOPE_AUTHORITY_GRANTED=false',
    'MAO_AUTHORITY_GRANTED=false',
    'OFFER_GENERATION_AUTHORITY_GRANTED=false',
    'OFFER_SUBMISSION_AUTHORITY_GRANTED=false'
  ].join('\n') + '\n'
);
