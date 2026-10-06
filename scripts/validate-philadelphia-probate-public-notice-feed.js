#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(
  ROOT,
  'build',
  'apps-script-brand'
);

const CONNECTOR = path.join(
  BUILD,
  'PAPhiladelphiaCountyConnector.js'
);

const MANIFEST = path.join(
  BUILD,
  'appsscript.json'
);

const SCHEDULER = path.join(
  BUILD,
  'CountyProductionScheduler.js'
);

const RECURRING_SOURCE = path.join(
  BUILD,
  'PhiladelphiaProbateRecurringSource.js'
);

function pass(message) {
  console.log('PASS: ' + message);
}

console.log(
  '=== PHILADELPHIA PROBATE PUBLIC-NOTICE FEED CONTRACT ==='
);
console.log();

const source =
  fs.readFileSync(
    CONNECTOR,
    'utf8'
  );

const scheduler =
  fs.readFileSync(
    SCHEDULER,
    'utf8'
  );

const recurringSource =
  fs.readFileSync(
    RECURRING_SOURCE,
    'utf8'
  );

const manifest =
  JSON.parse(
    fs.readFileSync(
      MANIFEST,
      'utf8'
    )
  );

assert.deepEqual(
  manifest.dependencies,
  {
    enabledAdvancedServices: [
      {
        userSymbol: 'Drive',
        serviceId: 'drive',
        version: 'v3'
      }
    ]
  }
);

pass(
  'Advanced Drive v3 is explicitly manifest-bound for PDF conversion'
);

assert.ok(
  source.includes(
    'REOS_COUNTY_PA_PHILADELPHIA_PROBATE_PUBLIC_NOTICE_URL'
  )
);

assert.ok(
  source.includes(
    "adapter: \"legal-intelligencer-probate\""
  )
);

pass(
  'Philadelphia probate dataset is explicitly configured'
);

assert.ok(
  source.includes(
    'assets\\.alm\\.com|images\\.law\\.com'
  )
);

pass(
  'probate source is restricted to approved Legal Intelligencer HTTPS hosts'
);

assert.ok(
  recurringSource.includes(
    "var CURSOR_PREFIX = 'PB1'"
  ) &&
  recurringSource.includes(
    'PHL-PROBATE-PB1-V1'
  ) &&
  recurringSource.includes(
    'MAX_LOOKBACK_DAYS = 10'
  ) &&
  recurringSource.includes(
    'NOTICE_PAGE_SIZE = 25'
  )
);

assert.ok(
  source.includes(
    'config.probateRecurring'
  ) &&
  source.includes(
    'probateNoticeOffset'
  ) &&
  source.includes(
    'probateNoticePageSize'
  ) &&
  source.includes(
    '.encodeCursor('
  )
);

assert.ok(
  source.includes(
    'no partial page persistence is authorized'
  )
);

pass(
  'probate connector supports bounded source-bound PB1 notice pagination'
);

assert.ok(
  source.includes(
    'PROBATE_MATCHED_OWNER'
  ) &&
  source.includes(
    'parcel_number'
  ) &&
  source.includes(
    'location'
  )
);

pass(
  'probate records require OPA-backed property identity'
);

assert.ok(
  source.includes(
    "status: 'AMBIGUOUS'"
  )
);

pass(
  'multiple distinct matching owner identities fail closed'
);

const allowlistMatch =
  scheduler.match(
    /const ALLOWLIST = Object\.freeze\(\[([\s\S]*?)\]\);/
  );

assert.ok(
  allowlistMatch,
  'county scheduler allowlist must be inspectable'
);

const probateAllowlistMatches =
  allowlistMatch[1].match(
    /dataset: 'probate'/g
  ) || [];

assert.equal(
  probateAllowlistMatches.length,
  1,
  'probate must appear exactly once in unattended scheduler authority'
);

