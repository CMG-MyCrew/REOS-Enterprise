"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

const wrapperPath = path.join(
  ROOT,
  "build",
  "apps-script-brand",
  "CompsReadinessEvidenceStorageProvisioningRpc.js"
);

const source = fs.readFileSync(wrapperPath, "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const exactSpreadsheetId =
  "1N_5Saw8paJbUZ3FYWr2LmqMDV5qcHSNHda6RoxyqNTU";

assert(
  source.includes(
    "reosCompsReadinessEvidenceStorageProvisioningPreflightV1"
  ),
  "preflight global wrapper missing"
);

assert(
  source.includes(
    "reosCompsReadinessEvidenceStorageProvisionV1"
  ),
  "provisioning global wrapper missing"
);

assert(
  source.includes(
    "REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_EXECUTOR_V1"
  ),
  "certified executor delegation missing"
);

assert(
  source.includes("options.authorized !== true"),
  "explicit provisioning authorization gate missing"
);

assert(
  source.includes(exactSpreadsheetId),
  "exact production spreadsheet identity missing"
);

assert(
  !source.includes("getActiveSpreadsheet("),
  "active spreadsheet fallback forbidden"
);

assert(
  !source.includes("createSheet("),
  "wrapper must not duplicate sheet creation semantics"
);

assert(
  !source.includes("insertSheet("),
  "wrapper must not duplicate sheet creation semantics"
);

assert(
  !source.includes("appendRow("),
  "wrapper must not append evidence rows"
);

assert(
  !source.includes("setValues("),
  "wrapper must not write spreadsheet values directly"
);

assert(
  !source.includes("setProperty("),
  "wrapper must not mutate script properties"
);

const calls = [];

const executor = {
  preflight(options) {
    calls.push({
      method: "preflight",
      options: JSON.parse(JSON.stringify(options))
    });

    return {
      version: "fixture",
      outcome: "PREFLIGHT_FIXTURE",
      spreadsheetIdentity: options.spreadsheetIdentity
    };
  },

  execute(options) {
    calls.push({
      method: "execute",
      options: JSON.parse(JSON.stringify(options))
    });

    return {
      version: "fixture",
      outcome: "PROVISION_FIXTURE",
      spreadsheetIdentity: options.spreadsheetIdentity,
      authorized: options.authorized
    };
  }
};

const context = {
  Object,
  Error,
  JSON,
  REOS_COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_EXECUTOR_V1:
    executor
};

context.global = context;
context.globalThis = context;

vm.createContext(context);
vm.runInContext(source, context, {
  filename: wrapperPath
});

assert(
  typeof context
    .reosCompsReadinessEvidenceStorageProvisioningPreflightV1 ===
    "function",
  "preflight Apps Script global not exported"
);

assert(
  typeof context
    .reosCompsReadinessEvidenceStorageProvisionV1 ===
    "function",
  "provisioning Apps Script global not exported"
);

const preflightResult =
  context
    .reosCompsReadinessEvidenceStorageProvisioningPreflightV1(
      exactSpreadsheetId
    );

assert(
  calls.length === 1,
  "preflight must make exactly one executor call"
);

assert(
  calls[0].method === "preflight",
  "preflight must delegate only to executor.preflight"
);

assert(
  calls[0].options.spreadsheetIdentity === exactSpreadsheetId,
  "preflight exact spreadsheet identity not preserved"
);

assert(
  calls[0].options.authorized !== true,
  "preflight must not grant provisioning authorization"
);

assert(
  preflightResult.outcome === "PREFLIGHT_FIXTURE",
  "preflight result not returned unchanged"
);

let rejectedIdentity = false;

try {
  context
    .reosCompsReadinessEvidenceStorageProvisioningPreflightV1(
      "wrong-spreadsheet"
    );
} catch (error) {
  rejectedIdentity =
    String(error.message).includes(
      "REJECTED_SPREADSHEET_IDENTITY"
    );
}

assert(
  rejectedIdentity,
  "preflight must reject non-production spreadsheet identity"
);

assert(
  calls.length === 1,
  "rejected identity must not reach executor"
);

let rejectedMissingAuthorization = false;

try {
  context.reosCompsReadinessEvidenceStorageProvisionV1(
    exactSpreadsheetId,
    {}
  );
} catch (error) {
  rejectedMissingAuthorization =
    String(error.message).includes(
      "REJECTED_PROVISIONING_AUTHORIZATION"
    );
}

assert(
  rejectedMissingAuthorization,
  "provisioning must reject missing explicit authorization"
);

assert(
  calls.length === 1,
  "unauthorized provisioning must not reach executor"
);

let rejectedFalseAuthorization = false;

try {
  context.reosCompsReadinessEvidenceStorageProvisionV1(
    exactSpreadsheetId,
    { authorized: false }
  );
} catch (error) {
  rejectedFalseAuthorization =
    String(error.message).includes(
      "REJECTED_PROVISIONING_AUTHORIZATION"
    );
}

assert(
  rejectedFalseAuthorization,
  "provisioning must reject authorized=false"
);

assert(
  calls.length === 1,
  "authorized=false must not reach executor"
);

const executionResult =
  context.reosCompsReadinessEvidenceStorageProvisionV1(
    exactSpreadsheetId,
    { authorized: true }
  );

assert(
  calls.length === 2,
  "authorized provisioning must make exactly one executor call"
);

assert(
  calls[1].method === "execute",
  "authorized provisioning must delegate only to executor.execute"
);

assert(
  calls[1].options.authorized === true,
  "authorized=true not preserved"
);

assert(
  calls[1].options.spreadsheetIdentity === exactSpreadsheetId,
  "execution exact spreadsheet identity not preserved"
);

assert(
  executionResult.outcome === "PROVISION_FIXTURE",
  "execution result not returned unchanged"
);

let rejectedExecutionIdentity = false;

try {
  context.reosCompsReadinessEvidenceStorageProvisionV1(
    "wrong-spreadsheet",
    { authorized: true }
  );
} catch (error) {
  rejectedExecutionIdentity =
    String(error.message).includes(
      "REJECTED_SPREADSHEET_IDENTITY"
    );
}

assert(
  rejectedExecutionIdentity,
  "execution must reject non-production spreadsheet identity"
);

assert(
  calls.length === 2,
  "rejected execution identity must not reach executor"
);

console.log(
  "COMPS_READINESS_EVIDENCE_STORAGE_PROVISIONING_RPC_V1_VALID=true"
);
console.log("PREFLIGHT_GLOBAL_EXPORTED=true");
console.log("PROVISIONING_GLOBAL_EXPORTED=true");
console.log("PREFLIGHT_READ_ONLY_DELEGATION_CERTIFIED=true");
console.log("PREFLIGHT_AUTHORIZATION_NOT_GRANTED=true");
console.log("PROVISIONING_EXPLICIT_AUTHORIZATION_REQUIRED=true");
console.log("EXACT_PRODUCTION_SPREADSHEET_ID_REQUIRED=true");
console.log("WRAPPER_PROVISIONING_SEMANTICS_DUPLICATED=false");
console.log("ACTIVE_SPREADSHEET_FALLBACK_PRESENT=false");
console.log("EVIDENCE_ROW_APPEND_PRESENT=false");
