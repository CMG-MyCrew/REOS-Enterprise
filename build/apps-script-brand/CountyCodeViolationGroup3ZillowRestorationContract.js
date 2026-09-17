/**
 * REOS Enterprise
 *
 * Philadelphia code-violation Group 3 Zillow restoration contract.
 *
 * OFFLINE CONTRACT ONLY.
 *
 * Purpose:
 * - preserve row 767 / DL-20260820181647-4170 as the sole county
 *   code-violation observation for VI-2026-045359;
 * - restore physical row 771 / ZIL-20260820193920-1756 from exact
 *   ZILLOW_GMAIL_IMPORTS provenance;
 * - preserve the Zillow Distress Lead ID and Created At lineage;
 * - preserve ZILLOW_GMAIL_IMPORTS row 38 / column 13 unchanged;
 * - require no physical row delete and no downstream reference rewrite.
 *
 * This module contains no executor, no write primitive, no public RPC,
 * and grants no production mutation authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGroup3ZillowRestorationContract =
  (function () {
    'use strict';

    var CONTRACT = Object.freeze({
      version:
        'COUNTY_CODE_VIOLATION_GROUP3_ZILLOW_RESTORATION_V1',

      groupNumber:
        3,

      violationNumber:
        'VI-2026-045359',

      proposedDurableKey:
        'pa-philadelphia|code_violations|vi-2026-045359',

      countySurvivor: Object.freeze({
        distressLeadId:
          "DL-20260820181647-4170",
        physicalRow:
          767,
        action:
          "PRESERVE_AS_SOLE_COUNTY_CODE_VIOLATION"
      }),

      zillowRestoration: Object.freeze({
        distressLeadId:
          "ZIL-20260820193920-1756",
        physicalRow:
          771,
        sourceImportRow:
          38,
        action:
          "RESTORE_ZILLOW_PHYSICAL_ROW_FROM_IMPORT_PROVENANCE",

        preservePhysicalDistressLeadId:
          true,

        preserveCreatedAt:
          true,

        sourceRecordId:
          "1a02188c24fd2e2c",

        sourceObservationKey:
          "zillow gmail|gmail_leads|1a02188c24fd2e2c",

        projection:
          Object.freeze({"Address":"notifications%2Fview-all_target%2FX1-SS1hxmtr65nqsb0000000000_73nh7_sse%2F%3Frtoken%3De0dd9a4d-36f2-4f4e-9680-0d9e71201231%257EX1-ZU10ay7lb3otlah_3qul1%26utm_ca","Canonical Property Key":"","Distress Type":"Listing Inquiry","Email":"instant-updates@mail.zillow.com","External Lead ID":"","Lead Type":"Property Inquiry","Notes":"Imported from Gmail label: Zillow/New Leads\nProperty URL: https://click.mail.zillow.com/f/a/hCQFZro_nNffwQWAuJH04Q~~/AAAAARA~/Y311_yl9PILTO1dW2CeqdPI6Jx0xMD6Sq-q4A6w0jqPd9QN9HKXCjEwwNfNGWH900LZRTh9WDiYqudZ67e2GmA~~?target=https%3A%2F%2Fwww.zillow.com%2F%3Frtoken%3De0dd9a4d-36f2-4f4e-9680-0d9e71201231%257EX1-ZU10ay7lb3otlah_3qul1%26utm_campaign%3Demo-instantsearchdigest%26utm_source%3Demail%26utm_term%3Durn%3Acmp%3A20260820-e0561a7f-45bd-42a2-8539-c0e1dac8158a%26utm_medium%3Demail%26utm_content%3Dheaderzillowlogo","Owner Name":"","Phone":"","Source":"Zillow Gmail","Source Dataset":"gmail_leads","Source Observation Key":"zillow gmail|gmail_leads|1a02188c24fd2e2c","Source Record ID":"1a02188c24fd2e2c","Source Record Key":"zillow gmail|gmail_leads|1a02188c24fd2e2c","Source URL":"https://click.mail.zillow.com/f/a/hCQFZro_nNffwQWAuJH04Q~~/AAAAARA~/Y311_yl9PILTO1dW2CeqdPI6Jx0xMD6Sq-q4A6w0jqPd9QN9HKXCjEwwNfNGWH900LZRTh9WDiYqudZ67e2GmA~~?target=https%3A%2F%2Fwww.zillow.com%2F%3Frtoken%3De0dd9a4d-36f2-4f4e-9680-0d9e71201231%257EX1-ZU10ay7lb3otlah_3qul1%26utm_campaign%3Demo-instantsearchdigest%26utm_source%3Demail%26utm_term%3Durn%3Acmp%3A20260820-e0561a7f-45bd-42a2-8539-c0e1dac8158a%26utm_medium%3Demail%26utm_content%3Dheaderzillowlogo","Status":"New"}),

        clearCountyFields:
          Object.freeze(["Address","City","State","Zip","Owner Name","Distress Type","Estimated Value","Notes","County","Source","Source Dataset","Connector Run ID","Parcel ID","Source Record ID","Source Record Key","Last Seen At","Source Updated At","Co-Owner Name","Estimated Debt","Assessment Value","Year Built","Land Acres","Living Area","Last Sale Date","Last Sale Price","Tax Delinquent Amount","Tax Principal","Tax Interest","Tax Penalty","Violation Amount","Violation Number","Violation Type","Violation Status","Vacancy Status","Vacancy Rank","Sheriff Auction ID","Book/Writ","Sale Type","Sale Status","Sale Date","Source Observation Key","Canonical Property Key"])
      }),

      downstreamReference: Object.freeze({
        sheet:
          "ZILLOW_GMAIL_IMPORTS",
        rowNumber:
          38,
        columnNumber:
          13,
        columnName:
          'Distress Lead ID',
        distressLeadId:
          "ZIL-20260820193920-1756",
        action:
          'PRESERVE_UNCHANGED'
      }),

      referenceRewriteRequired:
        false,

      physicalDeleteRequired:
        false,

      countyCollapseResolvedByRestoration:
        true,

      executionAuthorityGranted:
        false,

      repairAuthorityGranted:
        false,

      referenceRewriteAuthorityGranted:
        false,

      deleteAuthorityGranted:
        false,

      checkpointMutationAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      connectorExecutionAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    });

    function contract() {
      return CONTRACT;
    }

    return Object.freeze({
      contract:
        contract
    });
  })();
