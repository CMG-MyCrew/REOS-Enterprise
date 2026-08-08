/**
 * REOS Enterprise - Canonical Backup & Recovery Framework
 * Single source of truth for BACKUPS metadata and backup operations.
 */
var REOS = REOS || {};

REOS.Backup = (function () {
  const SHEET = 'BACKUPS';
  const ID_FIELD = 'Backup ID';
  const RETENTION_DAYS = 90;

  const HEADERS = [
    'Backup ID','Backup Date','Backup Type','Source Spreadsheet ID',
    'Backup Spreadsheet ID','Backup URL','Folder ID','Status','Retention Days',
    'Size Note','Notes','Config JSON','Created By','Restore Tested At',
    'Created At','Updated At'
  ];

  const ALIASES = {
    'Backup Type': 'Type',
    'Source Spreadsheet ID': 'Source Workbook ID',
    'Backup Spreadsheet ID': 'Backup File ID'
  };

  function ensureSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(SHEET);

    if (!sh) sh = ss.insertSheet(SHEET);

    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      formatHeader_(sh);
      return sh;
    }

    addMissingHeaders_(sh);
    migrateLegacyRows_(sh);
    return sh;
  }

  function addMissingHeaders_(sh) {
    const headers = headers_(sh);
    const missing = HEADERS.filter(function (header) {
      return headers.indexOf(header) < 0;
    });

    if (!missing.length) return;

    sh.getRange(
      1,
      sh.getLastColumn() + 1,
      1,
      missing.length
    ).setValues([missing]);

    formatHeader_(sh);

    REOS.Logger.audit(
      'BACKUPS schema extended',
      { addedHeaders: missing }
    );
  }

  function migrateLegacyRows_(sh) {
    const headers = headers_(sh);
    const map = headerMap_(headers);

    if (sh.getLastRow() < 2) return 0;

    const rows = sh
      .getRange(2, 1, sh.getLastRow() - 1, headers.length)
      .getValues();

    let changedRows = 0;

    rows.forEach(function (row) {
      let changed = false;

      Object.keys(ALIASES).forEach(function (target) {
        const source = ALIASES[target];

        if (
          has_(map, target) &&
          has_(map, source) &&
          blank_(row[map[target]]) &&
          !blank_(row[map[source]])
        ) {
          row[map[target]] = row[map[source]];
          changed = true;
        }
      });

      if (has_(map, 'Backup Type')) {
        const legacyType = String(
          row[map['Backup Type']] || ''
        ).trim();

        if (legacyType === 'Workbook') {
          row[map['Backup Type']] =
            'Spreadsheet Copy';
          changed = true;
        } else if (legacyType === 'Config') {
          row[map['Backup Type']] =
            'Configuration';
          changed = true;
        }
      }

      if (
        has_(map, 'Backup Date') &&
        has_(map, 'Created At') &&
        blank_(row[map['Backup Date']]) &&
        !blank_(row[map['Created At']])
      ) {
        row[map['Backup Date']] = row[map['Created At']];
        changed = true;
      }

      if (
        has_(map, 'Retention Days') &&
        !blank_(row[map[ID_FIELD]]) &&
        blank_(row[map['Retention Days']])
      ) {
        row[map['Retention Days']] = RETENTION_DAYS;
        changed = true;
      }

      if (changed) changedRows++;
    });

    if (changedRows) {
      sh.getRange(
        2,
        1,
        rows.length,
        headers.length
      ).setValues(rows);

      REOS.Logger.audit(
        'BACKUPS legacy rows migrated',
        { rowsUpdated: changedRows }
      );
    }

    return changedRows;
  }

  function createSpreadsheetBackup(notes, options) {
    REOS.Security.requirePermission('finance:write');

    ensureSheet();
    options = options || {};

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const folder = getBackupFolder_();
    const now = new Date();

    const stamp = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'yyyy-MM-dd_HH-mm-ss'
    );

    const label = label_(options.label || '');

    const name =
      'REOS Backup - ' +
      (label ? label + ' - ' : '') +
      stamp;

    const copy = DriveApp
      .getFileById(ss.getId())
      .makeCopy(name, folder);

    const row = insert_({
      'Backup Date': now,
      'Backup Type': 'Spreadsheet Copy',
      'Source Spreadsheet ID': ss.getId(),
      'Backup Spreadsheet ID': copy.getId(),
      'Backup URL': copy.getUrl(),
      'Folder ID': folder.getId(),
      Status: 'Completed',
      'Retention Days': positive_(
        options.retentionDays,
        RETENTION_DAYS
      ),
      'Size Note': 'Google Drive spreadsheet copy',
      Notes: notes || '',
      'Config JSON': JSON.stringify({
        label: label
      }),
      'Created By': currentUser_()
    }, options.idPrefix || 'BAK');

    REOS.Logger.audit(
      'Spreadsheet backup created',
      {
        backupId: row[ID_FIELD],
        fileId: copy.getId()
      }
    );

    return row;
  }

  function createConfigBackup(label, options) {
    REOS.Security.requireAdmin();

    ensureSheet();
    options = options || {};

    const safe = safeProperties_(
      PropertiesService
        .getScriptProperties()
        .getProperties()
    );

    const row = insert_({
      'Backup Date': new Date(),
      'Backup Type': 'Configuration',
      'Source Spreadsheet ID':
        SpreadsheetApp.getActiveSpreadsheet().getId(),
      Status: 'Completed',
      'Retention Days': RETENTION_DAYS,
      'Size Note':
        'Script properties snapshot; secret-like values redacted',
      Notes: safe.redacted.length
        ? 'Redacted keys: ' + safe.redacted.join(', ')
        : 'Configuration snapshot.',
      'Config JSON': JSON.stringify({
        label: label_(label || ''),
        properties: safe.properties,
        redactedKeys: safe.redacted
      }),
      'Created By': currentUser_()
    }, options.idPrefix || 'BAK');

    REOS.Logger.audit(
      'Configuration backup created',
      {
        backupId: row[ID_FIELD],
        redactedKeyCount: safe.redacted.length
      }
    );

    return row;
  }

  function createRollbackPoint(label) {
    REOS.Security.requireAdmin();

    const name = label_(label || 'Rollback Point');

    return {
      workbook: createSpreadsheetBackup(
        'Rollback point workbook snapshot.',
        { label: name }
      ),
      config: createConfigBackup(name)
    };
  }

  function listBackups(options) {
    REOS.Security.requirePermission('reports:read');

    ensureSheet();

    if (typeof options !== 'object') {
      options = {
        limit: Number(options || 50)
      };
    }

    options = options || {};

    return REOS.Database
      .getAll(SHEET)
      .slice()
      .sort(function (a, b) {
        return time_(b) - time_(a);
      })
      .slice(
        0,
        positive_(options.limit, 50)
      );
  }

  function validateBackup(backupId) {
    REOS.Security.requireAdmin();

    ensureSheet();

    const row = REOS.Database.findById(
      SHEET,
      ID_FIELD,
      backupId
    );

    if (!row) {
      throw new Error(
        'Backup not found: ' + backupId
      );
    }

    const fileId = String(
      row['Backup Spreadsheet ID'] ||
      row['Backup File ID'] ||
      ''
    ).trim();

    const type = String(
      row['Backup Type'] ||
      row.Type ||
      ''
    ).trim();

    if (fileId) {
      try {
        const file = DriveApp.getFileById(fileId);

        return {
          ok: true,
          backup: row,
          message: 'Backup file accessible.',
          fileId: file.getId(),
          fileName: file.getName()
        };
      } catch (error) {
        return {
          ok: false,
          backup: row,
          message:
            error.message ||
            String(error)
        };
      }
    }

    if (type === 'Configuration') {
      try {
        const data = JSON.parse(
          String(row['Config JSON'] || '{}')
        );

        return {
          ok: true,
          backup: row,
          message:
            'Configuration snapshot readable.',
          redactedKeys:
            data.redactedKeys || []
        };
      } catch (error) {
        return {
          ok: false,
          backup: row,
          message:
            'Invalid Config JSON: ' +
            error.message
        };
      }
    }

    return {
      ok: false,
      backup: row,
      message:
        'Incomplete backup metadata.'
    };
  }

  function markRestoreTested(
    backupId,
    notes
  ) {
    REOS.Security.requirePermission(
      'finance:write'
    );

    ensureSheet();

    return REOS.Database.update(
      SHEET,
      ID_FIELD,
      backupId,
      {
        Status: 'Restore Tested',
        'Restore Tested At':
          new Date(),
        Notes:
          notes ||
          'Restore test completed.'
      }
    );
  }

  function cleanupExpiredBackups() {
    REOS.Security.requirePermission(
      'finance:write'
    );

    ensureSheet();

    const now = Date.now();
    let marked = 0;

    REOS.Database
      .getAll(SHEET)
      .forEach(function (row) {
        const date = date_(
          row['Backup Date'] ||
          row['Created At']
        );

        const status = String(
          row.Status || ''
        );

        const retention = positive_(
          row['Retention Days'],
          RETENTION_DAYS
        );

        if (
          date &&
          (
            status === 'Completed' ||
            status === 'Created'
          ) &&
          now - date.getTime() >
            retention * 86400000
        ) {
          REOS.Database.update(
            SHEET,
            ID_FIELD,
            row[ID_FIELD],
            {
              Status: 'Expired'
            }
          );

          marked++;
        }
      });

    return {
      expiredMarked: marked,
      deletedFiles: 0
    };
  }

  function migrateSchema() {
    REOS.Security.requireAdmin();
    ensureSheet();
    return schemaStatus();
  }

  function schemaStatus() {
    REOS.Security.requireAdmin();

    ensureSheet();

    const headers =
      REOS.Database.getHeaders(SHEET);

    const rows =
      REOS.Database.getAll(SHEET);

    const missing = HEADERS.filter(
      function (header) {
        return headers.indexOf(header) < 0;
      }
    );

    const legacy = Object
      .keys(ALIASES)
      .map(function (key) {
        return ALIASES[key];
      })
      .filter(function (header) {
        return headers.indexOf(header) >= 0;
      });

    const incomplete = rows
      .filter(function (row) {
        return (
          row[ID_FIELD] &&
          !String(
            row['Backup Type'] ||
            row.Type ||
            ''
          ).trim()
        );
      })
      .map(function (row) {
        return {
          backupId:
            row[ID_FIELD],
          rowNumber:
            row._rowNumber
        };
      });

    return {
      ok: missing.length === 0 && incomplete.length === 0,
      sheet: SHEET,
      rowCount: rows.length,
      missingHeaders: missing,
      legacyHeadersRetained:
        legacy,
      incompleteRows:
        incomplete
    };
  }

  function insert_(record, idPrefix) {
    ensureSheet();

    return REOS.Database.insert(
      SHEET,
      record,
      {
        idField: ID_FIELD,
        idPrefix:
          idPrefix || 'BAK'
      }
    );
  }

  function getBackupFolder_() {
    const id =
      REOS.getProperty_(
        'REOS_BACKUP_FOLDER_ID'
      );

    if (id) {
      try {
        return DriveApp.getFolderById(id);
      } catch (error) {
        REOS.Logger.warn(
          'Backup folder ID is stale; resolving folder again.',
          { folderId: id }
        );
      }
    }

    const root =
      REOS.GoogleDrive &&
      REOS.GoogleDrive.getRootFolder
        ? REOS.GoogleDrive.getRootFolder()
        : DriveApp.getRootFolder();

    const matches =
      root.getFoldersByName(
        'REOS Backups'
      );

    const folder =
      matches.hasNext()
        ? matches.next()
        : root.createFolder(
            'REOS Backups'
          );

    REOS.setProperty_(
      'REOS_BACKUP_FOLDER_ID',
      folder.getId()
    );

    return folder;
  }

  function safeProperties_(props) {
    const properties = {};
    const redacted = [];

    Object.keys(props || {})
      .sort()
      .forEach(function (key) {
        if (
          /(^|[_-])(SECRET|TOKEN|PASSWORD|PASSCODE|CREDENTIALS?|KEY)([_-]|$)/i
            .test(key) ||
          /(PRIVATEKEY|APIKEY|AUTHKEY|CLIENTSECRET|ACCESSTOKEN|REFRESHTOKEN)$/i
            .test(String(key || '').replace(/[^A-Za-z0-9]/g, ''))
        ) {
          properties[key] =
            '[REDACTED]';
          redacted.push(key);
        } else {
          properties[key] =
            props[key];
        }
      });

    return {
      properties: properties,
      redacted: redacted
    };
  }

  function headers_(sh) {
    return sh
      .getRange(
        1,
        1,
        1,
        sh.getLastColumn()
      )
      .getValues()[0]
      .map(function (value) {
        return String(
          value || ''
        ).trim();
      });
  }

  function headerMap_(headers) {
    const map = {};

    headers.forEach(
      function (header, index) {
        if (header) {
          map[header] = index;
        }
      }
    );

    return map;
  }

  function has_(obj, key) {
    return Object.prototype
      .hasOwnProperty
      .call(obj, key);
  }

  function blank_(value) {
    return (
      value === '' ||
      value === null ||
      typeof value === 'undefined'
    );
  }

  function formatHeader_(sh) {
    sh.setFrozenRows(1);

    sh.getRange(
      1,
      1,
      1,
      sh.getLastColumn()
    )
      .setFontWeight('bold')
      .setWrap(true);
  }

  function currentUser_() {
    return (
      Session
        .getActiveUser()
        .getEmail() ||
      ''
    );
  }

  function positive_(
    value,
    fallback
  ) {
    const number = Number(value);

    return (
      isFinite(number) &&
      number > 0
    )
      ? number
      : fallback;
  }

  function label_(value) {
    return String(value || '')
      .replace(
        /[\\/:*?"<>|]+/g,
        '-'
      )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
  }

  function date_(value) {
    if (!value) return null;

    if (
      Object.prototype
        .toString
        .call(value) ===
        '[object Date]' &&
      !isNaN(value.getTime())
    ) {
      return value;
    }

    const parsed =
      new Date(value);

    return isNaN(
      parsed.getTime()
    )
      ? null
      : parsed;
  }

  function time_(row) {
    const date = date_(
      row['Backup Date'] ||
      row['Created At']
    );

    return date
      ? date.getTime()
      : 0;
  }

  return {
    HEADERS: HEADERS.slice(),
    ensureSheet: ensureSheet,
    migrateSchema: migrateSchema,
    schemaStatus: schemaStatus,

    createSpreadsheetBackup:
      createSpreadsheetBackup,

    createConfigBackup:
      createConfigBackup,

    createRollbackPoint:
      createRollbackPoint,

    listBackups:
      listBackups,

    validateBackup:
      validateBackup,

    markRestoreTested:
      markRestoreTested,

    cleanupExpiredBackups:
      cleanupExpiredBackups
  };
})();

function backupCreateSpreadsheet(notes) {
  return REOS.Backup.createSpreadsheetBackup(notes);
}

function backupList(limit) {
  return REOS.Backup.listBackups(limit);
}

function backupMarkRestoreTested(
  backupId,
  notes
) {
  return REOS.Backup.markRestoreTested(
    backupId,
    notes
  );
}

function backupCleanupExpired() {
  return REOS.Backup.cleanupExpiredBackups();
}

function backupValidate(backupId) {
  return REOS.Backup.validateBackup(backupId);
}

function backupMigrateSchema() {
  return REOS.Backup.migrateSchema();
}

function backupSchemaStatus() {
  return REOS.Backup.schemaStatus();
}
