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

assert.equal(
  allowlistMatch[1].includes(
    "dataset: 'probate'"
  ),
  false,
  'probate must remain outside unattended scheduler authority'
);

pass(
  'probate remains excluded from unattended county scheduler authority'
);

assert.equal(
  /ScriptApp\.newTrigger\s*\(/.test(
    source
  ),
  false
);

assert.equal(
  /OfferGenerator|QualifiedDealQueue/
    .test(source),
  false
);

assert.ok(
  /automaticOfferAuthorityGranted:\s*false/
    .test(source),
  'probate diagnostic must explicitly deny automatic-offer authority'
);

pass(
  'probate source grants no trigger or automatic-offer authority'
);

let registered = null;
let temporaryDocTrashed = false;
let noticeFetchCount = 0;
const projectTriggers = [];
const opaQueries = [];

const noticeText = [
  'THE LEGAL INTELLIGENCER',
  'MONDAY, MARCH 30, 2026',
  'PUBLIC NOTICES',
  'ESTATE NOTICES',
  "ORPHANS' COURT DIVISION",
  'COURT OF COMMON PLEAS',
  'AUDIT LIST',
  'Letters have been granted on the Estate of each of the following decedents.',
  'SMITH, ROBERT L. -- John Smith, Executor, 100 Test Street, Philadelphia, PA 19103.',
  'JONES, ALICE M. -- Mary Jones, Administratrix, 200 Test Street, Philadelphia, PA 19104.'
].join('\n');

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

    Security: {
      requireAdmin() {
        return true;
      }
    },

    CountyRuntimeBridge: {
      registerConnectors() {
        return true;
      }
    },

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

  Utilities: {
    computeDigest() {
      return new Array(32)
        .fill(0);
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return projectTriggers;
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
              return noticeText;
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

const parserEvidence =
  sandbox.REOS
    .PAPhiladelphiaCountyConnector
    .probateEstateParserEvidence({
      sourceUrl:
        'https://assets.alm.com/certification/tlipn033026.pdf'
    });

assert.equal(
  noticeFetchCount,
  2
);

assert.equal(
  parserEvidence.ok,
  true
);

assert.equal(
  parserEvidence.readOnly,
  true
);

assert.equal(
  parserEvidence.mode,
  'PHILADELPHIA_PROBATE_ENTRY_SHAPE_EVIDENCE'
);

assert.equal(
  parserEvidence.currentAnchorCount,
  2
);

assert.equal(
  parserEvidence.currentQualifiedAnchorCount,
  2
);

assert.equal(
  parserEvidence.separatorCounts.doubleHyphen,
  2
);

assert.ok(
  parserEvidence.keywordCounts.executor >=
    1
);

assert.ok(
  parserEvidence.keywordCounts.administratrix >=
    1
);

assert.ok(
  parserEvidence.firstNonEmptyLines.length >
    0
);

assert.ok(
  parserEvidence.snippetCount >
    0
);

assert.equal(
  parserEvidence.sourceConfigurationExecuted,
  false
);

assert.equal(
  parserEvidence.distressLeadMutationExecuted,
  false
);

assert.equal(
  parserEvidence.schedulerAuthorityGranted,
  false
);

assert.equal(
  parserEvidence.productionDataMutationAuthorityGranted,
  false
);

assert.equal(
  parserEvidence.automaticOfferAuthorityGranted,
  false
);

pass(
  'bounded estate-entry shape diagnostic reproduces current parser contract read-only'
);

projectTriggers.push({
  getHandlerFunction() {
    return 'reosCountyProductionSchedulerRun';
  }
});

assert.throws(
  () =>
    sandbox.REOS
      .PAPhiladelphiaCountyConnector
      .probateEstateParserEvidence({
        sourceUrl:
          'https://assets.alm.com/certification/tlipn033026.pdf'
      }),
  /scheduler must remain frozen/i
);

assert.equal(
  noticeFetchCount,
  2
);

projectTriggers.length =
  0;

pass(
  'estate-entry shape diagnostic fails before network execution when scheduler is active'
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
    'reosPhiladelphiaProbateEstateParserEvidence'
  )
);

pass(
  'controlled read-only probate estate-entry evidence RPC is present'
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
