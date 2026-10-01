/*
 * REOS Philadelphia Probate PB1
 * Bounded Oversize Text Evidence v1
 *
 * Evidence-only OCR measurement for the exact certified PB1 PDF.
 * No HTTP, parsing, persistence, county mutation, ARV, repair,
 * MAO, offer, or normal extraction acceptance authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateBoundedOversizeTextEvidence =
  (function () {
    'use strict';

    var EXPECTED_PDF_SHA256 =
      '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

    var EXPECTED_PDF_BYTES =
      4220387;

    var MAX_PDF_BYTES =
      26214400;

    var CURRENT_NORMAL_EXTRACTION_LIMIT =
      250000;

    function unsignedByte_(value) {
      value = Number(value);

      if (value < 0) {
        value += 256;
      }

      return value;
    }

    function hex_(bytes) {
      var out = '';

      for (var i = 0; i < bytes.length; i += 1) {
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
        throw new Error(
          'PB1 oversize text evidence requires SHA-256 support.'
        );
      }
    }

    function sha256_(bytes) {
      assertDigestService_();

      return hex_(
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          bytes
        )
      );
    }

    function bytesFromBlob_(blob) {
      if (
        !blob ||
        typeof blob.getBytes !== 'function'
      ) {
        throw new Error(
          'PB1 oversize text evidence requires a PDF blob.'
        );
      }

      var bytes =
        blob.getBytes();

      if (
        !bytes ||
        typeof bytes.length !== 'number'
      ) {
        throw new Error(
          'PB1 oversize text evidence could not read PDF bytes.'
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
        throw new Error(
          'PB1 oversize text evidence PDF signature is invalid.'
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
          throw new Error(
            'PB1 oversize text evidence PDF signature is invalid.'
          );
        }
      }
    }

    function assertInput_(blob) {
      var bytes =
        bytesFromBlob_(blob);

      if (bytes.length > MAX_PDF_BYTES) {
        throw new Error(
          'PB1 oversize text evidence PDF exceeds maximum size.'
        );
      }

      if (
        bytes.length !==
        EXPECTED_PDF_BYTES
      ) {
        throw new Error(
          'PB1 oversize text evidence PDF byte length mismatch.'
        );
      }

      assertPdfSignature_(bytes);

      var sha =
        sha256_(bytes);

      if (
        sha !==
        EXPECTED_PDF_SHA256
      ) {
        throw new Error(
          'PB1 oversize text evidence PDF SHA-256 mismatch.'
        );
      }

      return {
        bytes: bytes,
        sha256: sha
      };
    }

    function assertServices_() {
      if (
        typeof Drive === 'undefined' ||
        !Drive.Files ||
        typeof Drive.Files.create !== 'function'
      ) {
        throw new Error(
          'PB1 oversize text evidence requires Advanced Drive v3.'
        );
      }

      if (
        typeof DocumentApp === 'undefined' ||
        typeof DocumentApp.openById !== 'function'
      ) {
        throw new Error(
          'PB1 oversize text evidence requires DocumentApp.'
        );
      }

      if (
        typeof DriveApp === 'undefined' ||
        typeof DriveApp.getFileById !== 'function'
      ) {
        throw new Error(
          'PB1 oversize text evidence requires DriveApp cleanup.'
        );
      }
    }

    function cleanup_(documentId) {
      DriveApp
        .getFileById(documentId)
        .setTrashed(true);

      return true;
    }

    function inspect(blob) {
      /*
       * Identity verification happens before the first Drive mutation.
       */
      var input =
        assertInput_(blob);

      assertServices_();

      var documentId = '';
      var cleanupAttempted = false;
      var cleanupConfirmed = false;
      var primaryError = null;
      var result = null;

      try {
        var converted =
          Drive.Files.create(
            {
              name:
                'REOS Philadelphia Probate Oversize Evidence OCR',

              mimeType:
                'application/vnd.google-apps.document'
            },
            blob,
            {
              ocrLanguage:
                'en',

              fields:
                'id,name,mimeType'
            }
          );

        if (
          !converted ||
          !converted.id
        ) {
          throw new Error(
            'PB1 oversize text evidence conversion returned no document ID.'
          );
        }

        documentId =
          String(converted.id);

        var document =
          DocumentApp.openById(
            documentId
          );

        var text =
          String(
            document
              .getBody()
              .getText() ||
            ''
          );

        if (!text.trim()) {
          throw new Error(
            'PB1 oversize text evidence returned no text.'
          );
        }

        var observedCount =
          text.length;

        if (
          observedCount <=
          CURRENT_NORMAL_EXTRACTION_LIMIT
        ) {
          throw new Error(
            'PB1 oversize text evidence did not exceed current normal extraction limit.'
          );
        }

        var textBytes =
          Utilities
            .newBlob(text)
            .getBytes();

        var textSha =
          sha256_(textBytes);

        result = {
          ok: true,
          evidenceVersion: 1,

          pdfContentSha256:
            input.sha256,

          pdfByteLength:
            input.bytes.length,

          maxPdfBytes:
            MAX_PDF_BYTES,

          currentNormalExtractionLimit:
            CURRENT_NORMAL_EXTRACTION_LIMIT,

          observedTextCharacterCount:
            observedCount,

          observedTextSha256:
            textSha,

          exceedsCurrentNormalExtractionLimit:
            true,

          acceptedForNormalExtraction:
            false,

          temporaryArtifactCreated:
            true,

          temporaryArtifactCleanupAttempted:
            false,

          temporaryArtifactCleanupConfirmed:
            false,

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

          httpFetchExecuted:
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
      } catch (error) {
        primaryError = error;
      } finally {
        if (documentId) {
          cleanupAttempted = true;

          try {
            cleanupConfirmed =
              cleanup_(documentId);
          } catch (cleanupError) {
            cleanupConfirmed = false;

            if (!primaryError) {
              primaryError =
                new Error(
                  'PB1 oversize text evidence temporary artifact cleanup failed.'
                );
            } else {
              primaryError =
                new Error(
                  String(
                    primaryError &&
                    primaryError.message
                      ? primaryError.message
                      : primaryError
                  ) +
                  ' Temporary artifact cleanup also failed.'
                );
            }
          }
        }
      }

      if (primaryError) {
        throw primaryError;
      }

      if (
        !documentId ||
        !cleanupAttempted ||
        !cleanupConfirmed
      ) {
        throw new Error(
          'PB1 oversize text evidence cleanup was not confirmed.'
        );
      }

      result
        .temporaryArtifactCleanupAttempted =
          true;

      result
        .temporaryArtifactCleanupConfirmed =
          true;

      return result;
    }

    return {
      evidenceVersion: 1,

      expectedPdfSha256:
        EXPECTED_PDF_SHA256,

      expectedPdfBytes:
        EXPECTED_PDF_BYTES,

      maxPdfBytes:
        MAX_PDF_BYTES,

      currentNormalExtractionLimit:
        CURRENT_NORMAL_EXTRACTION_LIMIT,

      inspect: inspect
    };
  })();
