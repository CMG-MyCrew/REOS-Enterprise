'use strict';

const fs = require('fs');
const vm = require('vm');

const path =
  'build/apps-script-brand/PhiladelphiaProbateBoundedSourceDiscovery.js';

const code =
  fs.readFileSync(
    path,
    'utf8'
  );

const directForbidden = [
  'UrlFetchApp',
  'PropertiesService',
  'ScriptApp',
  'SpreadsheetApp',
  'DriveApp',
  'Drive.Files',
  'DocumentApp',
  'LockService',
  'registerConnectors('
];

for (const token of directForbidden) {
  if (code.includes(token)) {
    throw new Error(
      'Forbidden direct authority surface: ' +
      token
    );
  }
}

const publicationDate =
  '2026-09-30';

const sourceUrl =
  'https://assets.alm.com/example/tlipn093026.pdf';

const articleUrl =
  'https://www.law.com/thelegalintelligencer/2026/09/30/wednesday-public-noticescalendars/';

const hash =
  'a'.repeat(64);

function baseSource() {
  return {
    cursorPrefix: 'PB1',

    cursorDomainId:
      'PHL-PROBATE-PB1-V1',

    maxLookbackDays: 10,
    noticePageSize: 25,

    approvedSourceUrl(value) {
      return (
        /^https:\/\/(?:assets\.alm\.com|images\.law\.com)\//i
          .test(String(value || ''))
      );
    },

    resolve(cursor, now) {
      if (cursor !== '') {
        throw new Error(
          'Expected empty cursor.'
        );
      }

      if (!(now instanceof Date)) {
        throw new Error(
          'Expected Date argument.'
        );
      }

      return {
        ok: true,

        cursorDomainId:
          'PHL-PROBATE-PB1-V1',

        publicationDate,
        articleUrl,
        sourceUrl,
        sourceSha256: hash,

        noticeOffset: 0,
        noticePageSize: 25,
        continuation: false
      };
    }
  };
}

function execute(source) {
  const context = {
    Date,
    String,
    Number,
    Error,
    RegExp,

    REOS: {
      PhiladelphiaProbateRecurringSource:
        source
    }
  };

  vm.createContext(context);

  vm.runInContext(
    code,
    context,
    {
      filename: path
    }
  );

  if (
    typeof context
      .reosPhiladelphiaProbateBoundedSourceDiscovery !==
    'function'
  ) {
    throw new Error(
      'RPC export missing.'
    );
  }

  return context
    .reosPhiladelphiaProbateBoundedSourceDiscovery();
}

let resolveCount = 0;
let approvedCount = 0;

const successSource =
  baseSource();

const originalResolve =
  successSource.resolve;

successSource.resolve =
  function(cursor, now) {
    resolveCount += 1;

    return originalResolve(
      cursor,
      now
    );
  };

const originalApproved =
  successSource.approvedSourceUrl;

successSource.approvedSourceUrl =
  function(value) {
    approvedCount += 1;

    return originalApproved(value);
  };

const result =
  execute(successSource);

if (resolveCount !== 1) {
  throw new Error(
    'Expected exactly one resolver call.'
  );
}

if (approvedCount !== 1) {
  throw new Error(
    'Expected exactly one approved-source validation.'
  );
}

const expected = {
  ok: true,
  discoveryVersion: 1,

  cursorDomainId:
    'PHL-PROBATE-PB1-V1',

  publicationDate,
  articleUrl,
  sourceUrl,
  sourceSha256: hash,

  noticeOffset: 0,
  noticePageSize: 25,
  continuation: false,

  resolveExecuted: true,
  articleDiscoveryHttpAuthorized: true,

  pdfFetchExecuted: false,
  driveOcrExecuted: false,
  connectorRegistrationExecuted: false,

  persistenceExecuted: false,
  configurationExecuted: false,

  schedulerMutationExecuted: false,
  triggerMutationExecuted: false,
  checkpointMutationExecuted: false,
  countyDataMutationExecuted: false,

  arvAuthorityGranted: false,
  repairScopeAuthorityGranted: false,
  maoAuthorityGranted: false,
  offerAuthorityGranted: false
};

