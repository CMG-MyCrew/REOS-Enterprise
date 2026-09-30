#!/usr/bin/env node

'use strict';

const assert =
  require('node:assert/strict');

const crypto =
  require('node:crypto');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');

const ROOT =
  path.resolve(
    __dirname,
    '..'
  );

const MODULE =
  path.join(
    ROOT,
    'build',
    'apps-script-brand',
    'PhiladelphiaProbateRecurringSource.js'
  );

const source =
  fs.readFileSync(
    MODULE,
    'utf8'
  );

console.log(
  '=== PHILADELPHIA PROBATE RECURRING SOURCE CONTRACT ==='
);
console.log();

assert.equal(
  /\bPropertiesService\b/
    .test(source),
  false,
  'recurring source resolver does not mutate Script Properties'
);

assert.equal(
  /\bScriptApp\b/
    .test(source),
  false,
  'recurring source resolver grants no trigger authority'
);

assert.equal(
  /DISTRESS_LEADS|Database\.|QualifiedDealQueue|OfferGenerator|automaticOffer/i
    .test(source),
  false,
  'recurring source resolver grants no persistence or offer authority'
);

assert.ok(
  source.includes(
    "var CURSOR_PREFIX = 'PB1'"
  ),
  'PB1 cursor prefix is explicit'
);

assert.ok(
  source.includes(
    "PHL-PROBATE-PB1-V1"
  ),
  'PB1 cursor domain is explicit'
);

assert.ok(
  source.includes(
    'MAX_LOOKBACK_DAYS = 10'
  ),
  'source discovery lookback is bounded'
);

assert.ok(
  source.includes(
    'NOTICE_PAGE_SIZE = 25'
  ),
  'notice pagination is bounded to 25 notices'
);

let activePdf =
  'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

const fetches = [];

function formatParts(
  date,
  timeZone
) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
        year:
          'numeric',
        month:
          '2-digit',
        day:
          '2-digit',
        weekday:
          'long'
      }
    );

  return Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(
        part =>
          part.type !==
          'literal'
      )
      .map(
        part => [
          part.type,
          part.value
        ]
      )
  );
}

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
  isNaN,

  Utilities: {
    DigestAlgorithm: {
      SHA_256:
        'SHA_256'
    },

    Charset: {
      UTF_8:
        'UTF_8'
    },

    computeDigest(
      algorithm,
      value
    ) {
      assert.equal(
        algorithm,
        'SHA_256'
      );

      return Array.from(
        crypto
          .createHash(
            'sha256'
          )
          .update(
            String(value),
            'utf8'
          )
          .digest()
      );
    },

    formatDate(
      date,
      timeZone,
      pattern
    ) {
      const parts =
        formatParts(
          date,
          timeZone
        );

      if (
        pattern ===
        'yyyy'
      ) {
        return parts.year;
      }

      if (
        pattern ===
        'MM'
      ) {
        return parts.month;
      }

      if (
        pattern ===
        'dd'
      ) {
        return parts.day;
      }

      if (
        pattern ===
        'yyyy-MM-dd'
      ) {
        return (
          parts.year +
          '-' +
          parts.month +
          '-' +
          parts.day
        );
      }

      if (
        pattern ===
        'MMddyy'
      ) {
        return (
          parts.month +
          parts.day +
          parts.year.slice(-2)
        );
      }

      if (
        pattern ===
        'EEEE'
      ) {
        return parts.weekday;
      }

      throw new Error(
        'Unexpected format pattern: ' +
        pattern
      );
    }
  },

  UrlFetchApp: {
    fetch(
      url
    ) {
      fetches.push(
        url
      );

      const isCurrent =
        url ===
        'https://www.law.com/thelegalintelligencer/2026/09/30/wednesday-public-noticescalendars/';

      return {
        getResponseCode() {
          return isCurrent
            ? 200
            : 404;
        },

        getContentText() {
          if (!isCurrent) {
            return '';
          }

          return (
            '<html><body><a href="' +
            activePdf +
            '">Public Notices PDF</a></body></html>'
          );
        }
      };
    }
  }
};

