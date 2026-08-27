/**
 * REOS Enterprise - County C1 Identity Schema Migration
 *
 * Dedicated Phase C.6 schema-only migration.
 *
 * This module is deliberately narrower than DistressLeadCountySchema.ensure().
 *
 * It may append exactly:
 *   - Source Observation Key
 *   - Canonical Property Key
 *
 * It MUST NOT:
 *   - insert/update/upsert/delete DISTRESS_LEADS rows
 *   - execute a county connector
 *   - migrate any other schema
 *   - create repair/insert authority
 *   - execute or change scheduler/trigger state
 */
var REOS = REOS || {};

REOS.CountyC1SchemaMigration = (function () {
  var TABLE =
    'DISTRESS_LEADS';

  var IDENTITY_HEADERS = [
    'Source Observation Key',
    'Canonical Property Key'
  ];

  function safeValue_(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return value;
    }

    if (
      Object.prototype.toString.call(value) ===
      '[object Date]'
    ) {
      return value.toISOString();
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    return String(value);
  }

  function sha256_(value) {
    var digest =
      Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        JSON.stringify(value),
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
        ) + normalized.toString(16);
      })
      .join('');
  }

  function arraysEqual_(left, right) {
    if (
      !Array.isArray(left) ||
      !Array.isArray(right) ||
      left.length !== right.length
    ) {
      return false;
    }

    return left.every(
      function (value, index) {
        return value === right[index];
      }
    );
  }

  function requireDependencies_() {
    if (
      !REOS.Database ||
      typeof REOS.Database.getHeaders !==
        'function' ||
      typeof REOS.Database.getAll !==
        'function' ||
      typeof REOS.Database.getSheet !==
        'function'
    ) {
      throw new Error(
        'Database header/read/sheet APIs are required.'
      );
    }

    if (
      !REOS.DistressLeadCountySchema ||
      typeof REOS.DistressLeadCountySchema
        .requiredHeaders !==
        'function'
    ) {
      throw new Error(
        'Certified DISTRESS_LEADS schema contract is required.'
      );
    }

    if (
      !REOS.Security ||
      typeof REOS.Security.requireAdmin !==
        'function'
    ) {
      throw new Error(
        'Admin authority is required.'
      );
    }

    if (
      typeof LockService ===
        'undefined' ||
      !LockService ||
      typeof LockService.getScriptLock !==
        'function'
    ) {
      throw new Error(
        'Script lock authority is required.'
      );
    }

    if (
      typeof Utilities ===
        'undefined' ||
      !Utilities ||
      typeof Utilities.computeDigest !==
        'function'
    ) {
      throw new Error(
        'Utilities digest support is required.'
      );
    }
  }

  function requiredHeaders_() {
    return REOS
      .DistressLeadCountySchema
      .requiredHeaders();
  }

  function legacyExpectedHeaders_() {
    return requiredHeaders_()
      .filter(function (header) {
        return (
          IDENTITY_HEADERS.indexOf(
            header
          ) === -1
        );
      });
  }

  function readyExpectedHeaders_() {
    return legacyExpectedHeaders_()
      .concat(
        IDENTITY_HEADERS
      );
  }

  function schemaState_(headers) {
    var legacy =
      legacyExpectedHeaders_();

    var ready =
      readyExpectedHeaders_();

    if (
      arraysEqual_(
        headers,
        legacy
      )
    ) {
      return {
        state:
          'READY_TO_APPEND',
        missingHeaders:
          IDENTITY_HEADERS.slice(),
        missingCount:
          IDENTITY_HEADERS.length
      };
    }

    if (
      arraysEqual_(
        headers,
        ready
      )
    ) {
      return {
        state:
          'ALREADY_READY',
        missingHeaders:
          [],
        missingCount:
          0
      };
    }

    throw new Error(
      'DISTRESS_LEADS schema differs from certified C1 migration boundary.'
    );
  }

  function rowFingerprint_(
    projectionHeaders
  ) {
    var rows =
      REOS.Database
        .getAll(TABLE);

    var projected =
      rows.map(
        function (row) {
          return projectionHeaders
            .map(function (header) {
              return safeValue_(
                row[header]
              );
            });
        }
      );

    return {
      rowCount:
        rows.length,

      sha256:
        sha256_(
          projected
        ),

      identityColumnsBlank:
        rows.every(
          function (row) {
            return IDENTITY_HEADERS
              .every(
                function (header) {
                  return (
                    row[header] ===
                      undefined ||
                    row[header] ===
                      null ||
                    String(
                      row[header]
                    ).trim() === ''
                  );
                }
              );
          }
        )
    };
  }

  function inspect() {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    var headers =
      REOS.Database
        .getHeaders(TABLE);

    var state =
      schemaState_(
        headers
      );

    return {
      ok:
        true,

      mode:
        'READ_ONLY',

      phase:
        'c1_identity_schema_readiness',

      table:
        TABLE,

      state:
        state.state,

      currentHeaderCount:
        headers.length,

      requiredFinalHeaderCount:
        readyExpectedHeaders_()
          .length,

      missingHeaders:
        state.missingHeaders,

      missingCount:
        state.missingCount,

      schemaMutationExecuted:
        false,

      rowMutationExecuted:
        false,

      c1InsertAuthorityGranted:
        false,

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false
    };
  }

  function migrate(options) {
    requireDependencies_();

    REOS.Security
      .requireAdmin();

    options =
      options || {};

    if (
      options.confirmMigration !==
        true
    ) {
      throw new Error(
        'C1 identity schema migration requires confirmMigration=true.'
      );
    }

    var lock =
      LockService
        .getScriptLock();

    if (
      !lock ||
      typeof lock.tryLock !==
        'function'
    ) {
      throw new Error(
        'C1 identity schema migration requires fail-fast ScriptLock support.'
      );
    }

    var acquired =
      lock.tryLock(
        1000
      );

    if (!acquired) {
      throw new Error(
        'C1 identity schema migration lock is contended; no migration executed.'
      );
    }

    try {
      var beforeHeaders =
        REOS.Database
          .getHeaders(TABLE);

      var state =
        schemaState_(
          beforeHeaders
        );

      var legacyHeaders =
        legacyExpectedHeaders_();

      var beforeFingerprint =
        rowFingerprint_(
          legacyHeaders
        );

      if (
        state.state ===
          'ALREADY_READY'
      ) {
        if (
          !beforeFingerprint
            .identityColumnsBlank
        ) {
          throw new Error(
            'Existing identity columns contain data; automatic schema migration authority is unavailable.'
          );
        }

        return {
          ok:
            true,

          phase:
            'c1_identity_schema_migration',

          outcome:
            'C1_IDENTITY_SCHEMA_ALREADY_READY_NO_WRITE',

          table:
            TABLE,

          beforeHeaderCount:
            beforeHeaders.length,

          afterHeaderCount:
            beforeHeaders.length,

          addedHeaders:
            [],

          addedCount:
            0,

          beforeRowCount:
            beforeFingerprint.rowCount,

          afterRowCount:
            beforeFingerprint.rowCount,

          beforeRowFingerprintSha256:
            beforeFingerprint.sha256,

          afterRowFingerprintSha256:
            beforeFingerprint.sha256,

          preExistingRowDataUnchanged:
            true,

          schemaMutationExecuted:
            false,

          rowMutationExecuted:
            false,

          c1InsertAuthorityGranted:
            false,

          mutationAuthorityGranted:
            false,

          insertAuthorityGranted:
            false
        };
      }

      if (
        beforeHeaders.length !==
          legacyHeaders.length
      ) {
        throw new Error(
          'Certified pre-migration header count mismatch.'
        );
      }

      if (
        beforeFingerprint
          .identityColumnsBlank !==
          true
      ) {
        throw new Error(
          'Unexpected identity data exists before schema migration.'
        );
      }

      var sheet =
        REOS.Database
          .getSheet(TABLE);

      var startColumn =
        beforeHeaders.length + 1;

      var range =
        sheet.getRange(
          1,
          startColumn,
          1,
          IDENTITY_HEADERS.length
        );

      /*
       * This is the ONLY permitted mutation in this module:
       * one header-row append of exactly two certified identity columns.
       */
      range.setValues([
        IDENTITY_HEADERS.slice()
      ]);

      var afterHeaders =
        REOS.Database
          .getHeaders(TABLE);

      var expectedAfter =
        readyExpectedHeaders_();

      if (
        !arraysEqual_(
          afterHeaders,
          expectedAfter
        )
      ) {
        throw new Error(
          'Post-migration header state differs from certified boundary.'
        );
      }

      var afterFingerprint =
        rowFingerprint_(
          legacyHeaders
        );

      if (
        beforeFingerprint.rowCount !==
          afterFingerprint.rowCount
      ) {
        throw new Error(
          'DISTRESS_LEADS row count changed during schema append.'
        );
      }

      if (
        beforeFingerprint.sha256 !==
          afterFingerprint.sha256
      ) {
        throw new Error(
          'Pre-existing DISTRESS_LEADS row data changed during schema append.'
        );
      }

      if (
        afterFingerprint
          .identityColumnsBlank !==
          true
      ) {
        throw new Error(
          'New identity columns are not blank for pre-existing rows.'
        );
      }

      return {
        ok:
          true,

        phase:
          'c1_identity_schema_migration',

        outcome:
          'C1_IDENTITY_SCHEMA_TWO_COLUMNS_APPENDED',

        table:
          TABLE,

        beforeHeaderCount:
          beforeHeaders.length,

        afterHeaderCount:
          afterHeaders.length,

        addedHeaders:
          IDENTITY_HEADERS.slice(),

        addedCount:
          IDENTITY_HEADERS.length,

        startColumn:
          startColumn,

        beforeRowCount:
          beforeFingerprint.rowCount,

        afterRowCount:
          afterFingerprint.rowCount,

        beforeRowFingerprintSha256:
          beforeFingerprint.sha256,

        afterRowFingerprintSha256:
          afterFingerprint.sha256,

        preExistingRowDataUnchanged:
          true,

        schemaMutationExecuted:
          true,

        rowMutationExecuted:
          false,

        c1InsertAuthorityGranted:
          false,

        mutationAuthorityGranted:
          false,

        insertAuthorityGranted:
          false
      };
    } finally {
      lock.releaseLock();
    }
  }

  return {
    inspect:
      inspect,

    migrate:
      migrate
  };
})();


/*
 * Controlled admin-only read-only C1 schema inspection.
 *
 * This wrapper reaches only inspect(); it acquires no migration lock
 * and exposes no schema or row mutation authority.
 */
function reosCountyC1SchemaMigrationInspect() {
  return REOS
    .CountyC1SchemaMigration
    .inspect();
}


function reosCountyC1SchemaMigration(
  options
) {
  return REOS
    .CountyC1SchemaMigration
    .migrate(
      options || {}
    );
}
