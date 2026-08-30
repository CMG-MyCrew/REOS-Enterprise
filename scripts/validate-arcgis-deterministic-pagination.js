#!/usr/bin/env node

'use strict';

const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log(
  '=== ARCGIS DETERMINISTIC PAGINATION CERTIFICATION ==='
);

const connectorPath =
  'build/apps-script-brand/PAPhiladelphiaCountyConnector.js';

const adapterPath =
  'build/apps-script-brand/ArcGISAdapter.js';

const httpPath =
  'build/apps-script-brand/CountyHttpAdapter.js';

const connector = fs.readFileSync(connectorPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');
const http = fs.readFileSync(httpPath, 'utf8');

/*
 * V17 contract:
 *
 * Offset-paginated ArcGIS datasets may define their own stable
 * ordering. The county connector must propagate that ordering into
 * the generic ArcGIS adapter.
 *
 * Do not impose OBJECTID globally because the adapter is shared by
 * many county implementations.
 */

const taxStart = connector.indexOf(
  'tax_delinquent: {'
);

const taxEnd = connector.indexOf(
  'code_violations: {',
  taxStart
);

assert(
  taxStart !== -1 && taxEnd !== -1,
  'Philadelphia tax_delinquent definition is present'
);

const taxDefinition = connector.slice(
  taxStart,
  taxEnd
);

assert(
  /orderByFields\s*:\s*["']OBJECTID ASC["']/.test(
    taxDefinition
  ),
  'Philadelphia tax_delinquent declares deterministic OBJECTID ordering'
);

const fetchStart = connector.indexOf(
  'function fetch_(context)'
);

const fetchEnd = connector.indexOf(
  'function getHtmlParser_',
  fetchStart
);

assert(
  fetchStart !== -1 && fetchEnd !== -1,
  'Philadelphia fetch implementation is present'
);

const fetchSection = connector.slice(
  fetchStart,
  fetchEnd
);

assert(
  /definition\.orderByFields/.test(fetchSection) &&
  /adapterOptions\.orderByFields/.test(fetchSection),
  'connector propagates dataset ordering to ArcGIS adapter'
);

assert(
  /if\s*\(\s*options\.orderByFields\s*\)/.test(adapter) &&
  /parameters\.orderByFields\s*=\s*options\.orderByFields/.test(
    adapter
  ),
  'generic ArcGIS adapter supports caller-defined ordering'
);

assert(
  !/orderByFields\s*:\s*['"]OBJECTID ASC['"]/.test(
    adapter
  ),
  'generic ArcGIS adapter does not impose OBJECTID globally'
);

console.log(
  'PASS: ArcGIS pagination ordering is dataset-defined and propagated'
);

/*
 * URL transport escaping contract.
 *
 * CountyHttpAdapter preserves Apps Script's normal escaping behavior
 * unless the caller explicitly supplies escaping:false.
 *
 * ArcGIS URLs have already been percent-encoded by appendQuery(),
 * therefore ArcGIS fetch and health explicitly disable a second
 * escaping pass.
 */

assert(
  /escaping\s*:\s*options\.escaping\s*!==\s*false/.test(
    http
  ),
  'County HTTP adapter exposes explicit escaping=false opt-out'
);

const arcgisEscapingOverrides =
  adapter.match(
    /escaping\s*:\s*false/g
  ) || [];

assert.strictEqual(
  arcgisEscapingOverrides.length,
  2,
  'ArcGIS fetch and health both disable URL re-escaping'
);

console.log(
  'PASS: County HTTP transport preserves default escaping unless caller opts out'
);

console.log(
  'PASS: ArcGIS fetch and health explicitly disable URL re-escaping'
);

/*
 * Runtime-style transport proof using the actual production source.
 */

const capturedRequests = [];

const sandbox = {
  REOS: {
    CountyAdapters: {}
  },

  UrlFetchApp: {
    fetch: function (url, options) {
      capturedRequests.push({
        url: url,
        options: options
      });

      return {
        getResponseCode: function () {
          return 200;
        },

        getContentText: function () {
          return JSON.stringify({
            features: [],
            count: 0
          });
        },

        getHeaders: function () {
          return {
            'Content-Type':
              'application/json'
          };
        }
      };
    }
  },

  Date: Date,
  JSON: JSON,
  Object: Object,
  String: String,
  Number: Number,
  Array: Array,
  Math: Math,
  console: console
};

vm.createContext(
  sandbox
);

vm.runInContext(
  http,
  sandbox
);

vm.runInContext(
  adapter,
  sandbox
);

sandbox.REOS
  .CountyAdapters
  .ArcGIS
  .fetch({
    endpoint:
      'https://example.test/query',

    context: {
      limit: 100,
      cursor: '1600'
    },

    maxLimit: 2000,

    orderByFields:
      'objectid ASC'
  });

assert.strictEqual(
  capturedRequests.length,
  1,
  'ArcGIS fetch emits exactly one HTTP request'
);

const fetchRequest =
  capturedRequests[0];

const expectedFetchUrl =
  'https://example.test/query' +
  '?where=1%3D1' +
  '&outFields=*' +
  '&returnGeometry=false' +
  '&resultRecordCount=100' +
  '&resultOffset=1600' +
  '&f=json' +
  '&orderByFields=objectid%20ASC';

assert.strictEqual(
  fetchRequest.url,
  expectedFetchUrl,
  'ArcGIS URL is exactly once percent-encoded'
);

assert.strictEqual(
  fetchRequest.options.escaping,
  false,
  'ArcGIS fetch supplies escaping=false'
);

assert(
  !fetchRequest.url.includes('%253D'),
  'ArcGIS where clause is not double encoded'
);

assert(
  !fetchRequest.url.includes('%2520'),
  'ArcGIS order clause is not double encoded'
);

console.log(
  'PASS: ArcGIS encoded fetch URL is preserved exactly through transport'
);

sandbox.REOS
  .CountyAdapters
  .ArcGIS
  .health({
    endpoint:
      'https://example.test/query'
  });

assert.strictEqual(
  capturedRequests.length,
  2,
  'ArcGIS health emits exactly one additional request'
);

assert.strictEqual(
  capturedRequests[1].options.escaping,
  false,
  'ArcGIS health supplies escaping=false'
);

console.log(
  'PASS: ArcGIS health transport also disables URL re-escaping'
);

/*
 * Shared-transport regression:
 * a caller that does not opt out must retain escaping=true.
 */

sandbox.REOS
  .CountyAdapters
  .Http
  .request({
    url:
      'https://example.test/raw?q=a%20b',

    method:
      'get'
  });

assert.strictEqual(
  capturedRequests.length,
  3,
  'direct HTTP regression request captured'
);

assert.strictEqual(
  capturedRequests[2].options.escaping,
  true,
  'non-ArcGIS caller retains escaping=true'
);

console.log(
  'PASS: non-ArcGIS HTTP callers retain existing escaping behavior'
);

console.log();
console.log(
  'ArcGIS deterministic pagination certification PASSED.'
);