assert.ok(
  allowlistMatch[1].indexOf(
    "dataset: 'probate'"
  ) >
  allowlistMatch[1].indexOf(
    "dataset: 'sheriff_mortgage_sales'"
  ),
  'probate must be appended after the four previously certified county feeds'
);

pass(
  'probate is explicitly appended as scheduler feed index 4'
);

assert.equal(
  /ScriptApp\.newTrigger\s*\(/.test(
    source
  ),
  false
);

assert.equal(
  /OfferGenerator|QualifiedDealQueue|automaticOffer/i
    .test(source),
  false
);

pass(
  'probate source grants no trigger or automatic-offer authority'
);

let registered = null;
let temporaryDocTrashed = false;
let noticeFetchCount = 0;
const opaQueries = [];

const legacyNoticeText = [
  'THE LEGAL INTELLIGENCER',
  'MONDAY, MARCH 30, 2026',
  'PUBLIC NOTICES',
  'ESTATE NOTICES',
  "ORPHANS' COURT DIVISION",
  'COURT OF COMMON PLEAS',
  'AUDIT LIST',
  "DECEDENT'S ESTATES",
  '1. SMITH, ROBERT',
  'L. – John Smith, Execu',
  'tor, 100 Test Street, Philadelphia, PA 19103.',
  '1. ROBERT SCHAFFER, JR. SPECIAL NEEDS TRUST – Truist Bank, Trustee.',
  '2. JONES, ALICE M. – Mary Jones, Adminis',
  'tratrix, 200 Test Street, Philadelphia, PA 19104.',
  '2604-304',
  'MARLENY PINEDA, SOLELY IN HER CAPACITY AS EXECUTRIX TO THE ESTATE OF GABRIEL PINEDA, DECEASED.'
].join('\n');

let activeNoticeText =
  legacyNoticeText;

const fakeBlob = {
  getContentType() {
    return 'application/pdf';
  },
  setName() {
    return this;
  }
};

const propertyValues = {
  REOS_COUNTY_PA_PHILADELPHIA_PROPERTY_ASSESSMENT_URL:
    'https://example.test/opa/query'
};

const sandbox = {
  console,
  Date,
  JSON,
  Math,
  Number,
  Object,
  String,
  Array,
  Error,
  RegExp,
  isFinite,

  REOS: {
    GeneratedCountyConnectorRegistrars: [],

    CountyConnectorSDK: {
      register(connector) {
        registered = connector;
        return connector.id;
      },

      get() {
        return null;
      },

      validateLead(record) {
        const errors = [];

        if (!record.Address) {
          errors.push('Address is required.');
        }

        if (!record.City) {
          errors.push('City is required.');
        }

        if (!record.State) {
          errors.push('State is required.');
        }

        if (
          !record['Parcel ID'] &&
          !record['Source Record ID']
        ) {
          errors.push(
            'Parcel ID or Source Record ID is required.'
          );
        }

        return {
          ok: errors.length === 0,
          errors
        };
      }
    },

    CountyAdapters: {
      Registry: {
        fetch(adapter, options) {
          assert.equal(
            adapter,
            'arcgis'
          );

          opaQueries.push(
            String(
              options.where || ''
            )
          );

          const where =
            String(
              options.where || ''
            );

          if (
            where.includes('SMITH') &&
            where.includes('ROBERT')
          ) {
            return {
              records: [
                {
                  objectid: 1,
                  parcel_number:
                    '123456789',
                  location:
                    '123 MAIN ST',
                  zip_code:
                    '19103',
                  owner_1:
                    'SMITH ROBERT L',
                  owner_2:
                    '',
                  market_value:
                    250000
                },
                {
                  objectid: 2,
                  parcel_number:
                    '987654321',
                  location:
                    '456 MARKET ST',
                  zip_code:
                    '19106',
                  owner_1:
                    'SMITH ROBERT L',
                  owner_2:
                    '',
                  market_value:
                    350000
                }
              ],
              metadata: {
                exceededTransferLimit:
                  false
              }
            };
          }

          if (
            where.includes('JONES') &&
            where.includes('ALICE')
          ) {
            return {
              records: [
                {
                  objectid: 3,
                  parcel_number:
                    '111111111',
                  location:
                    '100 FIRST ST',
                  zip_code:
                    '19104',
                  owner_1:
                    'JONES ALICE M',
                  owner_2:
                    '',
                  market_value:
                    210000
                },
                {
                  objectid: 4,
                  parcel_number:
                    '222222222',
                  location:
                    '200 SECOND ST',
                  zip_code:
                    '19104',
                  owner_1:
                    'JONES ALICE K',
                  owner_2:
                    '',
                  market_value:
                    220000
                }
              ],
              metadata: {
                exceededTransferLimit:
                  false
              }
            };
          }

          return {
            records: [],
            metadata: {
              exceededTransferLimit:
                false
            }
          };
        }
      }
    }
  },

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(key) {
          return (
            propertyValues[key] ||
            ''
          );
        }
      };
    }
  },

  UrlFetchApp: {
    fetch(url) {
      noticeFetchCount += 1;

      assert.ok(
        String(url)
          .startsWith(
            'https://assets.alm.com/'
          )
      );

      return {
        getResponseCode() {
          return 200;
        },

        getBlob() {
          return fakeBlob;
        }
      };
    }
  },

  Drive: {
    Files: {
      create(resource, blob, options) {
        assert.equal(
          resource.mimeType,
          'application/vnd.google-apps.document'
        );

        assert.equal(
          options.ocrLanguage,
          'en'
        );

        assert.equal(
          blob,
          fakeBlob
        );

        return {
          id: 'temporary-probate-doc'
        };
      }
    }
  },

  DocumentApp: {
    openById(id) {
      assert.equal(
        id,
        'temporary-probate-doc'
      );

      return {
        getBody() {
          return {
            getText() {
              return activeNoticeText;
            }
          };
        }
      };
    }
  },

  DriveApp: {
    getFileById(id) {
      assert.equal(
        id,
        'temporary-probate-doc'
      );

      return {
        setTrashed(value) {
          temporaryDocTrashed =
            value === true;
        }
      };
    }
  }
};

