/**
 * REOS Enterprise v3.0
 *
 * Philadelphia Probate PB1 bounded source discovery RPC.
 *
 * This wrapper delegates only to the already bounded PB1 resolver.
 * It grants no downstream PDF, OCR, persistence, configuration,
 * scheduler, county mutation, ARV, repair-scope, MAO, or offer
 * authority.
 */
function reosPhiladelphiaProbateBoundedSourceDiscovery() {
  if (
    typeof REOS === 'undefined' ||
    !REOS ||
    !REOS.PhiladelphiaProbateRecurringSource
  ) {
    throw new Error(
      'Philadelphia probate PB1 recurring source is unavailable.'
    );
  }

  var source =
    REOS.PhiladelphiaProbateRecurringSource;

  if (
    typeof source.resolve !== 'function' ||
    typeof source.approvedSourceUrl !== 'function'
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery functions are unavailable.'
    );
  }

  if (
    source.cursorPrefix !== 'PB1' ||
    source.cursorDomainId !==
      'PHL-PROBATE-PB1-V1' ||
    Number(source.maxLookbackDays) !== 10 ||
    Number(source.noticePageSize) !== 25
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery contract mismatch.'
    );
  }

  var result =
    source.resolve(
      '',
      new Date()
    );

  if (
    !result ||
    result.ok !== true ||
    result.cursorDomainId !==
      'PHL-PROBATE-PB1-V1' ||
    Number(result.noticeOffset) !== 0 ||
    Number(result.noticePageSize) !== 25 ||
    result.continuation !== false
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery result violated its bounded contract.'
    );
  }

  var publicationDate =
    String(
      result.publicationDate || ''
    ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/
      .test(publicationDate)
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery publication date is invalid.'
    );
  }

  var sourceUrl =
    String(
      result.sourceUrl || ''
    ).trim();

  if (
    source.approvedSourceUrl(
      sourceUrl
    ) !== true
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery returned an unapproved source URL.'
    );
  }

  var parts =
    publicationDate.split('-');

  var expectedBasename =
    (
      'tlipn' +
      parts[1] +
      parts[2] +
      parts[0].slice(2) +
      '.pdf'
    ).toLowerCase();

  if (
    sourceUrl
      .toLowerCase()
      .indexOf(expectedBasename) === -1
  ) {
    throw new Error(
      'Philadelphia probate PB1 source URL is not bound to its publication date.'
    );
  }

  var articleUrl =
    String(
      result.articleUrl || ''
    ).trim();

  if (
    !/^https:\/\/www\.law\.com\/thelegalintelligencer\//i
      .test(articleUrl)
  ) {
    throw new Error(
      'Philadelphia probate PB1 discovery returned an unexpected article URL.'
    );
  }

  var sourceSha256 =
    String(
      result.sourceSha256 || ''
    ).trim();

  if (
    !/^[a-f0-9]{64}$/i
      .test(sourceSha256)
  ) {
    throw new Error(
      'Philadelphia probate PB1 source hash is invalid.'
    );
  }

  return {
    ok: true,
    discoveryVersion: 1,

    cursorDomainId:
      result.cursorDomainId,

    publicationDate:
      publicationDate,

    articleUrl:
      articleUrl,

    sourceUrl:
      sourceUrl,

    sourceSha256:
      sourceSha256,

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
}
