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

function functionBlock(
  source,
  name,
  nextName
) {
  const start =
    source.indexOf(
      'function ' + name
    );

  assert(
    start !== -1,
    'Missing function: ' + name
  );

  let end =
    nextName
      ? source.indexOf(
          'function ' + nextName,
          start + 1
        )
      : source.length;

  if (end === -1) {
    end = source.length;
  }

  return source.slice(
    start,
    end
  );
}

const security =
  read('Security.js');

assert(
  /function\s+reosRequireOfferExecutionPermission_\s*\(\)/.test(
    security
  ),
  'Canonical private offer-execution permission guard is required.'
);

assert(
  /requirePermission\s*\(\s*['"]offers:execute['"]\s*\)/.test(
    security
  ),
  'Offer execution guard must require offers:execute.'
);

pass(
  'dedicated offers:execute capability exists'
);

assert(
  /ROLE_PERMISSIONS\[REOS\.CONFIG\.ROLES\.ADMIN\]\s*=\s*\[['"]\*['"]\]/.test(
    security
  ),
  'Admin wildcard permission must remain intact.'
);

pass(
  'Admin inherits offer execution through wildcard authority'
);

/*
 * Do not grant offers:execute to broad operational roles by
 * default. The only occurrence in Security.js should be the
 * canonical guard itself unless explicitly added later.
 */
const executeOccurrences =
  (
    security.match(
      /offers:execute/g
    ) || []
  ).length;

assert.strictEqual(
  executeOccurrences,
  1,
  'offers:execute must not be silently assigned to a default role.'
);

assert(
  /parsePermissions_/.test(
    security
  ) &&
  /user\.Permissions/.test(
    security
  ),
  'Existing explicit per-user Permissions support must remain available.'
);

pass(
  'non-admin execution requires an explicit user permission grant'
);

const dashboard =
  read('OfferExecutionDashboard.js');

[
  [
    'reosOfferExecutionSendEmail',
    'reosOfferExecutionReconcileSent'
  ],
  [
    'reosOfferExecutionReconcileSent',
    'showOfferExecutionDashboard'
  ]
].forEach(
  function (entry) {
    const block =
      functionBlock(
        dashboard,
        entry[0],
        entry[1]
      );

    assert(
      /reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
        block
      ),
      entry[0] +
        ' must require offers:execute.'
    );
  }
);

pass(
  'dashboard send and reconciliation endpoints require offers:execute'
);

const workflow =
  read('OfferExecutionWorkflow.js');

[
  [
    'reosOfferExecutionEnsureSheets',
    'reosOfferExecutionBuildQueue'
  ],
  [
    'reosOfferExecutionBuildQueue',
    'reosOfferExecutionMarkSubmitted'
  ],
  [
    'reosOfferExecutionMarkSubmitted',
    'reosOfferExecutionRecordResponse'
  ],
  [
    'reosOfferExecutionRecordResponse',
    'reosOfferExecutionScheduleFollowUps'
  ],
  [
    'reosOfferExecutionScheduleFollowUps',
    'reosOfferExecutionList'
  ]
].forEach(
  function (entry) {
    const block =
      functionBlock(
        workflow,
        entry[0],
        entry[1]
      );

    assert(
      /reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
        block
      ),
      entry[0] +
        ' must require offers:execute.'
    );
  }
);

pass(
  'all exported workflow mutation endpoints require offers:execute'
);

const transport =
  read('OfferDeliveryTransport.js');

const directDelivery =
  functionBlock(
    transport,
    'reosOfferDeliveryEmail'
  );

assert(
  /reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
    directDelivery
  ),
  'Direct Email delivery wrapper must require offers:execute.'
);

pass(
  'alternate direct Gmail delivery endpoint requires offers:execute'
);

/*
 * Read-only access remains separate from execution authority.
 */
const dashboardData =
  functionBlock(
    dashboard,
    'reosOfferExecutionDashboardData',
    'reosOfferExecutionSendEmail'
  );

assert(
  !/reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
    dashboardData
  ),
  'Dashboard read endpoint must not accidentally require execution authority.'
);

const listBlock =
  functionBlock(
    workflow,
    'reosOfferExecutionList',
    'reosOfferExecutionSummary'
  );

const summaryBlock =
  functionBlock(
    workflow,
    'reosOfferExecutionSummary'
  );

assert(
  !/reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
    listBlock
  ) &&
  !/reosRequireOfferExecutionPermission_\s*\(\s*\)/.test(
    summaryBlock
  ),
  'Read-only execution list/summary endpoints must remain distinct from mutation authority.'
);

pass(
  'read access remains separate from offer execution authority'
);

console.log();
console.log(
  'Offer Execution Permission contract validation PASSED.'
);
