/*
 * REOS Philadelphia Probate PB1
 * Production Oversize Text Evidence Recovery v1
 *
 * Future evidence-only recovery surface.
 * Repository presence grants no execution authority.
 */

(function (global) {
  'use strict';

  var SOURCE_URL =
    'https://assets.alm.com/fb/c6/fe47319a42efa3d6c4c8c8159472/tlipn093026.pdf';

  var SOURCE_URL_SHA256 =
    '98895284687b6a6c00959af47a40c7cf7f5da324d356e731c36f6a42a130a7ca';

  var PUBLICATION_DATE =
    '2026-09-30';

  var SOURCE_HOST =
    'assets.alm.com';

  var SOURCE_BASENAME =
    'tlipn093026.pdf';

  var EXPECTED_PDF_BYTES =
    4220387;

  var EXPECTED_PDF_SHA256 =
    '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

  var MAX_PDF_BYTES =
    26214400;

  var CURRENT_NORMAL_EXTRACTION_LIMIT =
    250000;

  function fail_(message) {
    throw new Error(
      'PB1 oversize text evidence recovery rejected: ' +
      message
    );
  }

  function unsignedByte_(value) {
    value = Number(value);

    if (value < 0) {
      value += 256;
    }

    return value;
  }

  function hex_(bytes) {
    var out = '';

    for (
      var i = 0;
      i < bytes.length;
      i += 1
    ) {
      var value =
        unsignedByte_(bytes[i]);

      var item =
        value.toString(16);

      out +=
        item.length === 1
          ? '0' + item
          : item;
    }

    return out;
  }

  function assertDigestService_() {
    if (
      typeof Utilities === 'undefined' ||
      typeof Utilities.computeDigest !== 'function' ||
      typeof Utilities.newBlob !== 'function' ||
      !Utilities.DigestAlgorithm ||
      !Utilities.DigestAlgorithm.SHA_256
    ) {
      fail_(
        'SHA-256 runtime service unavailable'
      );
    }
  }

  function sha256Hex_(bytes) {
    assertDigestService_();

    return hex_(
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        bytes
      )
    );
  }

  function sha256StringHex_(value) {
    return sha256Hex_(
      Utilities
        .newBlob(String(value))
        .getBytes()
    );
  }

  function validatePinnedSource_() {
    if (
      sha256StringHex_(SOURCE_URL) !==
      SOURCE_URL_SHA256
    ) {
      fail_(
        'source URL SHA-256 mismatch'
      );
    }

    if (
      SOURCE_URL.indexOf(
        'https://' +
        SOURCE_HOST +
        '/'
      ) !== 0
    ) {
      fail_(
        'source URL host/scheme mismatch'
      );
    }

    if (
      SOURCE_URL.slice(
        SOURCE_URL.length -
        SOURCE_BASENAME.length
      ) !==
      SOURCE_BASENAME
    ) {
      fail_(
        'source basename mismatch'
      );
    }

    var parts =
      PUBLICATION_DATE.split('-');

    var expectedBasename =
      'tlipn' +
      parts[1] +
      parts[2] +
      parts[0].slice(2) +
      '.pdf';

    if (
      SOURCE_BASENAME !==
      expectedBasename
    ) {
      fail_(
        'publication-date/source-basename mismatch'
      );
    }
  }

  function assertRuntimeServices_() {
    if (
      typeof UrlFetchApp === 'undefined' ||
      typeof UrlFetchApp.fetch !== 'function'
    ) {
      fail_(
        'UrlFetchApp runtime service unavailable'
      );
    }

    assertDigestService_();

    if (
      !global.REOS ||
      !global.REOS
        .PhiladelphiaProbateBoundedOversizeTextEvidence ||
      typeof global.REOS
        .PhiladelphiaProbateBoundedOversizeTextEvidence
        .inspect !== 'function'
    ) {
      fail_(
        'bounded oversize text evidence component unavailable'
      );
    }
  }

  function bytesFromBlob_(blob) {
    if (
      !blob ||
      typeof blob.getBytes !== 'function'
    ) {
      fail_(
        'response Blob unavailable'
      );
    }

    var bytes =
      blob.getBytes();

    if (
      !bytes ||
      typeof bytes.length !== 'number'
    ) {
      fail_(
        'response PDF bytes unavailable'
      );
    }

    return bytes;
  }

  function assertPdfSignature_(bytes) {
    var signature = [
      0x25,
      0x50,
      0x44,
      0x46,
      0x2d
    ];

    if (bytes.length < signature.length) {
      fail_(
        'invalid PDF signature'
      );
    }

    for (
      var i = 0;
      i < signature.length;
      i += 1
    ) {
      if (
        unsignedByte_(bytes[i]) !==
        signature[i]
      ) {
        fail_(
          'invalid PDF signature'
        );
      }
    }
  }

  function contentType_(response) {
    if (
      !response ||
      typeof response.getAllHeaders !== 'function'
    ) {
      return '';
    }

    var headers =
      response.getAllHeaders() ||
      {};

    return String(
      headers['Content-Type'] ||
      headers['content-type'] ||
      ''
    );
  }

  function assertEvidence_(value) {
    if (
      !value ||
      value.ok !== true
    ) {
      fail_(
        'oversize evidence result was not successful'
      );
    }

    if (value.evidenceVersion !== 1) {
      fail_(
        'oversize evidence version mismatch'
      );
    }

    if (
      value.pdfContentSha256 !==
      EXPECTED_PDF_SHA256
    ) {
      fail_(
        'oversize evidence PDF SHA-256 mismatch'
      );
    }

    if (
      Number(value.pdfByteLength) !==
      EXPECTED_PDF_BYTES
    ) {
      fail_(
        'oversize evidence PDF byte length mismatch'
      );
    }

    if (
      Number(value.maxPdfBytes) !==
      MAX_PDF_BYTES
    ) {
      fail_(
        'oversize evidence maximum PDF size mismatch'
      );
    }

    if (
      Number(
        value.currentNormalExtractionLimit
      ) !==
      CURRENT_NORMAL_EXTRACTION_LIMIT
    ) {
      fail_(
        'normal extraction limit metadata mismatch'
      );
    }

    var observedCount =
      Number(
        value.observedTextCharacterCount
      );

    if (
      !isFinite(observedCount) ||
      observedCount <=
      CURRENT_NORMAL_EXTRACTION_LIMIT
    ) {
      fail_(
        'observed text count is not oversize'
      );
    }

    if (
      typeof value.observedTextSha256 !== 'string' ||
      !/^[0-9a-f]{64}$/.test(
        value.observedTextSha256
      )
    ) {
      fail_(
        'observed text SHA-256 is invalid'
      );
    }

    if (
      value.exceedsCurrentNormalExtractionLimit !==
      true
    ) {
      fail_(
        'oversize evidence flag mismatch'
      );
    }

    if (
      value.acceptedForNormalExtraction !==
      false
    ) {
      fail_(
        'oversize text was incorrectly accepted for normal extraction'
      );
    }

    if (
      value.temporaryArtifactCreated !== true ||
      value.temporaryArtifactCleanupAttempted !== true ||
      value.temporaryArtifactCleanupConfirmed !== true
    ) {
      fail_(
        'temporary artifact cleanup evidence incomplete'
      );
    }

    if (
      Number(value.driveCreateCount) !== 1 ||
      Number(value.documentOpenCount) !== 1 ||
      Number(value.textReadCount) !== 1
    ) {
      fail_(
        'OCR evidence operation counts mismatch'
      );
    }

    if (
      value.fullExtractedTextReturned !== false ||
      value.textPreviewReturned !== false ||
      value.pdfBytesReturned !== false
    ) {
      fail_(
        'prohibited content-return evidence detected'
      );
    }

    var falseFlags = [
      'sourceDiscoveryExecuted',
      'httpFetchExecuted',
      'connectorFetchExecuted',
      'connectorRegistrationExecuted',
      'probateParsingExecuted',
      'leadCreationExecuted',
      'persistenceExecuted',
      'configurationExecuted',
      'schedulerInspectionExecuted',
      'schedulerMutationExecuted',
      'triggerMutationExecuted',
      'checkpointMutationExecuted',
      'countyDataMutationExecuted',
      'arvAuthorityGranted',
      'repairScopeAuthorityGranted',
      'maoAuthorityGranted',
      'offerAuthorityGranted'
    ];

    for (
      var i = 0;
      i < falseFlags.length;
      i += 1
    ) {
      if (
        value[falseFlags[i]] !==
        false
      ) {
        fail_(
          'unsafe oversize evidence flag: ' +
          falseFlags[i]
        );
      }
    }

    return {
      observedCount:
        observedCount,

      observedSha:
        value.observedTextSha256
    };
  }

  function execute_() {
    validatePinnedSource_();
    assertRuntimeServices_();

    var fetchCount = 0;

    var response =
      UrlFetchApp.fetch(
        SOURCE_URL,
        {
          method: 'get',

          followRedirects:
            false,

          muteHttpExceptions:
            true,

          headers: {
            Accept:
              'application/pdf'
          }
        }
      );

    fetchCount += 1;

    if (
      !response ||
      typeof response.getResponseCode !== 'function'
    ) {
      fail_(
        'HTTP response surface unavailable'
      );
    }

    var status =
      Number(
        response.getResponseCode()
      );

    if (
      status < 200 ||
      status >= 300
    ) {
      fail_(
        'HTTP status was not 2xx'
      );
    }

    if (
      typeof response.getBlob !== 'function'
    ) {
      fail_(
        'HTTP response Blob surface unavailable'
      );
    }

    var blob =
      response.getBlob();

    var bytes =
      bytesFromBlob_(blob);

    if (!bytes.length) {
      fail_(
        'response PDF body was empty'
      );
    }

    if (bytes.length > MAX_PDF_BYTES) {
      fail_(
        'response PDF exceeds maximum size'
      );
    }

    if (
      bytes.length !==
      EXPECTED_PDF_BYTES
    ) {
      fail_(
        'response PDF byte length mismatch'
      );
    }

    assertPdfSignature_(bytes);

    var contentType =
      contentType_(response);

    if (
      contentType &&
      contentType
        .toLowerCase()
        .split(';')[0]
        .trim() !==
        'application/pdf'
    ) {
      fail_(
        'response had non-PDF Content-Type'
      );
    }

    var pdfSha =
      sha256Hex_(bytes);

    if (
      pdfSha !==
      EXPECTED_PDF_SHA256
    ) {
      fail_(
        'PDF content SHA-256 mismatch'
      );
    }

    if (fetchCount !== 1) {
      fail_(
        'HTTP fetch count mismatch'
      );
    }

    var evidence =
      global.REOS
        .PhiladelphiaProbateBoundedOversizeTextEvidence
        .inspect(blob);

    var measured =
      assertEvidence_(evidence);

    return {
      ok: true,
      recoveryVersion: 1,

      publicationDate:
        PUBLICATION_DATE,

      sourceUrl:
        SOURCE_URL,

      sourceUrlSha256:
        SOURCE_URL_SHA256,

      sourceHost:
        SOURCE_HOST,

      sourceBasename:
        SOURCE_BASENAME,

      httpFetchExecuted:
        true,

      httpFetchCount:
        1,

      httpStatus:
        status,

      contentType:
        contentType,

      pdfByteLength:
        bytes.length,

      maxPdfBytes:
        MAX_PDF_BYTES,

      pdfSignatureValid:
        true,

      pdfContentSha256:
        pdfSha,

      evidenceExecuted:
        true,

      evidenceCount:
        1,

      currentNormalExtractionLimit:
        CURRENT_NORMAL_EXTRACTION_LIMIT,

      observedTextCharacterCount:
        measured.observedCount,

      observedTextSha256:
        measured.observedSha,

      exceedsCurrentNormalExtractionLimit:
        true,

      acceptedForNormalExtraction:
        false,

      temporaryArtifactCreated:
        true,

      temporaryArtifactCleanupAttempted:
        true,

      temporaryArtifactCleanupConfirmed:
        true,

      driveCreateCount:
        1,

      documentOpenCount:
        1,

      textReadCount:
        1,

      fullExtractedTextReturned:
        false,

      textPreviewReturned:
        false,

      pdfBytesReturned:
        false,

      sourceDiscoveryExecuted:
        false,

      connectorFetchExecuted:
        false,

      connectorRegistrationExecuted:
        false,

      probateParsingExecuted:
        false,

      leadCreationExecuted:
        false,

      persistenceExecuted:
        false,

      configurationExecuted:
        false,

      schedulerInspectionExecuted:
        false,

      schedulerMutationExecuted:
        false,

      triggerMutationExecuted:
        false,

      checkpointMutationExecuted:
        false,

      countyDataMutationExecuted:
        false,

      arvAuthorityGranted:
        false,

      repairScopeAuthorityGranted:
        false,

      maoAuthorityGranted:
        false,

      offerAuthorityGranted:
        false
    };
  }

  global.REOS =
    global.REOS ||
    {};

  global.REOS
    .PhiladelphiaProbateProductionOversizeTextEvidenceRecovery = {
      recoveryVersion: 1,

      publicationDate:
        PUBLICATION_DATE,

      sourceUrl:
        SOURCE_URL,

      sourceUrlSha256:
        SOURCE_URL_SHA256,

      sourceBasename:
        SOURCE_BASENAME,

      expectedPdfBytes:
        EXPECTED_PDF_BYTES,

      expectedPdfSha256:
        EXPECTED_PDF_SHA256,

      maxPdfBytes:
        MAX_PDF_BYTES,

      currentNormalExtractionLimit:
        CURRENT_NORMAL_EXTRACTION_LIMIT,

      execute:
        execute_
    };

  global
    .reosPhiladelphiaProbateProductionOversizeTextEvidenceRecovery =
      function () {
        return execute_();
      };
})(this);
