const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(
  'build/apps-script-brand/CountyCodeViolationSingleRowDriftDiagnostic.js',
  'utf8'
);

function assert(value, message) {
  if (!value) throw new Error(message);
}

function expectThrow(fn, pattern, label) {
  let error = null;
  try {
    fn();
  } catch (e) {
    error = e;
  }

  assert(error, label + ': expected failure');
  assert(
    pattern.test(String(error.message || error)),
    label + ': unexpected error: ' + error
  );
}

function run(rows, options) {
  const context = {
    REOS: {
      Database: {
        getAll(table) {
          assert(
            table === 'DISTRESS_LEADS',
            'unexpected table'
          );
          return rows;
        }
      },
      Security: {
        requireAdmin() {
          return true;
        }
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return context
    .reosCountyCodeViolationSingleRowDriftDiagnostic(
      options
    );
}

const row = {
  _rowNumber: 764,
  'Distress Lead ID': 'DL-20260820181640-2063',
  Source: 'PA-PHILADELPHIA',
  'Source Dataset': 'code_violations',
  'Source Record ID': '24',
  'Violation Number': 'VI-2026-045340',
  'Parcel ID': '',
  'Source Record Key': 'legacy-record-key',
  'Source Observation Key':
    'pa-philadelphia|code_violations|24',
  'Canonical Property Key':
    'property|address|pa|philadelphia|19150-2404|8030 forrest ave'
};

const result = run([row], {});

assert(result.ok === true, 'expected ok');
assert(result.mode === 'READ_ONLY', 'expected READ_ONLY');
assert(result.target.rowNumber === 764, 'wrong row');

assert(
  result.target.distressLeadId ===
    'DL-20260820181640-2063',
  'wrong target'
);

assert(
  result.target.canonicalPropertyKey ===
    row['Canonical Property Key'],
  'canonical key not returned'
);

[
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerAuthorityGranted',
  'deleteAuthorityGranted',
  'connectorExecutionAuthorityGranted',
  'checkpointMutationAuthorityGranted',
  'schedulerAuthorityGranted',
  'automaticOfferAuthorityGranted'
].forEach(function (key) {
  assert(result[key] === false, key + ' must be false');
});

expectThrow(
  function () {
    run([row], { distressLeadIds: ['OTHER'] });
  },
  /Caller-defined diagnostic authority is prohibited/,
  'caller population'
);

expectThrow(
  function () {
    run([], {});
  },
  /found 0/,
  'missing row'
);

expectThrow(
  function () {
    run([row, Object.assign({}, row)], {});
  },
  /found 2/,
  'duplicate row'
);

expectThrow(
  function () {
    run(
      [Object.assign({}, row, { _rowNumber: 765 })],
      {}
    );
  },
  /physical row drift/,
  'row drift'
);

console.log('PASS: exact target record only');
console.log('PASS: current canonical property key exposed');
console.log('PASS: caller population prohibited');
console.log('PASS: missing/duplicate/row drift fail closed');
console.log('PASS: all mutation authorities false');
