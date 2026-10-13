/**
 * REOS comps readiness evidence storage provisioning RPC surface v1.
 *
 * Administrative surface only.
 *
 * This module intentionally contains no provisioning semantics. It delegates
 * to the already-certified dependency-injected executor.
 *
 * Preflight:
 *   reosCompsReadinessEvidenceStorageProvisioningPreflightV1(
 *     candidateSpreadsheetId
 *   )
 *
 * Provisioning:
 *   reosCompsReadinessEvidenceStorageProvisionV1(
 *     candidateSpreadsheetId,
 *     options
 *   )
 *
 * The provisioning wrapper requires options.authorized === true.
 */
(function (global) {
  "use strict";

  var VERSION = "v1";
  var AUTHORIZED_SPREADSHEET_ID =
    "1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU";

  function requireExecutor_() {
    var executor =
      global.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_EXECUTOR_V1;

    if (
      !executor ||
      typeof executor.preflight !== "function" ||
      typeof executor.execute !== "function"
    ) {
      throw new Error(
        "REOS comps readiness evidence storage provisioning executor unavailable"
      );
    }

    return executor;
  }

  function requireExactSpreadsheetId_(candidateSpreadsheetId) {
    if (
      typeof candidateSpreadsheetId !== "string" ||
      candidateSpreadsheetId !== AUTHORIZED_SPREADSHEET_ID
    ) {
      throw new Error(
        "REJECTED_SPREADSHEET_IDENTITY"
      );
    }

    return candidateSpreadsheetId;
  }

  function reosCompsReadinessEvidenceStorageProvisioningPreflightV1(
    candidateSpreadsheetId
  ) {
    var spreadsheetId =
      requireExactSpreadsheetId_(candidateSpreadsheetId);

    return requireExecutor_().preflight({
      spreadsheetIdentity: spreadsheetId
    });
  }

  function reosCompsReadinessEvidenceStorageProvisionV1(
    candidateSpreadsheetId,
    options
  ) {
    var spreadsheetId =
      requireExactSpreadsheetId_(candidateSpreadsheetId);

    if (!options || options.authorized !== true) {
      throw new Error(
        "REJECTED_PROVISIONING_AUTHORIZATION"
      );
    }

    return requireExecutor_().execute({
      authorized: true,
      spreadsheetIdentity: spreadsheetId
    });
  }

  global.reosCompsReadinessEvidenceStorageProvisioningPreflightV1 =
    reosCompsReadinessEvidenceStorageProvisioningPreflightV1;

  global.reosCompsReadinessEvidenceStorageProvisionV1 =
    reosCompsReadinessEvidenceStorageProvisionV1;

  global.REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_RPC_V1 =
    Object.freeze({
      version: VERSION,
      spreadsheetIdentity: AUTHORIZED_SPREADSHEET_ID,
      preflight:
        reosCompsReadinessEvidenceStorageProvisioningPreflightV1,
      provision:
        reosCompsReadinessEvidenceStorageProvisionV1
    });
})(this);
