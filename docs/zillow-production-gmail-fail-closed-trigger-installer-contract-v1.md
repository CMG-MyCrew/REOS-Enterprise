# Zillow Production Gmail Fail-Closed Trigger Installer Contract v1

## Purpose

Provide a narrowly scoped production trigger-installation boundary for the
existing Zillow Gmail scheduled handler:

`reosZillowGmailScheduledSync`

The target cadence is exactly 15 minutes.

## Lock boundary

The installer must acquire `LockService.getScriptLock()` before reading the
project-trigger inventory.

If the script lock cannot be acquired within the bounded wait period, the
installer returns `LOCK_BUSY` and performs no trigger mutation.

The lock remains held through any create operation and the post-create
inventory verification.

## Existing trigger behavior

If exactly one project trigger already references
`reosZillowGmailScheduledSync`, the installer returns `ALREADY_PRESENT`.

No trigger is created, deleted, replaced, or modified.

If more than one matching trigger exists, the installer returns
`DUPLICATE_PRESENT`.

Duplicate state is fail-closed. The installer has no cleanup or deletion
authority.

## Absent trigger behavior

Only when the under-lock inventory contains zero matching handlers may the
installer call:

`ScriptApp.newTrigger('reosZillowGmailScheduledSync')`

The builder must be time based and configured with:

`everyMinutes(15)`

The create operation may execute exactly once per invocation.

After creation, the project-trigger inventory must be re-read while the same
script lock remains held.

Exactly one matching handler must then exist. Any other result is an invariant
failure requiring separate live-state reconciliation before another attempt.

## Prohibited behavior

This increment must never call `ScriptApp.deleteTrigger`.

It must never call the existing delete-then-create installer or removal
surface.

It must not execute the Zillow connector.

It must not access Gmail.

It must not run acquisition ingestion.

It must not mutate county scheduler state.

It must not mutate production spreadsheet data.

It grants no deployment authority.

It grants no production invocation authority merely by being merged or
deployed.

It grants no MAO or offer authority.

## Production execution gate

`reosZillowGmailInstallTriggerFailClosed()` is an explicit production mutation
boundary.

Deployment of this source does not authorize invocation.

Any production invocation requires a separate, exact, just-in-time
authorization after live production version, connector state, and trigger
inventory authority are re-established.
