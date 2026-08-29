/**
 * REOS Enterprise - Canonical Property Identity
 *
 * Separates:
 *
 * 1. source observation identity
 *    Exact identity of one source/dataset record.
 *
 * 2. canonical property identity
 *    Source-independent deterministic identity of the property.
 *
 * No fuzzy address matching is permitted.
 */
var REOS = REOS || {};

REOS.CanonicalPropertyIdentity = (function () {

  function normalizeText_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function keyPart_(value) {
    return normalizeText_(value)
      .replace(/\|/g, '%7c');
  }

  function normalizeParcel_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function buildSourceObservationKey_(record) {
    record = record || {};

    var source =
      keyPart_(record.Source);

    var dataset =
      keyPart_(record['Source Dataset']);

    var sourceRecordId =
      keyPart_(record['Source Record ID']);

    var parcel =
      normalizeParcel_(record['Parcel ID']);

    if (!source) {
      throw new Error(
        'Source is required for source observation identity.'
      );
    }

    if (!dataset) {
      throw new Error(
        'Source Dataset is required for source observation identity.'
      );
    }

    /*
     * Preserve the legacy Source Record Key shape for compatibility:
     *
     * source|dataset|sourceRecordId
     *
     * This permits existing county observations to be lazily upgraded
     * without making address equality an upsert authority.
     */
    if (sourceRecordId) {
      return [
        source,
        dataset,
        sourceRecordId
      ].join('|');
    }

    /*
     * Property-level datasets may legitimately expose only parcel
     * identity. This remains source/dataset scoped and therefore is
     * observation identity, not canonical property identity.
     */
    if (parcel) {
      return [
        source,
        dataset,
        parcel
      ].join('|');
    }

    throw new Error(
      'Source Record ID or Parcel ID is required for source observation identity.'
    );
  }

  function buildCanonicalPropertyIdentity_(record) {
    record = record || {};

    var state =
      keyPart_(record.State);

    var county =
      keyPart_(record.County);

    var city =
      keyPart_(record.City);

    var parcel =
      normalizeParcel_(record['Parcel ID']);

    /*
     * Preferred authority:
     * jurisdiction + parcel/OPA identity.
     */
    if (
      parcel &&
      state &&
      (county || city)
    ) {
      return {
        key: [
          'property',
          'parcel',
          state,
          county || city,
          parcel
        ].join('|'),

        authority: 'parcel'
      };
    }

    /*
     * Deterministic exact-address fallback.
     *
     * This normalizes only casing/whitespace. It does NOT perform fuzzy
     * matching, abbreviation conversion, geocoding, phonetics, or
     * partial-address matching.
     */
    var address =
      keyPart_(record.Address);

    var zip =
      keyPart_(record.Zip);

    if (
      address &&
      city &&
      state
    ) {
      return {
        key: [
          'property',
          'address',
          state,
          city,
          zip,
          address
        ].join('|'),

        authority: 'address'
      };
    }

    throw new Error(
      'Canonical property identity requires parcel jurisdiction or exact address authority.'
    );
  }

  function resolve(record) {
    var canonical =
      buildCanonicalPropertyIdentity_(record);

    return {
      ok: true,

      sourceObservationKey:
        buildSourceObservationKey_(record),

      canonicalPropertyKey:
        canonical.key,

      authority:
        canonical.authority,

      observationAuthority:
        String(
          record &&
          record['Source Record ID']
            ? 'source_record_id'
            : 'parcel'
        )
    };
  }

  function sourceObservationKey(record) {
    return buildSourceObservationKey_(
      record || {}
    );
  }

  function canonicalPropertyIdentity(record) {
    return buildCanonicalPropertyIdentity_(
      record || {}
    );
  }

  function tryCanonicalPropertyIdentity(record) {
    try {
      var identity =
        buildCanonicalPropertyIdentity_(
          record || {}
        );

      return {
        ok: true,
        key: identity.key,
        authority: identity.authority,
        error: ''
      };
    } catch (error) {
      return {
        ok: false,
        key: '',
        authority: '',
        error:
          error && error.message
            ? error.message
            : String(error)
      };
    }
  }

  return {
    resolve: resolve,
    sourceObservationKey:
      sourceObservationKey,
    canonicalPropertyIdentity:
      canonicalPropertyIdentity,
    tryCanonicalPropertyIdentity:
      tryCanonicalPropertyIdentity
  };
})();
