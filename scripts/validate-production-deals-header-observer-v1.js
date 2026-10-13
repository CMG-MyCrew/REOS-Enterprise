#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

const modulePath = path.join(
  root,
  'build/apps-script-brand/ProductionDealsHeaderObserver.js'
);

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

const source = fs.readFileSync(modulePath, 'utf8');

function stripCommentsAndStrings(sourceText) {
  let output = '';
  let i = 0;
  let state = 'code';
  let quote = null;

  while (i < sourceText.length) {
    const ch = sourceText[i];
    const next =
      i + 1 < sourceText.length
        ? sourceText[i + 1]
        : '';

    if (state === 'code') {
      if (
        ch === "'" ||
        ch === '"' ||
        ch === '`'
      ) {
        quote = ch;
        state = 'string';
        output += ' ';
        i += 1;
        continue;
      }

      if (ch === '/' && next === '/') {
        state = 'line-comment';
        output += '  ';
        i += 2;
        continue;
      }

      if (ch === '/' && next === '*') {
        state = 'block-comment';
        output += '  ';
        i += 2;
        continue;
      }

      output += ch;
      i += 1;
      continue;
    }

    if (state === 'string') {
      if (ch === '\\') {
        output += '  ';
        i += 2;
        continue;
      }

      if (ch === quote) {
        state = 'code';
        quote = null;
      }

      output += ch === '\n' ? '\n' : ' ';
      i += 1;
      continue;
    }

    if (state === 'line-comment') {
      if (ch === '\n') {
        state = 'code';
        output += '\n';
      } else {
        output += ' ';
      }

      i += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (ch === '*' && next === '/') {
        state = 'code';
        output += '  ';
        i += 2;
      } else {
        output += ch === '\n' ? '\n' : ' ';
        i += 1;
      }
    }
  }

  return output;
}

const executableSource =
  stripCommentsAndStrings(source);

