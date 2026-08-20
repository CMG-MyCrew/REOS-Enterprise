#!/usr/bin/env node

'use strict';

const fs = require('fs');
const assert = require('assert');

console.log(
  '=== ARCGIS DETERMINISTIC PAGINATION CERTIFICATION ==='
);

const connectorPath =
  'build/apps-script-brand/PAPhiladelphiaCountyConnector.js';

const adapterPath =
  'build/apps-script-brand/ArcGISAdapter.js';

const connector = fs.readFileSync(connectorPath, 'utf8');
const adapter = fs.readFileSync(adapterPath, 'utf8');

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

console.log();
console.log(
  'ArcGIS deterministic pagination certification PASSED.'
);
