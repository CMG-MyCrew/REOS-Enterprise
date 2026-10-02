/*
 * REOS Philadelphia Probate PB1
 * Certified Oversize Publication Analysis v1
 *
 * Exact-source Blob-only OCR + bounded Estate Notices analysis.
 *
 * No HTTP.
 * No production RPC.
 * No OPA/property lookup.
 * No persistence.
 * No county mutation.
 * No ARV / repair / MAO / offer authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateCertifiedOversizePublicationAnalysis =
  (function () {
    'use strict';

    var EXPECTED_PUBLICATION_DATE =
      '2026-09-30';

    var EXPECTED_PDF_SHA256 =
      '90e2341f0de98e877180332131a21e8d3077c0ef9f090ef28f797a88eb726028';

    var EXPECTED_PDF_BYTES =
      4220387;

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
          'PB1 certified oversize publication analysis requires SHA-256 support.'
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
          'PB1 certified oversize publication analysis requires a PDF blob.'
        );
      }

      var bytes =
        blob.getBytes();

      if (
        !bytes ||
        typeof bytes.length !== 'number'
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis could not read PDF bytes.'
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

      if (
        bytes.length <
        signature.length
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis PDF signature is invalid.'
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
            'PB1 certified oversize publication analysis PDF signature is invalid.'
          );
        }
      }
    }

    function assertPdfInput_(blob) {
      var bytes =
        bytesFromBlob_(blob);

      if (
        bytes.length >
        MAX_PDF_BYTES
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis PDF exceeds maximum size.'
        );
      }

      if (
        bytes.length !==
        EXPECTED_PDF_BYTES
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis PDF byte length mismatch.'
        );
      }

      assertPdfSignature_(
        bytes
      );

      var sha =
        sha256_(bytes);

      if (
        sha !==
        EXPECTED_PDF_SHA256
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis PDF SHA-256 mismatch.'
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
          'PB1 certified oversize publication analysis requires Advanced Drive v3.'
        );
      }

      if (
        typeof DocumentApp === 'undefined' ||
        typeof DocumentApp.openById !== 'function'
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis requires DocumentApp.'
        );
      }

      if (
        typeof DriveApp === 'undefined' ||
        typeof DriveApp.getFileById !== 'function'
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis requires DriveApp cleanup.'
        );
      }
    }

    function assertNoticeOffset_(value) {
      var offset =
        Number(value);

      if (
        !Number.isInteger(offset) ||
        offset < 0
      ) {
        throw new Error(
          'PB1 certified oversize publication analysis notice offset is invalid.'
        );
      }

      return offset;
    }

    function cleanup_(documentId) {
      DriveApp
        .getFileById(
          documentId
        )
        .setTrashed(true);

      return true;
    }

    function parsePublicationDate_(text) {
      var months = {
        JANUARY: '01',
        FEBRUARY: '02',
        MARCH: '03',
        APRIL: '04',
        MAY: '05',
        JUNE: '06',
        JULY: '07',
        AUGUST: '08',
        SEPTEMBER: '09',
        OCTOBER: '10',
        NOVEMBER: '11',
        DECEMBER: '12'
      };

      var match =
        String(text || '').match(
          /\b(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+([0-3]?\d),?\s+(20\d{2})\b/i
        );

      if (!match) {
        throw new Error(
          'PB1 certified oversize publication date was not found.'
        );
      }

      var month =
        months[
          String(
            match[1]
          ).toUpperCase()
        ];

      var day =
        (
          '0' +
          String(
            Number(
              match[2]
            )
          )
        ).slice(-2);

      var value =
        String(match[3]) +
        '-' +
        month +
        '-' +
        day;

      if (
        value !==
        EXPECTED_PUBLICATION_DATE
      ) {
        throw new Error(
          'PB1 certified oversize publication date mismatch.'
        );
      }

      return value;
    }

    function normalizeProbateName_(value) {
      var name =
        String(value || '')
          .toUpperCase()
          .replace(/[’‘]/g, "'")
          .replace(/\s+/g, ' ')
          .trim();

      name =
        name
          .split(
            /\s+(?:A\/K\/A|AKA)\s+/i
          )[0]
          .split(
            /\(\s*(?:A\/K\/A|AKA)\b/i
          )[0]
          .trim();

      var pieces =
        name
          .split(',')
          .map(function (piece) {
            return piece.trim();
          })
          .filter(Boolean);

      if (
        pieces.length >
        1
      ) {
        var last =
          pieces.shift();

        var rest =
          pieces
            .filter(function (piece) {
              return !/^(?:JR|SR|II|III|IV)\.?$/i
                .test(piece);
            })
            .join(' ');

        name =
          last +
          ' ' +
          rest;
      }

      return name
        .replace(
          /\b(?:JR|SR|II|III|IV)\b\.?/g,
          ' '
        )
        .replace(
          /[^A-Z0-9]+/g,
          ' '
        )
        .replace(
          /\s+/g,
          ' '
        )
        .trim();
    }

    function probateNameParts_(value) {
      var normalized =
        normalizeProbateName_(
          value
        );

      var tokens =
        normalized
          .split(' ')
          .filter(Boolean);

      if (
        tokens.length < 2 ||
        tokens[0].length < 2 ||
        tokens[1].length < 2
      ) {
        return null;
      }

      return {
        normalized:
          normalized,

        last:
          tokens[0],

        first:
          tokens[1],

        tokens:
          tokens
      };
    }

    function parseEstateNotices_(text) {
      var normalized =
        String(text || '')
          .replace(/\r/g, '')
          .replace(/[’‘]/g, "'")
          .replace(/\u00a0/g, ' ');

      var markerPattern =
        /ESTATE[\s]+NOTICES[\s]+ORPHANS'?[\s]+COURT[\s]+DIVISION/i;

      var markerMatch =
        markerPattern.exec(
          normalized
        );

      if (!markerMatch) {
        throw new Error(
          'PB1 certified oversize Estate Notices marker was not found.'
        );
      }

      var publicationDate =
        parsePublicationDate_(
          normalized
        );

      var section =
        normalized.slice(
          markerMatch.index +
          markerMatch[0].length
        );

      var anchorPattern =
        /(^|\n)\s*\d{1,2}\.\s*([A-Z][A-Z0-9 .,'()\/&-]{2,120}(?:\n[A-Z][A-Z0-9 .,'()\/&-]{0,40})?)\s*\u2013\s*/gm;

      var anchors = [];
      var match;

      while (
        (
          match =
            anchorPattern.exec(
              section
            )
        ) !== null
      ) {
        anchors.push({
          index:
            match.index,

          bodyStart:
            anchorPattern.lastIndex,

          name:
            String(
              match[2] ||
              ''
            )
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
        });
      }

      var notices = [];
      var seen = {};

      anchors.forEach(function (
        anchor,
        index
      ) {
        var end =
          index + 1 <
          anchors.length
            ? anchors[
                index + 1
              ].index
            : section.length;

        var body =
          section
            .slice(
              anchor.bodyStart,
              end
            )
            .replace(
              /\s+/g,
              ' '
            )
            .trim();

        var candidate =
          anchor.name;

        if (
          candidate.indexOf(',') ===
          -1
        ) {
          return;
        }

        if (
          !/\b(?:EXECU\s*TOR|EXECU\s*TRIX|AD\s*MINIS\s*TRATOR|AD\s*MINIS\s*TRATRIX|PERSONAL\s+REPRESENTATIVE|CO-EXECU\s*TOR|CO-EXECU\s*TRIX)\b/i
            .test(body)
        ) {
          return;
        }

        if (
          /\b(?:NOTICE TO COUNSEL|CITY COUNCIL|CERTIFICATE|COURT OF COMMON PLEAS)\b/i
            .test(candidate)
        ) {
          return;
        }

        var parts =
          probateNameParts_(
            candidate
          );

        if (!parts) {
          return;
        }

        if (
          seen[
            parts.normalized
          ]
        ) {
          return;
        }

        seen[
          parts.normalized
        ] = true;

        notices.push({
          decedent:
            candidate,

          normalizedDecedent:
            parts.normalized,

          representativeText:
            body.slice(
              0,
              REPRESENTATIVE_TEXT_LIMIT
            ),

          publicationDate:
            publicationDate
        });
      });

      if (!notices.length) {
        throw new Error(
          'PB1 certified oversize publication contained no authorized estate notices.'
        );
      }

      return notices;
    }

    function assertRecoveredTextIdentity_(
      text
    ) {
      if (
        !text ||
        !String(text).trim()
      ) {
        throw new Error(
          'PB1 certified oversize publication returned no OCR text.'
        );
      }

      text =
        String(text);

      var count =
        text.length;

      if (
        count <=
        CURRENT_NORMAL_EXTRACTION_LIMIT
      ) {
        throw new Error(
          'PB1 certified oversize publication does not exceed the normal extraction limit.'
        );
      }

      if (
        count >
        CERTIFIED_OVERSIZE_TEXT_LIMIT
      ) {
        throw new Error(
          'PB1 certified oversize publication exceeds the certified oversize text limit.'
        );
      }

      if (
        count !==
        EXPECTED_TEXT_CHARACTER_COUNT
      ) {
        throw new Error(
          'PB1 certified oversize publication OCR character count mismatch.'
        );
      }

      var textBytes =
        Utilities
          .newBlob(text)
          .getBytes();

      var sha =
        sha256_(
          textBytes
        );

      if (
        sha !==
        EXPECTED_TEXT_SHA256
      ) {
        throw new Error(
          'PB1 certified oversize publication OCR SHA-256 mismatch.'
        );
      }

      return {
        characterCount:
          count,

        sha256:
          sha
      };
    }

    function analyze(
      blob,
      noticeOffset
    ) {
      noticeOffset =
        assertNoticeOffset_(
          noticeOffset
        );

      /*
       * Exact PDF identity is proven before the first Drive mutation.
       */
      var input =
        assertPdfInput_(
          blob
        );

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
                'REOS Philadelphia Probate Certified Oversize Analysis OCR',

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
            'PB1 certified oversize publication conversion returned no document ID.'
          );
        }

        documentId =
          String(
            converted.id
          );

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

        /*
         * Parsing receives no authority until exact recovered-text
         * evidence has been re-established.
         */
        var textIdentity =
          assertRecoveredTextIdentity_(
            text
          );

        var notices =
          parseEstateNotices_(
            text
          );

        if (
          noticeOffset >=
          notices.length
        ) {
          throw new Error(
            'PB1 certified oversize publication notice offset is outside the parsed publication.'
          );
        }

        var selected =
          notices.slice(
            noticeOffset,
            noticeOffset +
              NOTICE_PAGE_SIZE
          );

        var nextNoticeOffset =
          noticeOffset +
          selected.length;

        var hasMore =
          nextNoticeOffset <
          notices.length;

        result = {
          ok: true,

          analysisVersion: 1,

          publicationDate:
            EXPECTED_PUBLICATION_DATE,

          pdfContentSha256:
            input.sha256,

          pdfByteLength:
            input.bytes.length,

          maxPdfBytes:
            MAX_PDF_BYTES,

          currentNormalExtractionLimit:
            CURRENT_NORMAL_EXTRACTION_LIMIT,

          certifiedOversizeTextLimit:
            CERTIFIED_OVERSIZE_TEXT_LIMIT,

          observedTextCharacterCount:
            textIdentity
              .characterCount,

          observedTextSha256:
            textIdentity.sha256,

          exceedsCurrentNormalExtractionLimit:
            true,

          acceptedForNormalExtraction:
            false,

          exactRecoveredTextIdentityConfirmed:
            true,

          probateParsingExecuted:
            true,

          parsedNoticeCount:
            notices.length,

          noticeOffset:
            noticeOffset,

          noticePageSize:
            NOTICE_PAGE_SIZE,

          selectedNoticeCount:
            selected.length,

          nextNoticeOffset:
            nextNoticeOffset,

          hasMore:
            hasMore,

          cursorDomain:
            CURSOR_DOMAIN,

          representativeTextLimit:
            REPRESENTATIVE_TEXT_LIMIT,

          notices:
            selected,

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
                  'PB1 certified oversize publication temporary artifact cleanup failed.'
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
          'PB1 certified oversize publication cleanup was not confirmed.'
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
      analysisVersion: 1,

      expectedPublicationDate:
        EXPECTED_PUBLICATION_DATE,

      expectedPdfSha256:
        EXPECTED_PDF_SHA256,

      expectedPdfBytes:
        EXPECTED_PDF_BYTES,

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

      noticePageSize:
        NOTICE_PAGE_SIZE,

      representativeTextLimit:
        REPRESENTATIVE_TEXT_LIMIT,

      cursorDomain:
        CURSOR_DOMAIN,

      analyze:
        analyze
    };
  })();
