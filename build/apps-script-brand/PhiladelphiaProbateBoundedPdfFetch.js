(function (global) {
  'use strict';

  var SOURCE_URL =
    'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

  var SOURCE_URL_SHA256 =
    '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

  var PUBLICATION_DATE = '2026-09-30';
  var SOURCE_HOST = 'assets.alm.com';
  var SOURCE_BASENAME = 'tlipn093026.pdf';

  // Post-response validation limit. UrlFetchApp receives the response
  // before this byte-length boundary can be enforced.
  var MAX_RESPONSE_BYTES = 26214400; // 25 MiB

  function fail_(message) {
    throw new Error(
      'PB1 bounded PDF fetch rejected: ' + message
    );
  }

  function sha256Hex_(bytes) {
    var digest = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      bytes
    );

    return digest.map(function (value) {
      var unsigned = value < 0 ? value + 256 : value;
      return ('0' + unsigned.toString(16)).slice(-2);
    }).join('');
  }

  function sha256StringHex_(value) {
    return sha256Hex_(
      Utilities.newBlob(value).getBytes()
    );
  }

  function validatePinnedSource_() {
    if (
      sha256StringHex_(SOURCE_URL) !==
      SOURCE_URL_SHA256
    ) {
      fail_('source URL SHA-256 mismatch');
    }

    if (
      SOURCE_URL.indexOf(
        'https://' + SOURCE_HOST + '/'
      ) !== 0
    ) {
      fail_('source URL host/scheme mismatch');
    }

    if (
      SOURCE_URL.slice(
        SOURCE_URL.length - SOURCE_BASENAME.length
      ) !== SOURCE_BASENAME
    ) {
      fail_('source basename mismatch');
    }

    var parts = PUBLICATION_DATE.split('-');

    if (
      SOURCE_BASENAME !==
      'tlipn' +
        parts[1] +
        parts[2] +
        parts[0].slice(2) +
        '.pdf'
    ) {
      fail_('publication-date/basename mismatch');
    }
  }

  function contentType_(response) {
    var headers = response.getAllHeaders
      ? response.getAllHeaders()
      : {};

    var value =
      headers['Content-Type'] ||
      headers['content-type'] ||
      '';

    if (Array.isArray(value)) {
      value = value.length ? value[0] : '';
    }

    return String(value || '').trim();
  }

  function isPdfContentType_(value) {
    if (!value) {
      return true;
    }

    return (
      value.toLowerCase().split(';')[0].trim() ===
      'application/pdf'
    );
  }

  function hasPdfSignature_(bytes) {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }

  function execute_() {
    validatePinnedSource_();

    var fetchCount = 0;

    fetchCount += 1;

    var response = UrlFetchApp.fetch(
      SOURCE_URL,
      {
        method: 'get',
        followRedirects: false,
        muteHttpExceptions: true,
        headers: {
          Accept: 'application/pdf'
        }
      }
    );

    if (fetchCount !== 1) {
      fail_('HTTP fetch count invariant failed');
    }

    var status = response.getResponseCode();

    if (status < 200 || status >= 300) {
      fail_('HTTP status ' + status);
    }

    var blob = response.getBlob();
    var bytes = blob.getBytes();

    if (!bytes || bytes.length === 0) {
      fail_('empty response body');
    }

    if (bytes.length > MAX_RESPONSE_BYTES) {
      fail_('response exceeds maximum byte count');
    }

    if (!hasPdfSignature_(bytes)) {
      fail_('invalid PDF signature');
    }

    var contentType = contentType_(response);

    if (!isPdfContentType_(contentType)) {
      fail_('non-PDF Content-Type');
    }

    var contentSha256 = sha256Hex_(bytes);

    return {
      ok: true,
      fetchVersion: 1,

      publicationDate: PUBLICATION_DATE,
      sourceUrl: SOURCE_URL,
      sourceUrlSha256: SOURCE_URL_SHA256,
      sourceHost: SOURCE_HOST,
      sourceBasename: SOURCE_BASENAME,

      maxResponseBytes: MAX_RESPONSE_BYTES,
      responseSizeLimitIsPostFetch: true,

      httpFetchExecuted: true,
      httpFetchCount: fetchCount,
      httpStatus: status,
      contentType: contentType,
      contentLength: bytes.length,

      pdfSignatureValid: true,
      pdfContentSha256: contentSha256,
      pdfBytesReturned: false,

      driveOcrExecuted: false,
      documentAppExecuted: false,
      connectorFetchExecuted: false,
      connectorRegistrationExecuted: false,
      sourceDiscoveryExecuted: false,
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

  global.reosPhiladelphiaProbateBoundedPdfFetch =
    function () {
      return execute_();
    };

  if (typeof REOS !== 'undefined') {
    REOS.PhiladelphiaProbateBoundedPdfFetch = {
      execute: execute_,
      sourceUrl: SOURCE_URL,
      sourceUrlSha256: SOURCE_URL_SHA256,
      publicationDate: PUBLICATION_DATE,
      sourceBasename: SOURCE_BASENAME,
      maxResponseBytes: MAX_RESPONSE_BYTES
    };
  }
})(this);
