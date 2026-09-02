#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build', 'apps-script-brand');

function read(name) {
  return fs.readFileSync(path.join(BUILD, name), 'utf8');
}

let networkCalls = 0;
let databaseCalls = 0;

const context = vm.createContext({
  console,
  Date,
  JSON,
  Math,
  Number,
  String,
  Boolean,
  Array,
  Object,
  Error,
  RegExp,
  isNaN,
  parseInt,
  parseFloat,

  Session: {
    getActiveUser() {
      return {
        getEmail() {
          return 'philadelphia-actionability-certification@reos.local';
        }
      };
    }
  },

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty() {
          return '';
        },
        setProperty() {},
        deleteProperty() {}
      };
    }
  },

  UrlFetchApp: {
    fetch() {
      networkCalls += 1;
      throw new Error(
        'Network access forbidden during Philadelphia actionability certification.'
      );
    }
  },

  Utilities: {},

  REOS: {
    Database: {
      ensureTable() {
        databaseCalls += 1;
        throw new Error(
          'Database access forbidden during Philadelphia actionability certification.'
        );
      },

      getAll() {
        databaseCalls += 1;
        throw new Error(
          'Database access forbidden during Philadelphia actionability certification.'
        );
      },

      insert() {
        databaseCalls += 1;
        throw new Error(
          'Database access forbidden during Philadelphia actionability certification.'
        );
      },

      update() {
        databaseCalls += 1;
        throw new Error(
          'Database access forbidden during Philadelphia actionability certification.'
        );
      }
    },

    generateId_() {
      throw new Error(
        'ID generation forbidden during Philadelphia actionability certification.'
      );
    }
  }
});

vm.runInContext(
  read('CountyConnectorSDK.js'),
  context,
  { filename: path.join(BUILD, 'CountyConnectorSDK.js') }
);

assert.ok(
  context.REOS.CountyConnectorSDK,
  'CountyConnectorSDK did not load'
);

const sdk = context.REOS.CountyConnectorSDK;

assert.equal(
  typeof sdk.get,
  'function',
  'CountyConnectorSDK.get must exist'
);

assert.equal(
  typeof sdk.register,
  'function',
  'CountyConnectorSDK.register must exist'
);

vm.runInContext(
  read('PAPhiladelphiaCountyConnector.js'),
  context,
  {
    filename: path.join(
      BUILD,
      'PAPhiladelphiaCountyConnector.js'
    )
  }
);

assert.ok(
  context.REOS.PAPhiladelphiaCountyConnector,
  'Philadelphia connector symbol missing'
);

const registrars =
  context.REOS.GeneratedCountyConnectorRegistrars || [];

assert.equal(
  registrars.length,
  1,
  'expected exactly one Philadelphia registrar'
);

assert.equal(
  sdk.get('PA-PHILADELPHIA'),
  null,
  'connector must not auto-register before registrar execution'
);

registrars[0]();

const connector = sdk.get('PA-PHILADELPHIA');

assert.ok(
  connector,
  'Philadelphia connector did not register'
);

function normalize(raw) {
  return connector.normalize(raw, {
    dataset: 'code_violations',
    config: {}
  });
}

/*
 * Production failure exemplar:
 * ArcGIS objectid 242 is a vending-confiscation case with
 * no address, parcel, OPA account, ZIP, address object or geocode.
 * It is not an actionable property-level distress record.
 */
const addresslessVending = normalize({
  objectid: 242,
  posse_jobid: '1000553659',
  casenumber: 'CF-2026-073763',
  casetype: 'VENDING CONFISCATION',
  casestatus: 'IN VIOLATION',
  caseresponsibility: 'QOL VENDING WAREHOUSE',
  caseprioritydesc: 'STANDARD',
  violationnumber: 'VI-2026-045608',
  violationcode: '9-205(8)(P)',
  violationcodetitle:
    'SIDEWALK SALES VENDOR STREET PROHIBITED',
  violationstatus: 'OPEN',
  systemofrecord: 'ECLIPSE',
  underappeal: 'N'
});

assert.equal(
  addresslessVending.__skip,
  true,
  'addressless non-property violation must be skipped'
);

assert.equal(
  addresslessVending.__skipReason,
  'Record did not satisfy dataset record filter.',
  'addressless violation must use normal record-filter skip'
);

console.log(
  'PASS: addressless vending violation is skipped.'
);

/*
 * Neighboring production property record.
 */
const propertyViolation = normalize({
  objectid: 241,
  posse_jobid: '1000541326',
  addressobjectid: '15389098',
  parcel_id_num: '31769',
  casenumber: 'CF-2026-073740',
  casetype: 'NOTICE OF VIOLATION',
  casestatus: 'IN VIOLATION',
  violationnumber: 'VI-2026-045651',
  violationcode: 'PM15-504.1',
  violationcodetitle: 'PLUMBING SYSTEMS- GENERAL',
  violationstatus: 'OPEN',
  opa_account_num: '604202300',
  address: '422 S 55TH ST',
  zip: '19143-1430',
  opa_owner: 'MATEO LLC',
  systemofrecord: 'ECLIPSE'
});

assert.ok(
  !propertyViolation.__skip,
  'property-level violation must remain actionable'
);

assert.equal(
  propertyViolation.Address,
  '422 S 55TH ST',
  'property address mapping changed unexpectedly'
);

assert.equal(
  String(propertyViolation['Parcel ID']),
  '31769',
  'parcel_id_num must populate Parcel ID'
);

assert.equal(
  String(propertyViolation['Source Record ID']),
  '241',
  'objectid must remain Source Record ID authority'
);

const validation = connector.validate(
  propertyViolation,
  {
    dataset: 'code_violations'
  }
);

assert.equal(
  validation.ok,
  true,
  `actionable property violation failed validation: ${
    JSON.stringify(validation.errors || [])
  }`
);

console.log(
  'PASS: actionable property violation remains valid.'
);

/*
 * Confirm OPA account number remains a parcel fallback when
 * parcel_id_num is absent.
 */
const opaFallback = normalize({
  objectid: 243,
  opa_account_num: '451086600',
  address: '2813 E VENANGO ST',
  zip: '19134-6108',
  violationnumber: 'VI-2026-045623',
  violationstatus: 'OPEN'
});

assert.ok(
  !opaFallback.__skip,
  'OPA-backed property record must remain actionable'
);

assert.equal(
  String(opaFallback['Parcel ID']),
  '451086600',
  'opa_account_num must serve as parcel fallback'
);

console.log(
  'PASS: OPA account number is available as parcel fallback.'
);

const source = read('PAPhiladelphiaCountyConnector.js');

assert.ok(
  source.includes(
    'orderByFields: "violationdate ASC, objectid ASC"'
  ),
  'deterministic composite keyset ordering must remain intact'
);

assert.ok(
  source.includes(
    'type: "arcgis-date-objectid-v1"'
  ),
  'code-violation keyset cursor domain must remain intact'
);

console.log(
  'PASS: deterministic composite keyset pagination preserved.'
);

assert.equal(
  networkCalls,
  0,
  'validator unexpectedly performed network access'
);

assert.equal(
  databaseCalls,
  0,
  'validator unexpectedly performed database access'
);

console.log(
  'PASS: validator performs zero network and database writes.'
);

console.log('');
console.log(
  'Philadelphia code-violation actionability validation PASSED.'
);
