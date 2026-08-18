/**
 * REOS Enterprise - Backup Manager compatibility facade
 *
 * Keeps the Sprint 17 API stable while REOS.Backup owns the
 * canonical BACKUPS schema and storage implementation.
 */
var REOS = REOS || {};

REOS.BackupManager = (function () {

  function core_() {
    if (!REOS.Backup) {
      throw new Error(
        'REOS.Backup is not available.'
      );
    }

    return REOS.Backup;
  }

  function legacyRow_(row) {
    if (!row) return row;

    const out =
      Object.assign({}, row);

    const type = String(
      row['Backup Type'] ||
      row.Type ||
      ''
    );

    out.Type =
      type === 'Spreadsheet Copy'
        ? 'Workbook'
        : (
            type === 'Configuration'
              ? 'Config'
              : type
          );

    out['Source Workbook ID'] =
      row['Source Spreadsheet ID'] ||
      row['Source Workbook ID'] ||
      '';

    out['Backup File ID'] =
      row['Backup Spreadsheet ID'] ||
      row['Backup File ID'] ||
      '';

    if (
      out.Status === 'Completed'
    ) {
      out.Status = 'Created';
    }

    return out;
  }

  function ensureSheets() {
    core_().ensureSheet();
    return true;
  }

  function createWorkbookBackup(
    label
  ) {
    REOS.Security.requireAdmin();

    return legacyRow_(
      core_().createSpreadsheetBackup(
        '',
        {
          label: label || '',
          idPrefix: 'BKP'
        }
      )
    );
  }

  function createConfigBackup(
    label
  ) {
    REOS.Security.requireAdmin();

    return legacyRow_(
      core_().createConfigBackup(
        label || '',
        {
          idPrefix: 'BKP'
        }
      )
    );
  }

  function createRollbackPoint(
    label
  ) {
    REOS.Security.requireAdmin();

    return {
      workbook:
        createWorkbookBackup(
          label ||
          'Rollback Point'
        ),

      config:
        createConfigBackup(
          label ||
          'Rollback Point'
        )
    };
  }

  function list(options) {
    REOS.Security.requireAdmin();

    return core_()
      .listBackups(
        options || {}
      )
      .map(legacyRow_);
  }

  function validateBackup(
    backupId
  ) {
    REOS.Security.requireAdmin();

    const result =
      core_().validateBackup(
        backupId
      );

    if (
      result &&
      result.backup
    ) {
      result.backup =
        legacyRow_(
          result.backup
        );
    }

    return result;
  }

  function migrateSchema() {
    REOS.Security.requireAdmin();
    return core_().migrateSchema();
  }

  function schemaStatus() {
    REOS.Security.requireAdmin();
    return core_().schemaStatus();
  }

  return {
    ensureSheets:
      ensureSheets,

    createWorkbookBackup:
      createWorkbookBackup,

    createConfigBackup:
      createConfigBackup,

    createRollbackPoint:
      createRollbackPoint,

    list:
      list,

    validateBackup:
      validateBackup,

    migrateSchema:
      migrateSchema,

    schemaStatus:
      schemaStatus
  };
})();

function reosBackupEnsureSheets() {
  return REOS.BackupManager.ensureSheets();
}

function reosBackupCreateWorkbook(
  label
) {
  return REOS.BackupManager
    .createWorkbookBackup(label);
}

function reosBackupCreateConfig(
  label
) {
  return REOS.BackupManager
    .createConfigBackup(label);
}

function reosBackupCreateRollbackPoint(
  label
) {
  return REOS.BackupManager
    .createRollbackPoint(label);
}

function reosBackupList(options) {
  return REOS.BackupManager.list(
    options || {}
  );
}

function reosBackupValidate(
  backupId
) {
  return REOS.BackupManager
    .validateBackup(backupId);
}

function reosBackupMigrateSchema() {
  return REOS.BackupManager
    .migrateSchema();
}

function reosBackupSchemaStatus() {
  return REOS.BackupManager
    .schemaStatus();
}
