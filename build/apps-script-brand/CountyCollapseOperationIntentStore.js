/**
 * REOS Enterprise - County Collapse Operation-Intent Store v1
 *
 * Durable append-only evidence journal for the future county
 * code-violation collapse executor.
 *
 * This module:
 *   - does not provision its workbook or sheets;
 *   - does not acquire or release ScriptLock;
 *   - does not mutate county data;
 *   - does not expose an Apps Script RPC;
 *   - does not retry failed writes;
 *   - does not recreate deleted rows;
 *   - does not create execution authority.
 */

var REOS = REOS || {};

REOS.CountyCollapseOperationIntentStore = (function () {
  'use strict';

  var CONTRACT_VERSION_ = 1;

  var PROPERTY_KEY_ =
    'REOS_COUNTY_COLLAPSE_OPERATION_INTENT_WORKBOOK_ID';

  var EVENT_SHEET_ =
    'COUNTY_COLLAPSE_OPERATION_INTENTS';

  var CHUNK_SHEET_ =
    'COUNTY_COLLAPSE_OPERATION_INTENT_CHUNKS';

  var GENESIS_ = 'GENESIS';

  var MAX_EVENT_PAYLOAD_UTF8_BYTES_ =
    1048576;

  var MAX_CHUNK_UTF8_BYTES_ =
    16384;

  var MAX_CHUNKS_PER_EVENT_ =
    64;

  var MAX_EVENTS_PER_OPERATION_ =
    32;

  var EVENT_HEADERS_ = [
    'Operation ID',
    'Event Sequence',
    'Event Type',
    'Event Timestamp UTC',
    'Operation Intent Contract Version',
    'Executor Implementation Version',
    'Group Number',
    'Winner Distress Lead ID',
    'Target Delete Distress Lead ID',
    'Payload SHA-256',
    'Payload UTF-8 Bytes',
    'Payload Chunk Count',
    'Previous Event SHA-256',
    'Event SHA-256'
  ];

  var CHUNK_HEADERS_ = [
    'Operation ID',
    'Event Sequence',
    'Chunk Index',
    'Chunk UTF-8 Bytes',
    'Chunk SHA-256',
    'Chunk Data'
  ];

  var EVENT_TYPES_ = {
    INTENT_PREPARED: true,
    DELETE_INVOCATION_STARTED: true,
    POSTDELETE_VERIFIED: true,
    COLLAPSE_DELETE_VERIFIED: true,
    COLLAPSE_EXECUTOR_PRECONDITION_FAILED: true,
    COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN: true,
    RECONCILIATION_NOTE: true
  };

  var TERMINAL_TYPES_ = {
    COLLAPSE_DELETE_VERIFIED: true,
    COLLAPSE_EXECUTOR_PRECONDITION_FAILED: true,
    COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN: true
  };

  function fail_(message) {
    throw new Error(
      'COUNTY_COLLAPSE_OPERATION_INTENT_STORE: ' +
      message
    );
  }

  function hasOwn_(value, key) {
    return Object.prototype
      .hasOwnProperty
      .call(
        value,
        key
      );
  }

  function isPlainObject_(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.prototype
        .toString
        .call(value) ===
        '[object Object]'
    );
  }

  function assertExactFields_(
    value,
    fields,
    label
  ) {
    if (!isPlainObject_(value)) {
      fail_(
        label +
        ' must be a plain object.'
      );
    }

    var actual =
      Object.keys(value)
        .slice()
        .sort();

    var expected =
      fields
        .slice()
        .sort();

    if (
      actual.length !==
      expected.length
    ) {
      fail_(
        label +
        ' has missing or unknown fields.'
      );
    }

    for (
      var index = 0;
      index < expected.length;
      index++
    ) {
      if (
        actual[index] !==
        expected[index]
      ) {
        fail_(
          label +
          ' has missing or unknown fields.'
        );
      }
    }
  }

  function requireString_(
    value,
    label
  ) {
    if (
      typeof value !== 'string' ||
      value === ''
    ) {
      fail_(
        label +
        ' must be a non-empty string.'
      );
    }

    return value;
  }

  function requireSafeCellText_(
    value,
    label
  ) {
    var text =
      requireString_(
        value,
        label
      );

    if (
      /^[=+\-@]/.test(text) ||
      /[\u0000-\u001f\u007f]/.test(text)
    ) {
      fail_(
        label +
        ' contains unsafe spreadsheet text.'
      );
    }

    return text;
  }

  function requirePositiveInteger_(
    value,
    label
  ) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      Math.floor(value) !== value ||
      value < 1
    ) {
      fail_(
        label +
        ' must be a positive finite integer.'
      );
    }

    return value;
  }

  function requireNonNegativeInteger_(
    value,
    label
  ) {
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      Math.floor(value) !== value ||
      value < 0
    ) {
      fail_(
        label +
        ' must be a non-negative finite integer.'
      );
    }

    return value;
  }

  function requireHash_(
    value,
    label
  ) {
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{64}$/.test(value)
    ) {
      fail_(
        label +
        ' must be lowercase SHA-256 hex.'
      );
    }

    return value;
  }

  function requireTimestamp_(
    value,
    label
  ) {
    requireString_(
      value,
      label
    );

    var parsed =
      new Date(value);

    if (
      !Number.isFinite(
        parsed.getTime()
      ) ||
      parsed.toISOString() !==
        value
    ) {
      fail_(
        label +
        ' must be canonical UTC ISO-8601.'
      );
    }

    return value;
  }

  /*
   * Strict non-coercive canonical JSON.
   *
   * Object keys sort lexicographically. Arrays retain semantic order.
   * Unsupported values, sparse arrays, cyclic values, Date objects,
   * functions, symbols, bigint, NaN and infinity fail closed.
   */
  function canonicalJson_(
    value,
    stack
  ) {
    stack =
      stack ||
      [];

    if (value === null) {
      return 'null';
    }

    var type =
      typeof value;

    if (type === 'string') {
      return JSON.stringify(value);
    }

    if (type === 'boolean') {
      return value
        ? 'true'
        : 'false';
    }

    if (type === 'number') {
      if (!Number.isFinite(value)) {
        fail_(
          'Canonical JSON rejects non-finite numbers.'
        );
      }

      if (value === 0) {
        return '0';
      }

      return JSON.stringify(value);
    }

    if (
      type === 'undefined' ||
      type === 'function' ||
      type === 'symbol' ||
      type === 'bigint'
    ) {
      fail_(
        'Canonical JSON contains an unsupported runtime value.'
      );
    }

    if (
      value !== null &&
      typeof value === 'object'
    ) {
      if (
        stack.indexOf(value) !==
        -1
      ) {
        fail_(
          'Canonical JSON rejects cyclic structures.'
        );
      }

      stack.push(value);

      try {
        if (Array.isArray(value)) {
          var items = [];

          for (
            var arrayIndex = 0;
            arrayIndex < value.length;
            arrayIndex++
          ) {
            if (
              !hasOwn_(
                value,
                String(arrayIndex)
              )
            ) {
              fail_(
                'Canonical JSON rejects sparse arrays.'
              );
            }

            items.push(
              canonicalJson_(
                value[arrayIndex],
                stack
              )
            );
          }

          return (
            '[' +
            items.join(',') +
            ']'
          );
        }

        if (!isPlainObject_(value)) {
          fail_(
            'Canonical JSON requires plain objects.'
          );
        }

        if (
          typeof Object.getOwnPropertySymbols ===
            'function' &&
          Object.getOwnPropertySymbols(value)
            .length !== 0
        ) {
          fail_(
            'Canonical JSON rejects symbol keys.'
          );
        }

        var keys =
          Object.keys(value)
            .slice()
            .sort();

        var properties =
          keys.map(function (key) {
            return (
              JSON.stringify(key) +
              ':' +
              canonicalJson_(
                value[key],
                stack
              )
            );
          });

        return (
          '{' +
          properties.join(',') +
          '}'
        );
      } finally {
        stack.pop();
      }
    }

    fail_(
      'Canonical JSON encountered an unsupported value.'
    );
  }

  function sha256HexText_(text) {
    if (
      typeof Utilities === 'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function' ||
      !Utilities.DigestAlgorithm ||
      !Utilities.Charset
    ) {
      fail_(
        'Utilities SHA-256 support is unavailable.'
      );
    }

    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        String(text),
        Utilities.Charset.UTF_8
      );

    return digest
      .map(function (byte) {
        var number =
          byte < 0
            ? byte + 256
            : byte;

        var hex =
          number.toString(16);

        return (
          hex.length === 1
            ? '0' + hex
            : hex
        );
      })
      .join('');
  }

  function codePointAt_(
    text,
    index
  ) {
    var first =
      text.charCodeAt(index);

    if (
      first >= 0xd800 &&
      first <= 0xdbff
    ) {
      if (
        index + 1 >=
        text.length
      ) {
        fail_(
          'UTF-8 encoder encountered an unpaired high surrogate.'
        );
      }

      var second =
        text.charCodeAt(
          index + 1
        );

      if (
        second < 0xdc00 ||
        second > 0xdfff
      ) {
        fail_(
          'UTF-8 encoder encountered an unpaired high surrogate.'
        );
      }

      return {
        codePoint:
          (
            (
              first - 0xd800
            ) * 0x400
          ) +
          (
            second - 0xdc00
          ) +
          0x10000,
        width: 2
      };
    }

    if (
      first >= 0xdc00 &&
      first <= 0xdfff
    ) {
      fail_(
        'UTF-8 encoder encountered an unpaired low surrogate.'
      );
    }

    return {
      codePoint: first,
      width: 1
    };
  }

  function utf8CodePointBytes_(
    codePoint
  ) {
    if (codePoint <= 0x7f) {
      return 1;
    }

    if (codePoint <= 0x7ff) {
      return 2;
    }

    if (codePoint <= 0xffff) {
      return 3;
    }

    return 4;
  }

  function utf8ByteLength_(text) {
    text =
      String(text);

    var bytes = 0;

    for (
      var index = 0;
      index < text.length;
    ) {
      var point =
        codePointAt_(
          text,
          index
        );

      bytes +=
        utf8CodePointBytes_(
          point.codePoint
        );

      index +=
        point.width;
    }

    return bytes;
  }

  function chunkUtf8_(text) {
    text =
      String(text);

    var chunks = [];
    var start = 0;
    var index = 0;
    var bytes = 0;

    while (
      index < text.length
    ) {
      var point =
        codePointAt_(
          text,
          index
        );

      var pointBytes =
        utf8CodePointBytes_(
          point.codePoint
        );

      if (
        bytes > 0 &&
        bytes + pointBytes >
          MAX_CHUNK_UTF8_BYTES_
      ) {
        chunks.push(
          text.slice(
            start,
            index
          )
        );

        start =
          index;

        bytes = 0;
      }

      bytes +=
        pointBytes;

      index +=
        point.width;
    }

    if (
      start < text.length
    ) {
      chunks.push(
        text.slice(start)
      );
    }

    if (chunks.length === 0) {
      chunks.push('');
    }

    return chunks;
  }

  /*
   * Chunk text is stored as canonical base64 UTF-8.
   *
   * This prevents any chunk beginning with formula-significant text
   * from being interpreted as a spreadsheet formula while preserving
   * exact canonical payload bytes for readback.
   */
  function base64EncodeUtf8_(text) {
    if (
      typeof Utilities.base64Encode !==
        'function'
    ) {
      fail_(
        'Utilities base64Encode support is unavailable.'
      );
    }

    return Utilities.base64Encode(
      String(text),
      Utilities.Charset.UTF_8
    );
  }

  function base64DecodeUtf8_(value) {
    if (
      typeof Utilities.base64Decode !==
        'function' ||
      typeof Utilities.newBlob !==
        'function'
    ) {
      fail_(
        'Utilities base64 decode support is unavailable.'
      );
    }

    var bytes;

    try {
      bytes =
        Utilities.base64Decode(
          String(value)
        );
    } catch (error) {
      fail_(
        'Chunk data is not valid base64.'
      );
    }

    var text;

    try {
      text =
        Utilities
          .newBlob(bytes)
          .getDataAsString(
            Utilities.Charset.UTF_8
          );
    } catch (error) {
      fail_(
        'Chunk data is not valid UTF-8.'
      );
    }

    if (
      base64EncodeUtf8_(text) !==
      String(value)
    ) {
      fail_(
        'Chunk data is not canonical base64 UTF-8.'
      );
    }

    return text;
  }

  function assertLockContext_(
    lockContext
  ) {
    if (
      !REOS.Database ||
      typeof REOS.Database
        .assertScriptLockContext !==
        'function'
    ) {
      fail_(
        'Database lock-context assertion is unavailable.'
      );
    }

    REOS.Database
      .assertScriptLockContext(
        lockContext
      );

    return true;
  }

  function configuredWorkbookId_() {
    if (
      typeof PropertiesService ===
        'undefined' ||
      !PropertiesService ||
      typeof PropertiesService
        .getScriptProperties !==
        'function'
    ) {
      fail_(
        'Script Properties are unavailable.'
      );
    }

    var properties =
      PropertiesService
        .getScriptProperties();

    if (
      !properties ||
      typeof properties.getProperty !==
        'function'
    ) {
      fail_(
        'Script Properties read access is unavailable.'
      );
    }

    var workbookId =
      String(
        properties.getProperty(
          PROPERTY_KEY_
        ) ||
        ''
      ).trim();

    if (!workbookId) {
      fail_(
        'Storage workbook ID is not configured.'
      );
    }

    requireSafeCellText_(
      workbookId,
      'Storage workbook ID'
    );

    return workbookId;
  }

  function exactHeaders_(
    sheet,
    expected,
    label
  ) {
    if (
      !sheet ||
      typeof sheet.getLastColumn !==
        'function' ||
      typeof sheet.getRange !==
        'function'
    ) {
      fail_(
        label +
        ' sheet API is unavailable.'
      );
    }

    if (
      sheet.getLastColumn() !==
      expected.length
    ) {
      fail_(
        label +
        ' header width mismatch.'
      );
    }

    var range =
      sheet.getRange(
        1,
        1,
        1,
        expected.length
      );

    var values =
      range.getValues();

    if (
      !Array.isArray(values) ||
      values.length !== 1 ||
      !Array.isArray(values[0]) ||
      values[0].length !==
        expected.length
    ) {
      fail_(
        label +
        ' header row is malformed.'
      );
    }

    for (
      var index = 0;
      index < expected.length;
      index++
    ) {
      if (
        values[0][index] !==
        expected[index]
      ) {
        fail_(
          label +
          ' header mismatch.'
        );
      }
    }

    if (
      typeof range.getFormulas ===
        'function'
    ) {
      var formulas =
        range.getFormulas();

      if (
        formulas.some(function (row) {
          return row.some(function (formula) {
            return formula !== '';
          });
        })
      ) {
        fail_(
          label +
          ' headers contain formulas.'
        );
      }
    }
  }

  function openStorage_() {
    if (
      typeof SpreadsheetApp ===
        'undefined' ||
      !SpreadsheetApp ||
      typeof SpreadsheetApp.openById !==
        'function' ||
      typeof SpreadsheetApp
        .getActiveSpreadsheet !==
        'function'
    ) {
      fail_(
        'SpreadsheetApp storage APIs are unavailable.'
      );
    }

    var workbookId =
      configuredWorkbookId_();

    var active =
      SpreadsheetApp
        .getActiveSpreadsheet();

    if (
      !active ||
      typeof active.getId !==
        'function'
    ) {
      fail_(
        'Active county-data spreadsheet identity is unavailable.'
      );
    }

    if (
      active.getId() ===
      workbookId
    ) {
      fail_(
        'Storage workbook must be separate from the active county-data workbook.'
      );
    }

    var workbook =
      SpreadsheetApp
        .openById(
          workbookId
        );

    if (
      !workbook ||
      typeof workbook.getId !==
        'function' ||
      workbook.getId() !==
        workbookId ||
      typeof workbook.getSheets !==
        'function' ||
      typeof workbook.getSheetByName !==
        'function'
    ) {
      fail_(
        'Configured storage workbook identity could not be verified.'
      );
    }

    var sheets =
      workbook.getSheets();

    if (
      !Array.isArray(sheets) ||
      sheets.length !== 2
    ) {
      fail_(
        'Storage workbook must contain exactly two journal sheets.'
      );
    }

    var names =
      sheets
        .map(function (sheet) {
          if (
            !sheet ||
            typeof sheet.getName !==
              'function'
          ) {
            fail_(
              'Storage workbook contains an invalid sheet.'
            );
          }

          return sheet.getName();
        })
        .sort();

    var expectedNames =
      [
        EVENT_SHEET_,
        CHUNK_SHEET_
      ].sort();

    if (
      names[0] !==
        expectedNames[0] ||
      names[1] !==
        expectedNames[1]
    ) {
      fail_(
        'Storage workbook journal sheet set is invalid.'
      );
    }

    var eventSheet =
      workbook.getSheetByName(
        EVENT_SHEET_
      );

    var chunkSheet =
      workbook.getSheetByName(
        CHUNK_SHEET_
      );

    if (
      !eventSheet ||
      !chunkSheet
    ) {
      fail_(
        'Storage workbook journal sheets are missing.'
      );
    }

    exactHeaders_(
      eventSheet,
      EVENT_HEADERS_,
      'Event'
    );

    exactHeaders_(
      chunkSheet,
      CHUNK_HEADERS_,
      'Chunk'
    );

    return {
      workbookId:
        workbookId,
      workbook:
        workbook,
      eventSheet:
        eventSheet,
      chunkSheet:
        chunkSheet
    };
  }

  function readSheetRows_(
    sheet,
    headers,
    label
  ) {
    exactHeaders_(
      sheet,
      headers,
      label
    );

    if (
      typeof sheet.getLastRow !==
        'function'
    ) {
      fail_(
        label +
        ' getLastRow is unavailable.'
      );
    }

    var lastRow =
      sheet.getLastRow();

    if (
      typeof lastRow !==
        'number' ||
      !Number.isFinite(lastRow) ||
      Math.floor(lastRow) !==
        lastRow ||
      lastRow < 1
    ) {
      fail_(
        label +
        ' last-row geometry is invalid.'
      );
    }

    if (lastRow === 1) {
      return [];
    }

    var range =
      sheet.getRange(
        2,
        1,
        lastRow - 1,
        headers.length
      );

    var values =
      range.getValues();

    if (
      !Array.isArray(values) ||
      values.length !==
        lastRow - 1
    ) {
      fail_(
        label +
        ' row read is incomplete.'
      );
    }

    if (
      typeof range.getFormulas !==
        'function'
    ) {
      fail_(
        label +
        ' formula readback is required.'
      );
    }

    var formulas =
      range.getFormulas();

    if (
      !Array.isArray(formulas) ||
      formulas.length !==
        values.length
    ) {
      fail_(
        label +
        ' formula readback is incomplete.'
      );
    }

    for (
      var rowIndex = 0;
      rowIndex < values.length;
      rowIndex++
    ) {
      if (
        !Array.isArray(
          values[rowIndex]
        ) ||
        values[rowIndex].length !==
          headers.length ||
        !Array.isArray(
          formulas[rowIndex]
        ) ||
        formulas[rowIndex].length !==
          headers.length
      ) {
        fail_(
          label +
          ' row geometry is malformed.'
        );
      }

      for (
        var columnIndex = 0;
        columnIndex < headers.length;
        columnIndex++
      ) {
        if (
          formulas[rowIndex][columnIndex] !==
          ''
        ) {
          fail_(
            label +
            ' historical row contains a formula.'
          );
        }
      }
    }

    return values.map(
      function (row, index) {
        return {
          rowNumber:
            index + 2,
          values:
            row.slice()
        };
      }
    );
  }

  function validateManifest_(
    manifest
  ) {
    requireSafeCellText_(
      manifest.operationId,
      'Operation ID'
    );

    requirePositiveInteger_(
      manifest.eventSequence,
      'Event sequence'
    );

    requireSafeCellText_(
      manifest.eventType,
      'Event type'
    );

    if (
      !EVENT_TYPES_[
        manifest.eventType
      ]
    ) {
      fail_(
        'Unknown event type.'
      );
    }

    requireTimestamp_(
      manifest.eventTimestampUtc,
      'Event timestamp'
    );

    if (
      manifest.operationIntentContractVersion !==
      CONTRACT_VERSION_
    ) {
      fail_(
        'Operation-intent contract version mismatch.'
      );
    }

    requireSafeCellText_(
      manifest.executorImplementationVersion,
      'Executor implementation version'
    );

    requirePositiveInteger_(
      manifest.groupNumber,
      'Group number'
    );

    requireSafeCellText_(
      manifest.winnerDistressLeadId,
      'Winner Distress Lead ID'
    );

    requireSafeCellText_(
      manifest.targetDeleteDistressLeadId,
      'Target delete Distress Lead ID'
    );

    requireHash_(
      manifest.payloadSha256,
      'Payload SHA-256'
    );

    requirePositiveInteger_(
      manifest.payloadUtf8Bytes,
      'Payload UTF-8 bytes'
    );

    if (
      manifest.payloadUtf8Bytes >
      MAX_EVENT_PAYLOAD_UTF8_BYTES_
    ) {
      fail_(
        'Payload UTF-8 byte length exceeds v1 limit.'
      );
    }

    requirePositiveInteger_(
      manifest.payloadChunkCount,
      'Payload chunk count'
    );

    if (
      manifest.payloadChunkCount >
      MAX_CHUNKS_PER_EVENT_
    ) {
      fail_(
        'Payload chunk count exceeds v1 limit.'
      );
    }

    if (
      manifest.eventSequence === 1
    ) {
      if (
        manifest.previousEventSha256 !==
        GENESIS_
      ) {
        fail_(
          'First event previous hash is not genesis.'
        );
      }
    } else {
      requireHash_(
        manifest.previousEventSha256,
        'Previous event SHA-256'
      );
    }

    requireHash_(
      manifest.eventSha256,
      'Event SHA-256'
    );
  }

  function manifestFromRow_(row) {
    var values =
      row.values;

    var manifest = {
      operationId:
        values[0],
      eventSequence:
        values[1],
      eventType:
        values[2],
      eventTimestampUtc:
        values[3],
      operationIntentContractVersion:
        values[4],
      executorImplementationVersion:
        values[5],
      groupNumber:
        values[6],
      winnerDistressLeadId:
        values[7],
      targetDeleteDistressLeadId:
        values[8],
      payloadSha256:
        values[9],
      payloadUtf8Bytes:
        values[10],
      payloadChunkCount:
        values[11],
      previousEventSha256:
        values[12],
      eventSha256:
        values[13],
      rowNumber:
        row.rowNumber
    };

    validateManifest_(
      manifest
    );

    return manifest;
  }

  function chunkFromRow_(row) {
    var values =
      row.values;

    var chunk = {
      operationId:
        values[0],
      eventSequence:
        values[1],
      chunkIndex:
        values[2],
      chunkUtf8Bytes:
        values[3],
      chunkSha256:
        values[4],
      chunkData:
        values[5],
      rowNumber:
        row.rowNumber
    };

    requireSafeCellText_(
      chunk.operationId,
      'Chunk operation ID'
    );

    requirePositiveInteger_(
      chunk.eventSequence,
      'Chunk event sequence'
    );

    requireNonNegativeInteger_(
      chunk.chunkIndex,
      'Chunk index'
    );

    requirePositiveInteger_(
      chunk.chunkUtf8Bytes,
      'Chunk UTF-8 bytes'
    );

    if (
      chunk.chunkUtf8Bytes >
      MAX_CHUNK_UTF8_BYTES_
    ) {
      fail_(
        'Chunk UTF-8 byte length exceeds v1 limit.'
      );
    }

    requireHash_(
      chunk.chunkSha256,
      'Chunk SHA-256'
    );

    requireString_(
      chunk.chunkData,
      'Chunk data'
    );

    if (
      !/^[A-Za-z0-9+/]+={0,2}$/.test(
        chunk.chunkData
      )
    ) {
      fail_(
        'Chunk data is not base64 text.'
      );
    }

    return chunk;
  }

  function eventHashMaterial_(
    manifest
  ) {
    return {
      eventSequence:
        manifest.eventSequence,
      eventTimestampUtc:
        manifest.eventTimestampUtc,
      eventType:
        manifest.eventType,
      executorImplementationVersion:
        manifest.executorImplementationVersion,
      groupNumber:
        manifest.groupNumber,
      operationId:
        manifest.operationId,
      operationIntentContractVersion:
        manifest.operationIntentContractVersion,
      payloadChunkCount:
        manifest.payloadChunkCount,
      payloadSha256:
        manifest.payloadSha256,
      payloadUtf8Bytes:
        manifest.payloadUtf8Bytes,
      previousEventSha256:
        manifest.previousEventSha256,
      targetDeleteDistressLeadId:
        manifest.targetDeleteDistressLeadId,
      winnerDistressLeadId:
        manifest.winnerDistressLeadId
    };
  }

  function eventSha256_(manifest) {
    return sha256HexText_(
      canonicalJson_(
        eventHashMaterial_(
          manifest
        )
      )
    );
  }

  function verifyPayloadEnvelope_(
    payload,
    manifest,
    operationCreatedTimestampUtc
  ) {
    assertExactFields_(
      payload,
      [
        'data',
        'eventSequence',
        'eventTimestampUtc',
        'eventType',
        'executorImplementationVersion',
        'groupNumber',
        'operationCreatedTimestampUtc',
        'operationId',
        'operationIntentContractVersion',
        'targetDeleteDistressLeadId',
        'winnerDistressLeadId'
      ],
      'Canonical event payload envelope'
    );

    if (
      payload.operationId !==
        manifest.operationId ||
      payload.eventSequence !==
        manifest.eventSequence ||
      payload.eventType !==
        manifest.eventType ||
      payload.eventTimestampUtc !==
        manifest.eventTimestampUtc ||
      payload.operationIntentContractVersion !==
        CONTRACT_VERSION_ ||
      payload.executorImplementationVersion !==
        manifest.executorImplementationVersion ||
      payload.groupNumber !==
        manifest.groupNumber ||
      payload.winnerDistressLeadId !==
        manifest.winnerDistressLeadId ||
      payload.targetDeleteDistressLeadId !==
        manifest.targetDeleteDistressLeadId
    ) {
      fail_(
        'Canonical payload envelope disagrees with manifest identity.'
      );
    }

    requireTimestamp_(
      payload.operationCreatedTimestampUtc,
      'Operation creation timestamp'
    );

    if (
      operationCreatedTimestampUtc !==
        null &&
      payload.operationCreatedTimestampUtc !==
        operationCreatedTimestampUtc
    ) {
      fail_(
        'Operation creation timestamp changed.'
      );
    }

    if (
      !isPlainObject_(
        payload.data
      )
    ) {
      fail_(
        'Canonical event payload data must be a plain object.'
      );
    }
  }

  function validateTransitions_(events) {
    var barrierSeen = false;
    var postdeleteSeen = false;
    var terminalSeen = false;

    for (
      var index = 0;
      index < events.length;
      index++
    ) {
      var type =
        events[index]
          .manifest
          .eventType;

      if (terminalSeen) {
        fail_(
          'Event exists after terminal operation state.'
        );
      }

      if (
        type ===
        'INTENT_PREPARED' &&
        index !== 0
      ) {
        fail_(
          'INTENT_PREPARED may appear only at sequence 1.'
        );
      }

      if (
        type ===
        'DELETE_INVOCATION_STARTED'
      ) {
        if (barrierSeen) {
          fail_(
            'Delete invocation barrier is duplicated.'
          );
        }

        barrierSeen = true;
      }

      if (
        type ===
        'POSTDELETE_VERIFIED'
      ) {
        if (
          !barrierSeen ||
          postdeleteSeen
        ) {
          fail_(
            'POSTDELETE_VERIFIED requires exactly one prior delete barrier.'
          );
        }

        postdeleteSeen = true;
      }

      if (
        type ===
        'COLLAPSE_DELETE_VERIFIED' &&
        (
          !barrierSeen ||
          !postdeleteSeen
        )
      ) {
        fail_(
          'Verified delete terminal requires barrier and post-delete verification.'
        );
      }

      if (
        type ===
          'COLLAPSE_EXECUTOR_PRECONDITION_FAILED' &&
        barrierSeen
      ) {
        fail_(
          'Precondition-failed terminal is forbidden after delete barrier.'
        );
      }

      if (
        TERMINAL_TYPES_[type]
      ) {
        terminalSeen = true;
      }
    }
  }

  function readOperationFromStorage_(
    storage,
    operationId
  ) {
    operationId =
      requireSafeCellText_(
        operationId,
        'Operation ID'
      );

    var manifestRows =
      readSheetRows_(
        storage.eventSheet,
        EVENT_HEADERS_,
        'Event'
      )
        .filter(function (row) {
          return (
            row.values[0] ===
            operationId
          );
        });

    var chunkRows =
      readSheetRows_(
        storage.chunkSheet,
        CHUNK_HEADERS_,
        'Chunk'
      )
        .filter(function (row) {
          return (
            row.values[0] ===
            operationId
          );
        });

    if (
      manifestRows.length === 0 &&
      chunkRows.length === 0
    ) {
      return {
        found: false,
        operationId:
          operationId,
        events: []
      };
    }

    if (
      manifestRows.length === 0 ||
      chunkRows.length === 0
    ) {
      fail_(
        'Operation has orphaned manifest or chunk rows.'
      );
    }

    if (
      manifestRows.length >
      MAX_EVENTS_PER_OPERATION_
    ) {
      fail_(
        'Operation exceeds the v1 event limit.'
      );
    }

    var manifests =
      manifestRows.map(
        manifestFromRow_
      );

    var chunks =
      chunkRows.map(
        chunkFromRow_
      );

    var events = [];
    var expectedPrevious =
      GENESIS_;

    var identity = null;

    var operationCreatedTimestampUtc =
      null;

    var chunkCursor = 0;

    for (
      var index = 0;
      index < manifests.length;
      index++
    ) {
      var manifest =
        manifests[index];

      var expectedSequence =
        index + 1;

      if (
        manifest.eventSequence !==
        expectedSequence
      ) {
        fail_(
          'Event sequence is missing, duplicated, or physically reordered.'
        );
      }

      if (
        manifest.previousEventSha256 !==
        expectedPrevious
      ) {
        fail_(
          'Previous-event hash chain is broken.'
        );
      }

      if (
        eventSha256_(
          manifest
        ) !==
        manifest.eventSha256
      ) {
        fail_(
          'Event SHA-256 mismatch.'
        );
      }

      if (identity === null) {
        if (
          manifest.eventType !==
          'INTENT_PREPARED'
        ) {
          fail_(
            'Event sequence 1 must be INTENT_PREPARED.'
          );
        }

        identity = {
          executorImplementationVersion:
            manifest.executorImplementationVersion,
          groupNumber:
            manifest.groupNumber,
          winnerDistressLeadId:
            manifest.winnerDistressLeadId,
          targetDeleteDistressLeadId:
            manifest.targetDeleteDistressLeadId
        };
      } else if (
        manifest.executorImplementationVersion !==
          identity.executorImplementationVersion ||
        manifest.groupNumber !==
          identity.groupNumber ||
        manifest.winnerDistressLeadId !==
          identity.winnerDistressLeadId ||
        manifest.targetDeleteDistressLeadId !==
          identity.targetDeleteDistressLeadId
      ) {
        fail_(
          'Immutable operation identity changed.'
        );
      }

      var eventChunks = [];

      while (
        chunkCursor < chunks.length &&
        chunks[chunkCursor].eventSequence ===
          manifest.eventSequence
      ) {
        eventChunks.push(
          chunks[chunkCursor]
        );

        chunkCursor++;
      }

      if (
        eventChunks.length !==
        manifest.payloadChunkCount
      ) {
        fail_(
          'Event chunk count does not match manifest.'
        );
      }

      var parts = [];

      for (
        var chunkIndex = 0;
        chunkIndex < eventChunks.length;
        chunkIndex++
      ) {
        var chunk =
          eventChunks[chunkIndex];

        if (
          chunk.operationId !==
            operationId ||
          chunk.eventSequence !==
            manifest.eventSequence ||
          chunk.chunkIndex !==
            chunkIndex
        ) {
          fail_(
            'Chunk identity, sequence, or ordering is invalid.'
          );
        }

        var decoded =
          base64DecodeUtf8_(
            chunk.chunkData
          );

        if (
          utf8ByteLength_(
            decoded
          ) !==
          chunk.chunkUtf8Bytes
        ) {
          fail_(
            'Chunk UTF-8 byte length mismatch.'
          );
        }

        if (
          sha256HexText_(
            decoded
          ) !==
          chunk.chunkSha256
        ) {
          fail_(
            'Chunk SHA-256 mismatch.'
          );
        }

        parts.push(
          decoded
        );
      }

      var canonicalPayload =
        parts.join('');

      if (
        utf8ByteLength_(
          canonicalPayload
        ) !==
        manifest.payloadUtf8Bytes
      ) {
        fail_(
          'Payload UTF-8 byte length mismatch.'
        );
      }

      if (
        sha256HexText_(
          canonicalPayload
        ) !==
        manifest.payloadSha256
      ) {
        fail_(
          'Payload SHA-256 mismatch.'
        );
      }

      var payload;

      try {
        payload =
          JSON.parse(
            canonicalPayload
          );
      } catch (error) {
        fail_(
          'Canonical payload JSON cannot be parsed.'
        );
      }

      if (
        canonicalJson_(
          payload
        ) !==
        canonicalPayload
      ) {
        fail_(
          'Payload JSON is not in canonical representation.'
        );
      }

      verifyPayloadEnvelope_(
        payload,
        manifest,
        operationCreatedTimestampUtc
      );

      if (
        operationCreatedTimestampUtc ===
        null
      ) {
        operationCreatedTimestampUtc =
          payload
            .operationCreatedTimestampUtc;

        if (
          operationCreatedTimestampUtc !==
          manifest.eventTimestampUtc
        ) {
          fail_(
            'Prepared operation creation timestamp must equal first event timestamp.'
          );
        }
      }

      events.push({
        manifest:
          manifest,
        payload:
          payload,
        canonicalPayload:
          canonicalPayload,
        chunks:
          eventChunks
      });

      expectedPrevious =
        manifest.eventSha256;
    }

    if (
      chunkCursor !==
      chunks.length
    ) {
      fail_(
        'Operation contains orphaned or physically reordered chunks.'
      );
    }

    validateTransitions_(
      events
    );

    return {
      found: true,
      operationId:
        operationId,
      operationCreatedTimestampUtc:
        operationCreatedTimestampUtc,
      identity:
        identity,
      events:
        events
    };
  }

  function payloadEnvelope_(
    operationId,
    eventSequence,
    eventType,
    eventTimestampUtc,
    operationCreatedTimestampUtc,
    identity,
    data
  ) {
    if (!isPlainObject_(data)) {
      fail_(
        'Event payload data must be a plain object.'
      );
    }

    return {
      data:
        data,
      eventSequence:
        eventSequence,
      eventTimestampUtc:
        eventTimestampUtc,
      eventType:
        eventType,
      executorImplementationVersion:
        identity.executorImplementationVersion,
      groupNumber:
        identity.groupNumber,
      operationCreatedTimestampUtc:
        operationCreatedTimestampUtc,
      operationId:
        operationId,
      operationIntentContractVersion:
        CONTRACT_VERSION_,
      targetDeleteDistressLeadId:
        identity.targetDeleteDistressLeadId,
      winnerDistressLeadId:
        identity.winnerDistressLeadId
    };
  }

  function buildPersistableEvent_(
    operationId,
    eventSequence,
    eventType,
    eventTimestampUtc,
    operationCreatedTimestampUtc,
    identity,
    previousEventSha256,
    data
  ) {
    var payload =
      payloadEnvelope_(
        operationId,
        eventSequence,
        eventType,
        eventTimestampUtc,
        operationCreatedTimestampUtc,
        identity,
        data
      );

    var canonicalPayload =
      canonicalJson_(
        payload
      );

    var payloadBytes =
      utf8ByteLength_(
        canonicalPayload
      );

    if (
      payloadBytes >
      MAX_EVENT_PAYLOAD_UTF8_BYTES_
    ) {
      fail_(
        'Canonical payload exceeds the v1 event byte limit.'
      );
    }

    var rawChunks =
      chunkUtf8_(
        canonicalPayload
      );

    if (
      rawChunks.length >
      MAX_CHUNKS_PER_EVENT_
    ) {
      fail_(
        'Canonical payload exceeds the v1 chunk-count limit.'
      );
    }

    var chunks =
      rawChunks.map(
        function (chunk, index) {
          var bytes =
            utf8ByteLength_(
              chunk
            );

          if (
            bytes < 1 ||
            bytes >
              MAX_CHUNK_UTF8_BYTES_
          ) {
            fail_(
              'Canonical payload produced an invalid chunk size.'
            );
          }

          return {
            operationId:
              operationId,
            eventSequence:
              eventSequence,
            chunkIndex:
              index,
            chunkUtf8Bytes:
              bytes,
            chunkSha256:
              sha256HexText_(
                chunk
              ),
            chunkData:
              base64EncodeUtf8_(
                chunk
              )
          };
        }
      );

    var manifest = {
      operationId:
        operationId,
      eventSequence:
        eventSequence,
      eventType:
        eventType,
      eventTimestampUtc:
        eventTimestampUtc,
      operationIntentContractVersion:
        CONTRACT_VERSION_,
      executorImplementationVersion:
        identity.executorImplementationVersion,
      groupNumber:
        identity.groupNumber,
      winnerDistressLeadId:
        identity.winnerDistressLeadId,
      targetDeleteDistressLeadId:
        identity.targetDeleteDistressLeadId,
      payloadSha256:
        sha256HexText_(
          canonicalPayload
        ),
      payloadUtf8Bytes:
        payloadBytes,
      payloadChunkCount:
        chunks.length,
      previousEventSha256:
        previousEventSha256,
      eventSha256:
        ''
    };

    manifest.eventSha256 =
      eventSha256_(
        manifest
      );

    validateManifest_(
      manifest
    );

    return {
      manifest:
        manifest,
      chunks:
        chunks,
      canonicalPayload:
        canonicalPayload
    };
  }

  function manifestRow_(manifest) {
    return [
      manifest.operationId,
      manifest.eventSequence,
      manifest.eventType,
      manifest.eventTimestampUtc,
      manifest.operationIntentContractVersion,
      manifest.executorImplementationVersion,
      manifest.groupNumber,
      manifest.winnerDistressLeadId,
      manifest.targetDeleteDistressLeadId,
      manifest.payloadSha256,
      manifest.payloadUtf8Bytes,
      manifest.payloadChunkCount,
      manifest.previousEventSha256,
      manifest.eventSha256
    ];
  }

  function chunkRow_(chunk) {
    return [
      chunk.operationId,
      chunk.eventSequence,
      chunk.chunkIndex,
      chunk.chunkUtf8Bytes,
      chunk.chunkSha256,
      chunk.chunkData
    ];
  }

  /*
   * Append order is intentionally:
   *
   *   manifest -> chunks -> flush -> full newly-resolved readback
   *
   * No rollback, rewrite, cleanup, dedupe, retry, or purge is attempted
   * if any step fails.
   */
  function persistEvent_(
    event,
    lockContext
  ) {
    assertLockContext_(
      lockContext
    );

    var storage =
      openStorage_();

    assertLockContext_(
      lockContext
    );

    storage.eventSheet
      .appendRow(
        manifestRow_(
          event.manifest
        )
      );

    for (
      var index = 0;
      index < event.chunks.length;
      index++
    ) {
      assertLockContext_(
        lockContext
      );

      storage.chunkSheet
        .appendRow(
          chunkRow_(
            event.chunks[index]
          )
        );
    }

    if (
      typeof SpreadsheetApp.flush !==
        'function'
    ) {
      fail_(
        'SpreadsheetApp.flush is unavailable.'
      );
    }

    SpreadsheetApp.flush();

    /*
     * Resolve the configured workbook again after flush.
     * In-memory append success is not persistence proof.
     */
    var rereadStorage =
      openStorage_();

    var history =
      readOperationFromStorage_(
        rereadStorage,
        event.manifest.operationId
      );

    if (
      !history.found ||
      history.events.length <
        event.manifest.eventSequence
    ) {
      fail_(
        'Persisted event is unavailable after readback.'
      );
    }

    var persisted =
      history.events[
        event.manifest.eventSequence - 1
      ];

    if (
      persisted.manifest.eventSha256 !==
        event.manifest.eventSha256 ||
      persisted.manifest.payloadSha256 !==
        event.manifest.payloadSha256 ||
      persisted.canonicalPayload !==
        event.canonicalPayload
    ) {
      fail_(
        'Persisted event readback does not match attempted event.'
      );
    }

    return history;
  }

  function newOperationId_() {
    if (
      typeof Utilities.getUuid !==
        'function'
    ) {
      fail_(
        'Utilities.getUuid is unavailable.'
      );
    }

    var operationId =
      String(
        Utilities.getUuid() ||
        ''
      ).trim();

    requireSafeCellText_(
      operationId,
      'Generated operation ID'
    );

    if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        operationId
      )
    ) {
      fail_(
        'Generated operation ID is not a UUID.'
      );
    }

    return operationId;
  }

  function nowIso_() {
    return new Date()
      .toISOString();
  }

  function prepare(
    request,
    options
  ) {
    assertExactFields_(
      request,
      [
        'executorImplementationVersion',
        'groupNumber',
        'payload',
        'targetDeleteDistressLeadId',
        'winnerDistressLeadId'
      ],
      'Prepare request'
    );

    assertExactFields_(
      options,
      [
        'lockContext'
      ],
      'Prepare options'
    );

    assertLockContext_(
      options.lockContext
    );

    var identity = {
      executorImplementationVersion:
        requireSafeCellText_(
          request.executorImplementationVersion,
          'Executor implementation version'
        ),
      groupNumber:
        requirePositiveInteger_(
          request.groupNumber,
          'Group number'
        ),
      winnerDistressLeadId:
        requireSafeCellText_(
          request.winnerDistressLeadId,
          'Winner Distress Lead ID'
        ),
      targetDeleteDistressLeadId:
        requireSafeCellText_(
          request.targetDeleteDistressLeadId,
          'Target delete Distress Lead ID'
        )
    };

    if (
      !isPlainObject_(
        request.payload
      )
    ) {
      fail_(
        'Prepared payload data must be a plain object.'
      );
    }

    var operationId =
      newOperationId_();

    /*
     * Operation identity is generated once.
     * A collision fails closed and is never silently regenerated.
     */
    var storage =
      openStorage_();

    var existing =
      readOperationFromStorage_(
        storage,
        operationId
      );

    if (existing.found) {
      fail_(
        'Generated operation ID already exists.'
      );
    }

    var timestamp =
      nowIso_();

    var event =
      buildPersistableEvent_(
        operationId,
        1,
        'INTENT_PREPARED',
        timestamp,
        timestamp,
        identity,
        GENESIS_,
        request.payload
      );

    var history =
      persistEvent_(
        event,
        options.lockContext
      );

    return {
      operationId:
        operationId,
      eventSequence:
        1,
      eventType:
        'INTENT_PREPARED',
      eventSha256:
        event.manifest.eventSha256,
      payloadSha256:
        event.manifest.payloadSha256,
      operationCreatedTimestampUtc:
        timestamp,
      readbackVerified:
        history.found === true &&
        history.events.length === 1
    };
  }

  function append(
    request,
    options
  ) {
    assertExactFields_(
      request,
      [
        'eventType',
        'operationId',
        'payload'
      ],
      'Append request'
    );

    assertExactFields_(
      options,
      [
        'lockContext'
      ],
      'Append options'
    );

    assertLockContext_(
      options.lockContext
    );

    var operationId =
      requireSafeCellText_(
        request.operationId,
        'Operation ID'
      );

    var eventType =
      requireSafeCellText_(
        request.eventType,
        'Event type'
      );

    if (
      !EVENT_TYPES_[eventType] ||
      eventType ===
        'INTENT_PREPARED'
    ) {
      fail_(
        'Append event type is not permitted.'
      );
    }

    if (
      !isPlainObject_(
        request.payload
      )
    ) {
      fail_(
        'Append payload data must be a plain object.'
      );
    }

    var storage =
      openStorage_();

    var history =
      readOperationFromStorage_(
        storage,
        operationId
      );

    if (!history.found) {
      fail_(
        'Operation ID does not exist.'
      );
    }

    if (
      history.events.length >=
      MAX_EVENTS_PER_OPERATION_
    ) {
      fail_(
        'Operation already reached the v1 event limit.'
      );
    }

    var last =
      history.events[
        history.events.length - 1
      ];

    if (
      TERMINAL_TYPES_[
        last.manifest.eventType
      ]
    ) {
      fail_(
        'Cannot append after terminal operation state.'
      );
    }

    var eventSequence =
      history.events.length + 1;

    var timestamp =
      nowIso_();

    var event =
      buildPersistableEvent_(
        operationId,
        eventSequence,
        eventType,
        timestamp,
        history.operationCreatedTimestampUtc,
        history.identity,
        last.manifest.eventSha256,
        request.payload
      );

    /*
     * Reject forbidden state transitions before writing a byte.
     */
    validateTransitions_(
      history.events.concat([
        {
          manifest:
            event.manifest
        }
      ])
    );

    var persistedHistory =
      persistEvent_(
        event,
        options.lockContext
      );

    return {
      operationId:
        operationId,
      eventSequence:
        eventSequence,
      eventType:
        eventType,
      eventSha256:
        event.manifest.eventSha256,
      payloadSha256:
        event.manifest.payloadSha256,
      readbackVerified:
        persistedHistory.found === true &&
        persistedHistory.events.length ===
          eventSequence
    };
  }

  /*
   * Strict read path. Any malformed journal material throws.
   * No sheet write method is reachable from this function.
   */
  function read(operationId) {
    var storage =
      openStorage_();

    return readOperationFromStorage_(
      storage,
      operationId
    );
  }

  /*
   * Read-only recovery classification.
   *
   * This classification never authorizes retry or row recreation.
   * Live county reconciliation remains a separately certified surface.
   */
  function recover(operationId) {
    operationId =
      requireSafeCellText_(
        operationId,
        'Operation ID'
      );

    var history;

    try {
      history =
        read(
          operationId
        );
    } catch (error) {
      return {
        operationId:
          operationId,
        found:
          true,
        classification:
          'UNCERTAIN_STORAGE_INVALID',
        automaticRetryPermitted:
          false,
        rowRecreationPermitted:
          false,
        journalMutationExecuted:
          false,
        reason:
          String(
            error &&
            error.message
              ? error.message
              : error
          )
      };
    }

    if (!history.found) {
      return {
        operationId:
          operationId,
        found:
          false,
        classification:
          'NOT_FOUND',
        automaticRetryPermitted:
          false,
        rowRecreationPermitted:
          false,
        journalMutationExecuted:
          false
      };
    }

    var types =
      history.events
        .map(function (event) {
          return event
            .manifest
            .eventType;
        });

    var finalType =
      types[
        types.length - 1
      ];

    if (
      finalType ===
      'COLLAPSE_DELETE_VERIFIED'
    ) {
      return {
        operationId:
          operationId,
        found:
          true,
        classification:
          'VERIFIED_SUCCESS_JOURNAL',
        automaticRetryPermitted:
          false,
        rowRecreationPermitted:
          false,
        journalMutationExecuted:
          false,
        eventCount:
          types.length,
        terminalEventSha256:
          history.events[
            history.events.length - 1
          ].manifest.eventSha256
      };
    }

    if (
      types.indexOf(
        'DELETE_INVOCATION_STARTED'
      ) !== -1 ||
      finalType ===
        'COLLAPSE_EXECUTOR_OUTCOME_UNCERTAIN'
    ) {
      return {
        operationId:
          operationId,
        found:
          true,
        classification:
          'UNCERTAIN_DELETE_BARRIER_OR_TERMINAL',
        automaticRetryPermitted:
          false,
        rowRecreationPermitted:
          false,
        journalMutationExecuted:
          false,
        eventCount:
          types.length
      };
    }

    if (
      finalType ===
      'COLLAPSE_EXECUTOR_PRECONDITION_FAILED'
    ) {
      return {
        operationId:
          operationId,
        found:
          true,
        classification:
          'PRECONDITION_FAILED_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
        automaticRetryPermitted:
          false,
        rowRecreationPermitted:
          false,
        journalMutationExecuted:
          false,
        eventCount:
          types.length
      };
    }

    return {
      operationId:
        operationId,
      found:
        true,
      classification:
        'NO_DELETE_BARRIER_REQUIRES_LIVE_READ_ONLY_RECONCILIATION',
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false,
      journalMutationExecuted:
        false,
      eventCount:
        types.length
    };
  }

  function metadata() {
    return {
      version:
        CONTRACT_VERSION_,
      mode:
        'APPEND_ONLY_DURABLE_EVIDENCE_JOURNAL',
      storagePropertyKey:
        PROPERTY_KEY_,
      eventSheet:
        EVENT_SHEET_,
      chunkSheet:
        CHUNK_SHEET_,
      chunkEncoding:
        'BASE64_UTF8',
      maxEventPayloadUtf8Bytes:
        MAX_EVENT_PAYLOAD_UTF8_BYTES_,
      maxChunkUtf8Bytes:
        MAX_CHUNK_UTF8_BYTES_,
      maxChunksPerEvent:
        MAX_CHUNKS_PER_EVENT_,
      maxEventsPerOperation:
        MAX_EVENTS_PER_OPERATION_,
      nestedLockAcquisition:
        false,
      lockReleaseAuthority:
        false,
      workbookProvisioningAuthority:
        false,
      historicalUpdateAuthority:
        false,
      historicalDeleteAuthority:
        false,
      purgeAuthority:
        false,
      physicalDeleteAuthority:
        false,
      countyDataMutationAuthority:
        false,
      schedulerMutationAuthority:
        false,
      checkpointMutationAuthority:
        false,
      connectorExecutionAuthority:
        false,
      automaticOfferAuthority:
        false,
      automaticRetryPermitted:
        false,
      rowRecreationPermitted:
        false
    };
  }

  return {
    prepare:
      prepare,
    append:
      append,
    read:
      read,
    recover:
      recover,
    metadata:
      metadata
  };
})();
