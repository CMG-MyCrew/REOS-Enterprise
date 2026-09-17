# County Code-Violation Group 3 Zillow Restoration Operator Entrypoint Contract v1

## Status

This is a **source-design contract only**.

It defines the future operator invocation boundary for the already merged internal Group 3 Zillow restoration executor.

It does **not** implement the public entrypoint, deploy Apps Script source, create an Apps Script version, alter a deployment, invoke Apps Script, freeze or resume the county scheduler, mutate a checkpoint, change production data, rewrite a reference, delete a physical row, or grant automatic-offer authority.

Design authority base:

`416abc9cbb6e0a7ad16245e3253aa5142fbd1ca8`

Certified internal executor:

`build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationExecutor.js`

Future operator implementation file:

`build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js`

Future public Apps Script RPC:

`reosCountyCodeViolationGroup3ZillowRestorationExecute`

## 1. Purpose

The future operator entrypoint exists only to provide one explicit administrative invocation path into:

`REOS.CountyCodeViolationGroup3ZillowRestorationExecutor.execute(options)`

The entrypoint is a transport and authorization boundary only.

It must not reproduce, weaken, bypass, reinterpret, or replace the executor's evidence, locking, writer-exclusion, physical-replacement, quiescence, or post-verification logic.

## 2. Exact future public surface

The only new public Group 3 RPC permitted by this contract is:

`function reosCountyCodeViolationGroup3ZillowRestorationExecute(options)`

No alias, alternate spelling, convenience wrapper, menu callback, trigger callback, scheduled callback, web endpoint, connector callback, or second Group 3 execution RPC is permitted.

The function must be implemented only in:

`build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js`

## 3. Exact invocation request

The RPC accepts exactly one object argument named `options`.

The request has exactly these three fields:

- `confirmRestoration`
- `checkpointId`
- `checkpointCursor`

No missing fields and no additional fields are permitted.

The only accepted authority values are:

- `confirmRestoration === true`
- `checkpointId === 'COUNTY-20260902222607805'`
- `checkpointCursor === 'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281'`

The operator entrypoint must not supply defaults, coerce values, infer values, trim an invalid request into validity, substitute current checkpoint state, or broaden these exact values.

## 4. Administrative boundary

Before delegating to the executor, the public entrypoint must require:

`REOS.Security.requireAdmin();`

The entrypoint must fail closed if the Security module or Admin authority is unavailable.

Admin authorization alone does not grant production restoration authority.

## 5. Delegation boundary

After validating the exact request and requiring Admin authority, the entrypoint may call exactly once:

`REOS.CountyCodeViolationGroup3ZillowRestorationExecutor.execute(options)`

The exact operator-supplied `options` object must be delegated without changing its authority-bearing field values.

The entrypoint must not call:

- `REOS.Database.replacePhysicalRowExact`
- `REOS.Database.withScriptLockContext`
- `REOS.CountyMutationExclusionLease.assertWriterAllowed`
- `LockService`
- any scheduler install/remove/freeze/resume mutation
- any checkpoint mutation
- any connector execution
- any reference rewrite
- any delete primitive
- any automatic MAO or offer generator

Those bounded responsibilities remain owned by the already certified executor or remain prohibited.

## 6. Error and result semantics

The operator entrypoint must not catch and retry an executor failure.

It must not translate an uncertain outcome into success.

It must preserve the executor's failure classifications, including:

- `GROUP3_RESTORATION_PRECONDITION_FAILED`
- `GROUP3_RESTORATION_OUTCOME_UNCERTAIN`

On success it must return the executor result unchanged.

The success classification remains:

`GROUP3_RESTORATION_VERIFIED`

The returned authority flags remain false.

## 7. Existing executor preconditions remain mandatory

This operator contract does not weaken any existing executor precondition.

The executor still owns and must enforce, among other existing certified checks:

