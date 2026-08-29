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

function message(body, subject, messageId) {
  return {
    getId: () =>
      messageId ||
      'certified-zillow-message-001',

    getSubject: () =>
      subject ||
      'Zillow property inquiry',

    getPlainBody: () =>
      body || '',

    getFrom: () =>
      'daily-updates@mail.zillow.com',

    getReplyTo: () =>
      '',

    getDate: () =>
      new Date(
        '2026-08-24T00:00:00Z'
      )
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

assert.equal(
  valid.gmailMessageId,
  'certified-zillow-message-001',
  'parser must retain Gmail message identity'
);

console.log(
  'PASS: legitimate Zillow property address remains parseable'
);

console.log(
  'PASS: Gmail message identity remains available for source observation identity'
);

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

/*
 * Production regression: Zillow recommendation messages can place a
 * click.mail.zillow.com tracking URL where the permissive labeled-address
 * matcher sees an address candidate. No HTTP(S) URL may ever become a
 * property address.
 */
const rawTrackingUrl =
  'https://click.mail.zillow.com/f/a/TbSzerzo0eC58UhoMYjJgQ~~/AAAAARA~/example?target=x';

const trackingAddress = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Home: ' + rawTrackingUrl + '\n' +
    'https://www.zillow.com/'
  ),
  'Zillow/New Leads',
  config
);

assert.equal(
  trackingAddress.propertyAddress,
  '',
  'HTTP(S) tracking URL must never become a property address'
);

assert.equal(trackingAddress.city, '');
assert.equal(trackingAddress.state, '');
assert.equal(trackingAddress.zip, '');

console.log('PASS: raw HTTP(S) tracking URL is rejected as an address');

/*
 * Production regression: recommendation/listing marketing copy may contain
 * incidental rent/rental/tenant/lease terms. Those words must not turn an
 * otherwise generic Zillow listing recommendation into a Rental lead.
 */
/*
 * Preserve explicit classification authority. Classification may come from
 * an explicit Zillow subject/label context, but arbitrary marketing prose
 * must not manufacture a lead type.
 */
const explicitSeller = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Property: 1234 Market St, Philadelphia, PA 19107',
    'Seller lead from Zillow'
  ),
  'Zillow/Seller Leads',
  config
);

assert.equal(explicitSeller.leadType, 'Seller');

const explicitBuyer = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Property: 1234 Market St, Philadelphia, PA 19107',
    'Buyer inquiry from Zillow'
  ),
  'Zillow/Buyer Leads',
  config
);

assert.equal(explicitBuyer.leadType, 'Buyer');

const explicitRental = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Property: 1234 Market St, Philadelphia, PA 19107',
    'Rental inquiry from Zillow'
  ),
  'Zillow/Rental Leads',
  config
);

assert.equal(explicitRental.leadType, 'Rental');

console.log('PASS: explicit Zillow lead-type authority remains preserved');

const recommendation = context.REOS.ZillowGmailConnector.parseMessage_(
  message(
    'Home: ' + rawTrackingUrl + '\n' +
    'See rental estimates and lease information on Zillow.\n' +
    'https://www.zillow.com/'
  ),
  'Zillow/New Leads',
  config
);

assert.equal(
  recommendation.leadType,
  'Property Inquiry',
  'incidental marketing copy must not manufacture Rental lead authority'
);

console.log(
  'PASS: incidental rental marketing language does not reclassify listing recommendation'
);

console.log();
console.log('Zillow Gmail address parser validation PASSED.');
