/**
 * REOS Zillow production certification evidence.
 *
 * Read-only inspection surface for tracing a Gmail message through
 * ZILLOW_GMAIL_IMPORTS into DISTRESS_LEADS.
 *
 * Performs no Gmail operations, connector execution, ingestion,
 * scoring, promotion, or database writes.
 */

function reosZillowProductionEvidence(messageId) {
  messageId = String(messageId || '').trim();

  if (!messageId) {
    throw new Error('Gmail Message ID is required.');
  }

  var imports = REOS.Database.query(
    'ZILLOW_GMAIL_IMPORTS',
    function (row) {
      return String(row['Gmail Message ID'] || '') === messageId;
    }
  );

  if (!imports.length) {
    return JSON.stringify({
      ok: false,
      messageId: messageId,
      importFound: false,
      leadFound: false,
      import: null,
      lead: null
    });
  }

  var importRow = imports[imports.length - 1];
  var leadId =
    String(importRow['Distress Lead ID'] || '').trim();

  var lead = leadId
    ? REOS.Database.findById(
        'DISTRESS_LEADS',
        'Distress Lead ID',
        leadId
      )
    : null;

  return JSON.stringify({
    ok: !!lead,
    messageId: messageId,
    importFound: true,
    leadFound: !!lead,
    import: importRow,
    lead: lead || null
  });
}
