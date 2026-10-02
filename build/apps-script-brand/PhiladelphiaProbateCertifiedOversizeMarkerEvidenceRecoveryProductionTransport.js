/*
 * REOS Philadelphia Probate PB1
 * Certified Oversize Marker-Evidence Recovery Production Transport v1
 *
 * Exactly one pinned HTTP GET -> exact PDF identity verification ->
 * exactly one same-response Blob handoff to the separately certified
 * marker-evidence recovery component.
 *
 * This diagnostic is distinct from, and is not a retry of, the failed
 * v142 certified oversize publication-analysis invocation.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport =
  (function () {
    'use strict';

    var TRANSPORT_VERSION = 1;
    var MARKER_EVIDENCE_VERSION = 1;

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

    var MAX_PDF_BYTES =
      26214400;

    var EXPECTED_PDF_SHA256 =
      '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

    var CURRENT_NORMAL_EXTRACTION_LIMIT =
      250000;

    var CERTIFIED_OVERSIZE_TEXT_LIMIT =
      600000;

    var EXPECTED_TEXT_CHARACTER_COUNT =
      566435;

    var EXPECTED_TEXT_SHA256 =
      '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

    var LOCATOR_FAMILY_COUNT = 5;
    var MAX_CONTEXT_COUNT = 8;
    var MAX_CONTEXT_CHARACTERS = 800;
    var MAX_AGGREGATE_CONTEXT_CHARACTERS = 6400;

    var FIXED_LOCATOR_LABELS = [
      'ESTATE',
      'NOTICE',
      'ORPHAN',
      'COURT',
      'DIVISION'
    ];

    var CONTEXT_FIELDS = [
      'contextCharacterCount',
      'contextSha256',
      'endOffset',
      'locatorLabels',
      'rawOcrContext',
      'startOffset'
    ];

    function fail_(message) {
      throw new Error(
        'PB1 certified oversize marker-evidence production transport rejected: ' +
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

    function validatePinnedSource_() {
      if (
        sha256StringHex_(
          SOURCE_URL
        ) !==
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
        ) !==
        0
      ) {
        fail_(
          'source host/scheme mismatch'
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

      var dateParts =
        PUBLICATION_DATE.split('-');

      if (
        dateParts.length !== 3
      ) {
        fail_(
          'publication date format mismatch'
        );
      }

      var expectedBasename =
        'tlipn' +
        dateParts[1] +
        dateParts[2] +
        dateParts[0].slice(2) +
        '.pdf';

      if (
        expectedBasename !==
        SOURCE_BASENAME
      ) {
        fail_(
          'publication date/source basename mismatch'
        );
      }
    }

    function assertTransportServices_() {
      assertDigestService_();

      if (
        typeof UrlFetchApp === 'undefined' ||
        typeof UrlFetchApp.fetch !==
          'function'
      ) {
        fail_(
          'UrlFetchApp.fetch unavailable'
        );
      }
    }

    function assertMarkerSurface_() {
      if (
        !REOS ||
        !REOS
          .PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery
      ) {
        fail_(
          'certified marker-evidence component unavailable'
        );
      }

      var marker =
        REOS
          .PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecovery;

      var exact = [
        [
          marker.markerEvidenceVersion,
          MARKER_EVIDENCE_VERSION,
          'marker version mismatch'
        ],
        [
          marker.expectedPdfBytes,
          EXPECTED_PDF_BYTES,
          'marker PDF byte metadata mismatch'
        ],
        [
          marker.expectedPdfSha256,
          EXPECTED_PDF_SHA256,
          'marker PDF SHA metadata mismatch'
        ],
        [
          marker.maxPdfBytes,
          MAX_PDF_BYTES,
          'marker maximum PDF size mismatch'
        ],
        [
          marker.currentNormalExtractionLimit,
          CURRENT_NORMAL_EXTRACTION_LIMIT,
          'marker normal extraction limit mismatch'
        ],
        [
          marker.certifiedOversizeTextLimit,
          CERTIFIED_OVERSIZE_TEXT_LIMIT,
          'marker oversize extraction limit mismatch'
        ],
        [
          marker.expectedTextCharacterCount,
          EXPECTED_TEXT_CHARACTER_COUNT,
          'marker OCR character-count mismatch'
        ],
        [
          marker.expectedTextSha256,
          EXPECTED_TEXT_SHA256,
          'marker OCR SHA mismatch'
        ],
        [
          marker.locatorFamilyCount,
          LOCATOR_FAMILY_COUNT,
          'marker locator-family count mismatch'
        ],
        [
          marker.maxContextCount,
          MAX_CONTEXT_COUNT,
          'marker maximum context count mismatch'
        ],
        [
          marker.maxContextCharacters,
          MAX_CONTEXT_CHARACTERS,
          'marker maximum context characters mismatch'
        ],
        [
          marker.maxAggregateContextCharacters,
          MAX_AGGREGATE_CONTEXT_CHARACTERS,
          'marker aggregate context ceiling mismatch'
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
        typeof marker.recover !==
        'function'
      ) {
        fail_(
          'marker recovery function unavailable'
        );
      }

      if (
        marker.recover.length !== 1
      ) {
        fail_(
          'marker recovery parameter count mismatch'
        );
      }

      return marker;
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
        unsignedByte_(bytes[0]) === 0x25 &&
        unsignedByte_(bytes[1]) === 0x50 &&
        unsignedByte_(bytes[2]) === 0x44 &&
        unsignedByte_(bytes[3]) === 0x46 &&
        unsignedByte_(bytes[4]) === 0x2d
      );
    }

    function assertFalse_(
      result,
      name
    ) {
      if (
        result[name] !== false
      ) {
        fail_(
          'unsafe marker-evidence flag: ' +
          name
        );
      }
    }

    function validateContext_(
      context,
      priorEnd
    ) {
      if (
        !context ||
        typeof context !== 'object'
      ) {
        fail_(
          'marker context invalid'
        );
      }

      var keys =
        Object
          .keys(context)
          .sort();

      if (
        keys.join('|') !==
        CONTEXT_FIELDS.join('|')
      ) {
        fail_(
          'marker context field set mismatch'
        );
      }

      if (
        Object.prototype.toString.call(
          context.locatorLabels
        ) !== '[object Array]' ||
        context.locatorLabels.length < 1
      ) {
        fail_(
          'marker locator labels invalid'
        );
      }

      var seenLabels = {};

      context.locatorLabels.forEach(
        function (label) {
          if (
            FIXED_LOCATOR_LABELS.indexOf(
              label
            ) < 0
          ) {
            fail_(
              'non-fixed marker locator label'
            );
          }

          if (
            seenLabels[label]
          ) {
            fail_(
              'duplicate marker locator label'
            );
          }

          seenLabels[label] = true;
        }
      );

      if (
        !Number.isInteger(
          context.startOffset
        ) ||
        context.startOffset < 0 ||
        !Number.isInteger(
          context.endOffset
        ) ||
        context.endOffset <=
          context.startOffset
      ) {
        fail_(
          'marker context offsets invalid'
        );
      }

      if (
        priorEnd !== null &&
        context.startOffset <
          priorEnd
      ) {
        fail_(
          'marker contexts overlap or are unordered'
        );
      }

      if (
        typeof context.rawOcrContext !==
        'string'
      ) {
        fail_(
          'marker raw OCR context invalid'
        );
      }

      if (
        !Number.isInteger(
          context.contextCharacterCount
        ) ||
        context.contextCharacterCount < 1 ||
        context.contextCharacterCount >
          MAX_CONTEXT_CHARACTERS
      ) {
        fail_(
          'marker context character count invalid'
        );
      }

      if (
        context.rawOcrContext.length !==
          context.contextCharacterCount ||
        context.endOffset -
          context.startOffset !==
          context.contextCharacterCount
      ) {
        fail_(
          'marker context length relationship mismatch'
        );
      }

      if (
        typeof context.contextSha256 !==
          'string' ||
        !/^[0-9a-f]{64}$/.test(
          context.contextSha256
        )
      ) {
        fail_(
          'marker context SHA format invalid'
        );
      }

      if (
        sha256StringHex_(
          context.rawOcrContext
        ) !==
        context.contextSha256
      ) {
        fail_(
          'marker context SHA mismatch'
        );
      }

      return context.endOffset;
    }

    function validateMarkerEvidence_(
      result
    ) {
      if (
        !result ||
        result.ok !== true
      ) {
        fail_(
          'marker recovery did not return success evidence'
        );
      }

      var exact = [
        [result.markerEvidenceVersion, MARKER_EVIDENCE_VERSION, 'result marker version mismatch'],
        [result.pdfContentSha256, EXPECTED_PDF_SHA256, 'result PDF SHA mismatch'],
        [result.pdfByteLength, EXPECTED_PDF_BYTES, 'result PDF bytes mismatch'],
        [result.maxPdfBytes, MAX_PDF_BYTES, 'result maximum PDF size mismatch'],
        [result.currentNormalExtractionLimit, CURRENT_NORMAL_EXTRACTION_LIMIT, 'result normal limit mismatch'],
        [result.certifiedOversizeTextLimit, CERTIFIED_OVERSIZE_TEXT_LIMIT, 'result oversize limit mismatch'],
        [result.observedTextCharacterCount, EXPECTED_TEXT_CHARACTER_COUNT, 'result OCR character count mismatch'],
        [result.observedTextSha256, EXPECTED_TEXT_SHA256, 'result OCR SHA mismatch'],
        [result.exactRecoveredTextIdentityConfirmed, true, 'exact OCR identity confirmation mismatch'],
        [result.locatorFamilyCount, LOCATOR_FAMILY_COUNT, 'result locator count mismatch'],
        [result.maxContextCount, MAX_CONTEXT_COUNT, 'result max context count mismatch'],
        [result.maxContextCharacters, MAX_CONTEXT_CHARACTERS, 'result max context chars mismatch'],
        [result.maxAggregateContextCharacters, MAX_AGGREGATE_CONTEXT_CHARACTERS, 'result aggregate ceiling mismatch'],
        [result.temporaryArtifactCreated, true, 'temporary artifact evidence mismatch'],
        [result.temporaryArtifactCleanupAttempted, true, 'cleanup attempt evidence mismatch'],
        [result.temporaryArtifactCleanupConfirmed, true, 'cleanup confirmation mismatch'],
        [result.driveCreateCount, 1, 'Drive create evidence mismatch'],
        [result.documentOpenCount, 1, 'document open evidence mismatch'],
        [result.textReadCount, 1, 'text read evidence mismatch'],
        [result.fullOcrTextReturned, false, 'full OCR text returned'],
        [result.genericTextPreviewReturned, false, 'generic OCR preview returned'],
        [result.pdfBytesReturned, false, 'PDF bytes returned'],
        [result.temporaryDocumentIdReturned, false, 'temporary document ID returned']
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

      [
        'sourceDiscoveryExecuted',
        'httpFetchExecuted',
        'priorDriveArtifactSearchExecuted',
        'probateParsingExecuted',
        'parserRepairExecuted',
        'propertyLookupExecuted',
        'opaLookupExecuted',
        'propertyReconciliationExecuted',
        'leadCreationExecuted',
        'persistenceExecuted',
        'schedulerInspectionExecuted',
        'schedulerMutationExecuted',
        'triggerMutationExecuted',
        'checkpointMutationExecuted',
        'cursorMutationExecuted',
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

      if (
        !Number.isInteger(
          result.contextCount
        ) ||
        result.contextCount < 1 ||
        result.contextCount >
          MAX_CONTEXT_COUNT
      ) {
        fail_(
          'marker context count invalid'
        );
      }

      if (
        Object.prototype.toString.call(
          result.contexts
        ) !== '[object Array]' ||
        result.contexts.length !==
          result.contextCount
      ) {
        fail_(
          'marker context collection mismatch'
        );
      }

      if (
        !Number.isInteger(
          result.aggregateContextCharacters
        ) ||
        result.aggregateContextCharacters < 1 ||
        result.aggregateContextCharacters >
          MAX_AGGREGATE_CONTEXT_CHARACTERS
      ) {
        fail_(
          'marker aggregate character count invalid'
        );
      }

      var aggregate = 0;
      var priorEnd = null;

      result.contexts.forEach(
        function (context) {
          priorEnd =
            validateContext_(
              context,
              priorEnd
            );

          aggregate +=
            context
              .contextCharacterCount;
        }
      );

      if (
        aggregate !==
        result.aggregateContextCharacters
      ) {
        fail_(
          'marker aggregate context count mismatch'
        );
      }

      return result;
    }

    function execute_() {
      /*
       * Every local metadata/service gate is evaluated before the
       * single authorized HTTP attempt.
       */
      validatePinnedSource_();
      assertTransportServices_();

      var marker =
        assertMarkerSurface_();

      var httpFetchCount = 0;
      var markerRecoveryInvocationCount = 0;

      httpFetchCount += 1;

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
          'PDF SHA-256 mismatch'
        );
      }

      /*
       * The exact Blob returned by response.getBlob() is passed once.
       * No reconstructed or copied PDF Blob is created.
       */
      markerRecoveryInvocationCount +=
        1;

      var markerResult =
        marker.recover(
          blob
        );

      if (
        markerRecoveryInvocationCount !==
        1
      ) {
        fail_(
          'marker recovery invocation count invariant failed'
        );
      }

      markerResult =
        validateMarkerEvidence_(
          markerResult
        );

      return {
        ok:
          true,

        transportVersion:
          TRANSPORT_VERSION,

        markerEvidenceVersion:
          MARKER_EVIDENCE_VERSION,

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

        markerRecoveryExecuted:
          true,

        markerRecoveryInvocationCount:
          markerRecoveryInvocationCount,

        currentNormalExtractionLimit:
          markerResult
            .currentNormalExtractionLimit,

        certifiedOversizeTextLimit:
          markerResult
            .certifiedOversizeTextLimit,

        observedTextCharacterCount:
          markerResult
            .observedTextCharacterCount,

        observedTextSha256:
          markerResult
            .observedTextSha256,

        exactRecoveredTextIdentityConfirmed:
          true,

        locatorFamilyCount:
          markerResult
            .locatorFamilyCount,

        maxContextCount:
          markerResult
            .maxContextCount,

        maxContextCharacters:
          markerResult
            .maxContextCharacters,

        maxAggregateContextCharacters:
          markerResult
            .maxAggregateContextCharacters,

        contextCount:
          markerResult
            .contextCount,

        aggregateContextCharacters:
          markerResult
            .aggregateContextCharacters,

        contexts:
          markerResult
            .contexts,

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

        fullOcrTextReturned:
          false,

        genericTextPreviewReturned:
          false,

        pdfBytesReturned:
          false,

        temporaryDocumentIdReturned:
          false,

        sourceDiscoveryExecuted:
          false,

        markerComponentHttpFetchExecuted:
          false,

        priorDriveArtifactSearchExecuted:
          false,

        probateParsingExecuted:
          false,

        parserRepairExecuted:
          false,

        propertyLookupExecuted:
          false,

        opaLookupExecuted:
          false,

        propertyReconciliationExecuted:
          false,

        leadCreationExecuted:
          false,

        persistenceExecuted:
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
        TRANSPORT_VERSION,

      markerEvidenceVersion:
        MARKER_EVIDENCE_VERSION,

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

      currentNormalExtractionLimit:
        CURRENT_NORMAL_EXTRACTION_LIMIT,

      certifiedOversizeTextLimit:
        CERTIFIED_OVERSIZE_TEXT_LIMIT,

      expectedTextCharacterCount:
        EXPECTED_TEXT_CHARACTER_COUNT,

      expectedTextSha256:
        EXPECTED_TEXT_SHA256,

      locatorFamilyCount:
        LOCATOR_FAMILY_COUNT,

      maxContextCount:
        MAX_CONTEXT_COUNT,

      maxContextCharacters:
        MAX_CONTEXT_CHARACTERS,

      maxAggregateContextCharacters:
        MAX_AGGREGATE_CONTEXT_CHARACTERS,

      execute:
        execute_
    };
  })();

function reosPhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport() {
  return REOS
    .PhiladelphiaProbateCertifiedOversizeMarkerEvidenceRecoveryProductionTransport
    .execute();
}
