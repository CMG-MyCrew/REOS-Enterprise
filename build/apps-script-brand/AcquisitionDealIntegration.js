/**
 * REOS Enterprise v3.4.3
 * Sprint 5.2 — Acquisition Deal Integration
 * Increment 2: batch queue, idempotency, skip rules, and run summaries.
 */

var REOS = REOS || {};

REOS.AcquisitionDealIntegration = (function () {
  var DEALS = 'DEALS';
  var ANALYSIS = 'DEAL_ANALYSIS';
  var OFFERS = 'OFFERS';
  var SCORES = 'ACQUISITION_DEAL_SCORES';
  var BATCH_RUNS = 'ACQUISITION_BATCH_RUNS';
  var BATCH_ITEMS = 'ACQUISITION_BATCH_ITEMS';

  function ensureSheets() {
    assertDependencies_();
    REOS.DealAnalyzer.ensureSheets();
    REOS.AcquisitionPipeline.ensureSheets();

    REOS.Database.ensureTable(SCORES, [
      'Score ID','Deal ID','Analysis ID','Score','Grade','MAO','Purchase Price',
      'ROI %','DSCR','Risk Level','Recommendation','Score Breakdown JSON',
      'Created At','Updated At'
    ]);

    REOS.Database.ensureTable(BATCH_RUNS, [
      'Batch Run ID','Started At','Completed At','Status','Total Deals','Processed',
      'Skipped','Errors','Duration Ms','Options JSON','Summary JSON','Created At','Updated At'
    ]);

    REOS.Database.ensureTable(BATCH_ITEMS, [
      'Batch Item ID','Batch Run ID','Deal ID','Status','Reason','Analysis ID',
      'Score ID','Offer ID','Duration Ms','Error Message','Created At','Updated At'
    ]);
  }

  /**
   * Runs the complete acquisition workflow for one deal.
   *
   * options:
   *   createDraftOffer: defaults to true
   *   advancePipeline: defaults to true
   *   offerType: defaults to Cash
   *   offerTerms: optional
   *   reuseLatestAnalysis: defaults to false
   *   forceReprocess: defaults to false
   */
  function processDeal(dealId, analysisInput, options) {
    ensureSheets();
    options = options || {};

    var deal = requireDeal_(dealId);
    var existingScore = getLatestScore(dealId);
    if (existingScore && options.forceReprocess !== true) {
      return {
        ok: true,
        skipped: true,
        reason: 'Deal already scored.',
        deal: deal,
        score: existingScore
      };
    }

    var pipeline = REOS.AcquisitionPipeline.getPipeline(dealId) ||
      REOS.AcquisitionPipeline.createPipeline(dealId);

    var analysis = null;
    var score = null;
    var scoreRow = null;
    var offer = null;

    if (options.reuseLatestAnalysis === true) {
      analysis = getLatestAnalysis_(dealId);
      if (!analysis) throw new Error("No existing deal analysis found.");
      if (!(REOS.DealLogicVersioning && REOS.DealLogicVersioning.syncExisting)) {
        throw new Error("Deal Logic Versioning syncExisting is required for reused analyses.");
      }
      var synced = REOS.DealLogicVersioning.syncExisting(dealId, analysis, options);
      analysis = synced.analysis;
      scoreRow = synced.score;
      offer = synced.offer;
    } else {
      if (!(REOS.DealLogicVersioning && REOS.DealLogicVersioning.save)) {
        throw new Error("Deal Logic Versioning is required for deal processing.");
      }
      var saved = REOS.DealLogicVersioning.save(dealId, analysisInput || {}, {
        analysisSaveMode: options.analysisSaveMode || "create_version",
        createDraftOffer: options.createDraftOffer !== false,
        advancePipeline: false,
        offerType: options.offerType || "Cash",
        offerTerms: options.offerTerms || ""
      });
      analysis = saved.analysis;
      scoreRow = saved.score;
      offer = saved.offer;
    }

    if (!scoreRow) throw new Error("Deal Logic score synchronization failed.");
    score = { score: number_(scoreRow.Score), grade: String(scoreRow.Grade || "") };

    if (options.advancePipeline !== false) {
      pipeline = advanceToInitialAnalysis_(dealId, pipeline, score);
    }

    var result = {
      ok: true,
      skipped: false,
      deal: deal,
      pipeline: pipeline,
      analysis: analysis,
      score: scoreRow,
      offer: offer
    };

    publish_('acquisition.deal.processed', {
      dealId: dealId,
      analysisId: analysis['Analysis ID'],
      score: score.score,
      grade: score.grade,
      offerId: offer ? offer['Offer ID'] : ''
    });

    return result;
  }

  function processLatestDeal(analysisInput, options) {
    ensureSheets();
    var deals = REOS.Database.getAll(DEALS);
    if (!deals.length) throw new Error('No deals found.');
    return processDeal(deals[deals.length - 1]['Deal ID'], analysisInput || {}, options || {});
  }

  /**
   * Processes unscored deals in a resilient queue.
   *
   * Queue eligibility:
   * - Deal must not already have a score unless forceReprocess=true.
   * - Deal must have an existing analysis with Purchase Price and ARV > 0.
   * - Existing analysis is reused to prevent duplicate analysis rows.
   */
  function processQueue(options) {
    ensureSheets();
    options = options || {};

    var startedAt = new Date();
    var limit = Math.max(1, Math.min(number_(options.limit) || 50, 250));
    var forceReprocess = options.forceReprocess === true;
    var deals = REOS.Database.getAll(DEALS);

    var run = REOS.Database.insert(BATCH_RUNS, {
      'Started At': startedAt,
      'Completed At': '',
      Status: 'Running',
      'Total Deals': 0,
      Processed: 0,
      Skipped: 0,
      Errors: 0,
      'Duration Ms': 0,
      'Options JSON': json_({
        limit: limit,
        forceReprocess: forceReprocess,
        createDraftOffer: options.createDraftOffer !== false,
        advancePipeline: options.advancePipeline !== false
      }),
      'Summary JSON': ''
    }, { idField: 'Batch Run ID', idPrefix: 'BATCH' });

    var summary = {
      ok: true,
      batchRunId: run['Batch Run ID'],
      startedAt: startedAt.toISOString(),
      completedAt: '',
      totalDeals: 0,
      attempted: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
      durationMs: 0,
      items: []
    };

    var attempted = 0;

    for (var dealIndex = 0; dealIndex < deals.length; dealIndex++) {
      if (attempted >= limit) break;

      var deal = deals[dealIndex];
      var itemStarted = new Date();
      var dealId = String(deal['Deal ID'] || '');
      var item = {
        dealId: dealId,
        status: '',
        reason: '',
        analysisId: '',
        scoreId: '',
        offerId: '',
        durationMs: 0,
        errorMessage: ''
      };
      var countsTowardLimit = false;

      try {
        if (!dealId) {
          item.status = 'Skipped';
          item.reason = 'Missing Deal ID.';
          summary.skipped++;
        } else if (!forceReprocess && getLatestScore(dealId)) {
          item.status = 'Skipped';
          item.reason = 'Deal already scored.';
          summary.skipped++;
        } else {
          var latestAnalysis = getLatestAnalysis_(dealId);
          var validation = validateAnalysisForQueue_(latestAnalysis);

          if (!validation.ok) {
            item.status = 'Skipped';
            item.reason = validation.reason;
            item.analysisId = latestAnalysis ? latestAnalysis['Analysis ID'] || '' : '';
            summary.skipped++;
          } else {
            countsTowardLimit = true;
          var result = processDeal(dealId, {}, {
              createDraftOffer: options.createDraftOffer !== false,
              advancePipeline: options.advancePipeline !== false,
              offerType: options.offerType || 'Cash',
              offerTerms: options.offerTerms || '',
              reuseLatestAnalysis: true,
              forceReprocess: forceReprocess
            });

            item.status = result.skipped ? 'Skipped' : 'Processed';
            item.reason = result.reason || '';
            item.analysisId = result.analysis ? result.analysis['Analysis ID'] || '' : '';
            item.scoreId = result.score ? result.score['Score ID'] || '' : '';
            item.offerId = result.offer ? result.offer['Offer ID'] || '' : '';

            if (result.skipped) summary.skipped++;
            else summary.processed++;
          }
        }
      } catch (error) {
        countsTowardLimit = true;
        item.status = 'Error';
        item.errorMessage = error && error.message ? error.message : String(error);
        summary.errors++;
      }

      if (countsTowardLimit) attempted++;

      item.durationMs = new Date().getTime() - itemStarted.getTime();
      summary.items.push(item);

      try {
        saveBatchItem_(run['Batch Run ID'], item);
      } catch (itemSaveError) {
        summary.errors++;
        item.errorMessage = item.errorMessage
          ? item.errorMessage + " | Batch item persistence failed: " + itemSaveError.message
          : "Batch item persistence failed: " + itemSaveError.message;
      }
    }

    summary.totalDeals = summary.items.length;
    summary.attempted = attempted;

    var completedAt = new Date();
    summary.completedAt = completedAt.toISOString();
    summary.durationMs = completedAt.getTime() - startedAt.getTime();

    try {
      REOS.Database.update(BATCH_RUNS, 'Batch Run ID', run['Batch Run ID'], {
        'Completed At': completedAt,
        'Total Deals': summary.totalDeals,
        Status: summary.errors > 0 ? 'Completed With Errors' : 'Completed',
        Processed: summary.processed,
        Skipped: summary.skipped,
        Errors: summary.errors,
        'Duration Ms': summary.durationMs,
        'Summary JSON': json_(summary)
      });
    } catch (finalizeError) {
      summary.ok = false;
      summary.errors++;
      summary.finalizationError = finalizeError && finalizeError.message
        ? finalizeError.message
        : String(finalizeError);

      try {
        REOS.Database.update(BATCH_RUNS, 'Batch Run ID', run['Batch Run ID'], {
          'Completed At': completedAt,
          'Total Deals': summary.totalDeals,
          Status: 'Failed',
          Processed: summary.processed,
          Skipped: summary.skipped,
          Errors: summary.errors,
          'Duration Ms': summary.durationMs,
          'Summary JSON': json_(summary)
        });
      } catch (statusError) {
        throw new Error(
          'Batch finalization failed: ' + summary.finalizationError +
          ' | Failed to mark batch run as Failed: ' +
          (statusError && statusError.message ? statusError.message : String(statusError))
        );
      }

      throw finalizeError;
    }

    publish_('acquisition.batch.completed', summary);
    return summary;
  }

  function getBatchSummary(batchRunId) {
  ensureSheets();
  var run = null;

  if (batchRunId) {
    run = REOS.Database.findById(BATCH_RUNS, 'Batch Run ID', batchRunId);
  } else {
    var runs = REOS.Database.getAll(BATCH_RUNS);

    runs.sort(function (a, b) {
      var startedDiff =
        timestamp_(a['Started At']) - timestamp_(b['Started At']);
      if (startedDiff !== 0) return startedDiff;

      var createdDiff =
        timestamp_(a['Created At']) - timestamp_(b['Created At']);
      if (createdDiff !== 0) return createdDiff;

      return String(a['Batch Run ID'] || '').localeCompare(
        String(b['Batch Run ID'] || '')
      );
    });

    run = runs.length ? runs[runs.length - 1] : null;
  }

  if (!run) {
    return {
      ok: true,
      message: 'No batch runs found.',
      run: null,
      items: []
    };
  }

  var items = REOS.Database.getAll(BATCH_ITEMS).filter(function (row) {
    return String(row['Batch Run ID'] || '') ===
      String(run['Batch Run ID'] || '');
  });

  return {
    ok: true,
    run: run,
    items: items
  };
}

  function getLatestScore(dealId) {
  ensureSheets();

  var rows = REOS.Database.getAll(SCORES).filter(function (row) {
    return String(row['Deal ID'] || '') === String(dealId || '');
  });

  rows.sort(function (a, b) {
    var updatedDiff =
      timestamp_(a['Updated At']) - timestamp_(b['Updated At']);
    if (updatedDiff !== 0) return updatedDiff;

    var createdDiff =
      timestamp_(a['Created At']) - timestamp_(b['Created At']);
    if (createdDiff !== 0) return createdDiff;

    return String(a['Score ID'] || '').localeCompare(
      String(b['Score ID'] || '')
    );
  });

  return rows.length ? rows[rows.length - 1] : null;
}

function timestamp_(value) {
  if (!value) return 0;

  if (value instanceof Date) {
    var dateTime = value.getTime();
    return isFinite(dateTime) ? dateTime : 0;
  }

  var parsed = new Date(value).getTime();
  return isFinite(parsed) ? parsed : 0;
}

  function getLatestAnalysis_(dealId) {
  var rows = REOS.Database.getAll(ANALYSIS).filter(function (row) {
    return String(row['Deal ID'] || '') === String(dealId || '');
  });

  rows.sort(function (a, b) {
    var versionDiff =
      number_(a['Analysis Version']) - number_(b['Analysis Version']);
    if (versionDiff !== 0) return versionDiff;

    var updatedDiff =
      timestamp_(a['Updated At']) - timestamp_(b['Updated At']);
    if (updatedDiff !== 0) return updatedDiff;

    var createdDiff =
      timestamp_(a['Created At']) - timestamp_(b['Created At']);
    if (createdDiff !== 0) return createdDiff;

    return String(a['Analysis ID'] || '').localeCompare(
      String(b['Analysis ID'] || '')
    );
  });

  return rows.length ? rows[rows.length - 1] : null;
}

  function validateAnalysisForQueue_(analysis) {
    if (!analysis) {
      return { ok: false, reason: 'No existing deal analysis.' };
    }

    var missing = [];
    if (number_(analysis['Purchase Price']) <= 0) missing.push('Purchase Price');
    if (number_(analysis.ARV) <= 0) missing.push('ARV');

    if (missing.length) {
      return {
        ok: false,
        reason: 'Missing required financial data: ' + missing.join(', ') + '.'
      };
    }

    return { ok: true, reason: '' };
  }



  function saveBatchItem_(batchRunId, item) {
    return REOS.Database.insert(BATCH_ITEMS, {
      'Batch Run ID': batchRunId,
      'Deal ID': item.dealId,
      Status: item.status,
      Reason: item.reason,
      'Analysis ID': item.analysisId,
      'Score ID': item.scoreId,
      'Offer ID': item.offerId,
      'Duration Ms': item.durationMs,
      'Error Message': item.errorMessage
    }, { idField: 'Batch Item ID', idPrefix: 'BITEM' });
  }


  function advanceToInitialAnalysis_(dealId, pipeline, score) {
    var currentStage = String(pipeline['Current Stage'] || 'Lead');
    var stages = REOS.AcquisitionPipeline.STAGES || [
      'Lead','Property Review','Initial Analysis','Comparable Analysis',
      'Offer Generation','Offer Submitted','Negotiation','Under Contract',
      'Due Diligence','Closing','Disposition','Closed'
    ];
    var currentIndex = stages.indexOf(currentStage);
    var targetIndex = stages.indexOf('Initial Analysis');

    if (currentIndex >= targetIndex) return pipeline;

    return REOS.AcquisitionPipeline.advanceStage(
      dealId,
      'Initial Analysis',
      'Automated Deal Analyzer completed. Score ' + score.score + ' (' + score.grade + ').'
    );
  }

  function requireDeal_(dealId) {
    if (!dealId) throw new Error('Deal ID is required.');
    var deal = REOS.Database.findById(DEALS, 'Deal ID', dealId);
    if (!deal) throw new Error('Deal not found: ' + dealId);
    return deal;
  }

  function assertDependencies_() {
    if (!REOS.Database) throw new Error('REOS.Database is required.');
    if (!REOS.DealAnalyzer) throw new Error('REOS.DealAnalyzer is required.');
    if (!REOS.AcquisitionPipeline) throw new Error('REOS.AcquisitionPipeline is required.');
  }


  function number_(value) {
    var parsed = Number(value || 0);
    return isFinite(parsed) ? parsed : 0;
  }


  function json_(value) {
    if (REOS.toJson_) return REOS.toJson_(value);
    return JSON.stringify(value);
  }

  function publish_(topic, payload) {
    if (REOS.PluginEventBus && REOS.PluginEventBus.publish) {
      REOS.PluginEventBus.publish(topic, payload, 'acquisitions');
    }
  }

  return {
    ensureSheets: ensureSheets,
    processDeal: processDeal,
    processLatestDeal: processLatestDeal,
    processQueue: processQueue,
    getBatchSummary: getBatchSummary,
    getLatestScore: getLatestScore,
  };
})();

