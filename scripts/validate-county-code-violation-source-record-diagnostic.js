#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

console.log(
  '=== COUNTY CODE-VIOLATION SOURCE-RECORD DIAGNOSTIC CONTRACT ==='
);

const file =
  'build/apps-script-brand/CountyCodeViolationSourceRecordDiagnostic.js';

assert.ok(
  fs.existsSync(file),
  'Diagnostic source must exist'
);

const source =
  fs.readFileSync(
    file,
    'utf8'
  );

[
  /function\s+reosCountyCodeViolationSourceRecordDiagnostic\s*\(/,
  /objectid\s*=\s*['"]?\s*\+/,
  /CountyAdapters\.ArcGIS\.fetch\s*\(/,
  /connector\.normalize\s*\(/,
  /CanonicalPropertyIdentity[\s\S]*\.resolve\s*\(/,
  /Database[\s\S]*\.getAll\s*\(/,
  /productionDataMutationAuthorityGranted:\s*false/,
  /checkpointMutationAuthorityGranted:\s*false/,
  /schedulerAuthorityGranted:\s*false/,
  /connectorExecutionAuthorityGranted:\s*false/,
  /repairAuthorityGranted:\s*false/,
  /migrationAuthorityGranted:\s*false/,
  /automaticOfferAuthorityGranted:\s*false/
].forEach(pattern => {
  assert.match(
    source,
    pattern
  );
});

[
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.delete\s*\(/,
  /CountyConnectorSDK\.run\s*\(/,
  /ProductionSchedulerRunManualCertification\s*\(/,
  /ProductionSchedulerInstall\s*\(/
].forEach(pattern => {
  assert.equal(
    pattern.test(source),
    false,
    'Diagnostic must remain mutation/execution free: ' +
      pattern
  );
});

let adminCalls = 0;
let fetchCalls = 0;
let rowReads = 0;

const context = {
  console,

  Date,

  isFinite,

  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(name) {
          assert.equal(
            name,
            'REOS_COUNTY_PA_PHILADELPHIA_CODE_VIOLATIONS_URL'
          );

          return 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/VIOLATIONS/FeatureServer/0/query';
        }
      };
    }
  },

  ScriptApp: {
    getProjectTriggers() {
      return [];
    }
  },

  REOS: {
    Security: {
      requireAdmin() {
        adminCalls++;
        return true;
      }
    },

    Database: {
      getAll(sheet) {
        assert.equal(
          sheet,
          'DISTRESS_LEADS'
        );

        rowReads++;

        return [
          {
            _rowNumber: 923,
            'Distress Lead ID':
              'DL-20260821060151-8654',
            Address:
              '1327 S 4th St',
            City:
              'Philadelphia',
            State:
              'PA',
            Zip:
              '19147-5932',
            County:
              'Philadelphia',
            'Parcel ID':
              '466864',
            Source:
              'PA-PHILADELPHIA',
            'Source Dataset':
              'code_violations',
            'Source Record ID':
              '214',
            'Source Record Key':
              'pa-philadelphia|code_violations|214',
            'Source Observation Key':
              '',
            'Canonical Property Key':
              ''
          },

          {
            _rowNumber: 925,
            'Distress Lead ID':
              'DL-20260821060203-1280',
            Address:
              '1327 S 4th St',
            City:
              'Philadelphia',
            State:
              'PA',
            Zip:
              '19147-5932',
            County:
              'Philadelphia',
            'Parcel ID':
              '',
            Source:
              'PA-PHILADELPHIA',
            'Source Dataset':
              'code_violations',
            'Source Record ID':
              '214',
            'Source Record Key':
              'pa-philadelphia|code_violations|214',
            'Source Observation Key':
              '',
            'Canonical Property Key':
              ''
          }
        ];
      }
    },

    CountyRuntimeBridge: {
      registerConnectors() {
        return true;
      }
    },

    CountyConnectorSDK: {
      get(id) {
        assert.equal(
          id,
          'PA-PHILADELPHIA'
        );

        return {
          normalize(raw, runtimeContext) {
            assert.equal(
              runtimeContext.dataset,
              'code_violations'
            );

            return {
              Address:
                raw.address,
              City:
                'Philadelphia',
              State:
                'PA',
              Zip:
                raw.zip,
              County:
                'Philadelphia',
              'Parcel ID':
                raw.parcel_id_num,
              'Source Record ID':
                String(raw.objectid),
              Source:
                'PA-PHILADELPHIA',
              'Source Dataset':
                'code_violations',
              'Distress Type':
                'Code Violation',
              'Violation Status':
                raw.violationstatus
            };
          }
        };
      }
    },

    CountyAdapters: {
      ArcGIS: {
        fetch(options) {
          fetchCalls++;

          assert.match(
            options.where,
            /objectid = 214/
          );

          assert.equal(
            options.maxLimit,
            1
          );

          return {
            records: [
              {
                objectid:
                  214,
                address:
                  '1327 S 4th St',
                zip:
                  '19147-5932',
                parcel_id_num:
                  '466864',
                violationstatus:
                  'OPEN'
              }
            ],
            metadata: {
              mocked:
                true
            }
          };
        }
      }
    },

    CanonicalPropertyIdentity: {
      resolve(record) {
        const sourceKey =
          [
            String(record.Source)
              .toLowerCase(),
            String(
              record[
                'Source Dataset'
              ]
            ).toLowerCase(),
            String(
              record[
                'Source Record ID'
              ]
            ).toLowerCase()
          ].join('|');

        const parcel =
          String(
            record[
              'Parcel ID'
            ] || ''
          )
            .toLowerCase()
            .replace(
              /[^a-z0-9]/g,
              ''
            );

        const canonical =
          parcel
            ? 'property|parcel|pa|philadelphia|' +
              parcel
            : 'property|address|pa|philadelphia|19147-5932|1327 s 4th st';

        return {
          sourceObservationKey:
            sourceKey,
          canonicalPropertyKey:
            canonical
        };
      }
    }
  }
};

vm.createContext(
  context
);

vm.runInContext(
  source,
  context,
  {
    filename:
      file
  }
);

assert.equal(
  typeof context
    .reosCountyCodeViolationSourceRecordDiagnostic,
  'function'
);

const result =
  context
    .reosCountyCodeViolationSourceRecordDiagnostic(
      214
    );

assert.equal(
  adminCalls,
  1
);

assert.equal(
  fetchCalls,
  1
);

assert.equal(
  rowReads,
  1
);

assert.equal(
  result.ok,
  true
);

assert.equal(
  result.readOnly,
  true
);

assert.equal(
  result.mode,
  'CODE_VIOLATION_SOURCE_RECORD_DIAGNOSTIC'
);

assert.equal(
  result.sourceObservationKey,
  'pa-philadelphia|code_violations|214'
);

assert.equal(
  result.persistedMatchCount,
  2
);

assert.equal(
  result.normalizedIdentity
    .canonicalPropertyKey,
  'property|parcel|pa|philadelphia|466864'
);

assert.deepEqual(
  JSON.parse(
    JSON.stringify(
      result
        .sourceMatchesPersistedCanonicalRows
    )
  ),
  [
    {
      rowNumber:
        923,
      distressLeadId:
        'DL-20260821060151-8654'
    }
  ]
);

assert.equal(
  result
    .productionDataMutationAuthorityGranted,
  false
);

assert.equal(
  result
    .repairAuthorityGranted,
  false
);

assert.equal(
  result
    .automaticOfferAuthorityGranted,
  false
);

assert.throws(
  () =>
    context
      .reosCountyCodeViolationSourceRecordDiagnostic(
        -1
      ),
  /objectid is invalid/
);

console.log(
  'PASS: targeted source record is fetched exactly once.'
);

console.log(
  'PASS: source record is normalized through registered production connector.'
);

console.log(
  'PASS: canonical identity comparison distinguishes persisted conflicts.'
);

console.log(
  'PASS: diagnostic grants no mutation, scheduler, repair, or offer authority.'
);

console.log(
  'County code-violation source-record diagnostic validation PASSED.'
);