for (
  const [key, expectedValue]
  of Object.entries(expected)
) {
  if (
    result[key] !== expectedValue
  ) {
    throw new Error(
      'Unexpected result ' +
      key +
      '=' +
      JSON.stringify(result[key])
    );
  }
}

function expectFailure(
  label,
  mutate
) {
  const source =
    baseSource();

  mutate(source);

  let failed = false;

  try {
    execute(source);
  } catch (_) {
    failed = true;
  }

  if (!failed) {
    throw new Error(
      'Expected fail-closed case: ' +
      label
    );
  }
}

expectFailure(
  'wrong cursor prefix',
  source => {
    source.cursorPrefix = 'WRONG';
  }
);

expectFailure(
  'wrong domain',
  source => {
    source.cursorDomainId = 'WRONG';
  }
);

expectFailure(
  'wrong lookback',
  source => {
    source.maxLookbackDays = 11;
  }
);

expectFailure(
  'wrong page size',
  source => {
    source.noticePageSize = 26;
  }
);

expectFailure(
  'unapproved source',
  source => {
    source.approvedSourceUrl =
      () => false;
  }
);

expectFailure(
  'wrong dated PDF',
  source => {
    source.resolve =
      () => ({
        ok: true,
        cursorDomainId:
          'PHL-PROBATE-PB1-V1',
        publicationDate,
        articleUrl,
        sourceUrl:
          'https://assets.alm.com/example/tlipn092926.pdf',
        sourceSha256: hash,
        noticeOffset: 0,
        noticePageSize: 25,
        continuation: false
      });
  }
);

expectFailure(
  'wrong article host',
  source => {
    source.resolve =
      () => ({
        ok: true,
        cursorDomainId:
          'PHL-PROBATE-PB1-V1',
        publicationDate,
        articleUrl:
          'https://example.com/not-authorized',
        sourceUrl,
        sourceSha256: hash,
        noticeOffset: 0,
        noticePageSize: 25,
        continuation: false
      });
  }
);

expectFailure(
  'invalid source hash',
  source => {
    source.resolve =
      () => ({
        ok: true,
        cursorDomainId:
          'PHL-PROBATE-PB1-V1',
        publicationDate,
        articleUrl,
        sourceUrl,
        sourceSha256: 'bad',
        noticeOffset: 0,
        noticePageSize: 25,
        continuation: false
      });
  }
);

expectFailure(
  'continuation authority',
  source => {
    source.resolve =
      () => ({
        ok: true,
        cursorDomainId:
          'PHL-PROBATE-PB1-V1',
        publicationDate,
        articleUrl,
        sourceUrl,
        sourceSha256: hash,
        noticeOffset: 1,
        noticePageSize: 25,
        continuation: true
      });
  }
);

console.log(
  'PB1_BOUNDED_SOURCE_DISCOVERY_VALIDATOR_PASSED=true'
);

console.log(
  'RESOLVE_INVOCATION_COUNT_EXACT=1'
);

console.log(
  'APPROVED_SOURCE_VALIDATION_COUNT_EXACT=1'
);

console.log(
  'FAIL_CLOSED_CASES_PASSED=9'
);

console.log(
  'NO_DIRECT_URLFETCHAPP_SURFACE=true'
);

console.log(
  'NO_PDF_FETCH_SURFACE=true'
);

console.log(
  'NO_DRIVE_OCR_SURFACE=true'
);

console.log(
  'NO_PERSISTENCE_SURFACE=true'
);

console.log(
  'NO_CONNECTOR_REGISTRATION_SURFACE=true'
);

console.log(
  'NO_MAO_OFFER_AUTHORITY=true'
);