vm.createContext(sandbox);

vm.runInContext(
  source,
  sandbox,
  {
    filename:
      'PAPhiladelphiaCountyConnector.js'
  }
);

sandbox.REOS
  .PAPhiladelphiaCountyConnector
  .register();

assert.ok(
  registered,
  'Philadelphia connector must register'
);

assert.ok(
  registered.datasets.includes(
    'probate'
  ),
  'Philadelphia connector must expose probate dataset'
);

pass(
  'Philadelphia connector registers probate dataset'
);

const result =
  registered.fetch({
    runId:
      'CCR-PROBATE-CERTIFICATION',
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'probate',
    cursor:
      '',
    limit:
      100,
    config: {
      endpoint:
        'https://assets.alm.com/certification/tlipn033026.pdf'
    },
    now:
      new Date(
        '2026-03-30T12:00:00Z'
      )
  });

assert.equal(
  noticeFetchCount,
  1
);

assert.equal(
  result.metadata.parsedNoticeCount,
  2
);

pass(
  'live-OCR numbered en-dash estate entries tolerate bounded name and representative wrapping'
);

assert.equal(
  result.metadata.matchedNoticeCount,
  1
);

assert.equal(
  result.metadata.ambiguousNoticeCount,
  1
);

assert.equal(
  result.metadata.unmatchedNoticeCount,
  0
);

assert.equal(
  result.records.length,
  2
);

pass(
  'one reconciled decedent may produce multiple legitimate property observations'
);

assert.equal(
  new Set(
    result.records.map(
      record =>
        record.PROBATE_SOURCE_RECORD_ID
    )
  ).size,
  2
);