function reosSprint52EnsureSheets() {
  REOS.AcquisitionDealIntegration.ensureSheets();
  var result = { ok: true, message: 'Sprint 5.2 integration sheets ready.' };
  console.log(JSON.stringify(result));
  return result;
}

function reosSprint52ProcessLatestDemo() {
  var result = REOS.AcquisitionDealIntegration.processLatestDeal({
    purchasePrice: 95000,
    arv: 165000,
    repairCost: 25000,
    holdingCost: 4500,
    closingCost: 3500,
    financingCost: 2500,
    sellingCost: 9900,
    assignmentFee: 10000,
    rentMonthly: 1450,
    taxesAnnual: 2200,
    insuranceAnnual: 1500,
    hoaMonthly: 0,
    loanPaymentMonthly: 750
  }, {
    createDraftOffer: true,
    advancePipeline: true,
    forceReprocess: true
  });

  console.log(JSON.stringify(result, null, 2).slice(0, 5000));
  return result;
}

function reosSprint52ProcessQueue() {
  var result = REOS.AcquisitionDealIntegration.processQueue({
    limit: 50,
    createDraftOffer: true,
    advancePipeline: true,
    forceReprocess: false
  });
  console.log(JSON.stringify(result, null, 2).slice(0, 10000));
  return result;
}

function reosSprint52BatchSummary() {
  var result = REOS.AcquisitionDealIntegration.getBatchSummary();
  console.log(JSON.stringify(result, null, 2).slice(0, 10000));
  return result;
}
