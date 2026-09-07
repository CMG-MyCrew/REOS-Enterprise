/**
 * REOS Enterprise
 * Code Violations Gate 1 Certified Population Authority
 *
 * Immutable durable membership authority for the original certified
 * 168-row Gate-1 historical recovery cohort.
 *
 * ArcGIS ObjectID is evidence only and is NOT cohort membership authority.
 */
var REOS = REOS || {};

REOS.CountyCodeViolationGate1PopulationAuthority =
(function () {
  'use strict';

  var MANIFEST_SHA256 =
    'ebc0936a9fc3b4a5643e8a834ab7c068d2b1d2f15335b2fe9f365fe1e24a6b13';

  var SOURCE_EVIDENCE_SHA256 =
    '5958a94f9fa2b571b32cb4dd9dc43476b8877a59f37ebdd4c697faf033b445b3';

  var VIOLATION_NUMBERS =
    ["VI-2026-041180","VI-2026-041181","VI-2026-041182","VI-2026-041183","VI-2026-041184","VI-2026-041194","VI-2026-041195","VI-2026-041335","VI-2026-041336","VI-2026-041370","VI-2026-041371","VI-2026-041461","VI-2026-041462","VI-2026-041463","VI-2026-041464","VI-2026-041484","VI-2026-041485","VI-2026-041600","VI-2026-041591","VI-2026-041592","VI-2026-041601","VI-2026-041611","VI-2026-041612","VI-2026-041740","VI-2026-041741","VI-2026-041742","VI-2026-041783","VI-2026-041784","VI-2026-041785","VI-2026-041786","VI-2026-041816","VI-2026-041817","VI-2026-041945","VI-2026-041946","VI-2026-041947","VI-2026-041948","VI-2026-042012","VI-2026-042013","VI-2026-042014","VI-2026-042015","VI-2026-042016","VI-2026-042227","VI-2026-042228","VI-2026-042229","VI-2026-042231","VI-2026-042232","VI-2026-042265","VI-2026-042266","VI-2026-042427","VI-2026-042428","VI-2026-042429","VI-2026-042592","VI-2026-042593","VI-2026-042594","VI-2026-042595","VI-2026-042655","VI-2026-042233","VI-2026-042234","VI-2026-042235","VI-2026-042236","VI-2026-042237","VI-2026-042371","VI-2026-042372","VI-2026-042599","VI-2026-042600","VI-2026-042601","VI-2026-042652","VI-2026-042653","VI-2026-042793","VI-2026-042794","VI-2026-042801","VI-2026-042802","VI-2026-043159","VI-2026-043160","VI-2026-043161","VI-2026-043162","VI-2026-043163","VI-2026-042916","VI-2026-042917","VI-2026-043003","VI-2026-043004","VI-2026-043177","VI-2026-043178","VI-2026-043179","VI-2026-043201","VI-2026-043202","VI-2026-043270","VI-2026-043271","VI-2026-043340","VI-2026-043341","VI-2026-043342","VI-2026-043343","VI-2026-043344","VI-2026-043345","VI-2026-043346","VI-2026-043348","VI-2026-043349","VI-2026-043350","VI-2026-043352","VI-2026-043353","VI-2026-043354","VI-2026-043373","VI-2026-043374","VI-2026-043375","VI-2026-043388","VI-2026-043389","VI-2026-043390","VI-2026-043391","VI-2026-043392","VI-2026-043393","VI-2026-043402","VI-2026-043403","VI-2026-043404","VI-2026-043405","VI-2026-043408","VI-2026-043409","VI-2026-043410","VI-2026-043424","VI-2026-043425","VI-2026-043426","VI-2026-043427","VI-2026-043662","VI-2026-043663","VI-2026-043664","VI-2026-043887","VI-2026-043888","VI-2026-044320","VI-2026-044321","VI-2026-044322","VI-2026-044323","VI-2026-044354","VI-2026-044355","VI-2026-044356","VI-2026-044056","VI-2026-044057","VI-2026-044058","VI-2026-044059","VI-2026-044568","VI-2026-044569","VI-2026-044576","VI-2026-044577","VI-2026-044593","VI-2026-044594","VI-2026-044595","VI-2026-044596","VI-2026-044601","VI-2026-044602","VI-2026-044603","VI-2026-044655","VI-2026-044656","VI-2026-044738","VI-2026-044739","VI-2026-044869","VI-2026-044870","VI-2026-044871","VI-2026-044872","VI-2026-045123","VI-2026-045124","VI-2026-045148","VI-2026-045149","VI-2026-045212","VI-2026-045213","VI-2026-045214","VI-2026-045215","VI-2026-045277","VI-2026-045318","VI-2026-045319","VI-2026-045320"];

  var INDEX = {};

  VIOLATION_NUMBERS.forEach(
    function (value) {
      INDEX[value] = true;
    }
  );

  function metadata() {
    return {
      mode:
        'READ_ONLY_GATE1_CERTIFIED_POPULATION_AUTHORITY',

      connectorId:
        'PA-PHILADELPHIA',

      dataset:
        'code_violations',

      populationCount:
        VIOLATION_NUMBERS.length,

      openActionableCount:
        153,

      nonOpenCount:
        15,

      durableIdentityField:
        'Violation Number',

      objectIdIsMembershipAuthority:
        false,

      manifestSha256:
        MANIFEST_SHA256,

      sourceEvidenceSha256:
        SOURCE_EVIDENCE_SHA256,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      checkpointAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      migrationAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function contains(violationNumber) {
    return !!INDEX[
      String(
        violationNumber === undefined ||
        violationNumber === null
          ? ''
          : violationNumber
      )
        .trim()
        .toUpperCase()
    ];
  }

  function violationNumbers() {
    return VIOLATION_NUMBERS.slice();
  }

  return {
    metadata:
      metadata,

    contains:
      contains,

    violationNumbers:
      violationNumbers
  };
})();
