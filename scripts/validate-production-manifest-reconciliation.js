'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build', 'apps-script-brand');
const MANIFEST = path.join(BUILD_DIR, 'appsscript.json');

console.log('=== PRODUCTION MANIFEST RECONCILIATION CERTIFICATION ===');
console.log();

assert.ok(fs.existsSync(MANIFEST), 'Apps Script manifest must exist');

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

assert.strictEqual(
  manifest.timeZone,
  'America/New_York',
  'production timezone must remain America/New_York'
);

assert.strictEqual(
  manifest.runtimeVersion,
  'V8',
  'production runtime must remain V8'
);

assert.strictEqual(
  manifest.exceptionLogging,
  'STACKDRIVER',
  'production exception logging must remain STACKDRIVER'
);

const expectedDependencies = {
  enabledAdvancedServices: [
    {
      userSymbol: 'Drive',
      serviceId: 'drive',
      version: 'v3'
    }
  ]
};

assert.deepStrictEqual(
  manifest.dependencies,
  expectedDependencies,
  'Apps Script dependencies must contain only the certified Drive v3 service'
);

assert.deepStrictEqual(
  manifest.executionApi,
  { access: 'MYSELF' },
  'API executable must be restricted to deploying user'
);

assert.deepStrictEqual(
  manifest.webapp,
  {
    access: 'ANYONE',
    executeAs: 'USER_DEPLOYING'
  },
  'existing REOS web-app deployment contract must be preserved'
);

console.log('PASS: base Apps Script manifest authority is preserved');
console.log('PASS: API executable is restricted to MYSELF');
console.log('PASS: existing web-app authority is preserved');

const expectedScopes = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/script.external_request',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/calendar',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/script.send_mail',
  'https://www.googleapis.com/auth/script.scriptapp',
  'https://www.googleapis.com/auth/script.container.ui',
  'https://www.googleapis.com/auth/userinfo.email'
];

assert.ok(
  Array.isArray(manifest.oauthScopes),
  'oauthScopes must be explicitly declared'
);

const scopeSet = new Set(manifest.oauthScopes);

assert.strictEqual(
  scopeSet.size,
  manifest.oauthScopes.length,
  'oauthScopes must not contain duplicates'
);

assert.strictEqual(
  scopeSet.size,
  expectedScopes.length,
  'oauthScopes must contain exactly the certified scope inventory'
);

expectedScopes.forEach(scope => {
  assert.ok(
    scopeSet.has(scope),
    'missing required OAuth scope: ' + scope
  );
});

console.log(
  'PASS: exactly ' +
  expectedScopes.length +
  ' certified OAuth scopes are declared'
);

function collectSource(root) {
  let out = '';

  function walk(dir) {
    fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
      const file = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(file);
        return;
      }

      if (!entry.isFile()) return;
      if (!/\.(js|html)$/.test(entry.name)) return;

      out += '\n' + fs.readFileSync(file, 'utf8');
    });
  }

  walk(root);
  return out;
}

const source = collectSource(BUILD_DIR);

assert.ok(
  /\bDrive\.Files\.create\s*\(/.test(source),
  'Advanced Drive v3 source evidence is missing'
);

console.log(
  'PASS: Advanced Drive v3 is bound only through the certified production manifest'
);

const scopeEvidence = [
  {
    label: 'Spreadsheet service',
    pattern: /\bSpreadsheetApp\./,
    scope: 'https://www.googleapis.com/auth/spreadsheets'
  },
  {
    label: 'External HTTP service',
    pattern: /\bUrlFetchApp\./,
    scope: 'https://www.googleapis.com/auth/script.external_request'
  },
  {
    label: 'Drive service',
    pattern: /\bDriveApp\./,
    scope: 'https://www.googleapis.com/auth/drive'
  },
  {
    label: 'Document service',
    pattern: /\bDocumentApp\./,
    scope: 'https://www.googleapis.com/auth/documents'
  },
  {
    label: 'Calendar service',
    pattern: /\bCalendarApp\./,
    scope: 'https://www.googleapis.com/auth/calendar'
  },
  {
    label: 'Gmail service',
    pattern: /\bGmailApp\./,
    scope: 'https://mail.google.com/'
  },
  {
    label: 'Mail service',
    pattern: /\bMailApp\./,
    scope: 'https://www.googleapis.com/auth/script.send_mail'
  },
  {
    label: 'Installable trigger service',
    pattern: /\bScriptApp\.(?:newTrigger|getProjectTriggers|deleteTrigger)\b/,
    scope: 'https://www.googleapis.com/auth/script.scriptapp'
  },
  {
    label: 'Container UI',
    pattern: /\bSpreadsheetApp\.getUi\s*\(/,
    scope: 'https://www.googleapis.com/auth/script.container.ui'
  },
  {
    label: 'Active user identity',
    pattern: /\bSession\.getActiveUser\s*\(\)/,
    scope: 'https://www.googleapis.com/auth/userinfo.email'
  }
];

scopeEvidence.forEach(requirement => {
  assert.ok(
    requirement.pattern.test(source),
    requirement.label + ' source evidence is missing'
  );

  assert.ok(
    scopeSet.has(requirement.scope),
    requirement.label + ' scope is missing'
  );

  console.log(
    'PASS: ' +
    requirement.label +
    ' is covered by explicit OAuth authority'
  );
});

assert.notStrictEqual(
  manifest.executionApi.access,
  'ANYONE_ANONYMOUS',
  'API executable must never allow anonymous execution'
);

console.log();
console.log('oauth_scope_count=' + expectedScopes.length);
console.log('execution_api_access=' + manifest.executionApi.access);
console.log('webapp_access=' + manifest.webapp.access);
console.log('webapp_execute_as=' + manifest.webapp.executeAs);
console.log();
console.log('Production manifest reconciliation certification PASSED.');
