#!/usr/bin/env node

'use strict';

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');

const source = fs.readFileSync(
  'build/apps-script-brand/ZillowGmailConnector.js',
  'utf8'
);

const context = {
  REOS: {},
  console: console,
  Utilities: {
    DigestAlgorithm: {
      SHA_256: 'SHA_256'
    },
    Charset: {
      UTF_8: 'UTF_8'
    },
    computeDigest: function (algorithm, value, charset) {
      assert.equal(algorithm, 'SHA_256');
      assert.equal(charset, 'UTF_8');

      return Array.from(
        crypto
          .createHash('sha256')
          .update(String(value), 'utf8')
          .digest()
      ).map(function (byte) {
        return byte > 127 ? byte - 256 : byte;
      });
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

assert.ok(
  context.REOS.ZillowGmailConnector,
  'Zillow Gmail connector must load'
);

assert.equal(
  typeof context.REOS.ZillowGmailConnector.parseMessage_,
  'function',
  'parseMessage_ must remain exposed for deterministic validation'
);

function message(body, subject) {
  return {
    getSubject: () => subject || 'Zillow property inquiry',
    getPlainBody: () => body || '',
    getFrom: () => 'daily-updates@mail.zillow.com',
    getReplyTo: () => '',
    getDate: () => new Date('2026-08-24T00:00:00Z')
  };
}

const config = {
  defaultCity: '',
  defaultState: '',
  defaultAssignedTo: ''
};

const valid = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Property: 1234 Market St, Philadelphia, PA 19107'
  ),
  'Zillow/New Leads',
  config
);

assert.equal(valid.propertyAddress, '1234 Market St');
assert.equal(valid.city, 'Philadelphia');
assert.equal(valid.state, 'PA');
assert.equal(valid.zip, '19107');

console.log('PASS: legitimate Zillow property address remains parseable');

const malformed =
  'notifications%2Fview-all_target%2FX1-SSt6sdc49cp93e0000000000_8z2rv_sse%2F%3Frtoken%3Dd8963dfb-514f-4828-bd9d-28179b52e88b%257EX1-ZU10ay7lb3otlah_3qul1%26utm_campaign%3Demo-dailysavedsearch';

const rejected = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Property: ' + malformed + '\n' +
    'https://www.zillow.com/'
  ),
  'Zillow/New Leads',
  config
);

assert.equal(
  rejected.propertyAddress,
  '',
  'Zillow navigation/tracking fragment must not become a property address'
);

assert.equal(rejected.city, '');
assert.equal(rejected.state, '');
assert.equal(rejected.zip, '');

console.log(
  'PASS: certified Zillow navigation/tracking signature is rejected as an address'
);

const urlOnly = context.REOS.ZillowGmailConnector.parseMessage_(
  message('https://www.zillow.com/homedetails/example'),
  'Zillow/New Leads',
  config
);

assert.equal(urlOnly.propertyAddress, '');

console.log('PASS: property URL can remain usable without manufacturing an address');

console.log();
console.log('Zillow Gmail address parser validation PASSED.');
