/**
 * REOS Enterprise - ScriptLock Observability
 *
 * Diagnostic-only metadata for the global Apps Script ScriptLock domain.
 *
 * SAFETY:
 * - does not acquire or release ScriptLock
 * - grants no mutation / insert / scheduler / offer authority
 * - every telemetry operation is best-effort and non-throwing
 * - CURRENT ownership is token-bound
 * - stale CURRENT metadata is explicitly non-authoritative
 * - history events use unique Script Properties; no shared history RMW
 */
var REOS = REOS || {};

REOS.ScriptLockObservability = (function () {
  var CURRENT_KEY =
    'REOS_SCRIPTLOCK_OWNER_CURRENT_JSON';

  var EVENT_PREFIX =
    'REOS_SCRIPTLOCK_EVENT_JSON_';

  var MAX_EVENTS =
    12;

  var MAX_OWNER_AGE_MS =
    15 * 60 * 1000;

  function text_(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).trim();
  }

  function nowIso_() {
    return new Date()
      .toISOString();
  }

  function safeUuid_() {
    try {
      if (
        typeof Utilities !==
          'undefined' &&
        Utilities &&
        typeof Utilities.getUuid ===
          'function'
      ) {
        return text_(
          Utilities.getUuid()
        );
      }
    } catch (error) {
      // Diagnostic-only fallback.
    }

    return [
      'OBS',
      new Date().getTime(),
      Math.floor(
        Math.random() *
        1000000000
      )
    ].join('-');
  }

  function props_() {
    try {
      if (
        typeof PropertiesService ===
          'undefined' ||
        !PropertiesService ||
        typeof PropertiesService
          .getScriptProperties !==
          'function'
      ) {
        return null;
      }

      return PropertiesService
        .getScriptProperties();
    } catch (error) {
      return null;
    }
  }

  function safeGet_(props, key) {
    if (
      !props ||
      typeof props.getProperty !==
        'function'
    ) {
      return null;
    }

    try {
      return props.getProperty(
        key
      );
    } catch (error) {
      return null;
    }
  }

  function safeSet_(
    props,
    key,
    value
  ) {
    if (
      !props ||
      typeof props.setProperty !==
        'function'
    ) {
      return false;
    }

    try {
      props.setProperty(
        key,
        value
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function safeDelete_(
    props,
    key
  ) {
    if (
      !props ||
      typeof props.deleteProperty !==
        'function'
    ) {
      return false;
    }

    try {
      props.deleteProperty(
        key
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function safeSnapshot_(props) {
    if (
      !props ||
      typeof props.getProperties !==
        'function'
    ) {
      return {
        ok:
          false,

        values:
          {}
      };
    }

    try {
      return {
        ok:
          true,

        values:
          props.getProperties() ||
          {}
      };
    } catch (error) {
      return {
        ok:
          false,

        values:
          {}
      };
    }
  }

  function parseJson_(raw) {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(
        raw
      );
    } catch (error) {
      return null;
    }
  }

  function safeDetails_(details) {
    if (
      !details ||
      typeof details !==
        'object'
    ) {
      return {};
    }

    try {
      return JSON.parse(
        JSON.stringify(
          details
        )
      );
    } catch (error) {
      return {
        serializationFailed:
          true
      };
    }
  }

  function safeStringify_(value) {
    try {
      return JSON.stringify(
        value
      );
    } catch (error) {
      return JSON.stringify({
        serializationFailed:
          true,
        at:
          nowIso_()
      });
    }
  }

  function classifyCurrent_(
    current
  ) {
    if (!current) {
      return null;
    }

    var nowMs =
      new Date().getTime();

    var acquiredAtMs =
      new Date(
        text_(
          current.acquiredAt
        )
      ).getTime();

    var validTimestamp =
      Number.isFinite(
        acquiredAtMs
      );

    var futureTimestamp =
      validTimestamp &&
      acquiredAtMs >
        nowMs + 60000;

    var ageMs =
      validTimestamp &&
      !futureTimestamp
        ? Math.max(
            0,
            nowMs -
            acquiredAtMs
          )
        : null;

    var stale =
      !validTimestamp ||
      futureTimestamp ||
      ageMs >
        MAX_OWNER_AGE_MS;

    return Object.assign(
      {},
      current,
      {
        ownerAgeMilliseconds:
          ageMs,

        maxOwnerAgeMilliseconds:
          MAX_OWNER_AGE_MS,

        ownerStale:
          stale,

        ownerAuthoritative:
          !stale
      }
    );
  }

  function current_() {
    var props =
      props_();

    return parseJson_(
      safeGet_(
        props,
        CURRENT_KEY
      )
    );
  }

  function eventPropertyKey_(
    event
  ) {
    var timestamp =
      text_(
        event &&
        event.at
      )
        .replace(
          /[^0-9]/g,
          ''
        );

    var eventId =
      text_(
        event &&
        event.eventId
      )
        .replace(
          /[^A-Za-z0-9_-]/g,
          ''
        );

    return (
      EVENT_PREFIX +
      timestamp +
      '_' +
      eventId
    );
  }

  function eventRecordsFromValues_(
    all
  ) {
    all =
      all ||
      {};

    var records =
      [];

    Object.keys(all)
      .forEach(
        function (key) {
          if (
            key.indexOf(
              EVENT_PREFIX
            ) !==
            0
          ) {
            return;
          }

          var event =
            parseJson_(
              all[key]
            );

          if (!event) {
            return;
          }

          records.push({
            propertyKey:
              key,

            event:
              event
          });
        }
      );

    records.sort(
      function (left, right) {
        var leftAt =
          text_(
            left.event.at
          );

        var rightAt =
          text_(
            right.event.at
          );

        if (
          leftAt <
          rightAt
        ) {
          return -1;
        }

        if (
          leftAt >
          rightAt
        ) {
          return 1;
        }

        return text_(
          left.event.eventId
        ).localeCompare(
          text_(
            right.event.eventId
          )
        );
      }
    );

    return records;
  }

  function readEventRecords_(
    props
  ) {
    var snapshot =
      safeSnapshot_(
        props
      );

    return snapshot.ok
      ? eventRecordsFromValues_(
          snapshot.values
        )
      : [];
  }

  function pruneEventsBestEffort_(
    props
  ) {
    try {
      var records =
        readEventRecords_(
          props
        );

      var excess =
        Math.max(
          0,
          records.length -
          MAX_EVENTS
        );

      for (
        var index = 0;
        index < excess;
        index += 1
      ) {
        safeDelete_(
          props,
          records[index]
            .propertyKey
        );
      }
    } catch (error) {
      // Retention is diagnostic-only.
    }
  }

  function appendEvent_(
    event
  ) {
    try {
      var props =
        props_();

      if (!props) {
        return false;
      }

      var key =
        eventPropertyKey_(
          event
        );

      var written =
        safeSet_(
          props,
          key,
          safeStringify_(
            event
          )
        );

      if (written) {
        pruneEventsBestEffort_(
          props
        );
      }

      return written;
    } catch (error) {
      return false;
    }
  }

  function makeEvent_(
    kind,
    owner,
    operation,
    details
  ) {
    return {
      eventId:
        safeUuid_(),

      kind:
        text_(kind),

      owner:
        text_(owner),

      operation:
        text_(operation),

      at:
        nowIso_(),

      details:
        safeDetails_(
          details
        )
    };
  }

  function begin(
    owner,
    operation,
    details
  ) {
    try {
      var handle = {
        token:
          safeUuid_(),

        owner:
          text_(owner),

        operation:
          text_(operation),

        invocationId:
          text_(
            details &&
            details.invocationId
          ),

        acquiredAt:
          nowIso_()
      };

      var props =
        props_();

      var currentWritten =
        safeSet_(
          props,
          CURRENT_KEY,
          safeStringify_(
            handle
          )
        );

      var event =
        makeEvent_(
          'ACQUIRED',
          handle.owner,
          handle.operation,
          Object.assign(
            {},
            safeDetails_(
              details
            ),
            {
              token:
                handle.token,

              acquiredAt:
                handle.acquiredAt
            }
          )
        );

      var eventWritten =
        appendEvent_(
          event
        );

      handle.diagnosticAvailable =
        Boolean(
          currentWritten ||
          eventWritten
        );

      return handle;
    } catch (error) {
      return null;
    }
  }

  function contention(
    owner,
    operation,
    details
  ) {
    try {
      var observed =
        classifyCurrent_(
          current_()
        );

      var event =
        makeEvent_(
          'CONTENDED',
          owner,
          operation,
          Object.assign(
            {},
            safeDetails_(
              details
            ),
            {
              observedOwner:
                observed
                  ? text_(
                      observed.owner
                    )
                  : '',

              observedOperation:
                observed
                  ? text_(
                      observed.operation
                    )
                  : '',

              observedAcquiredAt:
                observed
                  ? text_(
                      observed.acquiredAt
                    )
                  : '',

              observedOwnerStale:
                observed
                  ? observed
                      .ownerStale ===
                      true
                  : false,

              observedOwnerAuthoritative:
                observed
                  ? observed
                      .ownerAuthoritative ===
                      true
                  : false
            }
          )
        );

      var eventWritten =
        appendEvent_(
          event
        );

      return {
        ok:
          true,

        diagnosticAvailable:
          Boolean(
            eventWritten ||
            observed
          ),

        observedOwner:
          observed
            ? text_(
                observed.owner
              )
            : '',

        observedOperation:
          observed
            ? text_(
                observed.operation
              )
            : '',

        observedAcquiredAt:
          observed
            ? text_(
                observed.acquiredAt
              )
            : '',

        observedOwnerStale:
          observed
            ? observed
                .ownerStale ===
                true
            : false,

        observedOwnerAuthoritative:
          observed
            ? observed
                .ownerAuthoritative ===
                true
            : false
      };
    } catch (error) {
      return {
        ok:
          false,

        diagnosticAvailable:
          false,

        observedOwner:
          '',

        observedOperation:
          '',

        observedAcquiredAt:
          '',

        observedOwnerStale:
          false,

        observedOwnerAuthoritative:
          false
      };
    }
  }

  function end(
    handle,
    outcome,
    details
  ) {
    try {
      if (
        !handle ||
        !text_(
          handle.token
        )
      ) {
        return false;
      }

      var props =
        props_();

      var current =
        parseJson_(
          safeGet_(
            props,
            CURRENT_KEY
          )
        );

      var currentCleared =
        false;

      if (
        current &&
        text_(
          current.token
        ) ===
          text_(
            handle.token
          )
      ) {
        currentCleared =
          safeDelete_(
            props,
            CURRENT_KEY
          );
      }

      var event =
        makeEvent_(
          'RELEASED',
          handle.owner,
          handle.operation,
          Object.assign(
            {},
            safeDetails_(
              details
            ),
            {
              token:
                text_(
                  handle.token
                ),

              acquiredAt:
                text_(
                  handle.acquiredAt
                ),

              outcome:
                text_(
                  outcome
                )
            }
          )
        );

      var eventWritten =
        appendEvent_(
          event
        );

      return Boolean(
        currentCleared ||
        eventWritten
      );
    } catch (error) {
      return false;
    }
  }

  function unavailableStatus_() {
    return {
      ok:
        false,

      diagnosticAvailable:
        false,

      storageMode:
        'UNIQUE_EVENT_PROPERTIES',

      sharedHistoryReadModifyWrite:
        false,

      historyRetentionBestEffort:
        true,

      maxEvents:
        MAX_EVENTS,

      maxOwnerAgeMilliseconds:
        MAX_OWNER_AGE_MS,

      currentOwner:
        null,

      lastEvent:
        null,

      history:
        [],

      mutationAuthorityGranted:
        false,

      insertAuthorityGranted:
        false,

      schedulerAuthorityGranted:
        false,

      automaticOfferAuthorityGranted:
        false
    };
  }

  function status() {
    try {
      var props =
        props_();

      if (!props) {
        return unavailableStatus_();
      }

      /*
       * Status is truthful only when one complete Script Properties
       * snapshot can actually be read. A failed read is diagnostic
       * unavailability, not an empty healthy telemetry state.
       */
      var snapshot =
        safeSnapshot_(
          props
        );

      if (!snapshot.ok) {
        return unavailableStatus_();
      }

      var current =
        classifyCurrent_(
          parseJson_(
            snapshot.values[
              CURRENT_KEY
            ]
          )
        );

      var records =
        eventRecordsFromValues_(
          snapshot.values
        );

      var history =
        records
          .slice(
            Math.max(
              0,
              records.length -
              MAX_EVENTS
            )
          )
          .map(
            function (record) {
              return record.event;
            }
          );

      return {
        ok:
          true,

        diagnosticAvailable:
          true,

        storageMode:
          'UNIQUE_EVENT_PROPERTIES',

        sharedHistoryReadModifyWrite:
          false,

        historyRetentionBestEffort:
          true,

        maxEvents:
          MAX_EVENTS,

        maxOwnerAgeMilliseconds:
          MAX_OWNER_AGE_MS,

        currentOwner:
          current,

        lastEvent:
          history.length
            ? history[
                history.length -
                1
              ]
            : null,

        history:
          history,

        mutationAuthorityGranted:
          false,

        insertAuthorityGranted:
          false,

        schedulerAuthorityGranted:
          false,

        automaticOfferAuthorityGranted:
          false
      };
    } catch (error) {
      return unavailableStatus_();
    }
  }

  return {
    begin:
      begin,

    contention:
      contention,

    end:
      end,

    status:
      status
  };
})();


function reosScriptLockObservabilityStatus() {
  if (
    !REOS.Security ||
    typeof REOS.Security
      .requireAdmin !==
      'function'
  ) {
    throw new Error(
      'ScriptLock observability status requires Admin authority.'
    );
  }

  REOS.Security
    .requireAdmin();

  return REOS
    .ScriptLockObservability
    .status();
}
