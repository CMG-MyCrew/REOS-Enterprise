/**
 * REOS Zillow Distress Lead provenance evidence.
 *
 * Admin-only read-only reverse lookup from an exact Distress Lead ID
 * into ZILLOW_GMAIL_IMPORTS and DISTRESS_LEADS.
 *
 * Grants no repair, migration, deletion, or mutation authority.
 */
function reosZillowDistressLeadProvenanceEvidence(distressLeadId) {
  REOS.Security.requireAdmin();

  distressLeadId = String(distressLeadId || '').trim();

  if (!distressLeadId) {
    throw new Error('Distress Lead ID is required.');
  }

  var imports = REOS.Database.query(
    'ZILLOW_GMAIL_IMPORTS',
    function (row) {
      return String(row['Distress Lead ID'] || '').trim() === distressLeadId;
    }
  );

  var lead = REOS.Database.findById(
    'DISTRESS_LEADS',
    'Distress Lead ID',
    distressLeadId
  );

  return JSON.stringify({
    ok: true,
    mode: 'READ_ONLY',
    phase: 'zillow_distress_lead_provenance_evidence',
    distressLeadId: distressLeadId,
    importMatchCount: imports.length,
    imports: imports,
    leadFound: !!lead,
    lead: lead || null,
    repairAuthorityGranted: false,
    repairPlanAuthorityGranted: false,
    migrationAuthorityGranted: false,
    deletionAuthorityGranted: false,
    mutationAuthorityGranted: false
  });
}