pass(
  'probate source observation identity is parcel-specific and deterministic'
);

assert.ok(
  result.records.every(
    record =>
      record.PROBATE_DECEDENT ===
        'SMITH, ROBERT L.' &&
      record.PROBATE_MATCHED_OWNER ===
        'SMITH ROBERT L'
  )
);

pass(
  'ambiguous same-name ownership receives no property persistence authority'
);

const normalized =
  registered.normalize(
    result.records[0],
    {
      dataset:
        'probate'
    }
  );

assert.equal(
  normalized.Address,
  '123 MAIN ST'
);

assert.equal(
  normalized.City,
  'Philadelphia'
);

assert.equal(
  normalized.State,
  'PA'
);

assert.equal(
  normalized['Parcel ID'],
  '123456789'
);

assert.equal(
  normalized['Distress Type'],
  'Probate'
);

assert.equal(
  normalized['Source Dataset'],
  'probate'
);

assert.ok(
  normalized[
    'Source Record ID'
  ].startsWith(
    'TLI-ESTATE-SMITH-ROBERT-L-'
  )
);

assert.equal(
  registered.validate(
    normalized,
    {
      dataset:
        'probate'
    }
  ).ok,
  true
);

pass(
  'property-backed probate record satisfies county lead validation'
);

pass(
  'live-OCR Estate Notices / Orphans Court Division marker is accepted'
);

assert.equal(
  temporaryDocTrashed,
  true
);

pass(
  'temporary OCR document is cleaned up after source extraction'
);

assert.ok(
  opaQueries.some(
    query =>
      query.includes('owner_1') &&
      query.includes('owner_2') &&
      query.includes('SMITH') &&
      query.includes('ROBERT')
  )
);

pass(
  'OPA enrichment is bounded to decedent owner-name evidence'
);


/*
 * October 6, 2026 current-layout compatibility fixture.
 *
 * Certified OCR structure:
 * - repeated ESTATE NOTICES heading cluster;
 * - current probate identity block;
 * - later substantive ESTATE NOTICES heading;
 * - unnumbered comma-form decedents;
 * - double-hyphen entry delimiter;
 * - generic uppercase double-hyphen caption after a top-level
 *   boundary must not become estate authority.
 */
activeNoticeText = [
  'THE LEGAL INTELLIGENCER',
  'TUESDAY, OCTOBER 6, 2026',
  'PUBLIC NOTICES',
  'ESTATE NOTICES',
  'ESTATE NOTICES',
  'ESTATE NOTICES',
  'ESTATE NOTICES',
  'CORPORATE NOTICES',
  'NOTICE TO COUNSEL',
  'General newspaper layout text.',
  "ORPHANS' COURT OF PHILADELPHIA COUNTY",
  'Letters have been granted to the following representatives.',
  'ESTATE NOTICES',
  'SMITH, ROBERT L. -- John Smith, Execu',
  'tor, 100 Test Street, Philadelphia, PA 19103.',
  'JONES, ALICE M. -- Mary Jones, Adminis',
  'tratrix, 200 Test Street, Philadelphia, PA 19104.',
  'PUBLIC NOTICES',
  'FAKE, PERSON -- Jane Fake, Executor.',
  'CORPORATE NOTICES'
].join('\n');

temporaryDocTrashed =
  false;

const currentLayoutResult =
  registered.fetch({
    runId:
      'CCR-PROBATE-CURRENT-LAYOUT',
    connectorId:
      'PA-PHILADELPHIA',
    dataset:
      'probate',
    cursor:
      '',
    limit:
      100,
    config: {
      endpoint:
        'https://assets.alm.com/certification/tlipn100626.pdf'
    },
    now:
      new Date(
        '2026-10-06T16:00:00Z'
      )
  });

assert.equal(
  currentLayoutResult
    .metadata
    .publicationDate,
  '2026-10-06'
);

