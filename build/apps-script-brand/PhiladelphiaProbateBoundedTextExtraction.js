/*
 * REOS Philadelphia Probate — Bounded Text Extraction v1
 *
 * This module has no HTTP authority.
 * It accepts only the already-authorized, cryptographically pinned PDF
 * blob and performs one temporary Drive OCR lifecycle.
 *
 * It grants no probate parsing, lead creation, persistence, county
 * mutation, ARV, repair-scope, MAO, or offer authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateBoundedTextExtraction =
  (function () {
    'use strict';

    var EXPECTED_PDF_SHA256 =
      '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

    var EXPECTED_PDF_BYTES =
      4220387;

    var MAX_PDF_BYTES =
      26214400;

    var MAX_TEXT_CHARS =
      250000;

    function bytesFromBlob_(blob) {
      if (
        !blob ||
        typeof blob.getBytes !== 'function'
      ) {
        throw new Error(
          'Bounded probate text extraction requires a PDF blob.'
        );
      }

      var bytes =
        blob.getBytes();

      if (
        !bytes ||
        typeof bytes.length !== 'number'
      ) {
        throw new Error(
          'Bounded probate text extraction could not read PDF bytes.'
        );
      }

      return bytes;
    }

    function unsignedByte_(value) {
      value =
        Number(value);

      if (value < 0) {
        value += 256;
      }

      return value;
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
          'Bounded probate text extraction PDF signature is invalid.'
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
            'Bounded probate text extraction PDF signature is invalid.'
          );
        }
      }
    }

    function hex_(bytes) {
      return bytes
        .map(function (value) {
          var hex =
            unsignedByte_(value)
              .toString(16);

          return (
            hex.length === 1
              ? '0' + hex
              : hex
          );
        })
        .join('');
    }

    function sha256_(bytes) {
      if (
        typeof Utilities === 'undefined' ||
        typeof Utilities.computeDigest !== 'function' ||
        !Utilities.DigestAlgorithm ||
        !Utilities.DigestAlgorithm.SHA_256
      ) {
        throw new Error(
          'Bounded probate text extraction requires SHA-256 support.'
        );
      }

      return hex_(
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          bytes
        )
      );
    }

    function assertInput_(blob) {
      var bytes =
        bytesFromBlob_(blob);

      if (bytes.length > MAX_PDF_BYTES) {
        throw new Error(
          'Bounded probate text extraction PDF exceeds maximum size.'
        );
      }

      if (bytes.length !== EXPECTED_PDF_BYTES) {
        throw new Error(
          'Bounded probate text extraction PDF byte length mismatch.'
        );
      }

      assertPdfSignature_(bytes);

      var sha =
        sha256_(bytes);

      if (sha !== EXPECTED_PDF_SHA256) {
        throw new Error(
          'Bounded probate text extraction PDF SHA-256 mismatch.'
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
          'Bounded probate text extraction requires Advanced Drive v3.'
        );
      }

      if (
        typeof DocumentApp === 'undefined' ||
        typeof DocumentApp.openById !== 'function'
      ) {
        throw new Error(
          'Bounded probate text extraction requires DocumentApp.'
        );
      }

      if (
        typeof DriveApp === 'undefined' ||
        typeof DriveApp.getFileById !== 'function'
      ) {
        throw new Error(
          'Bounded probate text extraction requires DriveApp cleanup.'
        );
      }
    }

    function cleanup_(documentId) {
      DriveApp
        .getFileById(documentId)
        .setTrashed(true);

      return true;
    }

    function extract(blob) {
      /*
       * CRITICAL ORDERING:
       * All byte identity checks occur before any temporary artifact
       * can be created.
       */
      var input =
        assertInput_(blob);

      assertServices_();

      var converted = null;
      var documentId = '';
      var cleanupAttempted = false;
      var cleanupConfirmed = false;
      var primaryError = null;
      var result = null;

      try {
        converted =
          Drive.Files.create(
            {
              name:
                'REOS Philadelphia Probate Bounded OCR',
              mimeType:
                'application/vnd.google-apps.document'
            },
            blob,
            {
              ocrLanguage: 'en',
              fields: 'id,name,mimeType'
            }
          );

        if (
          !converted ||
          !converted.id
        ) {
          throw new Error(
            'Bounded probate text extraction conversion returned no document ID.'
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
            'Bounded probate text extraction returned no text.'
          );
        }

        if (
          text.length >
          MAX_TEXT_CHARS
        ) {
          throw new Error(
            'Bounded probate text extraction exceeded maximum text length.'
          );
        }

        var textBytes =
          Utilities.newBlob(text)
            .getBytes();

        var textSha =
          sha256_(textBytes);

        result = {
          ok: true,
          extractionVersion: 1,

          pdfContentSha256:
            input.sha256,

          pdfByteLength:
            input.bytes.length,

          maxPdfBytes:
            MAX_PDF_BYTES,

          extractedTextCharacterCount:
            text.length,

          maxExtractedTextCharacters:
            MAX_TEXT_CHARS,

          extractedTextSha256:
            textSha,

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

          fullExtractedTextReturned:
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
        primaryError =
          error;
      } finally {
        if (documentId) {
          cleanupAttempted =
            true;

          try {
            cleanupConfirmed =
              cleanup_(
                documentId
              );
          } catch (cleanupError) {
            cleanupConfirmed =
              false;

            if (!primaryError) {
              primaryError =
                new Error(
                  'Bounded probate text extraction temporary artifact cleanup failed.'
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
          'Bounded probate text extraction cleanup was not confirmed.'
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
      extractionVersion: 1,

      expectedPdfSha256:
        EXPECTED_PDF_SHA256,

      expectedPdfBytes:
        EXPECTED_PDF_BYTES,

      maxPdfBytes:
        MAX_PDF_BYTES,

      maxExtractedTextCharacters:
        MAX_TEXT_CHARS,

      extract:
        extract
    };
  })();
