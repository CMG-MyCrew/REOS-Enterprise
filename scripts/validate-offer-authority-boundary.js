#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(
  __dirname,
  '../build/apps-script-brand'
);

function read(name) {
  return fs.readFileSync(
    path.join(ROOT, name),
    'utf8'
  );
}

function pass(message) {
  console.log(
    'PASS:',
    message
  );
}

function productionFiles() {
  return fs.readdirSync(ROOT)
    .filter(function (name) {
      return /\.(js|html)$/.test(name);
    });
}

/*
 * ----------------------------------------------------------
 * Canonical authority components
 * ----------------------------------------------------------
 */

const qualifiedQueue =
  read('QualifiedDealQueue.js');

assert(
  /function\s+validateAuthority\s*\(/.test(
    qualifiedQueue
  ),
  'QualifiedDealQueue must expose canonical authority validation.'
);

assert(
  /validateAuthority\s*:\s*validateAuthority/.test(
    qualifiedQueue
  ),
  'QualifiedDealQueue.validateAuthority must be exported.'
);

pass(
  'QualifiedDealQueue exposes canonical authority validation'
);

const dealLogic =
  read('DealLogicVersioning.js');

assert(
  /['"]Qualified Queue ID['"]/.test(
    dealLogic
  ),
  'Deal Logic must persist Qualified Queue ID.'
);

assert(
  /['"]Authority Source['"]\s*:\s*['"]QUALIFIED_DEAL_QUEUE['"]/.test(
    dealLogic
  ),
  'Deal Logic must stamp canonical authority source.'
);

assert(
  /['"]Authority Validated At['"]/.test(
    dealLogic
  ),
  'Deal Logic must persist authority validation time.'
);

pass(
  'Deal Logic stamps qualified offer provenance'
);

/*
 * ----------------------------------------------------------
 * Only the authoritative offer creator may stamp the
 * canonical qualified authority source.
 * ----------------------------------------------------------
 */

const authorityStampFiles =
  productionFiles().filter(
    function (name) {
      const text = read(name);

      return (
        /['"]Authority Source['"]\s*:\s*['"]QUALIFIED_DEAL_QUEUE['"]/
          .test(text)
      );
    }
  );

assert.deepStrictEqual(
  authorityStampFiles,
  ['DealLogicVersioning.js'],
  'Only DealLogicVersioning may originate QUALIFIED_DEAL_QUEUE offer provenance.'
);

pass(
  'Only Deal Logic originates qualified offer provenance'
);

/*
 * ----------------------------------------------------------
 * Known legacy/manual publishers may create artifacts,
 * but may not self-declare qualified authority.
 * ----------------------------------------------------------
 */

const legacyPublishers = [
  'AcquisitionOfferAutomation.js',
  'DealAnalyzer.js',
  'DealIntelligenceDashboard.js',
  'OfferGenerator.js',
  'OfferReviewWorkflow.js'
];

legacyPublishers.forEach(
  function (name) {
    const text = read(name);

    assert(
      !/['"]Authority Source['"]\s*:\s*['"]QUALIFIED_DEAL_QUEUE['"]/
        .test(text),
      name +
        ' must not self-declare qualified authority.'
    );

    assert(
      !/['"]Qualified Queue ID['"]\s*:/
        .test(text),
      name +
        ' must not manufacture Qualified Queue ID provenance.'
    );
  }
);

pass(
  'legacy offer publishers cannot manufacture qualified provenance'
);

/*
 * ----------------------------------------------------------
 * Maintain an explicit inventory of production modules that
 * can mutate OFFERS. A newly introduced writer must cause
 * this contract to fail until architecturally reviewed.
 * ----------------------------------------------------------
 */

function writesOffers(name) {
  const text = read(name);

  const literal =
    /REOS\.Database\.(?:insert|update|upsert)\(\s*['"]OFFERS['"]/;

  const constant =
    /REOS\.Database\.(?:insert|update|upsert)\(\s*OFFERS\b/;

  const sourceAlias =
    /(?:var|const|let)\s+SOURCE\s*=\s*['"]OFFERS['"]/
      .test(text) &&
    /REOS\.Database\.(?:insert|update|upsert)\(\s*SOURCE\b/
      .test(text);

  return (
    literal.test(text) ||
    constant.test(text) ||
    sourceAlias
  );
}

const actualWriters =
  productionFiles()
    .filter(function (name) {
      return /\.js$/.test(name);
    })
    .filter(writesOffers)
    .sort();

const expectedWriters = [
  'AcquisitionOfferAutomation.js',
  'DashboardActions.js',
  'DealAnalyzer.js',
  'DealIntelligenceDashboard.js',
  'DealLogicVersioning.js',
  'OfferExecutionWorkflow.js',
  'OfferGenerator.js',
  'OfferReviewWorkflow.js'
].sort();

assert.deepStrictEqual(
  actualWriters,
  expectedWriters,
  'OFFERS writer inventory changed. Review any new writer for execution-authority bypasses.'
);

pass(
  'OFFERS writer inventory is explicitly controlled'
);

/*
 * ----------------------------------------------------------
 * Increment 6 authority / delivery boundary.
 *
 * Current authority is enforced:
 *   Draft/Ready -> execution queue
 *   immediately before the irreversible delivery side effect
 *
 * Submitted state is then finalized only from durable Sent
 * delivery evidence carrying exact execution provenance.
 * ----------------------------------------------------------
 */

const execution =
  read('OfferExecutionWorkflow.js');

const deliveryTransport =
  read('OfferDeliveryTransport.js');

assert(
  /var\s+authority\s*=\s*validateOfferAuthority_\(offer\)/.test(
    execution
  ),
  'buildQueue must validate offer authority.'
);

assert(
  /function\s+requireSentDeliveryEvidence_\s*\(/.test(
    execution
  ),
  'markSubmitted must require durable delivery evidence.'
);

assert(
  /OfferDeliveryEvidence[\s\S]*isSentEvidence/.test(
    execution
  ),
  'Submission finalization must validate canonical Sent evidence.'
);

assert(
  /['"]Delivery Attempt ID['"]/.test(
    execution
  ) &&
  /['"]Delivery Evidence Reference['"]/.test(
    execution
  ),
  'Submitted execution must persist delivery evidence provenance.'
);

const sendBoundaryStart =
  deliveryTransport.indexOf(
    'var sendAuthorityValidatedAt;'
  );

const preSendValidation =
  deliveryTransport.indexOf(
    'validateCurrentExecutionAuthority_(',
    sendBoundaryStart
  );

const sentMessageAssignment =
  deliveryTransport.indexOf(
    'sentMessage =',
    preSendValidation
  );

const gmailSend =
  deliveryTransport.indexOf(
    'draft.send()',
    sentMessageAssignment
  );

assert(
  sendBoundaryStart !== -1 &&
  preSendValidation !== -1 &&
  sentMessageAssignment !== -1 &&
  gmailSend !== -1 &&
  sendBoundaryStart <
    preSendValidation &&
  preSendValidation <
    sentMessageAssignment &&
  sentMessageAssignment <
    gmailSend,
  'Current qualified authority must be validated before the executable Gmail send.'
);

assert(
  /GMAIL_MESSAGE_ID/.test(
    deliveryTransport
  ) &&
  /OfferDeliveryEvidence\.recordSent/.test(
    deliveryTransport
  ),
  'Gmail delivery must persist durable external message evidence.'
);

const sentEvidenceCallers =
  productionFiles().filter(
    function (name) {
      if (
        name ===
        'OfferDeliveryEvidence.js'
      ) {
        return false;
      }

      return /OfferDeliveryEvidence\.recordSent\s*\(/
        .test(
          read(name)
        );
    }
  ).sort();

assert.deepStrictEqual(
  sentEvidenceCallers,
  [
    'OfferDeliveryTransport.js'
  ],
  'Only the controlled transport adapter may create Sent delivery evidence.'
);

pass(
  'delivery send enforces current authority and submission requires durable Sent evidence'
);

/*
 * ----------------------------------------------------------
 * Dashboard cannot manufacture execution lifecycle states.
 * ----------------------------------------------------------
 */

const dashboard =
  read('DashboardActions.js');

const updateStart =
  dashboard.indexOf(
    'function updateOfferStatus'
  );

const updateEnd =
  dashboard.indexOf(
    'function addDealNote',
    updateStart
  );

assert(
  updateStart !== -1 &&
  updateEnd !== -1,
  'Dashboard updateOfferStatus function not found.'
);

const updateOfferStatus =
  dashboard.slice(
    updateStart,
    updateEnd
  );

assert(
  /managed by OfferExecutionWorkflow/.test(
    updateOfferStatus
  ),
  'Dashboard must delegate lifecycle authority to OfferExecutionWorkflow.'
);

assert(
  !/\bStatus\s*:\s*status\b/.test(
    updateOfferStatus
  ),
  'Dashboard must not directly write requested offer status.'
);

pass(
  'Operational Dashboard cannot manufacture execution states'
);

/*
 * ----------------------------------------------------------
 * Pipeline submission proof comes from execution history,
 * never from existence of an OFFERS row.
 * ----------------------------------------------------------
 */

const acquisitionWorkflow =
  read('AcquisitionWorkflow.js');

assert(
  /OFFER_EXECUTION_QUEUE/.test(
    acquisitionWorkflow
  ),
  'AcquisitionWorkflow must use execution queue submission proof.'
);

assert(
  /['"]Submitted At['"]/.test(
    acquisitionWorkflow
  ),
  'AcquisitionWorkflow must require Submitted At.'
);

assert(
  !/REOS\.Database\.getAll\(\s*['"]OFFERS['"]\s*\)/
    .test(acquisitionWorkflow),
  'AcquisitionWorkflow must not treat OFFERS existence as submission proof.'
);

pass(
  'pipeline submission proof comes from execution history'
);

/*
 * ----------------------------------------------------------
 * Live verification must now prove isolation of the legacy
 * AI publisher rather than expecting it to bypass authority.
 * ----------------------------------------------------------
 */

const live =
  read('LivePipelineVerification.js');

assert(
  /verify execution isolation/.test(
    live
  ),
  'Live verification stage must describe execution isolation.'
);

assert(
  /executionsBefore/.test(live) &&
  /executionsAfter/.test(live),
  'Live verification must compare execution rows before and after buildQueue.'
);

assert(
  /newExecutionCreated[\s\S]*\?\s*['"]Fail['"][\s\S]*:\s*['"]Pass['"]/
    .test(live),
  'Live verification must fail if the legacy offer gains new execution authority.'
);

assert(
  /correctly blocked from new execution authority/.test(
    live
  ),
  'Live verification must explicitly confirm legacy offer isolation.'
);

pass(
  'LivePipelineVerification expects legacy offer execution isolation'
);

/*
 * ----------------------------------------------------------
 * Direct production execution entrypoint inventory.
 *
 * User-facing execution controls belong to the dedicated
 * OfferExecution dashboard. LivePipelineVerification may
 * invoke buildQueue only as a controlled verification step.
 * ----------------------------------------------------------
 */

const directExecutionFiles =
  productionFiles().filter(
    function (name) {
      if (
        name ===
        'OfferExecutionWorkflow.js'
      ) {
        return false;
      }

      const text = read(name);

      /*
       * Count only actual execution calls.
       *
       * A module may reference OfferExecutionWorkflow merely to
       * verify that a method exists (ControlledDailyUseTest does
       * this through checkModule_). That is not execution authority.
       *
       * Direct calls use:
       *   REOS.OfferExecutionWorkflow.buildQueue(...)
       *
       * Controlled live verification uses invokeStage_ with the
       * module plus method name and therefore counts as an actual
       * dynamic caller.
       */
      var directCall =
        /OfferExecutionWorkflow\.(?:buildQueue|markSubmitted|recordResponse)\s*\(/
          .test(text);

      var controlledDynamicCall =
        /invokeStage_\([\s\S]{0,400}REOS\.OfferExecutionWorkflow[\s\S]{0,120}['"](?:buildQueue|markSubmitted|recordResponse)['"]/
          .test(text);

      return (
        directCall ||
        controlledDynamicCall
      );
    }
  ).sort();

assert.deepStrictEqual(
  directExecutionFiles,
  [
    'LivePipelineVerification.js'
  ],
  'Unexpected direct production caller of OfferExecutionWorkflow detected.'
);

pass(
  'direct production execution callers remain controlled'
);

console.log();

console.log(
  'Offer Authority Boundary contract validation PASSED.'
);
