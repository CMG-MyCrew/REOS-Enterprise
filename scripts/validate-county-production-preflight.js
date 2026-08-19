#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(
  ROOT,
  'build/apps-script-brand/CountyProductionScheduler.js'
);

function fail(message) {
  console.error('FAIL: ' + message);
  process.exit(1);
}

function pass(message) {
  console.log('PASS: ' + message);
}

function assert(condition, message) {
  if (!condition) fail(message);
  pass(message);
}

if (!fs.existsSync(SOURCE)) {
  fail('CountyProductionScheduler.js is present');
}

const source = fs.readFileSync(SOURCE, 'utf8');

console.log(
  '=== COUNTY PRODUCTION PREFLIGHT CERTIFICATION ==='
);

assert(
  /function\s+preflight\s*\(\)/.test(source),
  'county production preflight is present'
);

assert(
  /function\s+preflight\s*\(\)\s*\{\s*requireAdmin_\(\)/.test(
    source
  ),
  'preflight requires admin authority'
);

assert(
  source.includes(
    'reosCountyProductionSchedulerPreflight'
  ),
  'controlled Apps Script preflight entry point is present'
);

const required = [
  [
    'tax_delinquent',
    'REOS_COUNTY_PA_PHILADELPHIA_TAX_DELINQUENT_URL'
  ],
  [
    'code_violations',
    'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL'
  ],
  [
    'vacant_properties',
    'REOS_COUNTY_PA_PHILADELPHIA_VACANT_PROPERTIES_URL'
  ],
  [
    'sheriff_tax_sales',
    'REOS_COUNTY_PA_PHILADELPHIA_SHERIFF_TAX_SALES_URL'
  ],
  [
    'sheriff_mortgage_sales',
    'REOS_COUNTY_PA_PHILADELPHIA_SHERIFF_MORTGAGE_SALES_URL'
  ]
];

for (const [dataset, property] of required) {
  assert(
    source.includes(dataset) &&
      source.includes(property),
    `preflight covers ${dataset}`
  );
}

const preflightMatch = source.match(
  /function\s+preflight\s*\(\)\s*\{([\s\S]*?)\n  \}\n\n  function\s+run/
);

assert(
  Boolean(preflightMatch),
  'preflight implementation is structurally bounded'
);

const preflightSource = preflightMatch[1];

assert(
  !preflightSource.includes(
    'PROPERTY_ASSESSMENT_URL'
  ),
  'preflight excludes property_assessment'
);

assert(
  !/\bUrlFetchApp\b/.test(preflightSource),
  'preflight performs no network requests'
);

assert(
  !/CountyRuntimeBridge\s*\.\s*(sync|dryRun|runAll)\s*\(/.test(
    preflightSource
  ),
  'preflight performs no county runtime execution'
);

assert(
  !/\bScriptApp\b/.test(preflightSource),
  'preflight does not modify scheduler authority'
);

/*
 * Execute the module with deterministic mocks.
 */
const properties = new Map();
let adminCalls = 0;

const context = {
  console,
  Date,
  JSON,
  Object,
  String,
  Boolean,
  Array,
  Math,

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          return properties.has(key)
            ? properties.get(key)
            : null;
        },
        setProperty(key, value) {
          properties.set(key, String(value));
        },
        deleteProperty(key) {
          properties.delete(key);
        }
      };
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

assert(
  context.REOS &&
    context.REOS.CountyProductionScheduler &&
    typeof context.REOS.CountyProductionScheduler.preflight ===
      'function',
  'public preflight API loads'
);

/*
 * No endpoint properties configured.
 */
let result =
  context.REOS.CountyProductionScheduler.preflight();

assert(
  adminCalls === 1,
  'preflight invokes admin authority'
);

assert(
  result.ok === false &&
    result.ready === false &&
    result.configured === 0 &&
    result.required === 5,
  'missing configuration fails readiness'
);

assert(
  result.connectorId === 'PA-PHILADELPHIA',
  'preflight is bounded to PA-PHILADELPHIA'
);

assert(
  Object.keys(result.datasets).length === 5,
  'preflight reports exactly five datasets'
);

assert(
  Object.values(result.datasets).every(
    item =>
      Object.keys(item).length === 1 &&
      item.configured === false
  ),
  'unconfigured dataset telemetry is redacted'
);

/*
 * Configure four of five.
 */
for (const [, property] of required.slice(0, 4)) {
  properties.set(
    property,
    'https://example.invalid/secret-endpoint'
  );
}

result =
  context.REOS.CountyProductionScheduler.preflight();

assert(
  result.ok === false &&
    result.ready === false &&
    result.configured === 4 &&
    result.required === 5,
  'partial configuration fails readiness'
);

/*
 * Configure final required endpoint.
 */
properties.set(
  required[4][1],
  'https://example.invalid/final-secret-endpoint'
);

result =
  context.REOS.CountyProductionScheduler.preflight();

assert(
  result.ok === true &&
    result.ready === true &&
    result.configured === 5 &&
    result.required === 5,
  'all five configured endpoints pass readiness'
);

const serialized = JSON.stringify(result);

assert(
  !serialized.includes('example.invalid'),
  'preflight never exposes endpoint values'
);

assert(
  !serialized.includes('_URL'),
  'preflight never exposes Script Property names'
);

assert(
  Object.values(result.datasets).every(
    item =>
      Object.keys(item).length === 1 &&
      item.configured === true
  ),
  'configured dataset telemetry remains redacted'
);

assert(
  !Object.prototype.hasOwnProperty.call(
    result.datasets,
    'property_assessment'
  ),
  'runtime result excludes property_assessment'
);

console.log('');
console.log(
  'County production preflight certification PASSED.'
);
