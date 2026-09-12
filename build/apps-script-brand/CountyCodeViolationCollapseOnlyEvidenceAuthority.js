/**
 * REOS Enterprise - Code Violation Collapse-Only Evidence Authority
 *
 * Exact read-only authority catalog derived from preserved Gate 2B
 * collapse-only group evidence.
 *
 * Source evidence SHA-256:
 * 762abd7c1ffebec3e1e15a205a93b6ef4d564ccf8020d08fd315ccb4a9c49e49
 *
 * This catalog grants NO mutation, collapse, winner, delete,
 * scheduler, checkpoint, repair, migration, connector, or offer authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationCollapseOnlyEvidenceAuthority = (function () {
  var SOURCE_EVIDENCE_SHA256 = '762abd7c1ffebec3e1e15a205a93b6ef4d564ccf8020d08fd315ccb4a9c49e49';
  var AUTHORITY_SHA256 = '87ec06c98009dec42f5cfa52ecdeeaf6167d9c67d13dc0ca1eb353acf05964ee';

  var RECORDS = [
  {
    "groupNumber": 1,
    "rowNumber": 764,
    "distressLeadId": "DL-20260820181640-2063",
    "sourceRecordId": "24",
    "violationNumber": "VI-2026-045340",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2404|8030 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|24",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045340"
  },
  {
    "groupNumber": 2,
    "rowNumber": 766,
    "distressLeadId": "DL-20260820181645-7130",
    "sourceRecordId": "23",
    "violationNumber": "VI-2026-045339",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2404|8030 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|23",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045339"
  },
  {
    "groupNumber": 3,
    "rowNumber": 767,
    "distressLeadId": "DL-20260820181647-4170",
    "sourceRecordId": "28",
    "violationNumber": "VI-2026-045359",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19102-1404|127 n mole st",
    "legacyObservationKey": "pa-philadelphia|code_violations|28",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045359"
  },
  {
    "groupNumber": 1,
    "rowNumber": 768,
    "distressLeadId": "DL-20260820181649-9792",
    "sourceRecordId": "24",
    "violationNumber": "VI-2026-045340",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2404|8030 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|24",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045340"
  },
  {
    "groupNumber": 2,
    "rowNumber": 770,
    "distressLeadId": "DL-20260820181652-6183",
    "sourceRecordId": "23",
    "violationNumber": "VI-2026-045339",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2404|8030 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|23",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045339"
  },
  {
    "groupNumber": 3,
    "rowNumber": 771,
    "distressLeadId": "ZIL-20260820193920-1756",
    "sourceRecordId": "28",
    "violationNumber": "VI-2026-045359",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19102-1404|127 n mole st",
    "legacyObservationKey": "pa-philadelphia|code_violations|28",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045359"
  },
  {
    "groupNumber": 4,
    "rowNumber": 772,
    "distressLeadId": "DL-20260820195113-7700",
    "sourceRecordId": "58",
    "violationNumber": "VI-2026-045398",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|58",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045398"
  },
  {
    "groupNumber": 5,
    "rowNumber": 773,
    "distressLeadId": "DL-20260820195114-8036",
    "sourceRecordId": "44",
    "violationNumber": "VI-2026-046349",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|44",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046349"
  },
  {
    "groupNumber": 6,
    "rowNumber": 774,
    "distressLeadId": "DL-20260820195114-4198",
    "sourceRecordId": "57",
    "violationNumber": "VI-2026-045397",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|57",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045397"
  },
  {
    "groupNumber": 7,
    "rowNumber": 775,
    "distressLeadId": "DL-20260820195116-6729",
    "sourceRecordId": "43",
    "violationNumber": "VI-2026-046348",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|43",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046348"
  },
  {
    "groupNumber": 8,
    "rowNumber": 776,
    "distressLeadId": "DL-20260820195118-0118",
    "sourceRecordId": "56",
    "violationNumber": "VI-2026-045396",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|56",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045396"
  },
  {
    "groupNumber": 9,
    "rowNumber": 777,
    "distressLeadId": "DL-20260820195121-9141",
    "sourceRecordId": "42",
    "violationNumber": "VI-2026-046347",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|42",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046347"
  },
  {
    "groupNumber": 10,
    "rowNumber": 778,
    "distressLeadId": "DL-20260820195123-9145",
    "sourceRecordId": "55",
    "violationNumber": "VI-2026-045395",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|55",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045395"
  },
  {
    "groupNumber": 5,
    "rowNumber": 779,
    "distressLeadId": "DL-20260820195125-4161",
    "sourceRecordId": "44",
    "violationNumber": "VI-2026-046349",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|44",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046349"
  },
  {
    "groupNumber": 11,
    "rowNumber": 780,
    "distressLeadId": "DL-20260820195126-6833",
    "sourceRecordId": "54",
    "violationNumber": "VI-2026-045394",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|54",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045394"
  },
  {
    "groupNumber": 7,
    "rowNumber": 781,
    "distressLeadId": "DL-20260820195127-8317",
    "sourceRecordId": "43",
    "violationNumber": "VI-2026-046348",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|43",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046348"
  },
  {
    "groupNumber": 9,
    "rowNumber": 783,
    "distressLeadId": "DL-20260820195128-7226",
    "sourceRecordId": "42",
    "violationNumber": "VI-2026-046347",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|42",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046347"
  },
  {
    "groupNumber": 4,
    "rowNumber": 784,
    "distressLeadId": "DL-20260820195131-0566",
    "sourceRecordId": "58",
    "violationNumber": "VI-2026-045398",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|58",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045398"
  },
  {
    "groupNumber": 5,
    "rowNumber": 785,
    "distressLeadId": "DL-20260820195132-8733",
    "sourceRecordId": "44",
    "violationNumber": "VI-2026-046349",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-3203|269 w walnut ln",
    "legacyObservationKey": "pa-philadelphia|code_violations|44",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-046349"
  },
  {
    "groupNumber": 6,
    "rowNumber": 786,
    "distressLeadId": "DL-20260820195133-3145",
    "sourceRecordId": "57",
    "violationNumber": "VI-2026-045397",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|57",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045397"
  },
  {
    "groupNumber": 12,
    "rowNumber": 787,
    "distressLeadId": "DL-20260820195134-3998",
    "sourceRecordId": "48",
    "violationNumber": "VI-2026-045363",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19143-2627|5236 webster st",
    "legacyObservationKey": "pa-philadelphia|code_violations|48",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045363"
  },
  {
    "groupNumber": 8,
    "rowNumber": 788,
    "distressLeadId": "DL-20260820195135-1696",
    "sourceRecordId": "56",
    "violationNumber": "VI-2026-045396",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|56",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045396"
  },
  {
    "groupNumber": 12,
    "rowNumber": 789,
    "distressLeadId": "DL-20260820195137-7319",
    "sourceRecordId": "48",
    "violationNumber": "VI-2026-045363",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19143-2627|5236 webster st",
    "legacyObservationKey": "pa-philadelphia|code_violations|48",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045363"
  },
  {
    "groupNumber": 10,
    "rowNumber": 790,
    "distressLeadId": "DL-20260820195144-0900",
    "sourceRecordId": "55",
    "violationNumber": "VI-2026-045395",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|55",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045395"
  },
  {
    "groupNumber": 12,
    "rowNumber": 791,
    "distressLeadId": "DL-20260820195144-4533",
    "sourceRecordId": "48",
    "violationNumber": "VI-2026-045363",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19143-2627|5236 webster st",
    "legacyObservationKey": "pa-philadelphia|code_violations|48",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045363"
  },
  {
    "groupNumber": 11,
    "rowNumber": 792,
    "distressLeadId": "DL-20260820195146-8614",
    "sourceRecordId": "54",
    "violationNumber": "VI-2026-045394",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19125-4508|1145 n delaware ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|54",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045394"
  },
  {
    "groupNumber": 13,
    "rowNumber": 798,
    "distressLeadId": "DL-20260820200844-1545",
    "sourceRecordId": "70",
    "violationNumber": "VI-2026-045383",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19120-1409|329 w godfrey ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|70",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045383"
  },
  {
    "groupNumber": 13,
    "rowNumber": 802,
    "distressLeadId": "DL-20260820200848-6965",
    "sourceRecordId": "70",
    "violationNumber": "VI-2026-045383",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19120-1409|329 w godfrey ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|70",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045383"
  },
  {
    "groupNumber": 14,
    "rowNumber": 1153,
    "distressLeadId": "DL-20260824212659-5326",
    "sourceRecordId": "50",
    "violationNumber": "VI-2026-045575",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-1327|5531 morton st",
    "legacyObservationKey": "pa-philadelphia|code_violations|50",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045575"
  },
  {
    "groupNumber": 15,
    "rowNumber": 1155,
    "distressLeadId": "DL-20260824212701-4164",
    "sourceRecordId": "49",
    "violationNumber": "VI-2026-045574",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-1327|5531 morton st",
    "legacyObservationKey": "pa-philadelphia|code_violations|49",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045574"
  },
  {
    "groupNumber": 16,
    "rowNumber": 1156,
    "distressLeadId": "DL-20260824212702-5857",
    "sourceRecordId": "47",
    "violationNumber": "VI-2026-045362",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2401|8123 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|47",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045362"
  },
  {
    "groupNumber": 14,
    "rowNumber": 1157,
    "distressLeadId": "DL-20260824212703-6068",
    "sourceRecordId": "50",
    "violationNumber": "VI-2026-045575",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-1327|5531 morton st",
    "legacyObservationKey": "pa-philadelphia|code_violations|50",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045575"
  },
  {
    "groupNumber": 16,
    "rowNumber": 1158,
    "distressLeadId": "DL-20260824212718-9530",
    "sourceRecordId": "47",
    "violationNumber": "VI-2026-045362",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19150-2401|8123 forrest ave",
    "legacyObservationKey": "pa-philadelphia|code_violations|47",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045362"
  },
  {
    "groupNumber": 15,
    "rowNumber": 1159,
    "distressLeadId": "DL-20260824212722-1687",
    "sourceRecordId": "49",
    "violationNumber": "VI-2026-045574",
    "parcelId": "",
    "canonicalPropertyKey": "property|address|pa|philadelphia|19144-1327|5531 morton st",
    "legacyObservationKey": "pa-philadelphia|code_violations|49",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-045574"
  },
  {
    "groupNumber": 17,
    "rowNumber": 6035,
    "distressLeadId": "DL-20260903212644-8381",
    "sourceRecordId": "634783",
    "violationNumber": "VI-2026-040430",
    "parcelId": "139816",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|139816",
    "legacyObservationKey": "pa-philadelphia|code_violations|634783",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040430"
  },
  {
    "groupNumber": 18,
    "rowNumber": 6036,
    "distressLeadId": "DL-20260903212646-1299",
    "sourceRecordId": "634784",
    "violationNumber": "VI-2026-040431",
    "parcelId": "139816",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|139816",
    "legacyObservationKey": "pa-philadelphia|code_violations|634784",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040431"
  },
  {
    "groupNumber": 19,
    "rowNumber": 6037,
    "distressLeadId": "DL-20260903212649-1830",
    "sourceRecordId": "634785",
    "violationNumber": "VI-2026-040418",
    "parcelId": "415842",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|415842",
    "legacyObservationKey": "pa-philadelphia|code_violations|634785",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040418"
  },
  {
    "groupNumber": 20,
    "rowNumber": 6038,
    "distressLeadId": "DL-20260903212651-9321",
    "sourceRecordId": "634786",
    "violationNumber": "VI-2026-040419",
    "parcelId": "415842",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|415842",
    "legacyObservationKey": "pa-philadelphia|code_violations|634786",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040419"
  },
  {
    "groupNumber": 21,
    "rowNumber": 6039,
    "distressLeadId": "DL-20260903212652-8644",
    "sourceRecordId": "634787",
    "violationNumber": "VI-2026-040420",
    "parcelId": "156016",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|156016",
    "legacyObservationKey": "pa-philadelphia|code_violations|634787",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040420"
  },
  {
    "groupNumber": 22,
    "rowNumber": 6040,
    "distressLeadId": "DL-20260903212654-5719",
    "sourceRecordId": "634788",
    "violationNumber": "VI-2026-040421",
    "parcelId": "156016",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|156016",
    "legacyObservationKey": "pa-philadelphia|code_violations|634788",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040421"
  },
  {
    "groupNumber": 17,
    "rowNumber": 6041,
    "distressLeadId": "DL-20260903215613-8744",
    "sourceRecordId": "635305",
    "violationNumber": "VI-2026-040430",
    "parcelId": "139816",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|139816",
    "legacyObservationKey": "pa-philadelphia|code_violations|635305",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040430"
  },
  {
    "groupNumber": 18,
    "rowNumber": 6042,
    "distressLeadId": "DL-20260903215616-9645",
    "sourceRecordId": "635306",
    "violationNumber": "VI-2026-040431",
    "parcelId": "139816",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|139816",
    "legacyObservationKey": "pa-philadelphia|code_violations|635306",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040431"
  },
  {
    "groupNumber": 19,
    "rowNumber": 6043,
    "distressLeadId": "DL-20260903215618-6207",
    "sourceRecordId": "635307",
    "violationNumber": "VI-2026-040418",
    "parcelId": "415842",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|415842",
    "legacyObservationKey": "pa-philadelphia|code_violations|635307",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040418"
  },
  {
    "groupNumber": 20,
    "rowNumber": 6044,
    "distressLeadId": "DL-20260903215621-9668",
    "sourceRecordId": "635308",
    "violationNumber": "VI-2026-040419",
    "parcelId": "415842",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|415842",
    "legacyObservationKey": "pa-philadelphia|code_violations|635308",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040419"
  },
  {
    "groupNumber": 21,
    "rowNumber": 6045,
    "distressLeadId": "DL-20260903215623-4250",
    "sourceRecordId": "635309",
    "violationNumber": "VI-2026-040420",
    "parcelId": "156016",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|156016",
    "legacyObservationKey": "pa-philadelphia|code_violations|635309",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040420"
  },
  {
    "groupNumber": 22,
    "rowNumber": 6046,
    "distressLeadId": "DL-20260903215625-7984",
    "sourceRecordId": "635310",
    "violationNumber": "VI-2026-040421",
    "parcelId": "156016",
    "canonicalPropertyKey": "property|parcel|pa|philadelphia|156016",
    "legacyObservationKey": "pa-philadelphia|code_violations|635310",
    "proposedDurableKey": "pa-philadelphia|code_violations|vi-2026-040421"
  }
];

  function records() {
    return RECORDS.map(function (record) {
      return Object.freeze(Object.assign({}, record));
    });
  }

  function metadata() {
    return Object.freeze({
      sourceEvidenceSha256: SOURCE_EVIDENCE_SHA256,
      authoritySha256: AUTHORITY_SHA256,
      groupCount: 22,
      rowCount: 46,
      collapseAuthorityGranted: false,
      winnerSelectionAuthorityGranted: false,
      deleteAuthorityGranted: false,
      productionDataMutationAuthorityGranted: false,
      schedulerAuthorityGranted: false,
      automaticOfferAuthorityGranted: false
    });
  }

  return Object.freeze({
    records: records,
    metadata: metadata
  });
})();
