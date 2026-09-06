#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

const MODULE =
  'build/apps-script-brand/CountyCodeViolationGate1Reconciliation.js';

const modulePath = path.join(ROOT, MODULE);

assert.ok(
  fs.existsSync(modulePath),
  'Gate 1 reconciliation module is missing: ' + MODULE
);

const source = fs.readFileSync(modulePath, 'utf8');

function requirePattern(pattern, message) {
  assert.ok(pattern.test(source), message);
}

/*
 * Gate 1 scope must remain the single production-completion population:
 *
 * old ObjectID cap escapees
 * + at/before preserved AK1 logical boundary
 * + Philadelphia actionable-priority source domain.
 */
requirePattern(
  /HISTORICAL_OBJECTID_CAP\s*=\s*636638/,
  'Gate 1 must bind the certified historical ObjectID cap'
);

requirePattern(
  /objectid\s*>\s*['"]\s*\+\s*HISTORICAL_OBJECTID_CAP/,
  'Gate 1 must apply the historical ObjectID cap exclusion'
);

requirePattern(
  /2026-06-27 07:28:16/,
  'Gate 1 must bind to the certified preserved boundary timestamp'
);

requirePattern(
  /VI-2026-047721/,
  'Gate 1 must bind to the certified durable boundary violation number'
);

requirePattern(
  /UNSAFE[\s\S]*IMMINENTLY DANGEROUS[\s\S]*UNFIT[\s\S]*HAZARDOUS[\s\S]*UNLAWFUL/,
  'Gate 1 must preserve the certified actionable-priority source domain'
);

/*
 * Population authority.
 * The audit must fail closed if the previously proven population changes.
 */
requirePattern(
  /\b168\b/,
  'Gate 1 must bind to the proven 168 pre-boundary cap-excluded rows'
);

requirePattern(
  /\b153\b/,
  'Gate 1 must bind to the proven 153 OPEN actionable rows'
);

/*
 * Durable reconciliation classifications.
 */
[
  'ALREADY_SAFE',
  'MISSING',
  'DUPLICATE_DURABLE',
  'PROPERTY_CONFLICT',
  'LEGACY_OBJECTID_COLLISION',
  'SOURCE_IDENTITY_UNAVAILABLE'
].forEach((classification) => {
  requirePattern(
    new RegExp(classification),
    'Missing Gate 1 classification: ' + classification
  );
});

/*
 * Durable identity must be based on Violation Number.
 */
requirePattern(
  /Violation Number/,
  'Gate 1 must reconcile persisted durable Violation Number identity'
);

requirePattern(
  /violationnumber/,
  'Gate 1 must reconcile source violationnumber identity'
);

/*
 * Legacy ObjectID reuse must be detected explicitly.
 */
requirePattern(
  /Source Observation Key/,
  'Gate 1 must inspect legacy Source Observation Key authority'
);

requirePattern(
  /Source Record Key/,
  'Gate 1 must inspect legacy Source Record Key compatibility authority'
);

/*
 * Canonical property comparison must delegate to the existing deterministic
 * REOS canonical-property authority.
 */
requirePattern(
  /CanonicalPropertyIdentity/,
  'Gate 1 must use CanonicalPropertyIdentity'
);

requirePattern(
  /tryCanonicalPropertyIdentity/,
  'Gate 1 must use fail-closed canonical property resolution'
);

/*
 * Read-only safety contract.
 */
[
  'productionDataMutationAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'migrationAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach((field) => {
  requirePattern(
    new RegExp(field + '\\s*:\\s*false'),
    field + ' must remain false'
  );
});

requirePattern(
  /readOnly\s*:\s*true/,
  'Gate 1 reconciliation must explicitly report readOnly=true'
);

requirePattern(
  /getAll\s*\(/,
  'Gate 1 may read persisted DISTRESS_LEADS'
);

[
  /Database\.insert\s*\(/,
  /Database\.update\s*\(/,
  /Database\.delete/i,
  /setProperty\s*\(/,
  /deleteProperty\s*\(/,
  /newTrigger\s*\(/,
  /deleteTrigger\s*\(/,
  /CountyRuntimeBridge\.sync\s*\(/
].forEach((forbidden) => {
  assert.ok(
    !forbidden.test(source),
    'Gate 1 read-only reconciliation contains forbidden mutation/execution authority: ' +
      forbidden
  );
});

/*
 * Production scheduler must remain frozen during the reconciliation read.
 */
requirePattern(
  /getProjectTriggers\s*\(/,
  'Gate 1 must verify managed trigger state'
);

requirePattern(
  /reosCountyProductionSchedulerRun/,
  'Gate 1 must inspect the managed county scheduler handler'
);

requirePattern(
  /triggerCount|managedTriggerCount/,
  'Gate 1 must expose or validate zero scheduler triggers'
);

/*
 * One controlled RPC surface.
 */
requirePattern(
  /function\s+reosCountyCodeViolationGate1Reconciliation\s*\(/,
  'Gate 1 controlled RPC entry point is missing'
);

console.log(
  'PASS: Code Violations Production Completion Gate 1 contract validation PASSED.'
);
