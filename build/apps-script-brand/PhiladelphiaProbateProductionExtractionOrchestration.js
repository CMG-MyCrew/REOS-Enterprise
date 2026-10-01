/*
 * REOS Philadelphia Probate PB1
 * Production Extraction Orchestration v1
 *
 * IMPORTANT:
 *
 * This module contains the future bounded transport + extraction orchestration
 * surface, but repository presence alone grants no production execution
 * authority.
 *
 * The future RPC may perform one direct HTTP request to one pinned PDF only.
 * It must validate the returned bytes before delegating the SAME in-memory
 * Blob to the separately certified bounded text extractor.
 *
 * No retry, fallback, discovery, parsing, persistence, county mutation,
 * ARV, repair-scope, MAO, or offer authority is granted here.
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

  var MAX_TEXT_CHARS =
    250000;

  function fail_(message) {
    throw new Error(
      'PB1 production extraction orchestration rejected: ' +
      message
    );
  }

  function unsignedByte_(value) {
    value =
      Number(value);

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
        unsignedByte_(
          bytes[i]
        );

      var hex =
        value.toString(16);

      out +=
        hex.length === 1
          ? '0' + hex
          : hex;
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
        .newBlob(
          String(value)
        )
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
      ) !== SOURCE_BASENAME
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
        'publication-date/basename mismatch'
      );
    }
  }

  function assertRuntimeServices_() {
    if (
      typeof UrlFetchApp === 'undefined' ||
      typeof UrlFetchApp.fetch !== 'function'
    ) {
      fail_(
        'UrlFetchApp.fetch unavailable'
      );
    }

    assertDigestService_();

    if (
      !global.REOS ||
      !global.REOS
        .PhiladelphiaProbateBoundedTextExtraction ||
      typeof global.REOS
        .PhiladelphiaProbateBoundedTextExtraction
        .extract !== 'function'
    ) {
      fail_(
        'bounded text extraction component unavailable'
      );
    }
  }

  function contentType_(response) {
    var headers =
      response &&
      typeof response.getAllHeaders === 'function'
        ? response.getAllHeaders()
        : {};

    var value =
      headers['Content-Type'] ||
      headers['content-type'] ||
      '';

    if (
      Object.prototype.toString.call(
        value
      ) === '[object Array]'
    ) {
      value =
        value.length
          ? value[0]
          : '';
    }

    return String(
      value || ''
    ).trim();
  }

  function isPdfContentType_(value) {
    if (!value) {
      return true;
    }

    return (
      value
        .toLowerCase()
        .split(';')[0]
        .trim() ===
      'application/pdf'
    );
  }

  function hasPdfSignature_(bytes) {
    return (
      bytes &&
      typeof bytes.length === 'number' &&
      bytes.length >= 5 &&
      unsignedByte_(bytes[0]) === 0x25 &&
      unsignedByte_(bytes[1]) === 0x50 &&
      unsignedByte_(bytes[2]) === 0x44 &&
      unsignedByte_(bytes[3]) === 0x46 &&
      unsignedByte_(bytes[4]) === 0x2d
    );
  }

  function validateExtractorEvidence_(
    result
  ) {
    if (
      !result ||
      result.ok !== true
    ) {
      fail_(
        'bounded extraction did not return success evidence'
      );
    }

    if (
      result.pdfContentSha256 !==
      EXPECTED_PDF_SHA256
    ) {
      fail_(
        'bounded extraction PDF SHA evidence mismatch'
      );
    }

    if (
      Number(
        result.pdfByteLength
      ) !== EXPECTED_PDF_BYTES
    ) {
      fail_(
        'bounded extraction PDF byte-length evidence mismatch'
      );
    }

    var characterCount =
      Number(
        result.extractedTextCharacterCount
      );

    if (
      !isFinite(characterCount) ||
      characterCount <= 0 ||
      characterCount >
        MAX_TEXT_CHARS
    ) {
      fail_(
        'bounded extraction text-length evidence invalid'
      );
    }

    if (
      Number(
        result.maxExtractedTextCharacters
      ) !== MAX_TEXT_CHARS
    ) {
      fail_(
        'bounded extraction maximum text-length evidence mismatch'
      );
    }

    if (
      typeof result.extractedTextSha256 !==
        'string' ||
      !/^[0-9a-f]{64}$/.test(
        result.extractedTextSha256
      )
    ) {
      fail_(
        'bounded extraction text SHA evidence invalid'
      );
    }

    if (
      result.temporaryArtifactCreated !==
        true ||
      result
        .temporaryArtifactCleanupAttempted !==
        true ||
      result
        .temporaryArtifactCleanupConfirmed !==
        true
    ) {
      fail_(
        'bounded extraction cleanup evidence invalid'
      );
    }

    if (
      Number(
        result.driveCreateCount
      ) !== 1
    ) {
      fail_(
        'bounded extraction Drive create count mismatch'
      );
    }

    if (
      Number(
        result.documentOpenCount
      ) !== 1
    ) {
      fail_(
        'bounded extraction document-open count mismatch'
      );
    }

    if (
      result.fullExtractedTextReturned !==
        false
    ) {
      fail_(
        'bounded extraction returned full extracted text'
      );
    }

    if (
      result.pdfBytesReturned !==
        false
    ) {
      fail_(
        'bounded extraction returned PDF bytes'
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
      'schedulerMutationExecuted',
      'triggerMutationExecuted',
      'checkpointMutationExecuted',
      'countyDataMutationExecuted',
      'arvAuthorityGranted',
      'repairScopeAuthorityGranted',
      'maoAuthorityGranted',
      'offerAuthorityGranted'
    ];

    falseFlags.forEach(
      function (name) {
        if (
          result[name] !==
          false
        ) {
          fail_(
            'bounded extraction unsafe evidence flag: ' +
            name
          );
        }
      }
    );

    return result;
  }

  function execute_() {
    /*
     * Runtime services and the extractor must exist before the one
     * transport attempt is consumed.
     */
    validatePinnedSource_();
    assertRuntimeServices_();

    var httpFetchCount = 0;
    var extractionCount = 0;

    /*
     * SINGLE TRANSPORT AUTHORITY.
     *
     * There is intentionally exactly one executable UrlFetchApp.fetch
     * call site in this module.
     */
    httpFetchCount += 1;

    var response =
      UrlFetchApp.fetch(
        SOURCE_URL,
        {
          method: 'get',
          followRedirects: false,
          muteHttpExceptions: true,
          headers: {
            Accept:
              'application/pdf'
          }
        }
      );

    if (
      httpFetchCount !== 1
    ) {
      fail_(
        'HTTP fetch count invariant failed'
      );
    }

    if (
      !response ||
      typeof response.getResponseCode !==
        'function' ||
      typeof response.getBlob !==
        'function'
    ) {
      fail_(
        'HTTP response surface invalid'
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
        'HTTP status ' +
        status
      );
    }

    var blob =
      response.getBlob();

    if (
      !blob ||
      typeof blob.getBytes !==
        'function'
    ) {
      fail_(
        'HTTP response Blob unavailable'
      );
    }

    /*
     * SAME-RESPONSE IN-MEMORY HANDOFF.
     *
     * The exact Blob validated below is the Blob passed to the
     * bounded extractor. No second transport operation exists.
     */
    var bytes =
      blob.getBytes();

    if (
      !bytes ||
      typeof bytes.length !==
        'number' ||
      bytes.length === 0
    ) {
      fail_(
        'empty response body'
      );
    }

    if (
      bytes.length >
      MAX_PDF_BYTES
    ) {
      fail_(
        'response exceeds maximum PDF size'
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

    if (
      !hasPdfSignature_(
        bytes
      )
    ) {
      fail_(
        'invalid PDF signature'
      );
    }

    var contentType =
      contentType_(
        response
      );

    if (
      !isPdfContentType_(
        contentType
      )
    ) {
      fail_(
        'non-PDF Content-Type'
      );
    }

    var pdfContentSha256 =
      sha256Hex_(
        bytes
      );

    if (
      pdfContentSha256 !==
      EXPECTED_PDF_SHA256
    ) {
      fail_(
        'PDF content SHA-256 mismatch'
      );
    }

    extractionCount += 1;

    /*
     * SINGLE EXTRACTION AUTHORITY.
     *
     * OCR/Drive services remain encapsulated inside the already
     * certified bounded extractor. This orchestrator does not invoke
     * those services directly.
     */
    var extraction =
      global.REOS
        .PhiladelphiaProbateBoundedTextExtraction
        .extract(
          blob
        );

    if (
      extractionCount !== 1
    ) {
      fail_(
        'extractor invocation count invariant failed'
      );
    }

    extraction =
      validateExtractorEvidence_(
        extraction
      );

    return {
      ok: true,
      orchestrationVersion: 1,

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
        httpFetchCount,

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
        pdfContentSha256,

      extractionExecuted:
        true,

      extractionCount:
        extractionCount,

      extractedTextCharacterCount:
        extraction
          .extractedTextCharacterCount,

      maxExtractedTextCharacters:
        MAX_TEXT_CHARS,

      extractedTextSha256:
        extraction
          .extractedTextSha256,

      temporaryArtifactCreated:
        extraction
          .temporaryArtifactCreated,

      temporaryArtifactCleanupAttempted:
        extraction
          .temporaryArtifactCleanupAttempted,

      temporaryArtifactCleanupConfirmed:
        extraction
          .temporaryArtifactCleanupConfirmed,

      driveCreateCount:
        extraction
          .driveCreateCount,

      documentOpenCount:
        extraction
          .documentOpenCount,

      fullExtractedTextReturned:
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

  global
    .reosPhiladelphiaProbateProductionExtractionOrchestration =
      function () {
        return execute_();
      };

  global.REOS =
    global.REOS || {};

  global.REOS
    .PhiladelphiaProbateProductionExtractionOrchestration =
      {
        orchestrationVersion: 1,

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

        maxExtractedTextCharacters:
          MAX_TEXT_CHARS,

        execute:
          execute_
      };
})(this);
