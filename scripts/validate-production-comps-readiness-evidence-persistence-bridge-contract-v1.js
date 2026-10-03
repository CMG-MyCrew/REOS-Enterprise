'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const DESIGN = path.join(
  ROOT,
  'docs',
  'production-comps-readiness-evidence-persistence-bridge-contract-v1.md'
);

const ACQ = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'AcquisitionWorkflow.js'
);

const LIFE = path.join(
  ROOT,
  'build',
  'apps-script-brand',
  'DealLifecycleWorkflow.js'
);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireText(text, needle, label) {
  assert.ok(
    text.toLowerCase().includes(needle.toLowerCase()),
    'missing contract requirement: ' + label
  );
  console.log('PASS: ' + label);
}

const design = read(DESIGN);
const acq = read(ACQ);
const life = read(LIFE);

const requirements = [
  [
    'This contract is design-only.',
    'design-only authority'
  ],
  [
    'The bridge must never manufacture evidence.',
    'no evidence manufacturing'
  ],
  [
    'a legacy ARV number does not establish supported ARV evidence',
    'legacy ARV is not evidence'
  ],
  [
    'DEAL_COMPARABLES row presence does not establish accepted comparable evidence',
    'comparable presence is not evidence'
  ],
  [
    'comparable count alone does not establish ARV confidence',
    'comp count is not confidence'
  ],
  [
    'a legacy Repair Cost or rehab number does not establish an adequate repair scope',
    'legacy repair number is not scope evidence'
  ],
  [
    'ARV evidence status',
    'ARV evidence status persisted'
  ],
  [
    'ARV confidence status',
    'ARV confidence persisted'
  ],
  [
    'accepted comparable evidence IDs',
    'accepted comparable identity persisted'
  ],
  [
    'declared minimum comparable count',
    'minimum comp requirement persisted'
  ],
  [
    'valuation method',
    'valuation method persisted'
  ],
  [
    'scope completeness',
    'repair scope completeness persisted'
  ],
  [
    'repair scope status',
    'repair scope status persisted'
  ],
  [
    'estimated repair cost',
    'repair estimate persisted with evidence'
  ],
  [
    'review-required state',
    'review state persisted'
  ],
  [
    'reason codes',
    'reason codes persisted'
  ],
  [
    'schema version',
    'schema versioning'
  ],
  [
    'Deal ID',
    'deal identity binding'
  ],
  [
    'subject canonical property key',
    'canonical property identity support'
  ],
  [
    'Evidence for one deal must never satisfy another deal',
    'cross-deal evidence forbidden'
  ],
  [
    'append-only',
    'append-only evidence history'
  ],
  [
    'Idempotency',
    'idempotency contract'
  ],
  [
    'comp-supported ARV ready',
    'ARV readiness branch'
  ],
  [
    'adequate repair scope ready',
    'repair readiness branch'
  ],
  [
    'A persisted readiness record does not itself authorize Offer Generation.',
    'persistence is not offer authority'
  ],
  [
    'The bridge must not fall back to legacy ARV',
    'fail-closed legacy fallback prohibition'
  ],
  [
    'An ARV evidence write must not imply repair evidence exists.',
    'ARV/repair write independence'
  ],
  [
    'A repair evidence write must not imply ARV evidence exists.',
    'repair/ARV write independence'
  ],
  [
    'authority to evaluate readiness',
    'readiness authority separated'
  ],
  [
    'authority to calculate MAO',
    'MAO authority separated'
  ],
  [
    'authority to generate an offer',
    'offer authority separated'
  ],
  [
    'authority to submit an offer',
    'submission authority separated'
  ],
  [
    'The persistence representation must remain provider-neutral.',
    'provider-neutral persistence'
  ],
  [
    'Credentials, tokens, authentication headers, provider secrets',
    'credential persistence prohibited'
  ],
  [
    'which ARV evidence record was selected',
    'ARV observability'
  ],
  [
    'which repair evidence record was selected',
    'repair observability'
  ],
  [
    'exact persistence table/surface names',
    'implementation must define exact surfaces'
  ],
  [
    'exact headers/schema',
    'implementation must define exact schema'
  ],
  [
    'exact write API',
    'implementation must define exact write API'
  ],
  [
    'exact read/latest-selection API',
    'implementation must define exact read API'
  ],
  [
    'Automatic MAO or offer authority remains blocked unless both',
    'acquisition safety invariant'
  ],
  [
    'Missing or weak evidence must route the deal to research/review',
    'weak evidence routes to review'
  ],
  [
    'No phase automatically authorizes the next.',
    'phase authority separation'
  ]
];

for (const [needle, label] of requirements) {
  requireText(design, needle, label);
}

const forbiddenAuthorityStatements = [
  'this contract authorizes provider selection',
  'this contract authorizes external HTTP',
  'this contract authorizes live comparable retrieval',
  'this contract authorizes production ARV persistence',
  'this contract authorizes MAO calculation',
  'this contract authorizes offer generation',
  'this contract authorizes offer submission'
];

for (const forbidden of forbiddenAuthorityStatements) {
  assert.equal(
    design.toLowerCase().includes(forbidden.toLowerCase()),
    false,
    'forbidden authority statement found: ' + forbidden
  );
}

console.log('PASS: no forbidden authority grant');

assert.ok(
  acq.includes(
    'Comparable-row presence is not readiness authority.'
  ),
  'AcquisitionWorkflow fail-closed hardening missing'
);

assert.equal(
  acq.includes('if (comps.length) {'),
  false,
  'legacy comparable-presence path restored'
);

assert.ok(
  life.includes(
    'Legacy analysis / comparable-count / MAO evidence must not'
  ),
  'DealLifecycleWorkflow fail-closed hardening missing'
);

assert.equal(
  life.includes(
    "return decision_('Offer Generation', 'Valid analysis, minimum comps, and a positive draft offer are present.');"
  ),
  false,
  'legacy lifecycle offer decision restored'
);

console.log('PASS: production workflow remains fail closed');

console.log(
  'PRODUCTION_COMPS_READINESS_EVIDENCE_PERSISTENCE_BRIDGE_CONTRACT_V1_VALIDATION_PASSED=true'
);
