/**
 * REOS Enterprise v3.2.6 - Database Framework
 * Sheet-table data layer with safe table creation, insert, update, query, and soft delete.
 */

var REOS = REOS || {};

REOS.Database = (function () {
  function getSpreadsheet_() {
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  function getSheet(sheetName) {
    const sheet = getSpreadsheet_().getSheetByName(sheetName);
    if (!sheet) throw new Error('Sheet not found: ' + sheetName);
    return sheet;
  }

  function ensureTable(sheetName, headers) {
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setWrap(true);
      sheet.autoResizeColumns(1, headers.length);
    }
    return sheet;
  }

  function getHeaders(sheetName) {
    const sheet = getSheet(sheetName);
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const values = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return values.map(function (header) { return String(header || '').trim(); });
  }

  function getHeaderMap(sheetName) {
    const headers = getHeaders(sheetName);
    const map = {};
    headers.forEach(function (header, index) {
      if (header) map[header] = index;
    });
    return map;
  }

  function rowToObject(headers, row, rowNumber) {
    const record = {};
    headers.forEach(function (header, index) {
      if (header) record[header] = row[index];
    });
    record._rowNumber = rowNumber;
    return record;
  }

  function objectToRow(headers, record) {
    return headers.map(function (header) {
      return Object.prototype.hasOwnProperty.call(record, header) ? record[header] : '';
    });
  }

  function getAll(sheetName) {
    const sheet = getSheet(sheetName);
    const headers = getHeaders(sheetName);
    const lastRow = sheet.getLastRow();
    const lastColumn = Math.max(sheet.getLastColumn(), headers.length);

    if (lastRow < 2) return [];

    const rows =
      sheet
        .getRange(
          2,
          1,
          lastRow - 1,
          lastColumn
        )
        .getValues();

    /*
     * Preserve physical spreadsheet row authority before filtering
     * logically blank records.
     *
     * Filtering first and then deriving _rowNumber from the compacted
     * array causes every record after a blank physical row to point at
     * the wrong spreadsheet row.
     */
    return rows
      .map(function (row, index) {
        return {
          row: row,
          rowNumber: index + 2
        };
      })
      .filter(function (entry) {
        return entry.row.some(function (cell) {
          return (
            cell !== '' &&
            cell !== null
          );
        });
      })
      .map(function (entry) {
        return rowToObject(
          headers,
          entry.row,
          entry.rowNumber
        );
      });
  }

  function findById(sheetName, idField, idValue) {
    const id = String(idValue || '').trim();

    return getAll(sheetName).find(function (record) {
      return String(record[idField] || '').trim() === id;
    }) || null;
  }

  /*
   * Mutation authority must resolve directly from physical sheet rows.
   *
   * Do not derive a writable row number through getAll()/findById(),
   * because logical filtering must never influence physical row
   * addressing.
   */
  function findRowById(sheetName, idField, idValue) {
    const id =
      String(idValue || '').trim();

    if (!id) {
      return null;
    }

    const sheet =
      getSheet(sheetName);

    const headers =
      getHeaders(sheetName);

    const idColumnIndex =
      headers.indexOf(idField);

    if (idColumnIndex === -1) {
      throw new Error(
        'ID field not found: ' +
        idField
      );
    }

    const lastRow =
      sheet.getLastRow();

    if (lastRow < 2) {
      return null;
    }

    const values =
      sheet
        .getRange(
          2,
          idColumnIndex + 1,
          lastRow - 1,
          1
        )
        .getValues();

    for (
      let index = 0;
      index < values.length;
      index++
    ) {
      if (
        String(
          values[index][0] || ''
        ).trim() === id
      ) {
        return index + 2;
      }
    }

    return null;
  }

  function beginLockObservation_(
    owner,
    operation,
    details
  ) {
    try {
      if (
        REOS.ScriptLockObservability &&
        typeof REOS.ScriptLockObservability
          .begin ===
          'function'
      ) {
        return REOS.ScriptLockObservability
          .begin(
            owner,
            operation,
            details || {}
          );
      }
    } catch (ignore) {}

    return null;
  }

  function noteLockContention_(
    owner,
    operation,
    details
  ) {
    try {
      if (
        REOS.ScriptLockObservability &&
        typeof REOS.ScriptLockObservability
          .contention ===
          'function'
      ) {
        return REOS.ScriptLockObservability
          .contention(
            owner,
            operation,
            details || {}
          );
      }
    } catch (ignore) {}

    return null;
  }

  function endLockObservation_(
    handle,
    outcome,
    details
  ) {
    try {
      if (
        handle &&
        REOS.ScriptLockObservability &&
        typeof REOS.ScriptLockObservability
          .end ===
          'function'
      ) {
        REOS.ScriptLockObservability
          .end(
            handle,
            outcome,
            details || {}
          );
      }
    } catch (ignore) {}
  }

  var LOCK_CONTEXT_CAPABILITY_ = {};

  /*
   * Exact-object lease authority.
   *
   * A ScriptLock object may later report hasLock() === true after a
   * subsequent acquisition. Therefore lock ownership alone cannot make
   * an old context valid again.
   *
   * Only the exact context object registered for the current lease is
   * accepted. Revocation removes it permanently before lock release.
   */
  var ACTIVE_LOCK_CONTEXTS_ = [];

  function activateLockContext_(context) {
    ACTIVE_LOCK_CONTEXTS_.push(context);
  }

  function revokeLockContext_(context) {
    var index =
      ACTIVE_LOCK_CONTEXTS_.indexOf(context);

    if (index !== -1) {
      ACTIVE_LOCK_CONTEXTS_.splice(index, 1);
    }
  }

  function validateLockContext_(context) {
    if (
      !context ||
      typeof context !== 'object' ||
      context.capability !==
        LOCK_CONTEXT_CAPABILITY_ ||
      ACTIVE_LOCK_CONTEXTS_.indexOf(context) === -1 ||
      !context.lock ||
      typeof context.lock.hasLock !==
        'function' ||
      context.lock.hasLock() !== true
    ) {
      throw new Error(
        'Database lock context is invalid or no longer owns ScriptLock.'
      );
    }

    return context.lock;
  }


  var PHYSICAL_DELETE_REQUEST_FIELDS_ = [
    'spreadsheetId',
    'sheetId',
    'expectedRowNumber',
    'idField',
    'idValue',
    'expectedLastRow',
    'expectedLastColumn',
    'expectedMaxRows',
    'expectedMaxColumns',
    'expectedHeaders',
    'expectedRowValues',
    'expectedRowFormulas'
  ];

  function physicalDeleteError_(
    classification,
    message,
    cause
  ) {
    var error =
      new Error(
        classification +
        ': ' +
        message
      );

    error.classification =
      classification;

    if (
      cause !== undefined &&
      cause !== null
    ) {
      error.cause =
        cause;
    }

    return error;
  }

  function physicalDeletePlainObject_(
    value
  ) {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );
  }

  function physicalDeleteExactFields_(
    value,
    allowedFields,
    label
  ) {
    if (
      !physicalDeletePlainObject_(
        value
      )
    ) {
      throw new Error(
        label +
        ' must be an object.'
      );
    }

    var actual =
      Object.keys(value)
        .slice()
        .sort();

    var expected =
      allowedFields
        .slice()
        .sort();

    if (
      actual.length !==
      expected.length
    ) {
      throw new Error(
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
        throw new Error(
          label +
          ' has missing or unknown fields.'
        );
      }
    }
  }

  function physicalDeleteCanonicalNumberText_(
    value
  ) {
    if (
      typeof value !==
      'string' ||
      value === ''
    ) {
      return false;
    }

    var parsed =
      Number(value);

    if (
      !Number.isFinite(parsed)
    ) {
      return false;
    }

    return (
      String(parsed) ===
      value
    );
  }

  function validatePhysicalDeleteCanonicalValue_(
    value
  ) {
    if (
      !physicalDeletePlainObject_(
        value
      ) ||
      typeof value.type !==
        'string'
    ) {
      throw new Error(
        'Expected row value has invalid canonical form.'
      );
    }

    if (
      value.type ===
      'blank'
    ) {
      physicalDeleteExactFields_(
        value,
        [
          'type'
        ],
        'Canonical blank value'
      );

      return;
    }

    physicalDeleteExactFields_(
      value,
      [
        'type',
        'value'
      ],
      'Canonical row value'
    );

    if (
      value.type ===
      'string'
    ) {
      if (
        typeof value.value !==
        'string'
      ) {
        throw new Error(
          'Canonical string value is invalid.'
        );
      }

      return;
    }

    if (
      value.type ===
      'number'
    ) {
      if (
        !physicalDeleteCanonicalNumberText_(
          value.value
        )
      ) {
        throw new Error(
          'Canonical number value is invalid.'
        );
      }

      return;
    }

    if (
      value.type ===
      'boolean'
    ) {
      if (
        typeof value.value !==
        'boolean'
      ) {
        throw new Error(
          'Canonical boolean value is invalid.'
        );
      }

      return;
    }

    if (
      value.type ===
      'date'
    ) {
      if (
        typeof value.value !==
        'string'
      ) {
        throw new Error(
          'Canonical date value is invalid.'
        );
      }

      var parsedDate =
        new Date(
          value.value
        );

      if (
        !Number.isFinite(
          parsedDate.getTime()
        ) ||
        parsedDate.toISOString() !==
          value.value
      ) {
        throw new Error(
          'Canonical date value is invalid.'
        );
      }

      return;
    }

    throw new Error(
      'Canonical row value type is unsupported.'
    );
  }

  function canonicalizePhysicalDeleteValue_(
    value
  ) {
    if (
      value === ''
    ) {
      return {
        type:
          'blank'
      };
    }

    if (
      typeof value ===
      'string'
    ) {
      return {
        type:
          'string',
        value:
          value
      };
    }

    if (
      typeof value ===
      'number'
    ) {
      if (
        !Number.isFinite(value)
      ) {
        throw new Error(
          'Raw numeric cell value is not finite.'
        );
      }

      return {
        type:
          'number',
        value:
          Object.is(
            value,
            -0
          )
            ? '0'
            : String(value)
      };
    }

    if (
      typeof value ===
      'boolean'
    ) {
      return {
        type:
          'boolean',
        value:
          value
      };
    }

    if (
      Object.prototype
        .toString
        .call(value) ===
        '[object Date]' &&
      Number.isFinite(
        value.getTime()
      )
    ) {
      return {
        type:
          'date',
        value:
          value.toISOString()
      };
    }

    throw new Error(
      'Raw cell value type is unsupported.'
    );
  }

  function physicalDeleteCanonicalValuesEqual_(
    left,
    right
  ) {
    if (
      left.type !==
      right.type
    ) {
      return false;
    }

    if (
      left.type ===
      'blank'
    ) {
      return true;
    }

    return (
      left.value ===
      right.value
    );
  }

  function validatePhysicalDeleteRequest_(
    sheetName,
    request,
    options
  ) {
    if (
      typeof sheetName !==
        'string' ||
      sheetName.trim() === ''
    ) {
      throw new Error(
        'Physical delete sheet name is required.'
      );
    }

    physicalDeleteExactFields_(
      request,
      PHYSICAL_DELETE_REQUEST_FIELDS_,
      'Physical delete request'
    );

    physicalDeleteExactFields_(
      options,
      [
        'lockContext'
      ],
      'Physical delete options'
    );

    if (
      typeof request.spreadsheetId !==
        'string' ||
      request.spreadsheetId.trim() === ''
    ) {
      throw new Error(
        'Physical delete spreadsheet ID is required.'
      );
    }

    if (
      !Number.isInteger(
        request.sheetId
      )
    ) {
      throw new Error(
        'Physical delete sheet ID is invalid.'
      );
    }

    if (
      !Number.isInteger(
        request.expectedRowNumber
      ) ||
      request.expectedRowNumber <= 1
    ) {
      throw new Error(
        'Physical delete row number must exclude the header row.'
      );
    }

    if (
      typeof request.idField !==
        'string' ||
      request.idField.trim() === ''
    ) {
      throw new Error(
        'Physical delete ID field is required.'
      );
    }

    if (
      typeof request.idValue !==
        'string' ||
      request.idValue.trim() === ''
    ) {
      throw new Error(
        'Physical delete ID value is required.'
      );
    }

    [
      'expectedLastRow',
      'expectedLastColumn',
      'expectedMaxRows',
      'expectedMaxColumns'
    ].forEach(function (field) {
      if (
        !Number.isInteger(
          request[field]
        ) ||
        request[field] < 1
      ) {
        throw new Error(
          'Physical delete geometry field is invalid: ' +
          field
        );
      }
    });

    if (
      request.expectedLastRow <
        request.expectedRowNumber ||
      request.expectedMaxRows <
        request.expectedLastRow ||
      request.expectedMaxColumns <
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical delete expected geometry is inconsistent.'
      );
    }

    if (
      !Array.isArray(
        request.expectedHeaders
      ) ||
      !Array.isArray(
        request.expectedRowValues
      ) ||
      !Array.isArray(
        request.expectedRowFormulas
      )
    ) {
      throw new Error(
        'Physical delete expected row arrays are required.'
      );
    }

    if (
      request.expectedHeaders.length !==
        request.expectedLastColumn ||
      request.expectedRowValues.length !==
        request.expectedLastColumn ||
      request.expectedRowFormulas.length !==
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical delete expected array lengths do not match geometry.'
      );
    }

    request.expectedHeaders
      .forEach(function (header) {
        if (
          typeof header !==
          'string'
        ) {
          throw new Error(
            'Physical delete expected header must be a string.'
          );
        }
      });

    request.expectedRowValues
      .forEach(function (value) {
        validatePhysicalDeleteCanonicalValue_(
          value
        );
      });

    request.expectedRowFormulas
      .forEach(function (formula) {
        if (
          typeof formula !==
          'string'
        ) {
          throw new Error(
            'Physical delete expected formula must be a string.'
          );
        }
      });
  }

  function withScriptLockContext(work) {
    if (typeof work !== 'function') {
      throw new Error(
        'Database lock context callback is required.'
      );
    }

    var lock =
      LockService.getScriptLock();

    if (
      !lock ||
      typeof lock.tryLock !== 'function' ||
      typeof lock.hasLock !== 'function' ||
      typeof lock.releaseLock !== 'function'
    ) {
      throw new Error(
        'Database fail-fast ScriptLock support is required.'
      );
    }

    var acquired =
      lock.tryLock(
        1000
      );

    if (!acquired) {
      noteLockContention_(
        'Database',
        'withScriptLockContext',
        {
          waitMode: 'tryLock',
          waitMilliseconds: 1000
        }
      );

      throw new Error(
        'Database ScriptLock is contended; no operation executed.'
      );
    }

    var lockObservation =
      beginLockObservation_(
        'Database',
        'withScriptLockContext',
        {
          waitMode: 'tryLock',
          waitMilliseconds: 1000
        }
      );

    var lockOutcome =
      'SUCCESS';

    var context =
      Object.freeze({
        capability:
          LOCK_CONTEXT_CAPABILITY_,

        lock:
          lock
      });

    activateLockContext_(
      context
    );

    try {
      if (lock.hasLock() !== true) {
        throw new Error(
          'Database ScriptLock ownership could not be verified.'
        );
      }

      return work(
        context
      );
    } catch (error) {
      lockOutcome =
        'ERROR';

      throw error;
    } finally {
      /*
       * Revoke lease authority before flush/release. The captured
       * context must never become valid again if this ScriptLock object
       * is reacquired later.
       */
      revokeLockContext_(
        context
      );

      try {
        SpreadsheetApp.flush();
      } catch (flushError) {
        lockOutcome =
          'FLUSH_ERROR';

        throw flushError;
      } finally {
        /*
         * Physical release must precede observability finalization.
         * If release fails, retain owner metadata so status can later
         * classify it stale rather than falsely reporting RELEASED.
         */
        lock.releaseLock();

        endLockObservation_(
          lockObservation,
          lockOutcome,
          {
            waitMode: 'tryLock',
            waitMilliseconds: 1000
          }
        );
      }
    }
  }


  /*
   * Read-only capability assertion for certified internal modules.
   *
   * This does not acquire, release, replay, or transfer ScriptLock
   * authority. It only validates the exact currently-active
   * non-replayable Database lock-context object.
   */
  function assertScriptLockContext(
    lockContext
  ) {
    validateLockContext_(
      lockContext
    );

    return true;
  }


  var PHYSICAL_PATCH_REQUEST_FIELDS_ = [
    'spreadsheetId',
    'sheetId',
    'expectedRowNumber',
    'idField',
    'idValue',
    'expectedLastRow',
    'expectedLastColumn',
    'expectedMaxRows',
    'expectedMaxColumns',
    'expectedHeaders',
    'expectedRowValues',
    'expectedRowFormulas',
    'patches',
    'expectedPostRowValues',
    'expectedPostRowFormulas'
  ];

  var PHYSICAL_PATCH_CELL_FIELDS_ = [
    'rowNumber',
    'columnNumber',
    'header',
    'expectedValue',
    'expectedFormula',
    'replacementValue',
    'replacementFormula'
  ];

  var PHYSICAL_PATCH_HEADERS_ = [
    'Updated At',
    'Last Seen At',
    'Connector Run ID'
  ];

  function physicalPatchError_(
    classification,
    message,
    cause
  ) {
    var error =
      new Error(
        classification +
        ': ' +
        message
      );

    error.classification =
      classification;

    if (
      cause !== undefined &&
      cause !== null
    ) {
      error.cause =
        cause;
    }

    return error;
  }

  function physicalPatchCanonicalToRaw_(
    value
  ) {
    validatePhysicalDeleteCanonicalValue_(
      value
    );

    if (
      value.type ===
      'blank'
    ) {
      return '';
    }

    if (
      value.type ===
      'string'
    ) {
      return value.value;
    }

    if (
      value.type ===
      'number'
    ) {
      return Number(
        value.value
      );
    }

    if (
      value.type ===
      'boolean'
    ) {
      return value.value;
    }

    if (
      value.type ===
      'date'
    ) {
      return new Date(
        value.value
      );
    }

    throw new Error(
      'Physical patch canonical value type is unsupported.'
    );
  }

  function validatePhysicalPatchRequest_(
    sheetName,
    request,
    options
  ) {
    if (
      typeof sheetName !==
        'string' ||
      sheetName.trim() === ''
    ) {
      throw new Error(
        'Physical patch sheet name is required.'
      );
    }

    physicalDeleteExactFields_(
      request,
      PHYSICAL_PATCH_REQUEST_FIELDS_,
      'Physical patch request'
    );

    physicalDeleteExactFields_(
      options,
      [
        'lockContext'
      ],
      'Physical patch options'
    );

    if (
      typeof request.spreadsheetId !==
        'string' ||
      request.spreadsheetId.trim() === ''
    ) {
      throw new Error(
        'Physical patch spreadsheet ID is required.'
      );
    }

    if (
      !Number.isInteger(
        request.sheetId
      )
    ) {
      throw new Error(
        'Physical patch sheet ID is invalid.'
      );
    }

    if (
      !Number.isInteger(
        request.expectedRowNumber
      ) ||
      request.expectedRowNumber <= 1
    ) {
      throw new Error(
        'Physical patch row number must exclude the header row.'
      );
    }

    if (
      typeof request.idField !==
        'string' ||
      request.idField.trim() === ''
    ) {
      throw new Error(
        'Physical patch ID field is required.'
      );
    }

    if (
      typeof request.idValue !==
        'string' ||
      request.idValue.trim() === ''
    ) {
      throw new Error(
        'Physical patch ID value is required.'
      );
    }

    [
      'expectedLastRow',
      'expectedLastColumn',
      'expectedMaxRows',
      'expectedMaxColumns'
    ].forEach(function (field) {
      if (
        !Number.isInteger(
          request[field]
        ) ||
        request[field] < 1
      ) {
        throw new Error(
          'Physical patch geometry field is invalid: ' +
          field
        );
      }
    });

    if (
      request.expectedLastRow <
        request.expectedRowNumber ||
      request.expectedMaxRows <
        request.expectedLastRow ||
      request.expectedMaxColumns <
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical patch expected geometry is inconsistent.'
      );
    }

    [
      'expectedHeaders',
      'expectedRowValues',
      'expectedRowFormulas',
      'patches',
      'expectedPostRowValues',
      'expectedPostRowFormulas'
    ].forEach(function (field) {
      if (
        !Array.isArray(
          request[field]
        )
      ) {
        throw new Error(
          'Physical patch array is required: ' +
          field
        );
      }
    });

    if (
      request.expectedHeaders.length !==
        request.expectedLastColumn ||
      request.expectedRowValues.length !==
        request.expectedLastColumn ||
      request.expectedRowFormulas.length !==
        request.expectedLastColumn ||
      request.expectedPostRowValues.length !==
        request.expectedLastColumn ||
      request.expectedPostRowFormulas.length !==
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical patch expected array lengths do not match geometry.'
      );
    }

    if (
      request.patches.length !==
      3
    ) {
      throw new Error(
        'Physical patch requires exactly three cell patches.'
      );
    }

    var normalizedHeaders = {};
    var idHeaderCount = 0;

    request.expectedHeaders
      .forEach(function (header) {
        if (
          typeof header !==
            'string' ||
          header.trim() === ''
        ) {
          throw new Error(
            'Physical patch expected header is invalid.'
          );
        }

        var normalized =
          header
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedHeaders,
              normalized
            )
        ) {
          throw new Error(
            'Physical patch expected header is ambiguous.'
          );
        }

        normalizedHeaders[
          normalized
        ] =
          true;

        if (
          header ===
          request.idField
        ) {
          idHeaderCount++;
        }
      });

    if (
      idHeaderCount !==
      1
    ) {
      throw new Error(
        'Physical patch ID field must resolve exactly once.'
      );
    }

    request.expectedRowValues
      .forEach(function (value) {
        validatePhysicalDeleteCanonicalValue_(
          value
        );
      });

    request.expectedPostRowValues
      .forEach(function (value) {
        validatePhysicalDeleteCanonicalValue_(
          value
        );
      });

    request.expectedRowFormulas
      .forEach(function (formula) {
        if (
          typeof formula !==
          'string'
        ) {
          throw new Error(
            'Physical patch expected preimage formula is invalid.'
          );
        }
      });

    request.expectedPostRowFormulas
      .forEach(function (formula) {
        if (
          typeof formula !==
          'string'
        ) {
          throw new Error(
            'Physical patch expected postimage formula is invalid.'
          );
        }
      });

    var seenColumns = {};
    var seenHeaders = {};
    var patchByColumn = {};

    request.patches
      .forEach(function (patch) {
        physicalDeleteExactFields_(
          patch,
          PHYSICAL_PATCH_CELL_FIELDS_,
          'Physical patch cell request'
        );

        if (
          !Number.isInteger(
            patch.rowNumber
          ) ||
          patch.rowNumber !==
            request.expectedRowNumber
        ) {
          throw new Error(
            'Physical patch cell row does not match expected row.'
          );
        }

        if (
          !Number.isInteger(
            patch.columnNumber
          ) ||
          patch.columnNumber < 1 ||
          patch.columnNumber >
            request.expectedLastColumn
        ) {
          throw new Error(
            'Physical patch cell column is invalid.'
          );
        }

        if (
          Object.prototype
            .hasOwnProperty.call(
              seenColumns,
              patch.columnNumber
            )
        ) {
          throw new Error(
            'Physical patch target column is duplicated.'
          );
        }

        seenColumns[
          patch.columnNumber
        ] =
          true;

        if (
          typeof patch.header !==
            'string' ||
          request.expectedHeaders[
            patch.columnNumber - 1
          ] !==
            patch.header
        ) {
          throw new Error(
            'Physical patch target header does not match column authority.'
          );
        }

        if (
          PHYSICAL_PATCH_HEADERS_
            .indexOf(
              patch.header
            ) === -1
        ) {
          throw new Error(
            'Physical patch target header is unauthorized.'
          );
        }

        if (
          Object.prototype
            .hasOwnProperty.call(
              seenHeaders,
              patch.header
            )
        ) {
          throw new Error(
            'Physical patch target header is duplicated.'
          );
        }

        seenHeaders[
          patch.header
        ] =
          true;

        validatePhysicalDeleteCanonicalValue_(
          patch.expectedValue
        );

        validatePhysicalDeleteCanonicalValue_(
          patch.replacementValue
        );

        if (
          typeof patch.expectedFormula !==
            'string' ||
          patch.expectedFormula !== ''
        ) {
          throw new Error(
            'Physical patch target preimage formula must be blank.'
          );
        }

        if (
          typeof patch.replacementFormula !==
            'string' ||
          patch.replacementFormula !== ''
        ) {
          throw new Error(
            'Physical patch replacement formula must be blank.'
          );
        }

        var columnIndex =
          patch.columnNumber - 1;

        if (
          !physicalDeleteCanonicalValuesEqual_(
            patch.expectedValue,
            request.expectedRowValues[
              columnIndex
            ]
          )
        ) {
          throw new Error(
            'Physical patch target preimage value disagrees with row preimage.'
          );
        }

        if (
          request.expectedRowFormulas[
            columnIndex
          ] !==
            patch.expectedFormula
        ) {
          throw new Error(
            'Physical patch target preimage formula disagrees with row preimage.'
          );
        }

        if (
          !physicalDeleteCanonicalValuesEqual_(
            patch.replacementValue,
            request.expectedPostRowValues[
              columnIndex
            ]
          )
        ) {
          throw new Error(
            'Physical patch replacement value disagrees with expected postimage.'
          );
        }

        if (
          request.expectedPostRowFormulas[
            columnIndex
          ] !==
            patch.replacementFormula
        ) {
          throw new Error(
            'Physical patch replacement formula disagrees with expected postimage.'
          );
        }

        patchByColumn[
          patch.columnNumber
        ] =
          patch;
      });

    PHYSICAL_PATCH_HEADERS_
      .forEach(function (header) {
        if (
          !Object.prototype
            .hasOwnProperty.call(
              seenHeaders,
              header
            )
        ) {
          throw new Error(
            'Physical patch required target header is missing: ' +
            header
          );
        }
      });

    for (
      var columnNumber = 1;
      columnNumber <=
        request.expectedLastColumn;
      columnNumber++
    ) {
      var index =
        columnNumber - 1;

      var targetPatch =
        patchByColumn[
          columnNumber
        ];

      if (targetPatch) {
        if (
          request.expectedRowFormulas[
            index
          ] !== '' ||
          request.expectedPostRowFormulas[
            index
          ] !== ''
        ) {
          throw new Error(
            'Physical patch target formulas must remain blank.'
          );
        }

        continue;
      }

      if (
        !physicalDeleteCanonicalValuesEqual_(
          request.expectedRowValues[
            index
          ],
          request.expectedPostRowValues[
            index
          ]
        )
      ) {
        throw new Error(
          'Physical patch expected postimage modifies an untouched value.'
        );
      }

      if (
        request.expectedRowFormulas[
          index
        ] !==
          request.expectedPostRowFormulas[
            index
          ]
      ) {
        throw new Error(
          'Physical patch expected postimage modifies an untouched formula.'
        );
      }
    }
  }

  function patchPhysicalRowCellsExact(
    sheetName,
    request,
    options
  ) {
    try {
      validatePhysicalPatchRequest_(
        sheetName,
        request,
        options
      );
    } catch (error) {
      throw physicalPatchError_(
        'PHYSICAL_PATCH_PRECONDITION_FAILED',
        'Physical patch request validation failed.',
        error
      );
    }

    try {
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalPatchError_(
        'PHYSICAL_PATCH_PRECONDITION_FAILED',
        'Caller-owned lock context is invalid.',
        error
      );
    }

    var spreadsheet;
    var sheet;
    var actualHeaders;
    var idColumnIndex = -1;
    var preLastRow;
    var preLastColumn;
    var preMaxRows;
    var preMaxColumns;
    var orderedPatches;
    var patchRanges = [];
    var rawReplacementValues = [];

    try {
      spreadsheet =
        getSpreadsheet_();

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !==
          'function' ||
        spreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity does not match expected patch authority.'
        );
      }

      if (
        typeof spreadsheet.getSheetByName !==
          'function'
      ) {
        throw new Error(
          'Spreadsheet sheet lookup is unavailable.'
        );
      }

      sheet =
        spreadsheet.getSheetByName(
          sheetName
        );

      if (!sheet) {
        throw new Error(
          'Sheet not found: ' +
          sheetName
        );
      }

      if (
        typeof sheet.getSheetId !==
          'function' ||
        sheet.getSheetId() !==
          request.sheetId ||
        typeof sheet.getName !==
          'function' ||
        sheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Physical patch sheet identity changed.'
        );
      }

      preLastRow =
        sheet.getLastRow();

      preLastColumn =
        sheet.getLastColumn();

      preMaxRows =
        sheet.getMaxRows();

      preMaxColumns =
        sheet.getMaxColumns();

      if (
        preLastRow !==
          request.expectedLastRow ||
        preLastColumn !==
          request.expectedLastColumn ||
        preMaxRows !==
          request.expectedMaxRows ||
        preMaxColumns !==
          request.expectedMaxColumns
      ) {
        throw new Error(
          'Physical patch sheet geometry changed.'
        );
      }

      actualHeaders =
        sheet
          .getRange(
            1,
            1,
            1,
            request.expectedLastColumn
          )
          .getValues()[0];

      if (
        !Array.isArray(
          actualHeaders
        ) ||
        actualHeaders.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical patch header row is incomplete.'
        );
      }

      var normalizedActualHeaders = {};

      for (
        var headerIndex = 0;
        headerIndex <
          actualHeaders.length;
        headerIndex++
      ) {
        if (
          actualHeaders[
            headerIndex
          ] !==
            request.expectedHeaders[
              headerIndex
            ]
        ) {
          throw new Error(
            'Physical patch header row changed.'
          );
        }

        if (
          typeof actualHeaders[
            headerIndex
          ] !==
            'string' ||
          actualHeaders[
            headerIndex
          ].trim() === ''
        ) {
          throw new Error(
            'Physical patch header is invalid.'
          );
        }

        var normalizedActualHeader =
          actualHeaders[
            headerIndex
          ]
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedActualHeaders,
              normalizedActualHeader
            )
        ) {
          throw new Error(
            'Physical patch header is ambiguous.'
          );
        }

        normalizedActualHeaders[
          normalizedActualHeader
        ] =
          true;

        if (
          actualHeaders[
            headerIndex
          ] ===
            request.idField
        ) {
          if (
            idColumnIndex !== -1
          ) {
            throw new Error(
              'Physical patch ID field is ambiguous.'
            );
          }

          idColumnIndex =
            headerIndex;
        }
      }

      if (
        idColumnIndex === -1
      ) {
        throw new Error(
          'Physical patch ID field is not present.'
        );
      }

      var idValues =
        sheet
          .getRange(
            2,
            idColumnIndex + 1,
            request.expectedLastRow - 1,
            1
          )
          .getValues();

      var idMatchCount = 0;
      var matchedRowNumber =
        null;

      for (
        var idIndex = 0;
        idIndex <
          idValues.length;
        idIndex++
      ) {
        if (
          idValues[
            idIndex
          ][0] ===
            request.idValue
        ) {
          idMatchCount++;

          matchedRowNumber =
            idIndex + 2;
        }
      }

      if (
        idMatchCount !== 1 ||
        matchedRowNumber !==
          request.expectedRowNumber
      ) {
        throw new Error(
          'Physical patch ID identity is missing, ambiguous, or moved.'
        );
      }

      var candidateRange =
        sheet.getRange(
          request.expectedRowNumber,
          1,
          1,
          request.expectedLastColumn
        );

      var candidateValues =
        candidateRange
          .getValues()[0];

      var candidateFormulas =
        candidateRange
          .getFormulas()[0];

      if (
        candidateValues.length !==
          request.expectedLastColumn ||
        candidateFormulas.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical patch candidate row evidence is incomplete.'
        );
      }

      for (
        var valueIndex = 0;
        valueIndex <
          request.expectedLastColumn;
        valueIndex++
      ) {
        var canonicalActual =
          canonicalizePhysicalDeleteValue_(
            candidateValues[
              valueIndex
            ]
          );

        if (
          !physicalDeleteCanonicalValuesEqual_(
            canonicalActual,
            request.expectedRowValues[
              valueIndex
            ]
          )
        ) {
          throw new Error(
            'Physical patch candidate row value changed.'
          );
        }

        if (
          candidateFormulas[
            valueIndex
          ] !==
            request.expectedRowFormulas[
              valueIndex
            ]
        ) {
          throw new Error(
            'Physical patch candidate row formula changed.'
          );
        }
      }

      orderedPatches =
        request.patches
          .slice()
          .sort(function (
            left,
            right
          ) {
            return (
              left.columnNumber -
              right.columnNumber
            );
          });

      for (
        var patchIndex = 0;
        patchIndex <
          orderedPatches.length;
        patchIndex++
      ) {
        var patch =
          orderedPatches[
            patchIndex
          ];

        var targetRange =
          sheet.getRange(
            request.expectedRowNumber,
            patch.columnNumber,
            1,
            1
          );

        if (
          !targetRange ||
          typeof targetRange.setValue !==
            'function'
        ) {
          throw new Error(
            'Physical patch 1x1 target write surface is unavailable.'
          );
        }

        patchRanges.push(
          targetRange
        );

        rawReplacementValues.push(
          physicalPatchCanonicalToRaw_(
            patch.replacementValue
          )
        );
      }

      /*
       * This is the final definite no-write boundary.
       */
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalPatchError_(
        'PHYSICAL_PATCH_PRECONDITION_FAILED',
        'Physical patch precondition verification failed.',
        error
      );
    }

    /*
     * From the first setValue invocation onward every
     * failure is conservatively uncertain.
     */
    try {
      for (
        var writeIndex = 0;
        writeIndex <
          orderedPatches.length;
        writeIndex++
      ) {
        patchRanges[
          writeIndex
        ].setValue(
          rawReplacementValues[
            writeIndex
          ]
        );
      }

      SpreadsheetApp.flush();

      validateLockContext_(
        options.lockContext
      );

      var postSpreadsheet =
        getSpreadsheet_();

      if (
        !postSpreadsheet ||
        typeof postSpreadsheet.getId !==
          'function' ||
        postSpreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity changed after patch.'
        );
      }

      var postSheet =
        postSpreadsheet
          .getSheetByName(
            sheetName
          );

      if (
        !postSheet ||
        typeof postSheet.getSheetId !==
          'function' ||
        postSheet.getSheetId() !==
          request.sheetId ||
        typeof postSheet.getName !==
          'function' ||
        postSheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Sheet identity changed after patch.'
        );
      }

      if (
        postSheet.getLastRow() !==
          request.expectedLastRow ||
        postSheet.getLastColumn() !==
          request.expectedLastColumn ||
        postSheet.getMaxRows() !==
          request.expectedMaxRows ||
        postSheet.getMaxColumns() !==
          request.expectedMaxColumns
      ) {
        throw new Error(
          'Physical patch geometry changed after mutation.'
        );
      }

      var postHeaders =
        postSheet
          .getRange(
            1,
            1,
            1,
            request.expectedLastColumn
          )
          .getValues()[0];

      var postIdColumnIndex =
        -1;

      var normalizedPostHeaders = {};

      for (
        var postHeaderIndex = 0;
        postHeaderIndex <
          postHeaders.length;
        postHeaderIndex++
      ) {
        if (
          postHeaders[
            postHeaderIndex
          ] !==
            request.expectedHeaders[
              postHeaderIndex
            ]
        ) {
          throw new Error(
            'Physical patch header row changed after mutation.'
          );
        }

        var normalizedPostHeader =
          String(
            postHeaders[
              postHeaderIndex
            ]
          )
            .trim()
            .toLowerCase();

        if (
          !normalizedPostHeader ||
          Object.prototype
            .hasOwnProperty.call(
              normalizedPostHeaders,
              normalizedPostHeader
            )
        ) {
          throw new Error(
            'Physical patch postimage header authority is invalid.'
          );
        }

        normalizedPostHeaders[
          normalizedPostHeader
        ] =
          true;

        if (
          postHeaders[
            postHeaderIndex
          ] ===
            request.idField
        ) {
          if (
            postIdColumnIndex !==
            -1
          ) {
            throw new Error(
              'Physical patch postimage ID field is ambiguous.'
            );
          }

          postIdColumnIndex =
            postHeaderIndex;
        }
      }

      if (
        postIdColumnIndex === -1
      ) {
        throw new Error(
          'Physical patch postimage ID field is missing.'
        );
      }

      var postIdValues =
        postSheet
          .getRange(
            2,
            postIdColumnIndex + 1,
            request.expectedLastRow - 1,
            1
          )
          .getValues();

      var postIdMatchCount = 0;
      var postMatchedRowNumber =
        null;

      for (
        var postIdIndex = 0;
        postIdIndex <
          postIdValues.length;
        postIdIndex++
      ) {
        if (
          postIdValues[
            postIdIndex
          ][0] ===
            request.idValue
        ) {
          postIdMatchCount++;

          postMatchedRowNumber =
            postIdIndex + 2;
        }
      }

      if (
        postIdMatchCount !== 1 ||
        postMatchedRowNumber !==
          request.expectedRowNumber
      ) {
        throw new Error(
          'Physical patch postimage ID identity is missing, ambiguous, or moved.'
        );
      }

      var postRange =
        postSheet
          .getRange(
            request.expectedRowNumber,
            1,
            1,
            request.expectedLastColumn
          );

      var postValues =
        postRange
          .getValues()[0];

      var postFormulas =
        postRange
          .getFormulas()[0];

      if (
        postValues.length !==
          request.expectedLastColumn ||
        postFormulas.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical patch postimage row evidence is incomplete.'
        );
      }

      for (
        var postValueIndex = 0;
        postValueIndex <
          request.expectedLastColumn;
        postValueIndex++
      ) {
        var canonicalPost =
          canonicalizePhysicalDeleteValue_(
            postValues[
              postValueIndex
            ]
          );

        if (
          !physicalDeleteCanonicalValuesEqual_(
            canonicalPost,
            request.expectedPostRowValues[
              postValueIndex
            ]
          )
        ) {
          throw new Error(
            'Physical patch complete postimage value verification failed.'
          );
        }

        if (
          postFormulas[
            postValueIndex
          ] !==
            request.expectedPostRowFormulas[
              postValueIndex
            ]
        ) {
          throw new Error(
            'Physical patch complete postimage formula verification failed.'
          );
        }
      }

      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalPatchError_(
        'PHYSICAL_PATCH_OUTCOME_UNCERTAIN',
        'Physical patch invocation or postimage verification failed.',
        error
      );
    }

    return {
      classification:
        'PHYSICAL_PATCH_VERIFIED',

      spreadsheetId:
        request.spreadsheetId,

      sheetName:
        sheetName,

      sheetId:
        request.sheetId,

      rowNumber:
        request.expectedRowNumber,

      idField:
        request.idField,

      idValue:
        request.idValue,

      patchedColumns:
        orderedPatches
          .map(function (patch) {
            return patch.columnNumber;
          }),

      patchedHeaders:
        orderedPatches
          .map(function (patch) {
            return patch.header;
          }),

      prePatchLastRow:
        preLastRow,

      postPatchLastRow:
        request.expectedLastRow,

      prePatchMaxRows:
        preMaxRows,

      postPatchMaxRows:
        request.expectedMaxRows
    };
  }


  function deletePhysicalRowExact(
    sheetName,
    request,
    options
  ) {
    /*
     * Everything before deleteRow() is a definite
     * no-mutation precondition boundary.
     */
    try {
      validatePhysicalDeleteRequest_(
        sheetName,
        request,
        options
      );
    } catch (error) {
      throw physicalDeleteError_(
        'PHYSICAL_DELETE_PRECONDITION_FAILED',
        'Physical delete request validation failed.',
        error
      );
    }

    try {
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalDeleteError_(
        'PHYSICAL_DELETE_PRECONDITION_FAILED',
        'Caller-owned lock context is invalid.',
        error
      );
    }

    var spreadsheet;
    var sheet;
    var actualHeaders;
    var idColumnIndex = -1;
    var preLastRow;
    var preLastColumn;
    var preMaxRows;
    var preMaxColumns;

    try {
      spreadsheet =
        getSpreadsheet_();

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !==
          'function' ||
        spreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity does not match expected authority.'
        );
      }

      if (
        typeof spreadsheet.getSheetByName !==
          'function'
      ) {
        throw new Error(
          'Spreadsheet sheet lookup is unavailable.'
        );
      }

      sheet =
        spreadsheet.getSheetByName(
          sheetName
        );

      if (!sheet) {
        throw new Error(
          'Sheet not found: ' +
          sheetName
        );
      }

      if (
        typeof sheet.getSheetId !==
          'function' ||
        sheet.getSheetId() !==
          request.sheetId
      ) {
        throw new Error(
          'Sheet ID does not match expected authority.'
        );
      }

      if (
        typeof sheet.getName !==
          'function' ||
        sheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Resolved sheet name does not match requested sheet.'
        );
      }

      preLastRow =
        sheet.getLastRow();

      preLastColumn =
        sheet.getLastColumn();

      preMaxRows =
        sheet.getMaxRows();

      preMaxColumns =
        sheet.getMaxColumns();

      if (
        preLastRow !==
          request.expectedLastRow ||
        preLastColumn !==
          request.expectedLastColumn ||
        preMaxRows !==
          request.expectedMaxRows ||
        preMaxColumns !==
          request.expectedMaxColumns
      ) {
        throw new Error(
          'Physical sheet geometry changed.'
        );
      }

      actualHeaders =
        sheet
          .getRange(
            1,
            1,
            1,
            request.expectedLastColumn
          )
          .getValues()[0];

      if (
        !Array.isArray(
          actualHeaders
        ) ||
        actualHeaders.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical header row is incomplete.'
        );
      }

      var normalizedHeaders = {};

      for (
        var headerIndex = 0;
        headerIndex <
          actualHeaders.length;
        headerIndex++
      ) {
        if (
          actualHeaders[headerIndex] !==
          request.expectedHeaders[
            headerIndex
          ]
        ) {
          throw new Error(
            'Physical header row changed.'
          );
        }

        if (
          typeof actualHeaders[
            headerIndex
          ] !==
          'string'
        ) {
          throw new Error(
            'Physical header must be a string.'
          );
        }

        var normalizedHeader =
          actualHeaders[
            headerIndex
          ]
            .trim()
            .toLowerCase();

        if (!normalizedHeader) {
          throw new Error(
            'Physical header is blank.'
          );
        }

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedHeaders,
              normalizedHeader
            )
        ) {
          throw new Error(
            'Physical header is ambiguous.'
          );
        }

        normalizedHeaders[
          normalizedHeader
        ] =
          true;

        if (
          actualHeaders[
            headerIndex
          ] ===
          request.idField
        ) {
          if (
            idColumnIndex !== -1
          ) {
            throw new Error(
              'ID field is ambiguous.'
            );
          }

          idColumnIndex =
            headerIndex;
        }
      }

      if (
        idColumnIndex === -1
      ) {
        throw new Error(
          'ID field is not present in physical header.'
        );
      }

      var idValues =
        sheet
          .getRange(
            2,
            idColumnIndex + 1,
            request.expectedLastRow - 1,
            1
          )
          .getValues();

      if (
        !Array.isArray(
          idValues
        ) ||
        idValues.length !==
          request.expectedLastRow - 1
      ) {
        throw new Error(
          'Physical ID-column scan is incomplete.'
        );
      }

      var idMatchCount = 0;
      var matchedRowNumber =
        null;

      for (
        var idIndex = 0;
        idIndex <
          idValues.length;
        idIndex++
      ) {
        if (
          !Array.isArray(
            idValues[idIndex]
          ) ||
          idValues[idIndex].length <
            1
        ) {
          throw new Error(
            'Physical ID-column scan is malformed.'
          );
        }

        if (
          idValues[idIndex][0] ===
          request.idValue
        ) {
          idMatchCount++;

          matchedRowNumber =
            idIndex + 2;
        }
      }

      if (
        idMatchCount !== 1
      ) {
        throw new Error(
          'Physical ID identity is missing or ambiguous.'
        );
      }

      if (
        matchedRowNumber !==
          request.expectedRowNumber
      ) {
        throw new Error(
          'Physical ID row position changed.'
        );
      }

      var candidateRange =
        sheet.getRange(
          request.expectedRowNumber,
          1,
          1,
          request.expectedLastColumn
        );

      var candidateValues =
        candidateRange
          .getValues()[0];

      var candidateFormulas =
        candidateRange
          .getFormulas()[0];

      if (
        !Array.isArray(
          candidateValues
        ) ||
        candidateValues.length !==
          request.expectedLastColumn ||
        !Array.isArray(
          candidateFormulas
        ) ||
        candidateFormulas.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Candidate row evidence is incomplete.'
        );
      }

      for (
        var valueIndex = 0;
        valueIndex <
          request.expectedLastColumn;
        valueIndex++
      ) {
        var canonicalActual =
          canonicalizePhysicalDeleteValue_(
            candidateValues[
              valueIndex
            ]
          );

        if (
          !physicalDeleteCanonicalValuesEqual_(
            canonicalActual,
            request.expectedRowValues[
              valueIndex
            ]
          )
        ) {
          throw new Error(
            'Candidate row value evidence changed.'
          );
        }

        if (
          typeof candidateFormulas[
            valueIndex
          ] !==
          'string'
        ) {
          throw new Error(
            'Candidate formula evidence is invalid.'
          );
        }

        if (
          candidateFormulas[
            valueIndex
          ] !==
          request.expectedRowFormulas[
            valueIndex
          ]
        ) {
          throw new Error(
            'Candidate formula evidence changed.'
          );
        }
      }

      /*
       * Revalidate the exact caller-owned lease immediately
       * before the one physical mutation.
       */
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalDeleteError_(
        'PHYSICAL_DELETE_PRECONDITION_FAILED',
        'Physical delete precondition verification failed.',
        error
      );
    }

    /*
     * From this invocation onward, failures are uncertain.
     * There is intentionally exactly one physical-delete
     * call site in this primitive.
     */
    try {
      sheet.deleteRow(
        request.expectedRowNumber
      );
    } catch (error) {
      throw physicalDeleteError_(
        'PHYSICAL_DELETE_OUTCOME_UNCERTAIN',
        'Physical row deletion invocation failed.',
        error
      );
    }

    var postSpreadsheet;
    var postSheet;
    var postLastRow;
    var postMaxRows;

    try {
      postSpreadsheet =
        getSpreadsheet_();

      if (
        !postSpreadsheet ||
        typeof postSpreadsheet.getId !==
          'function' ||
        postSpreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity changed after deletion.'
        );
      }

      postSheet =
        postSpreadsheet
          .getSheetByName(
            sheetName
          );

      if (
        !postSheet ||
        typeof postSheet.getSheetId !==
          'function' ||
        postSheet.getSheetId() !==
          request.sheetId ||
        typeof postSheet.getName !==
          'function' ||
        postSheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Sheet identity changed after deletion.'
        );
      }

      postLastRow =
        postSheet.getLastRow();

      var postLastColumn =
        postSheet.getLastColumn();

      postMaxRows =
        postSheet.getMaxRows();

      var postMaxColumns =
        postSheet.getMaxColumns();

      if (
        postMaxRows !==
          request.expectedMaxRows - 1 ||
        postMaxColumns !==
          request.expectedMaxColumns ||
        postLastRow !==
          request.expectedLastRow - 1 ||
        postLastColumn !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Post-delete physical geometry is not exact.'
        );
      }

      if (
        postLastRow > 1
      ) {
        var postIdValues =
          postSheet
            .getRange(
              2,
              idColumnIndex + 1,
              postLastRow - 1,
              1
            )
            .getValues();

        if (
          !Array.isArray(
            postIdValues
          ) ||
          postIdValues.length !==
            postLastRow - 1
        ) {
          throw new Error(
            'Post-delete ID-column scan is incomplete.'
          );
        }

        for (
          var postIdIndex = 0;
          postIdIndex <
            postIdValues.length;
          postIdIndex++
        ) {
          if (
            !Array.isArray(
              postIdValues[
                postIdIndex
              ]
            ) ||
            postIdValues[
              postIdIndex
            ].length < 1
          ) {
            throw new Error(
              'Post-delete ID-column scan is malformed.'
            );
          }

          if (
            postIdValues[
              postIdIndex
            ][0] ===
            request.idValue
          ) {
            throw new Error(
              'Deleted physical ID remains present.'
            );
          }
        }
      }
    } catch (error) {
      throw physicalDeleteError_(
        'PHYSICAL_DELETE_OUTCOME_UNCERTAIN',
        'Post-delete verification failed.',
        error
      );
    }

    return {
      classification:
        'DELETED_VERIFIED',

      spreadsheetId:
        request.spreadsheetId,

      sheetName:
        sheetName,

      sheetId:
        request.sheetId,

      deletedRowNumber:
        request.expectedRowNumber,

      idField:
        request.idField,

      idValue:
        request.idValue,

      preDeleteLastRow:
        preLastRow,

      postDeleteLastRow:
        postLastRow,

      preDeleteMaxRows:
        preMaxRows,

      postDeleteMaxRows:
        postMaxRows
    };
  }


  var PHYSICAL_REPLACE_REQUEST_FIELDS_ = [
    'spreadsheetId',
    'sheetId',
    'expectedRowNumber',
    'idField',
    'idValue',
    'expectedLastRow',
    'expectedLastColumn',
    'expectedMaxRows',
    'expectedMaxColumns',
    'expectedHeaders',
    'expectedRowValues',
    'expectedRowFormulas',
    'expectedPostRowValues',
    'expectedPostRowFormulas'
  ];

  function physicalReplaceError_(
    classification,
    message,
    cause
  ) {
    var error =
      new Error(
        classification +
        ': ' +
        message
      );

    error.classification =
      classification;

    if (
      cause !== undefined &&
      cause !== null
    ) {
      error.cause =
        cause;
    }

    return error;
  }

  function physicalReplaceCanonicalToRaw_(
    value
  ) {
    validatePhysicalDeleteCanonicalValue_(
      value
    );

    if (
      value.type ===
      'blank'
    ) {
      return '';
    }

    if (
      value.type ===
      'string'
    ) {
      return value.value;
    }

    if (
      value.type ===
      'number'
    ) {
      return Number(
        value.value
      );
    }

    if (
      value.type ===
      'boolean'
    ) {
      return value.value;
    }

    if (
      value.type ===
      'date'
    ) {
      return new Date(
        value.value
      );
    }

    throw new Error(
      'Physical replace canonical value type is unsupported.'
    );
  }

  function validatePhysicalReplaceRequest_(
    sheetName,
    request,
    options
  ) {
    if (
      typeof sheetName !==
        'string' ||
      sheetName.trim() === ''
    ) {
      throw new Error(
        'Physical replace sheet name is required.'
      );
    }

    physicalDeleteExactFields_(
      request,
      PHYSICAL_REPLACE_REQUEST_FIELDS_,
      'Physical replace request'
    );

    physicalDeleteExactFields_(
      options,
      [
        'lockContext'
      ],
      'Physical replace options'
    );

    if (
      typeof request.spreadsheetId !==
        'string' ||
      request.spreadsheetId.trim() === ''
    ) {
      throw new Error(
        'Physical replace spreadsheet ID is required.'
      );
    }

    if (
      !Number.isInteger(
        request.sheetId
      )
    ) {
      throw new Error(
        'Physical replace sheet ID is invalid.'
      );
    }

    if (
      !Number.isInteger(
        request.expectedRowNumber
      ) ||
      request.expectedRowNumber <= 1
    ) {
      throw new Error(
        'Physical replace row number must exclude the header row.'
      );
    }

    if (
      typeof request.idField !==
        'string' ||
      request.idField.trim() === ''
    ) {
      throw new Error(
        'Physical replace ID field is required.'
      );
    }

    if (
      typeof request.idValue !==
        'string' ||
      request.idValue.trim() === ''
    ) {
      throw new Error(
        'Physical replace ID value is required.'
      );
    }

    [
      'expectedLastRow',
      'expectedLastColumn',
      'expectedMaxRows',
      'expectedMaxColumns'
    ].forEach(function (field) {
      if (
        !Number.isInteger(
          request[field]
        ) ||
        request[field] < 1
      ) {
        throw new Error(
          'Physical replace geometry field is invalid: ' +
          field
        );
      }
    });

    if (
      request.expectedLastRow <
        request.expectedRowNumber ||
      request.expectedMaxRows <
        request.expectedLastRow ||
      request.expectedMaxColumns <
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical replace expected geometry is inconsistent.'
      );
    }

    [
      'expectedHeaders',
      'expectedRowValues',
      'expectedRowFormulas',
      'expectedPostRowValues',
      'expectedPostRowFormulas'
    ].forEach(function (field) {
      if (
        !Array.isArray(
          request[field]
        )
      ) {
        throw new Error(
          'Physical replace array is required: ' +
          field
        );
      }
    });

    if (
      request.expectedHeaders.length !==
        request.expectedLastColumn ||
      request.expectedRowValues.length !==
        request.expectedLastColumn ||
      request.expectedRowFormulas.length !==
        request.expectedLastColumn ||
      request.expectedPostRowValues.length !==
        request.expectedLastColumn ||
      request.expectedPostRowFormulas.length !==
        request.expectedLastColumn
    ) {
      throw new Error(
        'Physical replace array lengths do not match geometry.'
      );
    }

    var normalizedHeaders = {};
    var idHeaderIndex = -1;

    request.expectedHeaders
      .forEach(function (
        header,
        index
      ) {
        if (
          typeof header !==
            'string' ||
          header.trim() === ''
        ) {
          throw new Error(
            'Physical replace expected header is invalid.'
          );
        }

        var normalized =
          header
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedHeaders,
              normalized
            )
        ) {
          throw new Error(
            'Physical replace expected header is ambiguous.'
          );
        }

        normalizedHeaders[
          normalized
        ] =
          true;

        if (
          header ===
          request.idField
        ) {
          if (
            idHeaderIndex !==
            -1
          ) {
            throw new Error(
              'Physical replace ID field is ambiguous.'
            );
          }

          idHeaderIndex =
            index;
        }
      });

    if (
      idHeaderIndex ===
      -1
    ) {
      throw new Error(
        'Physical replace ID field must resolve exactly once.'
      );
    }

    request.expectedRowValues
      .forEach(function (value) {
        validatePhysicalDeleteCanonicalValue_(
          value
        );
      });

    request.expectedPostRowValues
      .forEach(function (value) {
        validatePhysicalDeleteCanonicalValue_(
          value
        );
      });

    for (
      var formulaIndex = 0;
      formulaIndex <
        request.expectedLastColumn;
      formulaIndex++
    ) {
      var preFormula =
        request.expectedRowFormulas[
          formulaIndex
        ];

      var postFormula =
        request.expectedPostRowFormulas[
          formulaIndex
        ];

      if (
        typeof preFormula !==
        'string'
      ) {
        throw new Error(
          'Physical replace expected preimage formula is invalid.'
        );
      }

      if (
        typeof postFormula !==
        'string'
      ) {
        throw new Error(
          'Physical replace expected postimage formula is invalid.'
        );
      }

      if (
        postFormula !==
        preFormula
      ) {
        throw new Error(
          'Physical replace v1 does not authorize formula mutation.'
        );
      }

      var postValue =
        request.expectedPostRowValues[
          formulaIndex
        ];

      if (
        postFormula === '' &&
        postValue.type ===
          'string' &&
        postValue.value
          .indexOf('=') ===
          0
      ) {
        throw new Error(
          'Physical replace non-formula string must not begin with equals.'
        );
      }
    }

    var expectedPreId =
      request.expectedRowValues[
        idHeaderIndex
      ];

    var expectedPostId =
      request.expectedPostRowValues[
        idHeaderIndex
      ];

    if (
      expectedPreId.type !==
        'string' ||
      expectedPreId.value !==
        request.idValue
    ) {
      throw new Error(
        'Physical replace preimage ID does not match immutable identity.'
      );
    }

    if (
      expectedPostId.type !==
        'string' ||
      expectedPostId.value !==
        request.idValue
    ) {
      throw new Error(
        'Physical replace postimage ID does not preserve immutable identity.'
      );
    }
  }

  function replacePhysicalRowExact(
    sheetName,
    request,
    options
  ) {
    try {
      validatePhysicalReplaceRequest_(
        sheetName,
        request,
        options
      );
    } catch (error) {
      throw physicalReplaceError_(
        'PHYSICAL_REPLACE_PRECONDITION_FAILED',
        'Physical replace request validation failed.',
        error
      );
    }

    try {
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalReplaceError_(
        'PHYSICAL_REPLACE_PRECONDITION_FAILED',
        'Caller-owned lock context is invalid.',
        error
      );
    }

    var spreadsheet;
    var sheet;
    var actualHeaders;
    var idColumnIndex = -1;
    var preLastRow;
    var preLastColumn;
    var preMaxRows;
    var preMaxColumns;
    var candidateRange;
    var replacementRow = [];

    try {
      spreadsheet =
        getSpreadsheet_();

      if (
        !spreadsheet ||
        typeof spreadsheet.getId !==
          'function' ||
        spreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity does not match expected replace authority.'
        );
      }

      if (
        typeof spreadsheet.getSheetByName !==
          'function'
      ) {
        throw new Error(
          'Spreadsheet sheet lookup is unavailable.'
        );
      }

      sheet =
        spreadsheet.getSheetByName(
          sheetName
        );

      if (!sheet) {
        throw new Error(
          'Sheet not found: ' +
          sheetName
        );
      }

      if (
        typeof sheet.getSheetId !==
          'function' ||
        sheet.getSheetId() !==
          request.sheetId ||
        typeof sheet.getName !==
          'function' ||
        sheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Physical replace sheet identity changed.'
        );
      }

      preLastRow =
        sheet.getLastRow();

      preLastColumn =
        sheet.getLastColumn();

      preMaxRows =
        sheet.getMaxRows();

      preMaxColumns =
        sheet.getMaxColumns();

      if (
        preLastRow !==
          request.expectedLastRow ||
        preLastColumn !==
          request.expectedLastColumn ||
        preMaxRows !==
          request.expectedMaxRows ||
        preMaxColumns !==
          request.expectedMaxColumns
      ) {
        throw new Error(
          'Physical replace sheet geometry changed.'
        );
      }

      actualHeaders =
        sheet
          .getRange(
            1,
            1,
            1,
            request.expectedLastColumn
          )
          .getValues()[0];

      if (
        !Array.isArray(
          actualHeaders
        ) ||
        actualHeaders.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical replace header row is incomplete.'
        );
      }

      var normalizedActualHeaders = {};

      for (
        var headerIndex = 0;
        headerIndex <
          actualHeaders.length;
        headerIndex++
      ) {
        if (
          actualHeaders[
            headerIndex
          ] !==
            request.expectedHeaders[
              headerIndex
            ]
        ) {
          throw new Error(
            'Physical replace header row changed.'
          );
        }

        if (
          typeof actualHeaders[
            headerIndex
          ] !==
            'string' ||
          actualHeaders[
            headerIndex
          ].trim() === ''
        ) {
          throw new Error(
            'Physical replace header is invalid.'
          );
        }

        var normalizedActualHeader =
          actualHeaders[
            headerIndex
          ]
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedActualHeaders,
              normalizedActualHeader
            )
        ) {
          throw new Error(
            'Physical replace header is ambiguous.'
          );
        }

        normalizedActualHeaders[
          normalizedActualHeader
        ] =
          true;

        if (
          actualHeaders[
            headerIndex
          ] ===
            request.idField
        ) {
          if (
            idColumnIndex !==
            -1
          ) {
            throw new Error(
              'Physical replace ID field is ambiguous.'
            );
          }

          idColumnIndex =
            headerIndex;
        }
      }

      if (
        idColumnIndex ===
        -1
      ) {
        throw new Error(
          'Physical replace ID field is not present.'
        );
      }

      var idValues =
        sheet
          .getRange(
            2,
            idColumnIndex + 1,
            request.expectedLastRow - 1,
            1
          )
          .getValues();

      if (
        !Array.isArray(
          idValues
        ) ||
        idValues.length !==
          request.expectedLastRow - 1
      ) {
        throw new Error(
          'Physical replace ID-column scan is incomplete.'
        );
      }

      var idMatchCount = 0;
      var matchedRowNumber =
        null;

      for (
        var idIndex = 0;
        idIndex <
          idValues.length;
        idIndex++
      ) {
        if (
          !Array.isArray(
            idValues[
              idIndex
            ]
          ) ||
          idValues[
            idIndex
          ].length < 1
        ) {
          throw new Error(
            'Physical replace ID-column scan is malformed.'
          );
        }

        if (
          idValues[
            idIndex
          ][0] ===
            request.idValue
        ) {
          idMatchCount++;

          matchedRowNumber =
            idIndex + 2;
        }
      }

      if (
        idMatchCount !==
          1 ||
        matchedRowNumber !==
          request.expectedRowNumber
      ) {
        throw new Error(
          'Physical replace ID identity is missing, ambiguous, or moved.'
        );
      }

      candidateRange =
        sheet.getRange(
          request.expectedRowNumber,
          1,
          1,
          request.expectedLastColumn
        );

      if (
        !candidateRange ||
        typeof candidateRange.setValues !==
          'function'
      ) {
        throw new Error(
          'Physical replace full-row write surface is unavailable.'
        );
      }

      var candidateValues =
        candidateRange
          .getValues()[0];

      var candidateFormulas =
        candidateRange
          .getFormulas()[0];

      if (
        !Array.isArray(
          candidateValues
        ) ||
        candidateValues.length !==
          request.expectedLastColumn ||
        !Array.isArray(
          candidateFormulas
        ) ||
        candidateFormulas.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical replace candidate row evidence is incomplete.'
        );
      }

      for (
        var valueIndex = 0;
        valueIndex <
          request.expectedLastColumn;
        valueIndex++
      ) {
        var canonicalActual =
          canonicalizePhysicalDeleteValue_(
            candidateValues[
              valueIndex
            ]
          );

        if (
          !physicalDeleteCanonicalValuesEqual_(
            canonicalActual,
            request.expectedRowValues[
              valueIndex
            ]
          )
        ) {
          throw new Error(
            'Physical replace candidate row value changed.'
          );
        }

        if (
          candidateFormulas[
            valueIndex
          ] !==
            request.expectedRowFormulas[
              valueIndex
            ]
        ) {
          throw new Error(
            'Physical replace candidate row formula changed.'
          );
        }

        var replacementFormula =
          request.expectedPostRowFormulas[
            valueIndex
          ];

        if (
          replacementFormula !== ''
        ) {
          replacementRow.push(
            replacementFormula
          );
        } else {
          replacementRow.push(
            physicalReplaceCanonicalToRaw_(
              request.expectedPostRowValues[
                valueIndex
              ]
            )
          );
        }
      }

      /*
       * This is the final definite no-write boundary.
       */
      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalReplaceError_(
        'PHYSICAL_REPLACE_PRECONDITION_FAILED',
        'Physical replace precondition verification failed.',
        error
      );
    }

    /*
     * From entry into this one setValues invocation onward,
     * every failure is conservatively uncertain.
     */
    try {
      candidateRange.setValues(
        [
          replacementRow
        ]
      );

      SpreadsheetApp.flush();

      validateLockContext_(
        options.lockContext
      );

      var postSpreadsheet =
        getSpreadsheet_();

      if (
        !postSpreadsheet ||
        typeof postSpreadsheet.getId !==
          'function' ||
        postSpreadsheet.getId() !==
          request.spreadsheetId
      ) {
        throw new Error(
          'Spreadsheet identity changed after replacement.'
        );
      }

      var postSheet =
        postSpreadsheet
          .getSheetByName(
            sheetName
          );

      if (
        !postSheet ||
        typeof postSheet.getSheetId !==
          'function' ||
        postSheet.getSheetId() !==
          request.sheetId ||
        typeof postSheet.getName !==
          'function' ||
        postSheet.getName() !==
          sheetName
      ) {
        throw new Error(
          'Sheet identity changed after replacement.'
        );
      }

      if (
        postSheet.getLastRow() !==
          request.expectedLastRow ||
        postSheet.getLastColumn() !==
          request.expectedLastColumn ||
        postSheet.getMaxRows() !==
          request.expectedMaxRows ||
        postSheet.getMaxColumns() !==
          request.expectedMaxColumns
      ) {
        throw new Error(
          'Physical replace geometry changed after mutation.'
        );
      }

      var postHeaders =
        postSheet
          .getRange(
            1,
            1,
            1,
            request.expectedLastColumn
          )
          .getValues()[0];

      if (
        !Array.isArray(
          postHeaders
        ) ||
        postHeaders.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical replace postimage header row is incomplete.'
        );
      }

      var normalizedPostHeaders = {};
      var postIdColumnIndex = -1;

      for (
        var postHeaderIndex = 0;
        postHeaderIndex <
          postHeaders.length;
        postHeaderIndex++
      ) {
        if (
          postHeaders[
            postHeaderIndex
          ] !==
            request.expectedHeaders[
              postHeaderIndex
            ]
        ) {
          throw new Error(
            'Physical replace header row changed after mutation.'
          );
        }

        if (
          typeof postHeaders[
            postHeaderIndex
          ] !==
            'string' ||
          postHeaders[
            postHeaderIndex
          ].trim() === ''
        ) {
          throw new Error(
            'Physical replace postimage header is invalid.'
          );
        }

        var normalizedPostHeader =
          postHeaders[
            postHeaderIndex
          ]
            .trim()
            .toLowerCase();

        if (
          Object.prototype
            .hasOwnProperty.call(
              normalizedPostHeaders,
              normalizedPostHeader
            )
        ) {
          throw new Error(
            'Physical replace postimage header is ambiguous.'
          );
        }

        normalizedPostHeaders[
          normalizedPostHeader
        ] =
          true;

        if (
          postHeaders[
            postHeaderIndex
          ] ===
            request.idField
        ) {
          if (
            postIdColumnIndex !==
            -1
          ) {
            throw new Error(
              'Physical replace postimage ID field is ambiguous.'
            );
          }

          postIdColumnIndex =
            postHeaderIndex;
        }
      }

      if (
        postIdColumnIndex ===
        -1
      ) {
        throw new Error(
          'Physical replace postimage ID field is missing.'
        );
      }

      var postIdValues =
        postSheet
          .getRange(
            2,
            postIdColumnIndex + 1,
            request.expectedLastRow - 1,
            1
          )
          .getValues();

      if (
        !Array.isArray(
          postIdValues
        ) ||
        postIdValues.length !==
          request.expectedLastRow - 1
      ) {
        throw new Error(
          'Physical replace postimage ID-column scan is incomplete.'
        );
      }

      var postIdMatchCount = 0;
      var postMatchedRowNumber =
        null;

      for (
        var postIdIndex = 0;
        postIdIndex <
          postIdValues.length;
        postIdIndex++
      ) {
        if (
          !Array.isArray(
            postIdValues[
              postIdIndex
            ]
          ) ||
          postIdValues[
            postIdIndex
          ].length < 1
        ) {
          throw new Error(
            'Physical replace postimage ID-column scan is malformed.'
          );
        }

        if (
          postIdValues[
            postIdIndex
          ][0] ===
            request.idValue
        ) {
          postIdMatchCount++;

          postMatchedRowNumber =
            postIdIndex + 2;
        }
      }

      if (
        postIdMatchCount !==
          1 ||
        postMatchedRowNumber !==
          request.expectedRowNumber
      ) {
        throw new Error(
          'Physical replace postimage ID identity is missing, ambiguous, or moved.'
        );
      }

      var postRange =
        postSheet
          .getRange(
            request.expectedRowNumber,
            1,
            1,
            request.expectedLastColumn
          );

      var postValues =
        postRange
          .getValues()[0];

      var postFormulas =
        postRange
          .getFormulas()[0];

      if (
        !Array.isArray(
          postValues
        ) ||
        postValues.length !==
          request.expectedLastColumn ||
        !Array.isArray(
          postFormulas
        ) ||
        postFormulas.length !==
          request.expectedLastColumn
      ) {
        throw new Error(
          'Physical replace postimage row evidence is incomplete.'
        );
      }

      for (
        var postValueIndex = 0;
        postValueIndex <
          request.expectedLastColumn;
        postValueIndex++
      ) {
        var canonicalPost =
          canonicalizePhysicalDeleteValue_(
            postValues[
              postValueIndex
            ]
          );

        if (
          !physicalDeleteCanonicalValuesEqual_(
            canonicalPost,
            request.expectedPostRowValues[
              postValueIndex
            ]
          )
        ) {
          throw new Error(
            'Physical replace complete postimage value verification failed.'
          );
        }

        if (
          postFormulas[
            postValueIndex
          ] !==
            request.expectedPostRowFormulas[
              postValueIndex
            ]
        ) {
          throw new Error(
            'Physical replace complete postimage formula verification failed.'
          );
        }
      }

      validateLockContext_(
        options.lockContext
      );
    } catch (error) {
      throw physicalReplaceError_(
        'PHYSICAL_REPLACE_OUTCOME_UNCERTAIN',
        'Physical replace invocation or postimage verification failed.',
        error
      );
    }

    return {
      classification:
        'PHYSICAL_REPLACE_VERIFIED',

      spreadsheetId:
        request.spreadsheetId,

      sheetName:
        sheetName,

      sheetId:
        request.sheetId,

      rowNumber:
        request.expectedRowNumber,

      idField:
        request.idField,

      idValue:
        request.idValue,

      preReplaceLastRow:
        preLastRow,

      postReplaceLastRow:
        request.expectedLastRow,

      preReplaceMaxRows:
        preMaxRows,

      postReplaceMaxRows:
        request.expectedMaxRows
    };
  }


  function insert(sheetName, record, options) {
    options = options || {};

    var callerOwnsLock =
      Object.prototype.hasOwnProperty.call(
        options,
        'lockContext'
      );

    var lock;

    var lockObservation =
      null;

    var lockOutcome =
      'SUCCESS';

    if (callerOwnsLock) {
      lock =
        validateLockContext_(
          options.lockContext
        );
    } else {
      lock =
        LockService.getScriptLock();

      lock.waitLock(
        30000
      );

      lockObservation =
        beginLockObservation_(
          'Database.insert',
          sheetName,
          {
            waitMode: 'waitLock',
            waitMilliseconds: 30000
          }
        );
    }

    try {
      const sheet = getSheet(sheetName);
      const headers = getHeaders(sheetName);
      const now = new Date();
      record = Object.assign({}, record || {});
      if (options.idField && !record[options.idField]) record[options.idField] = REOS.generateId_(options.idPrefix || 'ID');
      if (headers.indexOf('Created At') !== -1 && !record['Created At']) record['Created At'] = now;
      if (headers.indexOf('Updated At') !== -1) record['Updated At'] = now;
      const row = objectToRow(headers, record);
      sheet.appendRow(row);
      const inserted = rowToObject(headers, row, sheet.getLastRow());
      if (REOS.Logger) REOS.Logger.info('DB insert', { sheet: sheetName, id: options.idField ? inserted[options.idField] : null });
      return inserted;
    } catch (error) {
      lockOutcome =
        'ERROR';

      throw error;
    } finally {
      if (!callerOwnsLock) {
        lock.releaseLock();

        endLockObservation_(
          lockObservation,
          lockOutcome,
          {
            sheetName:
              sheetName
          }
        );
      }
    }
  }

  function update(sheetName, idField, idValue, changes) {
    var options =
      (
        arguments.length > 4 &&
        arguments[4]
      )
        ? arguments[4]
        : {};

    var callerOwnsLock =
      Object.prototype.hasOwnProperty.call(
        options,
        'lockContext'
      );

    var lock;

    var lockObservation =
      null;

    var lockOutcome =
      'SUCCESS';

    if (callerOwnsLock) {
      lock =
        validateLockContext_(
          options.lockContext
        );
    } else {
      lock =
        LockService.getScriptLock();

      lock.waitLock(
        30000
      );

      lockObservation =
        beginLockObservation_(
          'Database.update',
          sheetName,
          {
            waitMode: 'waitLock',
            waitMilliseconds: 30000
          }
        );
    }

    try {
      const sheet = getSheet(sheetName);
      const headers = getHeaders(sheetName);
      const rowNumber =
        findRowById(
          sheetName,
          idField,
          idValue
        );

      if (!rowNumber) {
        throw new Error(
          'Record not found: ' +
          idValue
        );
      }

      const currentValues =
        sheet
          .getRange(
            rowNumber,
            1,
            1,
            headers.length
          )
          .getValues()[0];

      const currentRecord =
        rowToObject(
          headers,
          currentValues,
          rowNumber
        );

      const updatedRecord =
        Object.assign(
          {},
          currentRecord,
          changes || {}
        );

      delete updatedRecord._rowNumber;

      if (
        headers.indexOf(
          'Updated At'
        ) !== -1
      ) {
        updatedRecord[
          'Updated At'
        ] = new Date();
      }

      const row =
        objectToRow(
          headers,
          updatedRecord
        );

      sheet
        .getRange(
          rowNumber,
          1,
          1,
          row.length
        )
        .setValues(
          [row]
        );

      if (REOS.Logger) {
        REOS.Logger.info(
          'DB update',
          {
            sheet:
              sheetName,
            id:
              idValue
          }
        );
      }

      return rowToObject(
        headers,
        row,
        rowNumber
      );
    } catch (error) {
      lockOutcome =
        'ERROR';

      throw error;
    } finally {
      if (!callerOwnsLock) {
        lock.releaseLock();

        endLockObservation_(
          lockObservation,
          lockOutcome,
          {
            sheetName:
              sheetName
          }
        );
      }
    }
  }

  function upsert(sheetName, idField, idValue, record, options) {
    const existing = idValue ? findById(sheetName, idField, idValue) : null;
    if (existing) return update(sheetName, idField, idValue, record || {});
    return insert(sheetName, record || {}, options || { idField: idField });
  }

  function softDelete(sheetName, idField, idValue) {
    const headers = getHeaders(sheetName);
    if (headers.indexOf('Active') !== -1) return update(sheetName, idField, idValue, { Active: false, Status: 'Archived' });
    return update(sheetName, idField, idValue, { Status: 'Archived' });
  }

  function query(sheetName, predicate) {
    return getAll(sheetName).filter(predicate || function () { return true; });
  }

  return {
    getSheet: getSheet,
    ensureTable: ensureTable,
    getHeaders: getHeaders,
    getHeaderMap: getHeaderMap,
    getAll: getAll,
    findById: findById,
    findRowById: findRowById,
    withScriptLockContext: withScriptLockContext,
    assertScriptLockContext: assertScriptLockContext,
    patchPhysicalRowCellsExact: patchPhysicalRowCellsExact,
    deletePhysicalRowExact: deletePhysicalRowExact,
    replacePhysicalRowExact: replacePhysicalRowExact,
    insert: insert,
    update: update,
    upsert: upsert,
    softDelete: softDelete,
    query: query,
    rowToObject: rowToObject,
    objectToRow: objectToRow
  };
})();
