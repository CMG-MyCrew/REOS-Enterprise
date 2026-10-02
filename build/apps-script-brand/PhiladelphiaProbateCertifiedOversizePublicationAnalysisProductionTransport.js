/*
 * REOS Philadelphia Probate PB1
 * Certified Oversize Analysis Production Transport v1
 *
 * One pinned PDF transport attempt -> exact response identity validation ->
 * exactly one invocation of the already-certified oversize analysis runtime.
 *
 * No source discovery.
 * No retry.
 * No fallback.
 * No direct Drive/OCR authority.
 * No OPA/property reconciliation.
 * No lead creation.
 * No persistence.
 * No scheduler/cursor mutation.
 * No county mutation.
 * No ARV / repair-scope / MAO / offer authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport =
  (function () {
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

    var ANALYSIS_VERSION =
      1;

    var EXPECTED_PDF_BYTES =
      4220387;

    var EXPECTED_PDF_SHA256 =
      '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

    var MAX_PDF_BYTES =
      26214400;

    var CURRENT_NORMAL_EXTRACTION_LIMIT =
      250000;

    var CERTIFIED_OVERSIZE_TEXT_LIMIT =
      600000;

    var EXPECTED_TEXT_CHARACTER_COUNT =
      566435;

    var EXPECTED_TEXT_SHA256 =
      '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

    var NOTICE_PAGE_SIZE =
      25;

    var REPRESENTATIVE_TEXT_LIMIT =
      500;

    var CURSOR_DOMAIN =
      'PHL-PROBATE-PB1-V1';

    function fail_(message) {
      throw new Error(
        'PB1 certified oversize analysis production transport rejected: ' +
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
      var out =
        '';

      for (
        var i = 0;
        i < bytes.length;
        i += 1
      ) {
        var value =
          unsignedByte_(
            bytes[i]
          );

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
          .newBlob(
            String(value)
          )
          .getBytes()
      );
    }

    function assertNoticeOffset_(value) {
      var offset =
        Number(value);

      if (
        !Number.isInteger(offset) ||
        offset < 0
      ) {
        fail_(
          'notice offset is invalid'
        );
      }

      return offset;
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

    function assertAnalysisSurface_() {
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
        !REOS ||
        !REOS
          .PhiladelphiaProbateCertifiedOversizePublicationAnalysis
      ) {
        fail_(
          'certified oversize publication analysis is not loaded'
        );
      }

      var analysis =
        REOS
          .PhiladelphiaProbateCertifiedOversizePublicationAnalysis;

      var exact = [
        [
          analysis.analysisVersion,
          ANALYSIS_VERSION,
          'analysis version mismatch'
        ],
        [
          analysis.expectedPublicationDate,
          PUBLICATION_DATE,
          'publication date metadata mismatch'
        ],
        [
          analysis.expectedPdfBytes,
          EXPECTED_PDF_BYTES,
          'PDF byte-length metadata mismatch'
        ],
        [
          analysis.expectedPdfSha256,
          EXPECTED_PDF_SHA256,
          'PDF SHA-256 metadata mismatch'
        ],
        [
          analysis.maxPdfBytes,
          MAX_PDF_BYTES,
          'maximum PDF size metadata mismatch'
        ],
        [
          analysis.currentNormalExtractionLimit,
          CURRENT_NORMAL_EXTRACTION_LIMIT,
          'normal extraction limit metadata mismatch'
        ],
        [
          analysis.certifiedOversizeTextLimit,
          CERTIFIED_OVERSIZE_TEXT_LIMIT,
          'oversize text limit metadata mismatch'
        ],
        [
          analysis.expectedTextCharacterCount,
          EXPECTED_TEXT_CHARACTER_COUNT,
          'expected text character-count metadata mismatch'
        ],
        [
          analysis.expectedTextSha256,
          EXPECTED_TEXT_SHA256,
          'expected text SHA-256 metadata mismatch'
        ],
        [
          analysis.noticePageSize,
          NOTICE_PAGE_SIZE,
          'notice page-size metadata mismatch'
        ],
        [
          analysis.representativeTextLimit,
          REPRESENTATIVE_TEXT_LIMIT,
          'representative text-limit metadata mismatch'
        ],
        [
          analysis.cursorDomain,
          CURSOR_DOMAIN,
          'cursor-domain metadata mismatch'
        ]
      ];

      exact.forEach(
        function (item) {
          if (
            item[0] !==
            item[1]
          ) {
            fail_(
              item[2]
            );
          }
        }
      );

      if (
        typeof analysis.analyze !==
        'function'
      ) {
        fail_(
          'analysis symbol is not loaded'
        );
      }

      return analysis;
    }

    function contentType_(response) {
      var headers =
        response &&
        typeof response.getAllHeaders ===
          'function'
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
        value ||
        ''
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
        typeof bytes.length ===
          'number' &&
        bytes.length >= 5 &&
        unsignedByte_(bytes[0]) ===
          0x25 &&
        unsignedByte_(bytes[1]) ===
          0x50 &&
        unsignedByte_(bytes[2]) ===
          0x44 &&
        unsignedByte_(bytes[3]) ===
          0x46 &&
        unsignedByte_(bytes[4]) ===
          0x2d
      );
    }

    function assertFalse_(
      result,
      name
    ) {
      if (
        result[name] !==
        false
      ) {
        fail_(
          'unsafe analysis evidence flag: ' +
          name
        );
      }
    }

    function validateAnalysisEvidence_(
      result,
      noticeOffset
    ) {
      if (
        !result ||
        result.ok !== true
      ) {
        fail_(
          'certified analysis did not return success evidence'
        );
      }

      var exact = [
        [result.analysisVersion, ANALYSIS_VERSION, 'analysis result version mismatch'],
        [result.publicationDate, PUBLICATION_DATE, 'analysis publication date mismatch'],
        [result.pdfContentSha256, EXPECTED_PDF_SHA256, 'analysis PDF SHA evidence mismatch'],
        [result.pdfByteLength, EXPECTED_PDF_BYTES, 'analysis PDF byte-length evidence mismatch'],
        [result.maxPdfBytes, MAX_PDF_BYTES, 'analysis maximum PDF size evidence mismatch'],
        [result.currentNormalExtractionLimit, CURRENT_NORMAL_EXTRACTION_LIMIT, 'analysis normal extraction limit evidence mismatch'],
        [result.certifiedOversizeTextLimit, CERTIFIED_OVERSIZE_TEXT_LIMIT, 'analysis oversize text limit evidence mismatch'],
        [result.observedTextCharacterCount, EXPECTED_TEXT_CHARACTER_COUNT, 'analysis text character-count evidence mismatch'],
        [result.observedTextSha256, EXPECTED_TEXT_SHA256, 'analysis text SHA evidence mismatch'],
        [result.exceedsCurrentNormalExtractionLimit, true, 'analysis oversize evidence mismatch'],
        [result.acceptedForNormalExtraction, false, 'analysis normal extraction acceptance mismatch'],
        [result.exactRecoveredTextIdentityConfirmed, true, 'analysis recovered-text identity evidence mismatch'],
        [result.probateParsingExecuted, true, 'analysis parsing evidence mismatch'],
        [result.noticeOffset, noticeOffset, 'analysis notice offset mismatch'],
        [result.noticePageSize, NOTICE_PAGE_SIZE, 'analysis notice page-size mismatch'],
        [result.cursorDomain, CURSOR_DOMAIN, 'analysis cursor domain mismatch'],
        [result.representativeTextLimit, REPRESENTATIVE_TEXT_LIMIT, 'analysis representative text limit mismatch'],
        [result.temporaryArtifactCreated, true, 'analysis temporary artifact evidence mismatch'],
        [result.temporaryArtifactCleanupAttempted, true, 'analysis cleanup-attempt evidence mismatch'],
        [result.temporaryArtifactCleanupConfirmed, true, 'analysis cleanup-confirmation evidence mismatch'],
        [result.driveCreateCount, 1, 'analysis Drive create count mismatch'],
        [result.documentOpenCount, 1, 'analysis document-open count mismatch'],
        [result.textReadCount, 1, 'analysis text-read count mismatch'],
        [result.fullExtractedTextReturned, false, 'analysis returned full extracted text'],
        [result.textPreviewReturned, false, 'analysis returned text preview'],
        [result.pdfBytesReturned, false, 'analysis returned PDF bytes']
      ];

      exact.forEach(
        function (item) {
          if (
            item[0] !==
            item[1]
          ) {
            fail_(
              item[2]
            );
          }
        }
      );

      if (
        !Number.isInteger(
          result.parsedNoticeCount
        ) ||
        result.parsedNoticeCount <
          1
      ) {
        fail_(
          'analysis parsed notice count is invalid'
        );
      }

      if (
        !Number.isInteger(
          result.selectedNoticeCount
        ) ||
        result.selectedNoticeCount <
          1 ||
        result.selectedNoticeCount >
          NOTICE_PAGE_SIZE
      ) {
        fail_(
          'analysis selected notice count is invalid'
        );
      }

      if (
        result.nextNoticeOffset !==
        noticeOffset +
          result.selectedNoticeCount
      ) {
        fail_(
          'analysis next notice offset mismatch'
        );
      }

      if (
        result.nextNoticeOffset >
        result.parsedNoticeCount
      ) {
        fail_(
          'analysis next notice offset exceeds parsed notice count'
        );
      }

      if (
        typeof result.hasMore !==
          'boolean' ||
        result.hasMore !==
          (
            result.nextNoticeOffset <
            result.parsedNoticeCount
          )
      ) {
        fail_(
          'analysis hasMore evidence mismatch'
        );
      }

      if (
        Object.prototype.toString.call(
          result.notices
        ) !== '[object Array]' ||
        result.notices.length !==
          result.selectedNoticeCount
      ) {
        fail_(
          'analysis notice page evidence mismatch'
        );
      }

      result.notices.forEach(
        function (notice) {
          if (
            !notice ||
            typeof notice.decedent !==
              'string' ||
            !notice.decedent.trim() ||
            typeof notice.normalizedDecedent !==
              'string' ||
            !notice.normalizedDecedent.trim() ||
            typeof notice.representativeText !==
              'string' ||
            notice.representativeText.length >
              REPRESENTATIVE_TEXT_LIMIT ||
            notice.publicationDate !==
              PUBLICATION_DATE
          ) {
            fail_(
              'analysis notice evidence is invalid'
            );
          }
        }
      );

      [
        'sourceDiscoveryExecuted',
        'httpFetchExecuted',
        'opaLookupExecuted',
        'propertyReconciliationExecuted',
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
      ].forEach(
        function (name) {
          assertFalse_(
            result,
            name
          );
        }
      );

      return result;
    }

    function execute_(noticeOffset) {
      noticeOffset =
        assertNoticeOffset_(
          noticeOffset
        );

      /*
       * Exact source identity and certified-analysis metadata must
       * both pass before consuming the one HTTP attempt.
       */
      validatePinnedSource_();

      var analysis =
        assertAnalysisSurface_();

      var httpFetchCount =
        0;

      var analysisInvocationCount =
        0;

      /*
       * SINGLE TRANSPORT AUTHORITY.
       */
      httpFetchCount +=
        1;

      var response =
        UrlFetchApp.fetch(
          SOURCE_URL,
          {
            method:
              'get',

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

      if (
        httpFetchCount !==
        1
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
       */
      var bytes =
        blob.getBytes();

      if (
        !bytes ||
        typeof bytes.length !==
          'number' ||
        bytes.length ===
          0
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

      /*
       * SINGLE CERTIFIED ANALYSIS AUTHORITY.
       * No retry or fallback is authorized.
       */
      analysisInvocationCount +=
        1;

      var analysisResult =
        analysis.analyze(
          blob,
          noticeOffset
        );

      if (
        analysisInvocationCount !==
        1
      ) {
        fail_(
          'analysis invocation count invariant failed'
        );
      }

      analysisResult =
        validateAnalysisEvidence_(
          analysisResult,
          noticeOffset
        );

      return {
        ok:
          true,

        transportVersion:
          1,

        publicationDate:
          PUBLICATION_DATE,

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

        sameResponseBlobHandoffConfirmed:
          true,

        analysisExecuted:
          true,

        analysisInvocationCount:
          analysisInvocationCount,

        analysisExecutionCount:
          analysisInvocationCount,

        analysisVersion:
          analysisResult.analysisVersion,

        currentNormalExtractionLimit:
          analysisResult.currentNormalExtractionLimit,

        certifiedOversizeTextLimit:
          analysisResult.certifiedOversizeTextLimit,

        observedTextCharacterCount:
          analysisResult.observedTextCharacterCount,

        observedTextSha256:
          analysisResult.observedTextSha256,

        exceedsCurrentNormalExtractionLimit:
          true,

        acceptedForNormalExtraction:
          false,

        exactRecoveredTextIdentityConfirmed:
          true,

        probateParsingExecuted:
          true,

        parsedNoticeCount:
          analysisResult.parsedNoticeCount,

        noticeOffset:
          analysisResult.noticeOffset,

        noticePageSize:
          NOTICE_PAGE_SIZE,

        selectedNoticeCount:
          analysisResult.selectedNoticeCount,

        nextNoticeOffset:
          analysisResult.nextNoticeOffset,

        hasMore:
          analysisResult.hasMore,

        cursorDomain:
          CURSOR_DOMAIN,

        representativeTextLimit:
          REPRESENTATIVE_TEXT_LIMIT,

        notices:
          analysisResult.notices,

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

        analysisHttpFetchExecuted:
          false,

        sourceDiscoveryExecuted:
          false,

        opaLookupExecuted:
          false,

        propertyReconciliationExecuted:
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

        cursorMutationExecuted:
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

    return {
      transportVersion:
        1,

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

      expectedPdfBytes:
        EXPECTED_PDF_BYTES,

      expectedPdfSha256:
        EXPECTED_PDF_SHA256,

      maxPdfBytes:
        MAX_PDF_BYTES,

      analysisVersion:
        ANALYSIS_VERSION,

      currentNormalExtractionLimit:
        CURRENT_NORMAL_EXTRACTION_LIMIT,

      certifiedOversizeTextLimit:
        CERTIFIED_OVERSIZE_TEXT_LIMIT,

      expectedTextCharacterCount:
        EXPECTED_TEXT_CHARACTER_COUNT,

      expectedTextSha256:
        EXPECTED_TEXT_SHA256,

      noticePageSize:
        NOTICE_PAGE_SIZE,

      representativeTextLimit:
        REPRESENTATIVE_TEXT_LIMIT,

      cursorDomain:
        CURSOR_DOMAIN,

      execute:
        execute_
    };
  })();

function reosPhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport(
  noticeOffset
) {
  return REOS
    .PhiladelphiaProbateCertifiedOversizePublicationAnalysisProductionTransport
    .execute(
      noticeOffset
    );
}