const forbiddenExecutablePatterns = [
  ['getActiveSpreadsheet', /\bgetActiveSpreadsheet\s*\(/],
  ['PropertiesService', /\bPropertiesService\b/],
  ['setProperty', /\.setProperty\s*\(/],
  ['deleteProperty', /\.deleteProperty\s*\(/],
  ['insertSheet', /\.insertSheet\s*\(/],
  ['deleteSheet', /\.deleteSheet\s*\(/],
  ['appendRow', /\.appendRow\s*\(/],
  ['setValue', /\.setValue\s*\(/],
  ['setValues', /\.setValues\s*\(/],
  ['clear', /\.clear\s*\(/],
  ['clearContent', /\.clearContent\s*\(/],
  ['UrlFetchApp', /\bUrlFetchApp\b/],
  ['GmailApp', /\bGmailApp\b/],
  ['DriveApp', /\bDriveApp\b/],
  ['ScriptApp', /\bScriptApp\b/],
  ['LockService', /\bLockService\b/]
];

for (
  const [name, pattern]
  of forbiddenExecutablePatterns
) {
  assert(
    !pattern.test(executableSource),
    'forbidden executable capability present: ' + name
  );
}

assert(
  source.includes('SpreadsheetApp.openById'),
  'explicit openById production primitive missing'
);

assert(
  source.includes("'DEALS'"),
  'exact DEALS sheet name missing'
);

assert(
  source.includes('MAX_HEADER_COLUMNS = 256'),
  'bounded header width missing'
);

const sandbox = {
  console: console
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox, {
  filename: modulePath
});

const api =
  sandbox.REOS_PRODUCTION_DEALS_HEADER_OBSERVER_V1;

assert(api, 'observer global missing');

assert(
  typeof api.observe === 'function',
  'observe function missing'
);

assert(
  typeof sandbox.reosObserveProductionDealsHeaderV1 ===
    'function',
  'RPC wrapper missing'
);

const expectedId =
  '1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU';

function makeRuntime(options) {
  options = options || {};

  return {
    openSpreadsheetById(id) {
      if (options.throwOpen) {
        throw new Error('open failed');
      }

      return {
        getId() {
          return options.openedId || id;
        },

        getSheetByName(name) {
          if (options.missingSheet) {
            return null;
          }

          assert(
            name === 'DEALS',
            'observer requested a non-DEALS sheet'
          );

          return {
            getLastColumn() {
              if (
                Object.prototype.hasOwnProperty.call(
                  options,
                  'lastColumn'
                )
              ) {
                return options.lastColumn;
              }

              return 4;
            },

            getRange(row, column, rows, columns) {
              assert(row === 1, 'header row must be row 1');
              assert(column === 1, 'header read must start at column 1');
              assert(rows === 1, 'header read must be exactly one row');

              return {
                getDisplayValues() {
                  if (options.values) {
                    return options.values;
                  }

                  return [[
                    'Deal ID',
                    'Property ID',
                    'Stage',
                    'Owner'
                  ]];
                }
              };
            }
          };
        }
      };
    }
  };
}

let result;

result = api.observe('', makeRuntime());

assert(
  result.certifiedObservation === false,
  'empty ID must fail closed'
);

assert(
  result.reason === 'SPREADSHEET_ID_REQUIRED',
  'empty ID reason mismatch'
);

result = api.observe(
  'not-authorized',
  makeRuntime()
);

assert(
  result.certifiedObservation === false,
  'substitute spreadsheet ID must fail closed'
);

assert(
  result.reason === 'SPREADSHEET_ID_NOT_AUTHORIZED',
  'substitute ID reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime({
    throwOpen: true
  })
);

assert(
  result.certifiedObservation === false,
  'open failure must fail closed'
);

assert(
  result.reason === 'OPEN_BY_ID_FAILED',
  'open failure reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime({
    openedId: 'wrong-id'
  })
);

assert(
  result.certifiedObservation === false,
  'opened ID mismatch must fail closed'
);

assert(
  result.reason === 'OPENED_SPREADSHEET_ID_MISMATCH',
  'opened ID mismatch reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime({
    missingSheet: true
  })
);

assert(
  result.certifiedObservation === false,
  'missing DEALS sheet must fail closed'
);

assert(
  result.reason === 'DEALS_SHEET_MISSING',
  'missing sheet reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime({
    lastColumn: 0
  })
);

assert(
  result.certifiedObservation === false,
  'empty header must fail closed'
);

assert(
  result.reason === 'DEALS_HEADER_EMPTY',
  'empty header reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime({
    lastColumn: 257
  })
);

assert(
  result.certifiedObservation === false,
  'oversized header must fail closed'
);

assert(
  result.reason === 'DEALS_HEADER_BOUND_EXCEEDED',
  'oversized header reason mismatch'
);

result = api.observe(
  expectedId,
  makeRuntime()
);

assert(
  result.certifiedObservation === true,
  'valid observation should certify'
);

assert(
  result.readOnly === true,
  'readOnly marker must be true'
);

assert(
  result.mutationExecuted === false,
  'mutation marker must remain false'
);

assert(
  result.openedSpreadsheetId === expectedId,
  'opened spreadsheet ID mismatch'
);

assert(
  result.sheetName === 'DEALS',
  'sheet name mismatch'
);

assert(
  result.lastColumn === 4,
  'lastColumn mismatch'
);

assert(
  result.observedColumnCount === 4,
  'observed column count mismatch'
);

assert(
  JSON.stringify(result.headers) ===
    JSON.stringify([
      'Deal ID',
      'Property ID',
      'Stage',
      'Owner'
    ]),
  'header values mismatch'
);

assert(
  result.reason === 'OBSERVED',
  'success reason mismatch'
);

console.log(
  'PASS: production DEALS header observer v1 offline certification'
);

console.log(
  'EXPLICIT_SPREADSHEET_ID_ONLY=true'
);

console.log(
  'OPEN_BY_ID_ONLY=true'
);

console.log(
  'EXACT_SHEET_NAME=DEALS'
);

console.log(
  'BOUNDED_HEADER_READ_MAX_COLUMNS=256'
);

console.log(
  'MUTATION_CAPABILITY_PRESENT=false'
);

console.log(
  'AUTOMATIC_INVOCATION_PRESENT=false'
);
