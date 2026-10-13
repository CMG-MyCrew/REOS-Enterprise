'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');

const modulePath = path.join(
  root,
  'build/apps-script-brand/ProductionSpreadsheetPropertyBindingAdmin.js'
);

const source = fs.readFileSync(modulePath, 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function makeSheet(headers) {
  return {
    getLastColumn() {
      return headers.length;
    },

    getRange(row, col, rows, cols) {
      assert(row === 1, 'unexpected row');
      assert(col === 1, 'unexpected col');
      assert(rows === 1, 'unexpected row count');
      assert(cols === headers.length, 'unexpected col count');

      return {
        getDisplayValues() {
          return [headers.slice()];
        }
      };
    }
  };
}

const primaryHeaders = [
  'Distress Lead ID',
  'Address',
  'City',
  'State',
  'Zip',
  'County',
  'Source',
  'Source Dataset',
  'Parcel ID',
  'Source Record ID',
  'Source Record Key',
  'Source Observation Key',
  'Canonical Property Key'
];

const secondaryHeaders = [
  'ARV',
  'Analysis ID',
  'Cap Rate %',
  'Cash Required',
  'Closed',
  'Closing',
  'Comparable Analysis',
  'Created At',
  'DEALS',
  'DSCR',
  'Deal ID',
  'Disposition',
  'Due Diligence',
  'Flip Profit',
  'Grade',
  'Initial Analysis',
  'Lead',
  'MAO',
  'NOI',
  'Negotiation',
  'Offer Amount',
  'Offer Generation',
  'Offer ID',
  'Offer Submitted',
  'Property Review',
  'Purchase Price',
  'ROI %',
  'Recommendation',
  'Risk Level',
  'Score',
  'Score ID',
  'Source',
  'Status',
  'Summary JSON',
  'Under Contract',
  'Updated At'
];

const candidate =
  '1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU';

function makeRuntime(initialProperty, config = {}) {
  let property = initialProperty || '';
  let setCount = 0;
  let openCount = 0;

  const spreadsheet = {
    getId() {
      return config.openedId || candidate;
    },

    getSheetByName(name) {
      if (name === 'DISTRESS_LEADS') {
        if (config.missingPrimary) {
          return null;
        }

        return makeSheet(
          config.badPrimary
            ? primaryHeaders.slice(0, -1)
            : primaryHeaders
        );
      }

      if (name === 'DEALS') {
        if (config.missingSecondary) {
          return null;
        }

        return makeSheet(
          config.badSecondary
            ? secondaryHeaders.slice(0, -1)
            : secondaryHeaders
        );
      }

      return null;
    }
  };

  return {
    runtime: {
      getProperty(name) {
        assert(
          name === 'REOS_PRODUCTION_SPREADSHEET_ID',
          'unexpected property read'
        );

        return property;
      },

      setProperty(name, value) {
        assert(
          name === 'REOS_PRODUCTION_SPREADSHEET_ID',
          'unexpected property write'
        );

        assert(
          value === candidate,
          'unexpected property value'
        );

        setCount += 1;
        property = value;
      },

      openSpreadsheetById(id) {
        assert(id === candidate, 'unexpected spreadsheet id');
        openCount += 1;
        return spreadsheet;
      }
    },

    state() {
      return {
        property,
        setCount,
        openCount
      };
    }
  };
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {
  filename: modulePath
});

const api =
  sandbox.REOS_PRODUCTION_SPREADSHEET_PROPERTY_BINDING_ADMIN_V1;

assert(api, 'admin API missing');
assert(typeof api.execute === 'function', 'execute missing');

console.log('=== OFFLINE PROPERTY BINDING ADMIN VALIDATION ===');

{
  const x = makeRuntime('');

  const result = api.execute(
    candidate,
    { authorized: false },
    x.runtime
  );

  assert(
    result.reason === 'EXPLICIT_AUTHORIZATION_REQUIRED',
    'authorization gate failed'
  );

  assert(
    result.mutationExecuted === false,
    'unauthorized mutation occurred'
  );

  assert(x.state().setCount === 0, 'unauthorized write occurred');
  assert(x.state().openCount === 0, 'unauthorized open occurred');

  console.log('UNAUTHORIZED_EXECUTION_FAILS_CLOSED=true');
}

{
  const x = makeRuntime('');

  const result = api.execute(
    'wrong-spreadsheet',
    { authorized: true },
    x.runtime
  );

  assert(
    result.reason === 'UNAUTHORIZED_CANDIDATE',
    'candidate gate failed'
  );

  assert(x.state().setCount === 0, 'wrong candidate wrote property');
  assert(x.state().openCount === 0, 'wrong candidate opened workbook');

  console.log('WRONG_CANDIDATE_FAILS_CLOSED=true');
}

{
  const x = makeRuntime('different-production-id');

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  assert(
    result.reason === 'PREEXISTING_PROPERTY_MISMATCH',
    'preexisting mismatch did not fail closed'
  );

  assert(x.state().setCount === 0, 'mismatch overwrote property');
  assert(x.state().openCount === 0, 'mismatch opened workbook');

  console.log('PREEXISTING_PROPERTY_MISMATCH_FAILS_CLOSED=true');
}

{
  const x = makeRuntime('');

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  const state = x.state();

  assert(result.certified === true, 'fresh binding not certified');
  assert(result.reason === 'BOUND_AND_CERTIFIED', 'wrong success reason');
  assert(result.mutationExecuted === true, 'write not recorded');
  assert(state.setCount === 1, 'write count not exactly one');
  assert(state.openCount === 1, 'open count not exactly one');
  assert(state.property === candidate, 'property value wrong');
  assert(result.propertyAfter === candidate, 'post-write read wrong');
  assert(result.openedSpreadsheetId === candidate, 'opened id wrong');
  assert(
    result.primary.requiredFieldsPresent === true,
    'primary marker failed'
  );
  assert(
    result.secondary.requiredFieldsPresent === true,
    'secondary marker failed'
  );

  console.log('FRESH_BINDING_SINGLE_WRITE_CERTIFIED=true');
}

{
  const x = makeRuntime(candidate);

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  assert(result.certified === true, 'idempotent execution failed');
  assert(result.mutationExecuted === false, 'idempotent execution wrote');
  assert(x.state().setCount === 0, 'idempotent set count nonzero');
  assert(x.state().openCount === 1, 'idempotent verification not read');

  console.log('ALREADY_BOUND_IS_READ_ONLY_AND_CERTIFIED=true');
}

{
  const x = makeRuntime('', {
    openedId: 'wrong-opened-id'
  });

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  assert(
    result.reason === 'OPENED_SPREADSHEET_ID_MISMATCH',
    'opened-id mismatch not detected'
  );

  assert(result.certified === false, 'opened mismatch certified');

  console.log('OPENED_ID_MISMATCH_FAILS_CERTIFICATION=true');
}

{
  const x = makeRuntime('', {
    badPrimary: true
  });

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  assert(
    result.reason === 'BOUND_BUT_MARKERS_NOT_CERTIFIED',
    'primary schema failure not detected'
  );

  assert(result.certified === false, 'bad primary certified');

  console.log('PRIMARY_MARKER_FAILURE_FAILS_CERTIFICATION=true');
}

{
  const x = makeRuntime('', {
    badSecondary: true
  });

  const result = api.execute(
    candidate,
    { authorized: true },
    x.runtime
  );

  assert(
    result.reason === 'BOUND_BUT_MARKERS_NOT_CERTIFIED',
    'secondary schema failure not detected'
  );

  assert(result.certified === false, 'bad secondary certified');

  console.log('SECONDARY_MARKER_FAILURE_FAILS_CERTIFICATION=true');
}

const forbidden = [
  'getActiveSpreadsheet(',
  'insertSheet(',
  'deleteSheet(',
  'setValues(',
  'appendRow(',
  'clear(',
  'clearContent(',
  'deleteProperty(',
  'deleteAllProperties(',
  'UrlFetchApp',
  'GmailApp',
  'DriveApp',
  'ScriptApp.newTrigger'
];

for (const marker of forbidden) {
  assert(
    !source.includes(marker),
    'forbidden production capability: ' + marker
  );
}

const propertiesServiceSetPropertyCallsites =
  (
    source.match(
      /PropertiesService\s*\.\s*getScriptProperties\s*\(\s*\)\s*\.\s*setProperty\s*\(/g
    ) || []
  ).length;

const runtimeSetPropertyInvocations =
  (
    source.match(
      /\brt\s*\.\s*setProperty\s*\(/g
    ) || []
  ).length;

assert(
  propertiesServiceSetPropertyCallsites === 1,
  'unexpected PropertiesService setProperty callsite count: ' +
    propertiesServiceSetPropertyCallsites
);

assert(
  runtimeSetPropertyInvocations === 1,
  'unexpected bounded runtime setProperty invocation count: ' +
    runtimeSetPropertyInvocations
);

console.log('ACTIVE_SPREADSHEET_FALLBACK_ABSENT=true');
console.log('SPREADSHEET_MUTATION_CAPABILITY_ABSENT=true');
console.log('PROPERTY_DELETE_CAPABILITY_ABSENT=true');
console.log('EXACT_PROPERTIES_SERVICE_SET_PROPERTY_CALLSITE_COUNT=1');
console.log('EXACT_BOUNDED_RUNTIME_SET_PROPERTY_INVOCATION_COUNT=1');
console.log('OFFLINE_PROPERTY_BINDING_ADMIN_VALIDATOR_PASS=true');
