'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');

const DOC = 'docs/county-physical-row-delete-primitive-api-v1.md';
const DB = 'build/apps-script-brand/Database.js';

const EXPECTED_DOC_SHA = 'de798c81858024507e620e39d96c5bf10655f9c6ada41e2e2b81369bcdeb14e4';
const EXPECTED_DB_SHA = 'ce32381705aedb6c62a0bd4fac9237a51c79209315f92bfcb8277d23c8cee14a';

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

const doc = fs.readFileSync(DOC, 'utf8');
const db = fs.readFileSync(DB, 'utf8');
const normalized = doc.replace(/\s+/g, " ").trim();

console.log('=== COUNTY PHYSICAL-ROW DELETE PRIMITIVE API V1 VALIDATOR ===');

assert.strictEqual(sha256(doc), EXPECTED_DOC_SHA, 'specification SHA-256 drift');
assert.strictEqual(sha256(db), EXPECTED_DB_SHA, 'Database.js SHA-256 drift');

console.log('PASS: exact specification SHA-256');
console.log('PASS: exact Database.js pre-implementation SHA-256');

function requireText(text, label) {
  assert.ok(normalized.includes(text), "Missing contract requirement: " + label);
  console.log("PASS:", label);
}

requireText('Status: DESIGN ONLY.', 'design-only status');
requireText('REOS.Database.deletePhysicalRowExact(sheetName, request, options)', 'proposed primitive API');
requireText('The primitive may delete at most one physical row per invocation.', 'one-row-per-call boundary');
requireText('No internally acquired ScriptLock is permitted.', 'no nested ScriptLock');
requireText('again immediately before physical mutation.', 'final lock-context revalidation');
requireText('Caller booleans or fingerprints do not grant deletion authority.', 'caller authority rejected');

requireText('Unknown request fields fail closed.', 'unknown request fields fail closed');
requireText('sheet.getSheetId()', 'sheet-ID binding');
requireText('A matching sheet name alone is insufficient physical identity.', 'sheet-name-only identity rejected');
requireText('`spreadsheetId`', 'request field: spreadsheetId');
requireText('`sheetId`', 'request field: sheetId');
requireText('`expectedRowNumber`', 'request field: expectedRowNumber');
requireText('`idField`', 'request field: idField');
requireText('`idValue`', 'request field: idValue');
requireText('`expectedLastRow`', 'request field: expectedLastRow');
requireText('`expectedLastColumn`', 'request field: expectedLastColumn');
requireText('`expectedMaxRows`', 'request field: expectedMaxRows');
requireText('`expectedMaxColumns`', 'request field: expectedMaxColumns');
requireText('`expectedHeaders`', 'request field: expectedHeaders');
requireText('`expectedRowValues`', 'request field: expectedRowValues');
requireText('`expectedRowFormulas`', 'request field: expectedRowFormulas');

requireText('sheet.getLastRow() === expectedLastRow', 'last-row prestate binding');
requireText('sheet.getLastColumn() === expectedLastColumn', 'last-column prestate binding');
requireText('sheet.getMaxRows() === expectedMaxRows', 'max-row prestate binding');
requireText('sheet.getMaxColumns() === expectedMaxColumns', 'max-column prestate binding');

requireText('Headers must be unique after trimming and case folding.', 'header uniqueness');
requireText('Every header must be nonblank after trimming.', 'blank headers rejected');
requireText('`idField` must resolve to exactly one physical column.', 'unique ID header');

requireText('Exactly one physical cell must contain the exact string `idValue`.', 'exactly-one ID proof');
requireText('Zero matches fail closed.', 'zero ID matches rejected');
requireText('Multiple matches fail closed.', 'duplicate ID matches rejected');
requireText('The unique matching physical row must equal `expectedRowNumber`.', 'physical row-number binding');
requireText('`findRowById()` is not deletion authority.', 'findRowById rejected as authority');
requireText('Compacted `getAll()` row positions are not deletion authority.', 'getAll compacted positions rejected');

requireText('{ type: "blank" }', 'blank canonical value');
requireText('{ type: "string", value: "exact string" }', 'string canonical value');
requireText('{ type: "number", value: "canonical finite number text" }', 'number canonical value');
requireText('{ type: "boolean", value: true }', 'true boolean canonical value');
requireText('{ type: "boolean", value: false }', 'false boolean canonical value');
requireText('{ type: "date", value: "ISO-8601 UTC timestamp" }', 'date canonical value');

requireText('Numbers must be finite.', 'finite-number requirement');
requireText('Negative zero canonicalizes as `0`.', 'negative-zero canonicalization');
requireText('Locale-formatted display strings are not numeric authority.', 'display-number authority rejected');
requireText('Dates canonicalize with `Date.toISOString()`.', 'date canonicalization');
requireText('Unsupported raw cell types fail closed.', 'unsupported values fail closed');

