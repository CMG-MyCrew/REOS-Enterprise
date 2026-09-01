#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const path = 'build/apps-script-brand/ZillowDistressLeadProvenanceEvidence.js';
assert.ok(fs.existsSync(path), 'Zillow provenance evidence module must exist');

const source = fs.readFileSync(path, 'utf8');

[
  /\.ensureTable\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.softDelete\s*\(/,
  /\.set(Value|Values|Property)\s*\(/,
  /\.deleteProperty\s*\(/,
  /ScriptApp\s*\.\s*(newTrigger|deleteTrigger)/,
  /GmailApp\s*\./,
  /UrlFetchApp\s*\./
].forEach(pattern => assert.equal(pattern.test(source), false));

[
  /REOS\.Security\.requireAdmin\s*\(/,
  /REOS\.Database\.query\s*\(/,
  /REOS\.Database\.findById\s*\(/,
  /function\s+reosZillowDistressLeadProvenanceEvidence\s*\(/,
  /mode:\s*'READ_ONLY'/,
  /repairAuthorityGranted:\s*false/,
  /repairPlanAuthorityGranted:\s*false/,
  /migrationAuthorityGranted:\s*false/,
  /deletionAuthorityGranted:\s*false/,
  /mutationAuthorityGranted:\s*false/
].forEach(pattern => assert.match(source, pattern));

let adminCalls = 0;

const imports = [
  {'Distress Lead ID':'OTHER','Gmail Message ID':'m0'},
  {'Distress Lead ID':'ZIL-TEST-1','Gmail Message ID':'m1','Status':'Imported'}
];

const lead = {'Distress Lead ID':'ZIL-TEST-1','Source':'Zillow Gmail'};

const context = {
  REOS: {
    Security: {
      requireAdmin() { adminCalls += 1; }
    },
    Database: {
      query(table, predicate) {
        assert.equal(table, 'ZILLOW_GMAIL_IMPORTS');
        return imports.filter(predicate);
      },
      findById(table, field, id) {
        assert.equal(table, 'DISTRESS_LEADS');
        assert.equal(field, 'Distress Lead ID');
        return id === 'ZIL-TEST-1' ? lead : null;
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const result = JSON.parse(
  context.reosZillowDistressLeadProvenanceEvidence(' ZIL-TEST-1 ')
);

assert.equal(adminCalls, 1);
assert.equal(result.mode, 'READ_ONLY');
assert.equal(result.distressLeadId, 'ZIL-TEST-1');
assert.equal(result.importMatchCount, 1);
assert.equal(result.imports[0]['Gmail Message ID'], 'm1');
assert.equal(result.leadFound, true);
assert.equal(result.repairAuthorityGranted, false);
assert.equal(result.repairPlanAuthorityGranted, false);
assert.equal(result.migrationAuthorityGranted, false);
assert.equal(result.deletionAuthorityGranted, false);
assert.equal(result.mutationAuthorityGranted, false);

console.log("PASS: Zillow Distress Lead provenance evidence is read-only and exact-ID bounded");