- Admin authority
- exact invocation authority
- zero managed county scheduler triggers
- exact frozen checkpoint authority
- fresh Group 3 county-survivor evidence
- fresh Zillow target-row preimage evidence
- fresh Zillow import-row evidence
- fresh downstream-reference evidence
- exact pre-lock versus under-lock evidence equality
- Writer 13 exclusion
- caller-owned Database ScriptLock
- exact full-row replacement
- county survivor preservation
- Zillow import/reference-row preservation
- no reference rewrite
- no physical delete
- verified post-write outcome handling

## 8. No automatic invocation

The future RPC must never be called automatically by:

- the county production scheduler
- an Apps Script time trigger
- `onOpen`
- `onEdit`
- a menu
- a web app
- a connector
- a background task
- import processing
- lead ingestion
- offer generation

Invocation must remain a separate explicit operator action.

## 9. Deployment boundary

Merging a future source implementation of this operator RPC does not authorize deployment.

Deployment must be a separate certified production gate.

Before deployment, the full production payload delta from the currently deployed Apps Script version must be audited.

The deployment gate must prove the exact source authority, exact file payload, exact Apps Script version created, exact deployment updated, and absence of production data mutation during deployment.

## 10. Production execution boundary

Deployment does not authorize restoration execution.

A future production execution gate must independently prove immediately before invocation:

- the exact deployed source/version authority
- the exact public RPC authority
- zero managed county scheduler triggers
- the exact frozen checkpoint:
  - id `COUNTY-20260902222607805`
  - next feed index `0`
  - cursor `AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281`
  - completed feeds `0`
  - total feeds `4`
  - empty results
- fresh row 767 county-survivor evidence
- fresh row 771 target preimage evidence
- fresh Zillow Gmail import row 38 evidence
- fresh downstream-reference evidence
- no intervening production mutation
- explicit operator confirmation

Only that later gate may invoke the public RPC.

## 11. Post-execution boundary

After any future invocation, execution must halt on:

`GROUP3_RESTORATION_OUTCOME_UNCERTAIN`

No automatic retry is permitted.

Verified success must be followed by independent read-only production certification before any scheduler trigger is restored.

Scheduler restoration is a separate mutation gate.

## 12. Non-authorities

This contract explicitly records:

`GROUP3_OPERATOR_ENTRYPOINT_DESIGN_ONLY=true`

`GROUP3_OPERATOR_ENTRYPOINT_IMPLEMENTATION_PRESENT=false`

`GROUP3_OPERATOR_PUBLIC_RPC_PRESENT=false`

`GROUP3_OPERATOR_ENTRYPOINT_DEPLOYMENT_AUTHORITY_GRANTED=false`

`GROUP3_OPERATOR_ENTRYPOINT_EXECUTION_AUTHORITY_GRANTED=false`

`GROUP3_RESTORATION_EXECUTION_AUTHORITY_GRANTED=false`

`PRODUCTION_DATA_MUTATION_AUTHORITY_GRANTED=false`

`SCHEDULER_MUTATION_AUTHORITY_GRANTED=false`

`CHECKPOINT_MUTATION_AUTHORITY_GRANTED=false`

`REFERENCE_REWRITE_AUTHORITY_GRANTED=false`

`PHYSICAL_DELETE_AUTHORITY_GRANTED=false`

`CONNECTOR_EXECUTION_AUTHORITY_GRANTED=false`

`AUTOMATIC_OFFER_AUTHORITY_GRANTED=false`

## 13. Future source implementation acceptance

A later source-implementation increment may be certified only if it:

1. adds exactly one public Group 3 RPC named `reosCountyCodeViolationGroup3ZillowRestorationExecute`;
2. implements it only in `build/apps-script-brand/CountyCodeViolationGroup3ZillowRestorationOperator.js`;
3. accepts exactly the three request fields specified above;
4. accepts only the exact confirmation/checkpoint authority specified above;
5. requires Admin authority;
6. calls the internal executor exactly once;
7. performs no direct production write;
8. performs no scheduler or checkpoint mutation;
9. performs no reference rewrite or physical delete;
10. performs no retry;
11. returns executor success unchanged;
12. preserves executor error classification;
13. adds offline behavior validation;
14. adds CI registration;
15. grants no deployment or production-execution authority.

