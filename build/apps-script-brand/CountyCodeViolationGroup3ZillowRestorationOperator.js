'use strict';

/*
 * Explicit administrative transport boundary only.
 *
 * This function grants no deployment or production-execution authority.
 * All restoration evidence, quiescence, locking, writer exclusion,
 * replacement, and post-write verification remain owned by the internal
 * Group 3 executor.
 */
function reosCountyCodeViolationGroup3ZillowRestorationExecute(options) {
  var expectedKeys = [
    'checkpointCursor',
    'checkpointId',
    'confirmRestoration'
  ];

  if (
    options === null ||
    typeof options !== 'object' ||
    Object.prototype.toString.call(options) !==
      '[object Object]'
  ) {
    throw new Error(
      'Group 3 restoration operator request must be an object.'
    );
  }

  var actualKeys =
    Object.keys(options)
      .sort();

  if (
    actualKeys.length !==
      expectedKeys.length ||
    actualKeys.some(function (key, index) {
      return key !==
        expectedKeys[index];
    })
  ) {
    throw new Error(
      'Group 3 restoration operator request fields are not exact.'
    );
  }

  if (
    options.confirmRestoration !== true ||
    options.checkpointId !==
      'COUNTY-20260902222607805' ||
    options.checkpointCursor !==
      'AK1|PHL-CODE-HIGH-SEED-20250901-OID636638-V1|1782545296000|2281'
  ) {
    throw new Error(
      'Group 3 restoration operator invocation authority mismatch.'
    );
  }

  if (
    typeof REOS === 'undefined' ||
    !REOS ||
    !REOS.Security ||
    typeof REOS.Security.requireAdmin !==
      'function' ||
    !REOS.CountyCodeViolationGroup3ZillowRestorationExecutor ||
    typeof REOS
      .CountyCodeViolationGroup3ZillowRestorationExecutor
      .execute !==
      'function'
  ) {
    throw new Error(
      'Group 3 restoration operator dependencies are unavailable.'
    );
  }

  REOS.Security.requireAdmin();

  return REOS
    .CountyCodeViolationGroup3ZillowRestorationExecutor
    .execute(options);
}