requireText('range.getValues()', 'raw values are evidence');
requireText('range.getFormulas()', 'formula text is evidence');
requireText('`expectedRowValues` must exactly match the canonicalized `getValues()` result.', 'canonical row comparison');
requireText('`expectedRowFormulas` must exactly match the corresponding formulas array.', 'formula-array comparison');
requireText('Every formula entry must be a string.', 'formula entries are strings');
requireText('A non-formula cell is represented by the empty formula string.', 'non-formula representation');
requireText('Formula text comparison is exact.', 'exact formula comparison');
requireText('Equal displayed values do not make two formula cells equivalent.', 'display equality rejected');
requireText('Displayed values alone never grant deletion authority.', 'display values grant no authority');

requireText('Revalidate the same caller-owned lock context immediately before mutation.', 'final pre-delete lock validation');
requireText('No earlier step may perform physical mutation.', 'no early mutation');
requireText('`sheet.deleteRow(request.expectedRowNumber)`', 'single-row delete call');
requireText('`deleteRows()` is prohibited for this primitive.', 'bulk delete prohibited');
requireText('`deleteCells()` is prohibited.', 'cell delete prohibited');
requireText('`clearContent()` is not equivalent to physical-row deletion.', 'clearContent prohibited as substitute');
requireText('The primitive must not acquire or release ScriptLock itself.', 'primitive cannot own ScriptLock lifecycle');

requireText('sheet.getMaxRows() === expectedMaxRows - 1', 'post-delete max-row verification');
requireText('sheet.getMaxColumns() === expectedMaxColumns', 'post-delete max-column verification');
requireText('sheet.getLastRow() === expectedLastRow - 1', 'post-delete last-row verification');
requireText('sheet.getLastColumn() === expectedLastColumn', 'post-delete last-column verification');
requireText('fresh complete ID-column scan contains zero instances of deleted `idValue`.', 'deleted ID absence verification');
requireText('re-resolve survivor identity after every', 'survivor re-resolution requirement');

requireText('`DELETED_VERIFIED`', 'verified-delete outcome');
requireText('`PHYSICAL_DELETE_PRECONDITION_FAILED`', 'precondition-failure outcome');
requireText('`PHYSICAL_DELETE_OUTCOME_UNCERTAIN`', 'uncertain-delete outcome');

requireText('Any failure before the physical `deleteRow()` invocation is a definite', 'pre-delete failure boundary');
requireText('Once `sheet.deleteRow()` has been invoked, an exception from that call or', 'post-invocation uncertainty boundary');
requireText('No automatic retry is permitted after an uncertain outcome.', 'blind retry prohibited');
requireText('Missing candidate identity after an uncertain outcome is not proof', 'missing candidate is not success proof');
requireText('The primitive must not automatically recreate a deleted row.', 'automatic recreation prohibited');
requireText('The primitive must not claim transactional rollback.', 'false rollback claim prohibited');
requireText('requires read-only reconciliation before another', 'read-only reconciliation required');
requireText('classified as uncertain and reconciled before another mutation.', 'outer-finalization failure remains uncertain');

requireText('Passing every primitive physical-evidence check proves only that the', 'physical evidence alone grants no execution authority');
requireText('approved collapse cohort membership', 'collapse cohort authority external');
requireText('certified winner identity', 'winner authority external');
requireText('required observation preservation and readback', 'observation preservation external');
requireText('complete current downstream-reference clearance', 'reference clearance external');
requireText('deterministic row-shift and residual-state authority', 'residual-state authority external');
requireText('recoverable operation intent and required preimages', 'operation intent/preimages external');
requireText('scheduler and writer quiescence', 'writer quiescence external');
requireText('interruption and uncertain-outcome reconciliation rules', 'interruption reconciliation external');

requireText('It does not authorize adding `deleteRow()` to `Database.js`.', 'Database implementation blocked');
requireText('It does not authorize a county collapse executor.', 'executor blocked');
requireText('It does not authorize an Apps Script RPC.', 'RPC blocked');
requireText('It does not authorize deployment.', 'deployment blocked');
requireText('It does not authorize production data mutation.', 'production mutation blocked');
requireText('It does not authorize checkpoint mutation.', 'checkpoint mutation blocked');
requireText('It does not authorize scheduler changes.', 'scheduler changes blocked');
requireText('It does not authorize connector execution.', 'connector execution blocked');
requireText('It does not authorize automatic offers.', 'automatic offers blocked');


console.log('PASS: Database.js remains free of physical-delete implementation');
console.log();
console.log('County physical-row delete primitive API v1 validation PASSED.');
console.log('IMPLEMENTATION_AUTHORITY_GRANTED=false');
console.log('EXECUTION_AUTHORITY_GRANTED=false');
console.log('PRODUCTION_MUTATION_AUTHORITY_GRANTED=false');


assert.strictEqual(/\.deleteRow\s*\(/.test(db), false, "Database.js unexpectedly contains deleteRow");
assert.strictEqual(/\.deleteRows\s*\(/.test(db), false, "Database.js unexpectedly contains deleteRows");
assert.strictEqual(/\.deleteCells\s*\(/.test(db), false, "Database.js unexpectedly contains deleteCells");
assert.strictEqual(/function\s+deletePhysicalRowExact\s*\(/.test(db), false, "Database.js unexpectedly implements primitive");
assert.strictEqual(/deletePhysicalRowExact\s*:/.test(db), false, "Database.js unexpectedly exports primitive");

console.log("PASS: all five negative Database implementation assertions executed");