vm.createContext(
  sandbox
);

vm.runInContext(
  source,
  sandbox
);

const resolver =
  sandbox.REOS &&
  sandbox.REOS
    .PhiladelphiaProbateRecurringSource;

assert.ok(
  resolver,
  'recurring-source API loads'
);

assert.equal(
  resolver.cursorPrefix,
  'PB1'
);

assert.equal(
  resolver.cursorDomainId,
  'PHL-PROBATE-PB1-V1'
);

assert.equal(
  resolver.noticePageSize,
  25
);

const initial =
  resolver.resolve(
    '',
    new Date(
      '2026-09-30T04:30:00.000Z'
    )
  );

assert.equal(
  initial.ok,
  true
);

assert.equal(
  initial.publicationDate,
  '2026-09-30'
);

assert.equal(
  initial.sourceUrl,
  activePdf
);

assert.match(
  initial.sourceSha256,
  /^[0-9a-f]{64}$/
);

assert.equal(
  initial.noticeOffset,
  0
);

assert.equal(
  initial.noticePageSize,
  25
);

assert.equal(
  initial.continuation,
  false
);

assert.equal(
  fetches.length,
  1,
  'current publication is selected without unbounded probing'
);

const cursor =
  resolver.encodeCursor(
    initial.sourceSha256,
    initial.publicationDate,
    25
  );

assert.equal(
  cursor,
  (
    'PB1|' +
    initial.sourceSha256 +
    '|2026-09-30|25'
  )
);

const parsed =
  resolver.parseCursor(
    cursor
  );

assert.equal(
  parsed.noticeOffset,
  25
);

const continued =
  resolver.resolve(
    cursor,
    new Date(
      '2026-10-03T15:00:00.000Z'
    )
  );

assert.equal(
  continued.publicationDate,
  '2026-09-30',
  'continuation remains bound to cursor publication date'
);

assert.equal(
  continued.sourceUrl,
  initial.sourceUrl
);

assert.equal(
  continued.noticeOffset,
  25
);

assert.equal(
  continued.continuation,
  true
);

activePdf =
  'https://assets.alm.com/00/11/changed-authority/tlipn093026.pdf';

assert.throws(
  () =>
    resolver.resolve(
      cursor,
      new Date(
        '2026-10-03T15:00:00.000Z'
      )
    ),
  /source drift/i,
  'cursor-bound publication source drift fails closed'
);

assert.throws(
  () =>
    resolver.parseCursor(
      'PB1|bad|2026-09-30|25'
    ),
  /malformed/i,
  'malformed PB1 cursor fails closed'
);

assert.throws(
  () =>
    resolver.encodeCursor(
      initial.sourceSha256,
      '2026-09-30',
      0
    ),
  /positive integer/i,
  'PB1 continuation cursor cannot encode offset zero'
);

assert.equal(
  resolver.approvedSourceUrl(
    'https://assets.alm.com/x/tlipn093026.pdf'
  ),
  true
);

assert.equal(
  resolver.approvedSourceUrl(
    'https://example.com/tlipn093026.pdf'
  ),
  false
);

console.log(
  'PASS: current Legal Intelligencer issue discovery is bounded'
);
console.log(
  'PASS: ALM source authority is exact and host restricted'
);
console.log(
  'PASS: PB1 cursor is deterministic and source bound'
);
console.log(
  'PASS: cursor continuation re-resolves the exact publication'
);
console.log(
  'PASS: source drift fails closed'
);
console.log(
  'PASS: resolver grants no persistence, trigger, or offer authority'
);
console.log();
console.log(
  'PHILADELPHIA_PROBATE_RECURRING_SOURCE_VALIDATED=true'
);
