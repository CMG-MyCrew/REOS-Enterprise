#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const connectorPath = path.join(
  repoRoot,
  'build/apps-script-brand/PAPhiladelphiaCountyConnector.js'
);

const source = fs.readFileSync(connectorPath, 'utf8');

function fail(message) {
  console.error('FAIL:', message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS:', message);
}

const taxStart = source.indexOf('      tax_delinquent: {');
const nextDataset = source.indexOf(
  '      code_violations: {',
  taxStart
);

if (taxStart === -1 || nextDataset === -1) {
  fail('unable to isolate Philadelphia tax_delinquent definition');
}

const taxBlock = source.slice(taxStart, nextDataset);

if (
  !taxBlock.includes(
    'where: "IS_ACTIONABLE = \'true\'"'
  )
) {
  fail(
    'tax_delinquent must use source-side IS_ACTIONABLE=true filtering'
  );
}
pass('tax_delinquent requires actionable source records');

if (
  !taxBlock.includes(
    'orderByFields: "OBJECTID ASC"'
  )
) {
  fail(
    'tax_delinquent must preserve deterministic OBJECTID ordering'
  );
}
pass('deterministic OBJECTID ordering preserved');

const actionableOccurrences =
  (source.match(/IS_ACTIONABLE/g) || []).length;

if (actionableOccurrences !== 1) {
  fail(
    'IS_ACTIONABLE filter must appear exactly once in Philadelphia connector; found ' +
      actionableOccurrences
  );
}
pass('actionable filter is scoped only to intended dataset');

if (
  !source.includes('definition.sourceQuery &&') ||
  !source.includes('definition.sourceQuery.where') ||
  !source.includes(': \'1=1\';')
) {
  fail(
    'connector fetch path no longer honors dataset sourceQuery contract'
  );
}
pass('connector fetch path honors sourceQuery contract');

console.log(
  '\nPhiladelphia actionable tax filter validation PASSED.'
);