assert.equal(
  currentLayoutResult
    .metadata
    .parsedNoticeCount,
  2,
  'only the substantive current-layout estate window may produce notices'
);

assert.equal(
  currentLayoutResult
    .metadata
    .matchedNoticeCount,
  1
);

assert.equal(
  currentLayoutResult
    .metadata
    .ambiguousNoticeCount,
  1
);

assert.equal(
  currentLayoutResult
    .metadata
    .unmatchedNoticeCount,
  0
);

assert.equal(
  currentLayoutResult
    .records
    .length,
  2
);

assert.ok(
  currentLayoutResult
    .records
    .every(
      record =>
        record
          .PROBATE_DECEDENT ===
        'SMITH, ROBERT L.'
    )
);

assert.equal(
  temporaryDocTrashed,
  true
);

pass(
  'current October layout tolerates repeated ESTATE NOTICES header noise and selects one substantive estate window'
);

pass(
  'current unnumbered double-hyphen estate entries retain comma-form and representative-role authority'
);

pass(
  'uppercase double-hyphen captions outside the selected estate window receive no probate authority'
);


/*
 * Current-format zero-substantive-window case.
 *
 * Identity evidence may exist, but a header window without a
 * valid estate entry receives no probate parsing authority.
 */
activeNoticeText = [
  'THE LEGAL INTELLIGENCER',
  'TUESDAY, OCTOBER 6, 2026',
  'PUBLIC NOTICES',
  "ORPHANS' COURT OF PHILADELPHIA COUNTY",
  'Letters have been granted to the following representatives.',
  'ESTATE NOTICES',
  'THIS IS GENERIC PUBLIC NOTICE TEXT',
  'PUBLIC NOTICES'
].join('\n');

assert.throws(
  () =>
    registered.fetch({
      runId:
        'CCR-PROBATE-CURRENT-ZERO',
      connectorId:
        'PA-PHILADELPHIA',
      dataset:
        'probate',
      cursor:
        '',
      limit:
        100,
      config: {
        endpoint:
          'https://assets.alm.com/certification/tlipn100626.pdf'
      },
      now:
        new Date(
          '2026-10-06T16:00:00Z'
        )
    }),
  /current-format estate content window was not found/
);

pass(
  'current-layout zero-substantive-window source fails closed'
);


/*
 * Current-format ambiguity case.
 *
 * One probate identity block cannot authorize two separate
 * substantive ESTATE NOTICES windows.
 */
activeNoticeText = [
  'THE LEGAL INTELLIGENCER',
  'TUESDAY, OCTOBER 6, 2026',
  'PUBLIC NOTICES',
  "ORPHANS' COURT OF PHILADELPHIA COUNTY",
  'Letters have been granted to the following representatives.',
  'ESTATE NOTICES',
  'SMITH, ROBERT L. -- John Smith, Executor.',
  'ESTATE NOTICES',
  'JONES, ALICE M. -- Mary Jones, Administratrix.',
  'PUBLIC NOTICES'
].join('\n');

assert.throws(
  () =>
    registered.fetch({
      runId:
        'CCR-PROBATE-CURRENT-AMBIGUOUS-WINDOW',
      connectorId:
        'PA-PHILADELPHIA',
      dataset:
        'probate',
      cursor:
        '',
      limit:
        100,
      config: {
        endpoint:
          'https://assets.alm.com/certification/tlipn100626.pdf'
      },
      now:
        new Date(
          '2026-10-06T16:00:00Z'
        )
    }),
  /current-format estate content window is ambiguous/
);

pass(
  'multiple substantive current-layout estate windows fail closed'
);


/*
 * Current-format identity ambiguity/missing authority.
 */
activeNoticeText = [
  'THE LEGAL INTELLIGENCER',
  'TUESDAY, OCTOBER 6, 2026',
  'PUBLIC NOTICES',
  'ESTATE NOTICES',
  'SMITH, ROBERT L. -- John Smith, Executor.',
  'PUBLIC NOTICES'
].join('\n');

