/*
 * REOS Philadelphia Probate PB1
 * Certified Oversize Orphan-Anchored Marker Evidence Recovery v1
 *
 * Blob-only ORPHAN-anchored marker-evidence recovery for the exact certified PB1 PDF.
 *
 * No HTTP.
 * No public production RPC.
 * No probate parsing.
 * No parser repair authority.
 * No OPA/property lookup.
 * No lead creation or persistence.
 * No county mutation.
 * No ARV / repair / MAO / offer authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateCertifiedOversizeOrphanAnchoredMarkerEvidenceRecovery =
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

    var CERTIFIED_OVERSIZE_TEXT_LIMIT =
      600000;

    var EXPECTED_TEXT_CHARACTER_COUNT =
      566435;

    var EXPECTED_TEXT_SHA256 =
      '31d862834bac845bf76ac000427abe81412a50bd7b88b7e4213594d1a12719c3';

    var MAX_CONTEXT_COUNT =
      8;

    var MAX_CONTEXT_CHARACTERS =
      800;

    var MAX_AGGREGATE_CONTEXT_CHARACTERS =
      6400;

    /*
     * Only ORPHAN may allocate an evidence candidate window.
     * Other fixed locators may describe a selected ORPHAN window,
     * but they cannot create one.
     */
    var PRIMARY_ANCHOR_LABEL =
      'ORPHAN';

    /*
     * Evidence locators only.
     *
     * These expressions are intentionally fixed in source and are not
     * probate parsing grammar. Limited whitespace tolerance exists only
     * to locate bounded OCR context.
     */
    var LOCATOR_DEFINITIONS = [
      {
        label: 'ESTATE',
        pattern:
          /E[\s\u00a0]{0,4}S[\s\u00a0]{0,4}T[\s\u00a0]{0,4}A[\s\u00a0]{0,4}T[\s\u00a0]{0,4}E/gi
      },
      {
        label: 'NOTICE',
        pattern:
          /N[\s\u00a0]{0,4}O[\s\u00a0]{0,4}T[\s\u00a0]{0,4}I[\s\u00a0]{0,4}C[\s\u00a0]{0,4}E/gi
      },
      {
        label: 'ORPHAN',
        pattern:
          /O[\s\u00a0]{0,4}R[\s\u00a0]{0,4}P[\s\u00a0]{0,4}H[\s\u00a0]{0,4}A[\s\u00a0]{0,4}N/gi
      },
      {
        label: 'COURT',
        pattern:
          /C[\s\u00a0]{0,4}O[\s\u00a0]{0,4}U[\s\u00a0]{0,4}R[\s\u00a0]{0,4}T/gi
      },
      {
        label: 'DIVISION',
        pattern:
          /D[\s\u00a0]{0,4}I[\s\u00a0]{0,4}V[\s\u00a0]{0,4}I[\s\u00a0]{0,4}S[\s\u00a0]{0,4}I[\s\u00a0]{0,4}O[\s\u00a0]{0,4}N/gi
      }
    ];

    function fail_(message) {
      throw new Error(
        'PB1 certified oversize orphan-anchored marker evidence recovery rejected: ' +
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

    function sha256_(bytes) {
      assertDigestService_();

      return hex_(
        Utilities.computeDigest(
          Utilities.DigestAlgorithm.SHA_256,
          bytes
        )
      );
    }

    function sha256String_(value) {
      return sha256_(
        Utilities
          .newBlob(
            String(value)
          )
          .getBytes()
      );
    }

    function bytesFromBlob_(blob) {
      if (
        !blob ||
        typeof blob.getBytes !== 'function'
      ) {
        fail_(
          'PDF Blob unavailable'
        );
      }

      var bytes =
        blob.getBytes();

      if (
        !bytes ||
        typeof bytes.length !== 'number'
      ) {
        fail_(
          'PDF bytes unavailable'
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
        fail_(
          'PDF signature invalid'
        );
      }

      for (
        var i = 0;
        i < signature.length;
        i += 1
      ) {
        if (
          unsignedByte_(
            bytes[i]
          ) !==
          signature[i]
        ) {
          fail_(
            'PDF signature invalid'
          );
        }
      }
    }

    function assertPdfInput_(blob) {
      var bytes =
        bytesFromBlob_(
          blob
        );

      if (
        bytes.length >
        MAX_PDF_BYTES
      ) {
        fail_(
          'PDF exceeds maximum size'
        );
      }

      if (
        bytes.length !==
        EXPECTED_PDF_BYTES
      ) {
        fail_(
          'PDF byte length mismatch'
        );
      }

      assertPdfSignature_(
        bytes
      );

      var sha =
        sha256_(
          bytes
        );

      if (
        sha !==
        EXPECTED_PDF_SHA256
      ) {
        fail_(
          'PDF SHA-256 mismatch'
        );
      }

      return {
        byteLength:
          bytes.length,

        sha256:
          sha
      };
    }

    function assertServices_() {
      if (
        typeof Drive === 'undefined' ||
        !Drive.Files ||
        typeof Drive.Files.create !== 'function'
      ) {
        fail_(
          'Advanced Drive v3 unavailable'
        );
      }

      if (
        typeof DocumentApp === 'undefined' ||
        typeof DocumentApp.openById !== 'function'
      ) {
        fail_(
          'DocumentApp unavailable'
        );
      }

      if (
        typeof DriveApp === 'undefined' ||
        typeof DriveApp.getFileById !== 'function'
      ) {
        fail_(
          'DriveApp cleanup unavailable'
        );
      }
    }

    function cleanup_(documentId) {
      DriveApp
        .getFileById(
          documentId
        )
        .setTrashed(
          true
        );

      return true;
    }

    function assertRecoveredTextIdentity_(
      text
    ) {
      text =
        String(
          text || ''
        );

      if (!text.trim()) {
        fail_(
          'OCR text was empty'
        );
      }

      var count =
        text.length;

      if (
        count <=
        CURRENT_NORMAL_EXTRACTION_LIMIT
      ) {
        fail_(
          'OCR text does not exceed normal extraction limit'
        );
      }

      if (
        count >
        CERTIFIED_OVERSIZE_TEXT_LIMIT
      ) {
        fail_(
          'OCR text exceeds certified oversize limit'
        );
      }

      if (
        count !==
        EXPECTED_TEXT_CHARACTER_COUNT
      ) {
        fail_(
          'OCR character count mismatch'
        );
      }

      var sha =
        sha256String_(
          text
        );

      if (
        sha !==
        EXPECTED_TEXT_SHA256
      ) {
        fail_(
          'OCR SHA-256 mismatch'
        );
      }

      return {
        characterCount:
          count,

        sha256:
          sha
      };
    }

    function locatorOrder_(label) {
      for (
        var i = 0;
        i < LOCATOR_DEFINITIONS.length;
        i += 1
      ) {
        if (
          LOCATOR_DEFINITIONS[i].label ===
          label
        ) {
          return i;
        }
      }

      return LOCATOR_DEFINITIONS.length;
    }

    function findLocatorHits_(text) {
      var hits = [];

      LOCATOR_DEFINITIONS.forEach(function (
        definition
      ) {
        var pattern =
          definition.pattern;

        pattern.lastIndex =
          0;

        var match;

        while (
          (
            match =
              pattern.exec(
                text
              )
          ) !== null
        ) {
          hits.push({
            label:
              definition.label,

            index:
              match.index,

            end:
              match.index +
              match[0].length
          });

          /*
           * Defensive progress guard for future locator changes.
           */
          if (
            match[0].length ===
            0
          ) {
            pattern.lastIndex +=
              1;
          }
        }

        pattern.lastIndex =
          0;
      });

      hits.sort(function (
        left,
        right
      ) {
        if (
          left.index !==
          right.index
        ) {
          return (
            left.index -
            right.index
          );
        }

        if (
          left.end !==
          right.end
        ) {
          return (
            left.end -
            right.end
          );
        }

        return (
          locatorOrder_(
            left.label
          ) -
          locatorOrder_(
            right.label
          )
        );
      });

      return hits;
    }

    function windowForHit_(
      textLength,
      hit
    ) {
      var midpoint =
        hit.index +
        Math.floor(
          (
            hit.end -
            hit.index
          ) /
          2
        );

      var start =
        Math.max(
          0,
          midpoint -
            Math.floor(
              MAX_CONTEXT_CHARACTERS /
              2
            )
        );

      var end =
        Math.min(
          textLength,
          start +
            MAX_CONTEXT_CHARACTERS
        );

      if (
        end -
        start <
        MAX_CONTEXT_CHARACTERS &&
        end ===
        textLength
      ) {
        start =
          Math.max(
            0,
            end -
              MAX_CONTEXT_CHARACTERS
          );
      }

      return {
        start:
          start,

        end:
          end
      };
    }

    function labelsInWindow_(
      hits,
      start,
      end
    ) {
      var present = {};

      hits.forEach(function (
        hit
      ) {
        if (
          hit.index <
          end &&
          hit.end >
          start
        ) {
          present[
            hit.label
          ] = true;
        }
      });

      return LOCATOR_DEFINITIONS
        .map(function (
          definition
        ) {
          return definition.label;
        })
        .filter(function (
          label
        ) {
          return present[
            label
          ] ===
          true;
        });
    }

    function hasLabel_(
      labels,
      label
    ) {
      return (
        labels.indexOf(
          label
        ) >= 0
      );
    }

    function candidateComparator_(
      left,
      right
    ) {
      var leftCourtDivision =
        hasLabel_(
          left.labels,
          'COURT'
        ) &&
        hasLabel_(
          left.labels,
          'DIVISION'
        )
          ? 1
          : 0;

      var rightCourtDivision =
        hasLabel_(
          right.labels,
          'COURT'
        ) &&
        hasLabel_(
          right.labels,
          'DIVISION'
        )
          ? 1
          : 0;

      if (
        leftCourtDivision !==
        rightCourtDivision
      ) {
        return (
          rightCourtDivision -
          leftCourtDivision
        );
      }

      var leftNotice =
        hasLabel_(
          left.labels,
          'NOTICE'
        )
          ? 1
          : 0;

      var rightNotice =
        hasLabel_(
          right.labels,
          'NOTICE'
        )
          ? 1
          : 0;

      if (
        leftNotice !==
        rightNotice
      ) {
        return (
          rightNotice -
          leftNotice
        );
      }

      var leftEstate =
        hasLabel_(
          left.labels,
          'ESTATE'
        )
          ? 1
          : 0;

      var rightEstate =
        hasLabel_(
          right.labels,
          'ESTATE'
        )
          ? 1
          : 0;

      if (
        leftEstate !==
        rightEstate
      ) {
        return (
          rightEstate -
          leftEstate
        );
      }

      if (
        left.labels.length !==
        right.labels.length
      ) {
        return (
          right.labels.length -
          left.labels.length
        );
      }

      if (
        left.anchorOffset !==
        right.anchorOffset
      ) {
        return (
          left.anchorOffset -
          right.anchorOffset
        );
      }

      if (
        left.start !==
        right.start
      ) {
        return (
          left.start -
          right.start
        );
      }

      return (
        left.end -
        right.end
      );
    }

    function overlaps_(
      left,
      right
    ) {
      return (
        left.start <
          right.end &&
        left.end >
          right.start
      );
    }

    function extractMarkerEvidence_(
      text
    ) {
      /*
       * findLocatorHits_ scans the complete exact OCR text for the entire
       * fixed locator family before any context limit is applied.
       */
      var hits =
        findLocatorHits_(
          text
        );

      /*
       * ORPHAN is the only primary candidate-window anchor.
       */
      var orphanHits =
        hits.filter(function (
          hit
        ) {
          return (
            hit.label ===
            PRIMARY_ANCHOR_LABEL
          );
        });

      if (!orphanHits.length) {
        fail_(
          'orphan anchor locator produced no evidence'
        );
      }

      /*
       * Build every ORPHAN-anchored candidate before ranking or applying
       * MAX_CONTEXT_COUNT. Generic locators describe candidates only.
       */
      var candidates = [];
      var duplicateWindows = {};

      orphanHits.forEach(function (
        hit
      ) {
        var window =
          windowForHit_(
            text.length,
            hit
          );

        if (
          hit.index <
            window.start ||
          hit.end >
            window.end
        ) {
          fail_(
            'bounded ORPHAN context could not contain anchor hit'
          );
        }

        var key =
          String(
            window.start
          ) +
          ':' +
          String(
            window.end
          );

        /*
         * Exact duplicate candidate windows are deterministically
         * deduplicated. orphanHits is source ordered, so the first
         * retained candidate also has the lowest anchor offset.
         */
        if (
          duplicateWindows[
            key
          ]
        ) {
          return;
        }

        duplicateWindows[
          key
        ] = true;

        var labels =
          labelsInWindow_(
            hits,
            window.start,
            window.end
          );

        if (
          !hasLabel_(
            labels,
            PRIMARY_ANCHOR_LABEL
          )
        ) {
          fail_(
            'ORPHAN anchor missing from candidate locator labels'
          );
        }

        candidates.push({
          start:
            window.start,

          end:
            window.end,

          anchorOffset:
            hit.index,

          labels:
            labels
        });
      });

      candidates.sort(
        candidateComparator_
      );

      /*
       * Rank first, then greedily select non-overlapping bounded windows.
       * Lower-ranked overlaps are skipped; windows are never expanded or
       * merged.
       */
      var selected = [];

      candidates.forEach(function (
        candidate
      ) {
        if (
          selected.length >=
          MAX_CONTEXT_COUNT
        ) {
          return;
        }

        var overlapsSelected =
          selected.some(function (
            existing
          ) {
            return overlaps_(
              candidate,
              existing
            );
          });

        if (
          overlapsSelected
        ) {
          return;
        }

        selected.push(
          candidate
        );
      });

      if (!selected.length) {
        fail_(
          'no bounded ORPHAN contexts were produced'
        );
      }

      /*
       * Ranking controls selection only. Returned evidence is source
       * ordered for deterministic human/offline analysis.
       */
      selected.sort(function (
        left,
        right
      ) {
        if (
          left.start !==
          right.start
        ) {
          return (
            left.start -
            right.start
          );
        }

        return (
          left.end -
          right.end
        );
      });

      var contexts = [];
      var aggregateCharacters =
        0;

      selected.forEach(function (
        candidate
      ) {
        var raw =
          text.slice(
            candidate.start,
            candidate.end
          );

        if (
          raw.length >
          MAX_CONTEXT_CHARACTERS
        ) {
          fail_(
            'ORPHAN context exceeded character ceiling'
          );
        }

        if (
          !hasLabel_(
            candidate.labels,
            PRIMARY_ANCHOR_LABEL
          )
        ) {
          fail_(
            'returned context did not contain ORPHAN'
          );
        }

        aggregateCharacters +=
          raw.length;

        if (
          aggregateCharacters >
          MAX_AGGREGATE_CONTEXT_CHARACTERS
        ) {
          fail_(
            'aggregate ORPHAN context exceeded character ceiling'
          );
        }

        contexts.push({
          locatorLabels:
            candidate.labels,

          startOffset:
            candidate.start,

          /*
           * End offset is zero-based and exclusive.
           */
          endOffset:
            candidate.end,

          rawOcrContext:
            raw,

          contextCharacterCount:
            raw.length,

          contextSha256:
            sha256String_(
              raw
            )
        });
      });

      return {
        contexts:
          contexts,

        aggregateCharacters:
          aggregateCharacters
      };
    }

    function recover(blob) {
      /*
       * Exact PDF identity is established before the first Drive mutation.
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
                'REOS Philadelphia Probate Certified Oversize Orphan Anchored Marker Evidence OCR',

              mimeType:
                'application/vnd.google-apps.document'
            },
            blob,
            {
              ocrLanguage:
                'en',

              fields:
                'id'
            }
          );

        if (
          !converted ||
          !converted.id
        ) {
          fail_(
            'OCR conversion returned no document ID'
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
         * Marker evidence receives no authority until the exact certified
         * recovered-text identity has been re-established.
         */
        var textIdentity =
          assertRecoveredTextIdentity_(
            text
          );

        var markerEvidence =
          extractMarkerEvidence_(
            text
          );

        result = {
          ok:
            true,

          markerEvidenceVersion:
            1,

          pdfContentSha256:
            input.sha256,

          pdfByteLength:
            input.byteLength,

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

          exactRecoveredTextIdentityConfirmed:
            true,

          locatorFamilyCount:
            LOCATOR_DEFINITIONS.length,

          maxContextCount:
            MAX_CONTEXT_COUNT,

          maxContextCharacters:
            MAX_CONTEXT_CHARACTERS,

          maxAggregateContextCharacters:
            MAX_AGGREGATE_CONTEXT_CHARACTERS,

          contextCount:
            markerEvidence
              .contexts
              .length,

          aggregateContextCharacters:
            markerEvidence
              .aggregateCharacters,

          contexts:
            markerEvidence
              .contexts,

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

          httpFetchExecuted:
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
                  'PB1 certified oversize orphan-anchored marker evidence recovery temporary artifact cleanup failed.'
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
        fail_(
          'temporary artifact cleanup was not confirmed'
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
      markerEvidenceVersion:
        1,

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

      locatorFamilyCount:
        LOCATOR_DEFINITIONS.length,

      maxContextCount:
        MAX_CONTEXT_COUNT,

      maxContextCharacters:
        MAX_CONTEXT_CHARACTERS,

      maxAggregateContextCharacters:
        MAX_AGGREGATE_CONTEXT_CHARACTERS,

      recover:
        recover
    };
  })();
