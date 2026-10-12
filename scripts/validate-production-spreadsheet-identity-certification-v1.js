#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');

const productionPath = path.join(
  root,
  'build/apps-script-brand/ProductionSpreadsheetIdentityCertification.js'
);

const fixturePath = path.join(
  root,
  'scripts/fixtures/production-spreadsheet-identity-certification-v1.json'
);

const source = fs.readFileSync(productionPath, 'utf8');
const fixture = JSON.parse(
  fs.readFileSync(fixturePath, 'utf8')
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const context = {
  console
};

vm.createContext(context);
vm.runInContext(source, context, {
  filename: productionPath
});

const api =
  context.REOS_PRODUCTION_SPREADSHEET_IDENTITY_CERTIFICATION_V1;

assert(api, 'global identity certification object missing');
assert(api.VERSION === 'v1', 'version mismatch');

assert(
  typeof api.certify === 'function',
  'certify function missing'
);

assert(
  typeof context.reosProductionSpreadsheetIdentityCertificationV1
    === 'function',
  'public global function missing'
);

assert(
  JSON.stringify(api.getPrimaryRequiredFields()) ===
    JSON.stringify(fixture.primary.requiredFields),
  'primary required fields mismatch fixture'
);

assert(
  JSON.stringify(api.getSecondaryRequiredFields()) ===
    JSON.stringify(fixture.secondary.requiredFields),
  'secondary required fields mismatch fixture'
);

function makeSpreadsheet(id, primaryHeader, secondaryHeader) {
  const sheets = {
    DISTRESS_LEADS: {
      getLastColumn() {
        return primaryHeader.length;
      },
      getRange(row, col, rows, cols) {
        assert(row === 1, 'primary/data row read attempted');
        assert(col === 1, 'unexpected primary start column');
        assert(rows === 1, 'more than one row requested');
        assert(cols === primaryHeader.length, 'primary width mismatch');

        return {
          getDisplayValues() {
            return [primaryHeader.slice()];
          }
        };
      }
    },

    DEALS: {
      getLastColumn() {
        return secondaryHeader.length;
      },
      getRange(row, col, rows, cols) {
        assert(row === 1, 'secondary/data row read attempted');
        assert(col === 1, 'unexpected secondary start column');
        assert(rows === 1, 'more than one row requested');
        assert(cols === secondaryHeader.length, 'secondary width mismatch');

        return {
          getDisplayValues() {
            return [secondaryHeader.slice()];
          }
        };
      }
    }
  };

  return {
    getId() {
      return id;
    },

    getSheetByName(name) {
      return sheets[name] || null;
    }
  };
}

const candidate = 'CERTIFIED-CANDIDATE-ID';

let openCount = 0;

let runtime = {
  readScriptProperty(name) {
    assert(
      name === fixture.propertyName,
      'unexpected script property name'
    );

    return candidate;
  },

  openSpreadsheetById(id) {
    openCount += 1;

    assert(
      id === candidate,
      'candidate ID not passed exactly to openById runtime'
    );

    return makeSpreadsheet(
      candidate,
      fixture.primary.requiredFields,
      fixture.secondary.requiredFields
    );
  }
};

let result = api.certify(candidate, runtime);

assert(result.certified === true, 'happy path did not certify');
assert(result.propertyMatchesCandidate === true, 'property mismatch');
assert(result.openedSpreadsheetId === candidate, 'opened ID mismatch');
assert(result.primary.requiredFieldsPresent === true, 'primary failed');
assert(result.secondary.requiredFieldsPresent === true, 'secondary failed');
assert(result.mutationExecuted === false, 'mutation marker not false');
assert(openCount === 1, 'unexpected open count');

openCount = 0;

result = api.certify(candidate, {
  readScriptProperty() {
    return null;
  },

  openSpreadsheetById() {
    openCount += 1;
    throw new Error('must not open when property missing');
  }
});

assert(result.certified === false, 'missing property certified');
assert(result.reason === 'PROPERTY_MISSING', 'wrong missing-property reason');
assert(openCount === 0, 'opened workbook with missing property');

openCount = 0;

result = api.certify(candidate, {
  readScriptProperty() {
    return 'DIFFERENT-ID';
  },

  openSpreadsheetById() {
    openCount += 1;
    throw new Error('must not open on property mismatch');
  }
});

assert(result.certified === false, 'property mismatch certified');
assert(
  result.reason === 'PROPERTY_CANDIDATE_MISMATCH',
  'wrong property-mismatch reason'
);
assert(openCount === 0, 'opened workbook on property mismatch');

result = api.certify(candidate, {
  readScriptProperty() {
    return candidate;
  },

  openSpreadsheetById() {
    return makeSpreadsheet(
      'WRONG-OPENED-ID',
      fixture.primary.requiredFields,
      fixture.secondary.requiredFields
    );
  }
});

assert(result.certified === false, 'wrong opened ID certified');
assert(
  result.reason === 'OPENED_SPREADSHEET_ID_MISMATCH',
  'wrong opened-ID reason'
);

const badPrimary = fixture.primary.requiredFields.slice(1);

result = api.certify(candidate, {
  readScriptProperty() {
    return candidate;
  },

  openSpreadsheetById() {
    return makeSpreadsheet(
      candidate,
      badPrimary,
      fixture.secondary.requiredFields
    );
  }
});

assert(result.certified === false, 'missing primary field certified');
assert(
  result.primary.requiredFieldsPresent === false,
  'missing primary field not detected'
);

const badSecondary = fixture.secondary.requiredFields.slice(1);

result = api.certify(candidate, {
  readScriptProperty() {
    return candidate;
  },

  openSpreadsheetById() {
    return makeSpreadsheet(
      candidate,
      fixture.primary.requiredFields,
      badSecondary
    );
  }
});

assert(result.certified === false, 'missing secondary field certified');
assert(
  result.secondary.requiredFieldsPresent === false,
  'missing secondary field not detected'
);

let threw = false;

try {
  api.certify('', runtime);
} catch (error) {
  threw = true;
}

assert(threw, 'empty candidate did not fail closed');

const forbidden = [
  'getActiveSpreadsheet',
  '.setValue(',
  '.setValues(',
  '.appendRow(',
  '.clear(',
  '.clearContent(',
  '.insertSheet(',
  '.deleteSheet(',
  '.setProperty(',
  '.setProperties(',
  '.deleteProperty(',
  '.deleteAllProperties(',
  'SpreadsheetApp.flush',
  'LockService',
  'UrlFetchApp',
  'GmailApp',
  'DriveApp',
  'ScriptApp'
];

for (const token of forbidden) {
  assert(
    !source.includes(token),
    `forbidden token present: ${token}`
  );
}

console.log(
  'PRODUCTION_SPREADSHEET_IDENTITY_CERTIFICATION_V1_VALID=true'
);
console.log('HAPPY_PATH_CERTIFIED=true');
console.log('MISSING_PROPERTY_FAIL_CLOSED=true');
console.log('PROPERTY_MISMATCH_FAIL_CLOSED=true');
console.log('OPENED_ID_MISMATCH_FAIL_CLOSED=true');
console.log('PRIMARY_SCHEMA_MISMATCH_FAIL_CLOSED=true');
console.log('SECONDARY_SCHEMA_MISMATCH_FAIL_CLOSED=true');
console.log('EMPTY_CANDIDATE_FAIL_CLOSED=true');
console.log('DATA_ROW_READ_COUNT=0');
console.log('MUTATION_CAPABILITY_ABSENT=true');
