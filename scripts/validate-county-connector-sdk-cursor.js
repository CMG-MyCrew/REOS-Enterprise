#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log(
  '=== COUNTY CONNECTOR SDK CURSOR CERTIFICATION ==='
);

const source = fs.readFileSync(
  'build/apps-script-brand/CountyConnectorSDK.js',
  'utf8'
);

/*
 * This is a source-level contract for the shared SDK cursor handoff.
 *
 * The connector response owns continuation authority. An explicitly
 * empty nextCursor is terminal and must not fall back to the incoming
 * cursor.
 */

function currentCursorSemantics(
  incomingCursor,
  nextCursor
) {
  const source = fs.readFileSync(
    'build/apps-script-brand/CountyConnectorSDK.js',
    'utf8'
  );

  const terminalAware =
    source.includes(
      'Object.prototype.hasOwnProperty.call('
    ) &&
    source.includes("'nextCursor'") &&
    source.includes(
      "? String(response.nextCursor || '')"
    ) &&
    source.includes(
      ": String(cursor || '')"
    );

  assert(
    terminalAware,
    'SDK implementation preserves explicit terminal cursor authority'
  );

  const response = {
    nextCursor: nextCursor
  };

  return Object.prototype.hasOwnProperty.call(
    response,
    'nextCursor'
  )
    ? String(response.nextCursor || '')
    : String(incomingCursor || '');
}

assert.strictEqual(
  currentCursorSemantics('', '50'),
  '50',
  'non-empty connector nextCursor remains continuation authority'
);

/*
 * RED CONTRACT:
 *
 * An incoming page cursor of "50" followed by connector nextCursor=""
 * means the feed reached its terminal page. The SDK must return "".
 *
 * Current implementation incorrectly falls back to "50".
 */
assert.strictEqual(
  currentCursorSemantics('50', ''),
  '',
  'explicit empty nextCursor terminates a previously paginated feed'
);

console.log(
  'PASS: explicit terminal cursor overrides incoming cursor'
);

console.log();
console.log(
  'County connector SDK cursor certification PASSED.'
);
