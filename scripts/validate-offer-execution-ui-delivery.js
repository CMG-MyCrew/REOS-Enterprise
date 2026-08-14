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
  console.log('PASS:', message);
}

const dashboard =
  read('OfferExecutionDashboard.js');

const ui =
  read('OfferExecutionDashboardUI.html');

const workflow =
  read('OfferExecutionWorkflow.js');

assert(
  /OfferDeliveryTransport[\s\S]{0,100}\.deliverEmail\s*\(/.test(
    dashboard
  ),
  'Dashboard send action must route through controlled OfferDeliveryTransport.'
);

assert(
  /OfferExecutionWorkflow[\s\S]{0,100}\.finalizeSentDelivery\s*\(/.test(
    dashboard
  ),
  'Dashboard must finalize only through evidence-backed workflow API.'
);

pass(
  'dashboard orchestrates controlled delivery then evidence-backed finalization'
);

assert(
  /function\s+finalizeSentDelivery\s*\(/.test(
    workflow
  ) &&
  /return\s+markSubmitted\s*\(/.test(
    workflow
  ),
  'Workflow must expose a narrow Sent-delivery finalization adapter.'
);

pass(
  'workflow preserves markSubmitted as the canonical evidence boundary'
);

const sendFunctionStart =
  dashboard.indexOf(
    'function sendEmail('
  );

const reconcileStart =
  dashboard.indexOf(
    'function reconcileSent('
  );

assert(
  sendFunctionStart !== -1 &&
  reconcileStart !== -1 &&
  reconcileStart >
    sendFunctionStart,
  'Dashboard sendEmail function boundaries must be present.'
);

const sendBlock =
  dashboard.slice(
    sendFunctionStart,
    reconcileStart
  );

assert(
  !/recipientEmail\s*:/.test(
    sendBlock
  ) &&
  !/recipientName\s*:/.test(
    sendBlock
  ),
  'Dashboard send action must not supply recipient identity to transport.'
);

pass(
  'browser/server delivery path cannot substitute recipient identity'
);

assert(
  !/reosOfferExecutionMarkSubmitted/.test(
    ui
  ),
  'Execution UI must not call markSubmitted directly.'
);

assert(
  !/recipientEmail\s*:/.test(
    ui
  ) &&
  !/Recipient email \(optional\)/.test(
    ui
  ),
  'Execution UI must not submit a caller-selected Email recipient.'
);

assert(
  /reosOfferExecutionSendEmail/.test(
    ui
  ) &&
  /Send Email/.test(
    ui
  ),
  'Ready execution UI must invoke controlled Send Email action.'
);

pass(
  'Ready UI no longer manufactures Submitted state'
);

assert(
  /Delivery Status/.test(
    dashboard
  ) &&
  /Delivery Error/.test(
    dashboard
  ),
  'Dashboard data must expose delivery state and errors.'
);

assert(
  /deliveryStatus===['"]Sending['"]/.test(
    ui
  ) &&
  /deliveryStatus===['"]Uncertain['"]/.test(
    ui
  ) &&
  /Reconciliation required/.test(
    ui
  ),
  'Sending and Uncertain delivery outcomes must disable blind resend.'
);

assert(
  /deliveryStatus===['"]Failed['"]/.test(
    ui
  ) &&
  /Retry requires review/.test(
    ui
  ),
  'Failed delivery must require explicit review before retry.'
);

pass(
  'delivery failure and uncertainty states are visible and fail closed'
);

assert(
  /deliveryStatus===['"]Sent['"]/.test(
    ui
  ) &&
  /reosOfferExecutionReconcileSent/.test(
    ui
  ) &&
  /Finalize Sent/.test(
    ui
  ),
  'Durable Sent evidence must support local finalization without resending Gmail.'
);

assert(
  /Do not resend/.test(
    dashboard
  ) &&
  /Reconciliation is required/.test(
    dashboard
  ),
  'Post-send finalization failure must explicitly prohibit resend.'
);

pass(
  'durable Sent evidence can reconcile without repeating the external side effect'
);

assert(
  /methods\s*:\s*\[\s*['"]Email['"]\s*\]/.test(
    dashboard
  ),
  'Dashboard must expose only implemented controlled delivery methods.'
);

pass(
  'dashboard exposes only controlled Email delivery'
);

console.log();
console.log(
  'Offer Execution UI Delivery contract validation PASSED.'
);