assert.throws(
  () =>
    registered.fetch({
      runId:
        'CCR-PROBATE-CURRENT-NO-IDENTITY',
      connectorId:
        'PA-PHILADELPHIA',
      dataset:
        'probate',
      cursor:
        '',
      limit:
        100,
      config: {
        endpoint:
          'https://assets.alm.com/certification/tlipn100626.pdf'
      },
      now:
        new Date(
          '2026-10-06T16:00:00Z'
        )
    }),
  /current-format probate identity marker/
);

pass(
  'current-layout estate entries without bounded probate identity fail closed'
);

activeNoticeText =
  legacyNoticeText;

assert.throws(
  () =>
    registered.fetch({
      runId:
        'CCR-PROBATE-INVALID-SOURCE',
      connectorId:
        'PA-PHILADELPHIA',
      dataset:
        'probate',
      cursor:
        '',
      limit:
        100,
      config: {
        endpoint:
          'https://example.com/untrusted.pdf'
      },
      now:
        new Date()
    }),
  /approved Legal Intelligencer/
);

pass(
  'unapproved probate source URL fails before PDF conversion or property persistence'
);

assert.ok(
  source.includes(
    'reosPhiladelphiaProbateSourceAuthority'
  )
);

assert.ok(
  source.includes(
    'REOS_COUNTY_PA_PHILADELPHIA_PROBATE_PUBLIC_NOTICE_URL'
  )
);

assert.ok(
  source.includes(
    'confirmSourceUpdate'
  )
);

assert.ok(
  source.includes(
    'expectedCurrentSourceSha256'
  )
);

assert.ok(
  source.includes(
    'maxNoticeScan'
  )
);

const sourceAuthorityPreflight =
  source.slice(
    source.indexOf(
      'function probateSourcePreflight_(options)'
    ),
    source.indexOf(
      'function probateSourceConfigure_(options)'
    )
  );

assert.ok(
  sourceAuthorityPreflight.includes(
    'MANIFEST.datasets.probate.maxLimit'
  ),
  'source-authority preflight property-row capacity must use the probate dataset maximum'
);

assert.ok(
  sourceAuthorityPreflight.includes(
    'maxNoticeScan:\n          25'
  ),
  'source-authority preflight must remain bounded to 25 estate notices'
);

assert.ok(
  sourceAuthorityPreflight.includes(
    'dryRun:\n        true'
  ),
  'source-authority preflight must remain dry-run only'
);

assert.equal(
  sourceAuthorityPreflight.includes(
    '        25\n      );'
  ),
  false,
  'source-authority preflight must not retain the historical 25-property-row cap'
);

pass(
  'probate source-authority preflight uses the existing 500-row dataset capacity while retaining the 25-estate notice bound'
);

assert.ok(
  /REOS\.Security[\s\S]{0,80}\.requireAdmin\s*\(/.test(
    source
  )
);

assert.ok(
  source.includes(
    'LockService'
  )
);

assert.ok(
  source.includes(
    'reosCountyProductionSchedulerRun'
  )
);

assert.equal(
  (
    source.match(
      /\.setProperty\s*\(/g
    ) || []
  ).length,
  1,
  'probate source authority must contain exactly one Script Property write primitive'
);

assert.equal(
  /REOS\.Database\.(?:insert|update|upsert|delete)/.test(
    source
  ),
  false,
  'probate connector must not gain direct database mutation authority'
);

pass(
  'probate source configuration is Admin-only, scheduler-quiescent, SHA-bound, and limited to one Script Property write'
);

pass(
  'probate source preflight is bounded to at most 25 estate notices and grants no DISTRESS_LEADS mutation authority'
);

console.log();
console.log(
  'Philadelphia probate public-notice feed validation PASSED.'
);
