/**
 * REOS Enterprise v3.0
 * Philadelphia Probate Recurring Source Resolver
 *
 * Responsibilities:
 * - discover a recent Legal Intelligencer public-notices issue;
 * - accept only approved ALM-hosted PDFs;
 * - bind the issue date to the expected TLIPN PDF basename;
 * - encode/decode deterministic PB1 notice cursors;
 * - re-resolve the exact cursor-bound issue on continuation;
 * - fail closed when the publication source drifts.
 *
 * This module grants no persistence, trigger, scheduler-management,
 * acquisition, ARV, repair-scope, MAO, or offer authority.
 */

var REOS = REOS || {};

REOS.PhiladelphiaProbateRecurringSource = (function () {
  var CURSOR_PREFIX = 'PB1';
  var CURSOR_DOMAIN_ID =
    'PHL-PROBATE-PB1-V1';

  var TIME_ZONE =
    'America/New_York';

  var MAX_LOOKBACK_DAYS = 10;
  var NOTICE_PAGE_SIZE = 25;

  var ARTICLE_ROOT =
    'https://www.law.com/thelegalintelligencer/';

  var APPROVED_SOURCE_PATTERN =
    /^https:\/\/(?:assets\.alm\.com|images\.law\.com)\//i;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function sha256_(value) {
    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      throw new Error(
        'Philadelphia probate recurring source requires SHA-256 support.'
      );
    }

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        text_(value),
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var normalized =
          byte < 0
            ? byte + 256
            : byte;

        return (
          normalized < 16
            ? '0'
            : ''
        ) +
          normalized.toString(16);
      })
      .join('');
  }

  function assertIsoDate_(value) {
    var iso =
      text_(value);

    var match =
      /^(\d{4})-(\d{2})-(\d{2})$/
        .exec(iso);

    if (!match) {
      throw new Error(
        'Philadelphia probate publication date is invalid.'
      );
    }

    var probe =
      new Date(
        Date.UTC(
          Number(match[1]),
          Number(match[2]) - 1,
          Number(match[3]),
          12,
          0,
          0
        )
      );

    var verified =
      Utilities.formatDate(
        probe,
        'UTC',
        'yyyy-MM-dd'
      );

    if (verified !== iso) {
      throw new Error(
        'Philadelphia probate publication date is not a real calendar date.'
      );
    }

    return {
      iso: iso,
      year:
        Utilities.formatDate(
          probe,
          'UTC',
          'yyyy'
        ),
      month:
        Utilities.formatDate(
          probe,
          'UTC',
          'MM'
        ),
      day:
        Utilities.formatDate(
          probe,
          'UTC',
          'dd'
        ),
      compact:
        Utilities.formatDate(
          probe,
          'UTC',
          'MMddyy'
        ),
      weekday:
        Utilities.formatDate(
          probe,
          'UTC',
          'EEEE'
        ).toLowerCase()
    };
  }

  function recentDate_(
    now,
    offset
  ) {
    now =
      now ||
      new Date();

    var year =
      Number(
        Utilities.formatDate(
          now,
          TIME_ZONE,
          'yyyy'
        )
      );

    var month =
      Number(
        Utilities.formatDate(
          now,
          TIME_ZONE,
          'MM'
        )
      );

    var day =
      Number(
        Utilities.formatDate(
          now,
          TIME_ZONE,
          'dd'
        )
      );

    var probe =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day - offset,
          12,
          0,
          0
        )
      );

    return assertIsoDate_(
      Utilities.formatDate(
        probe,
        'UTC',
        'yyyy-MM-dd'
      )
    );
  }

  function articleUrl_(date) {
    return (
      ARTICLE_ROOT +
      date.year +
      '/' +
      date.month +
      '/' +
      date.day +
      '/' +
      date.weekday +
      '-public-noticescalendars/'
    );
  }

  function approvedSourceUrl_(value) {
    var url =
      text_(value);

    return (
      APPROVED_SOURCE_PATTERN
        .test(url)
    );
  }

  function fetchArticle_(
    date,
    allowMissing
  ) {
    if (
      typeof UrlFetchApp === 'undefined' ||
      !UrlFetchApp ||
      typeof UrlFetchApp.fetch !==
        'function'
    ) {
      throw new Error(
        'Philadelphia probate recurring source requires UrlFetchApp.'
      );
    }

    var url =
      articleUrl_(date);

    var response =
      UrlFetchApp.fetch(
        url,
        {
          method:
            'get',
          followRedirects:
            true,
          muteHttpExceptions:
            true,
          headers: {
            Accept:
              'text/html'
          }
        }
      );

    var status =
      Number(
        response.getResponseCode()
      );

    if (
      status < 200 ||
      status >= 300
    ) {
      if (allowMissing) {
        return null;
      }

      throw new Error(
        'Philadelphia probate publication page unavailable for ' +
        date.iso +
        ': HTTP ' +
        status +
        '.'
      );
    }

    var body =
      String(
        response.getContentText() ||
        ''
      )
        .replace(
          /\\\//g,
          '/'
        )
        .replace(
          /&amp;/gi,
          '&'
        );

    var expected =
      (
        'tlipn' +
        date.compact +
        '.pdf'
      ).toLowerCase();

    var regex =
      /https:\/\/(?:assets\.alm\.com|images\.law\.com)\/[^"'<>\s]+?\.pdf(?:\?[^"'<>\s]*)?/ig;

    var candidates = [];
    var match;

    while (
      (
        match =
          regex.exec(body)
      ) !== null
    ) {
      var candidate =
        text_(match[0]);

      if (
        !approvedSourceUrl_(
          candidate
        )
      ) {
        continue;
      }

      if (
        candidate
          .toLowerCase()
          .indexOf(expected) ===
        -1
      ) {
        continue;
      }

      if (
        candidates.indexOf(
          candidate
        ) ===
        -1
      ) {
        candidates.push(
          candidate
        );
      }
    }

    if (!candidates.length) {
      if (allowMissing) {
        return null;
      }

      throw new Error(
        'Philadelphia probate publication page did not expose the expected PDF for ' +
        date.iso +
        '.'
      );
    }

    if (candidates.length !== 1) {
      throw new Error(
        'Philadelphia probate publication page exposed ambiguous PDF authority for ' +
        date.iso +
        '.'
      );
    }

    return {
      publicationDate:
        date.iso,
      articleUrl:
        url,
      sourceUrl:
        candidates[0],
      sourceSha256:
        sha256_(
          candidates[0]
        )
    };
  }

  function parseCursor_(
    cursor
  ) {
    cursor =
      text_(cursor);

    if (!cursor) {
      return null;
    }

    var parts =
      cursor.split('|');

    if (
      parts.length !== 4 ||
      parts[0] !==
        CURSOR_PREFIX ||
      !/^[0-9a-f]{64}$/
        .test(parts[1]) ||
      !/^\d{4}-\d{2}-\d{2}$/
        .test(parts[2]) ||
      !/^\d+$/
        .test(parts[3])
    ) {
      throw new Error(
        'Philadelphia probate PB1 cursor is malformed.'
      );
    }

    assertIsoDate_(
      parts[2]
    );

    var offset =
      Number(parts[3]);

    if (
      !Number.isInteger(offset) ||
      offset <= 0
    ) {
      throw new Error(
        'Philadelphia probate PB1 cursor offset is invalid.'
      );
    }

    return {
      domainId:
        CURSOR_DOMAIN_ID,
      sourceSha256:
        parts[1],
      publicationDate:
        parts[2],
      noticeOffset:
        offset
    };
  }

  function encodeCursor(
    sourceSha256,
    publicationDate,
    noticeOffset
  ) {
    sourceSha256 =
      text_(
        sourceSha256
      );

    if (
      !/^[0-9a-f]{64}$/
        .test(
          sourceSha256
        )
    ) {
      throw new Error(
        'Philadelphia probate PB1 source SHA-256 is invalid.'
      );
    }

    var date =
      assertIsoDate_(
        publicationDate
      );

    noticeOffset =
      Number(
        noticeOffset
      );

    if (
      !Number.isInteger(
        noticeOffset
      ) ||
      noticeOffset <= 0
    ) {
      throw new Error(
        'Philadelphia probate PB1 cursor offset must be a positive integer.'
      );
    }

    return [
      CURSOR_PREFIX,
      sourceSha256,
      date.iso,
      String(
        noticeOffset
      )
    ].join('|');
  }

  function resolve(
    cursor,
    now
  ) {
    var parsed =
      parseCursor_(
        cursor
      );

    /*
     * Continuation authority is tied to the exact publication date and
     * exact discovered source URL hash. A changed article/PDF mapping
     * fails closed instead of silently moving an active notice offset
     * onto another publication.
     */
    if (parsed) {
      var cursorDate =
        assertIsoDate_(
          parsed.publicationDate
        );

      var continued =
        fetchArticle_(
          cursorDate,
          false
        );

      if (
        continued.sourceSha256 !==
        parsed.sourceSha256
      ) {
        throw new Error(
          'Philadelphia probate PB1 source drift detected.'
        );
      }

      return {
        ok:
          true,
        cursorDomainId:
          CURSOR_DOMAIN_ID,
        publicationDate:
          continued.publicationDate,
        articleUrl:
          continued.articleUrl,
        sourceUrl:
          continued.sourceUrl,
        sourceSha256:
          continued.sourceSha256,
        noticeOffset:
          parsed.noticeOffset,
        noticePageSize:
          NOTICE_PAGE_SIZE,
        continuation:
          true
      };
    }

    /*
     * Initial source discovery is bounded to MAX_LOOKBACK_DAYS and
     * skips weekend dates. The first valid publication in descending
     * date order is the only source authority returned.
     */
    for (
      var offset = 0;
      offset < MAX_LOOKBACK_DAYS;
      offset += 1
    ) {
      var date =
        recentDate_(
          now ||
          new Date(),
          offset
        );

      if (
        date.weekday ===
          'saturday' ||
        date.weekday ===
          'sunday'
      ) {
        continue;
      }

      var discovered =
        fetchArticle_(
          date,
          true
        );

      if (!discovered) {
        continue;
      }

      return {
        ok:
          true,
        cursorDomainId:
          CURSOR_DOMAIN_ID,
        publicationDate:
          discovered
            .publicationDate,
        articleUrl:
          discovered
            .articleUrl,
        sourceUrl:
          discovered
            .sourceUrl,
        sourceSha256:
          discovered
            .sourceSha256,
        noticeOffset:
          0,
        noticePageSize:
          NOTICE_PAGE_SIZE,
        continuation:
          false
      };
    }

    throw new Error(
      'No recent Philadelphia probate publication was discovered within the bounded lookback window.'
    );
  }

  return {
    cursorPrefix:
      CURSOR_PREFIX,
    cursorDomainId:
      CURSOR_DOMAIN_ID,
    maxLookbackDays:
      MAX_LOOKBACK_DAYS,
    noticePageSize:
      NOTICE_PAGE_SIZE,
    approvedSourceUrl:
      approvedSourceUrl_,
    parseCursor:
      parseCursor_,
    encodeCursor:
      encodeCursor,
    resolve:
      resolve
  };
})();
