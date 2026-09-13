const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(
  'build/apps-script-brand/CountyCodeViolationTwoRowRawEvidence.js',
  'utf8'
);

function assert(value, message) {
  if (!value) throw new Error(message);
}

[
  {
    pattern: /\.setValue(?:s)?\s*\(/,
    label: 'spreadsheet value write'
  },
  {
    pattern: /\.(?:appendRow|deleteRow|deleteRows|insertRow|insertRows|clear)\s*\(/,
    label: 'spreadsheet structural write'
  },
  {
    pattern: /REOS\.Database\.(?:insert|update|upsert|softDelete)\s*\(/,
    label: 'Database mutation'
  },
  {
    pattern: /ScriptApp\.(?:newTrigger|deleteTrigger)\s*\(/,
    label: 'trigger mutation'
  },
  {
    pattern: /PropertiesService[\s\S]*?\.setProperty\s*\(/,
    label: 'checkpoint or property mutation'
  }
].forEach(function (entry) {
  assert(
    entry.pattern.test(source) === false,
    'forbidden mutation surface: ' + entry.label
  );
});

assert(
  source.includes('getValues()'),
  'raw physical value read is required'
);

assert(
  source.includes('getDisplayValues()'),
  'display-value evidence read is required'
);

function expectThrow(fn, pattern, label) {
  let error = null;

  try {
    fn();
  } catch (caught) {
    error = caught;
  }

  assert(error, label + ': expected failure');
  assert(
    pattern.test(String(error.message || error)),
    label + ': unexpected error: ' + error
  );
}

const headers = [
  'Distress Lead ID',
  'Source',
  'Source Dataset',
  'Source Record ID',
  'Violation Number',
  'Parcel ID',
  'Source Record Key',
  'Source Observation Key',
  'Canonical Property Key',
  'Address',
  'City',
  'State',
  'Zip',
  'County'
];

function valuesFor(id, violationNumber) {
  return [
    id,
    'PA-PHILADELPHIA',
    'code_violations',
    '24',
    violationNumber,
    '',
    'pa-philadelphia|code_violations|24',
    '',
    '',
    '8030 Forrest Ave',
    'Philadelphia',
    'PA',
    '19150-2404',
    'Philadelphia'
  ];
}

function makeSheet(testHeaders, rows) {
  return {
    getLastColumn() {
      return testHeaders.length;
    },

    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      assert(rowCount === 1, 'expected one physical row');

      const sourceRow = rowNumber === 1
        ? testHeaders
        : rows[rowNumber];

      assert(sourceRow, 'unexpected row: ' + rowNumber);

      const values = sourceRow.slice(
        columnNumber - 1,
        columnNumber - 1 + columnCount
      );

      return {
        getValues() {
          return [values];
        },

        getDisplayValues() {
          return [values.map(function (value) {
            return value === undefined || value === null
              ? ''
              : String(value);
          })];
        }
      };
    }
  };
}

const identitySource = fs.readFileSync(
  'build/apps-script-brand/CanonicalPropertyIdentity.js',
  'utf8'
);

function run(config, options) {
  const stats = config.stats || {};
  stats.sheetReads = 0;
  stats.triggerReads = 0;
  const context = {
    REOS: {
      Database: {
        getSheet(table) {
          stats.sheetReads += 1;
          assert(table === 'DISTRESS_LEADS', 'wrong table');
          return makeSheet(config.headers, config.rows);
        }
      },

      Security: {
        requireAdmin() {
          if (config.denyAdmin) throw new Error('TEST_ADMIN_DENIED');
          return true;
        }
      }
    },

    ScriptApp: {
      getProjectTriggers() {
        stats.triggerReads += 1;
        if (config.triggerSequence) {
          const index = stats.triggerReads - 1;
          assert(index < config.triggerSequence.length, 'unexpected trigger read');
          return config.triggerSequence[index];
        }
        return config.triggers || [];
      }
    }
  };

  vm.createContext(context);
  vm.runInContext(identitySource, context);
  vm.runInContext(source, context);

  return context.reosCountyCodeViolationTwoRowRawEvidence(
    options
  );
}

const rows = {
  764: valuesFor(
    'DL-20260820181640-2063',
    'VI-2026-045340'
  ),
  768: valuesFor(
    'DL-20260820181649-9792',
    'VI-2026-045341'
  )
};

const result = run({ headers: headers, rows: rows }, {});

assert(result.ok === true, 'expected success');
assert(
  result.mode === 'READ_ONLY_TWO_ROW_RAW_EVIDENCE',
  'wrong mode'
);
assert(result.rows.length === 2, 'expected two rows');
assert(
  result.requiredHeaderBindings.length === headers.length,
  'expected every required header binding'
);
assert(
  result.comparisons.sameDerivedSourceObservationKey === true,
  'expected same derived source observation key'
);
assert(
  result.comparisons.sameDerivedCanonicalPropertyKey === true,
  'expected same derived canonical property key'
);

const first = result.rows[0];
const storedCanonical = first.rawCells.find(function (cell) {
  return cell.header === 'Canonical Property Key';
});
const storedObservation = first.rawCells.find(function (cell) {
  return cell.header === 'Source Observation Key';
});

assert(storedCanonical.rawValue === '', 'canonical storage must stay raw');
assert(storedObservation.rawValue === '', 'observation storage must stay raw');
assert(
  first.derivedIdentity.canonicalPropertyKey ===
    'property|address|pa|philadelphia|19150-2404|8030 forrest ave',
  'expected independently derived canonical key'
);

[
  'productionDataMutationAuthorityGranted',
  'repairAuthorityGranted',
  'migrationAuthorityGranted',
  'collapseAuthorityGranted',
  'winnerSelectionAuthorityGranted',
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
    run({ headers: headers, rows: rows }, { rowNumber: 999 });
  },
  /Caller-defined diagnostic authority is prohibited/,
  'caller authority'
);

expectThrow(
  function () {
    run({
      headers: headers,
      rows: rows,
      triggers: [{
        getHandlerFunction() {
          return 'reosCountyProductionSchedulerRun';
        }
      }]
    }, {});
  },
  /requires zero managed county scheduler triggers/,
  'county scheduler trigger'
);

expectThrow(
  function () {
    run({
      headers: headers.concat(['Address']),
      rows: rows
    }, {});
  },
  /Required header must occur exactly once: Address/,
  'duplicate required header'
);

const wrongRows = Object.assign({}, rows, {
  768: valuesFor(
    'WRONG-DISTRESS-LEAD-ID',
    'VI-2026-045341'
  )
});

expectThrow(
  function () {
    run({ headers: headers, rows: wrongRows }, {});
  },
  /Target physical row does not contain its certified Distress Lead ID/,
  'physical-row target drift'
);


const denialStats = {};
expectThrow(
  function () {
    run({
      headers: headers,
      rows: rows,
      denyAdmin: true,
      stats: denialStats
    }, {});
  },
  /TEST_ADMIN_DENIED/,
  'admin denial'
);
assert(denialStats.sheetReads === 0, 'admin denial must precede sheet access');
assert(denialStats.triggerReads === 0, 'admin denial must precede trigger access');

headers.forEach(function (missingHeader) {
  expectThrow(
    function () {
      run({
        headers: headers.filter(function (header) {
          return header !== missingHeader;
        }),
        rows: rows
      }, {});
    },
    /Required header must occur exactly once/,
    'missing header: ' + missingHeader
  );
});

const raceStats = {};
expectThrow(
  function () {
    run({
      headers: headers,
      rows: rows,
      stats: raceStats,
      triggerSequence: [
        [],
        [{
          getHandlerFunction() {
            return 'reosCountyProductionSchedulerRun';
          }
        }]
      ]
    }, {});
  },
  /requires zero managed county scheduler triggers/,
  'county trigger appears during read'
);
assert(raceStats.triggerReads === 2, 'both trigger checks must execute');
assert(raceStats.sheetReads === 1, 'race fixture must reach the sheet read');

const changedRows = {
  764: rows[764].slice(),
  768: rows[768].slice()
};
changedRows[768][headers.indexOf('Address')] = '999 Test Ave';
const changedResult = run({ headers: headers, rows: changedRows }, {});
assert(
  changedResult.comparisons.sameDerivedCanonicalPropertyKey === false,
  'real resolver must distinguish different addresses'
);
assert(
  changedResult.rows[1].derivedIdentity.canonicalPropertyKey ===
    'property|address|pa|philadelphia|19150-2404|999 test ave',
  'derived identity must reflect actual fixture inputs'
);

const beforeRead = JSON.stringify(rows);
run({ headers: headers, rows: rows }, {});
assert(JSON.stringify(rows) === beforeRead, 'fixture values must remain unchanged');

console.log('PASS: actual production identity resolver loaded');
console.log('PASS: changed address changes derived identity');
console.log('PASS: admin denial precedes production I/O');
console.log('PASS: every required missing header fails closed');
console.log('PASS: county trigger appearing during read fails closed');
console.log('PASS: input cell values remain unchanged');

console.log('PASS: exact two-row physical scope');
console.log('PASS: raw stored and derived identities remain separate');
console.log('PASS: header binding and physical-row drift fail closed');
console.log('PASS: county scheduler quiescence required');
console.log('PASS: all mutation authorities remain false');
