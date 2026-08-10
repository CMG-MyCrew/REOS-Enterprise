/**
 * REOS Enterprise v3.3.0 - Dynamic Menu Registry
 *
 * Modules and plugins register menu items declaratively. Menu.gs renders a
 * single menu from this registry.
 */

var REOS = REOS || {};

REOS.MenuRegistry = (function () {
  var groups = [];
  var initialized = false;

  function reset() { groups = []; initialized = false; }

  function registerGroup(group) {
    if (!group || !group.key) throw new Error('Menu group requires a key.');
    var existingIndex = groups.findIndex(function (g) { return g.key === group.key; });
    var normalized = {
      key: group.key,
      label: group.label || group.key,
      order: Number(group.order || 1000),
      enabled: group.enabled !== false,
      items: (group.items || []).filter(function (item) { return item && item.label && item.functionName; })
    };
    if (existingIndex >= 0) groups[existingIndex] = normalized;
    else groups.push(normalized);
    return normalized;
  }

  function registerItem(groupKey, item) {
    var group = groups.filter(function (g) { return g.key === groupKey; })[0];
    if (!group) group = registerGroup({ key: groupKey, label: groupKey, order: 1000, items: [] });
    if (item && item.label && item.functionName) group.items.push(item);
    return item;
  }

  function initializeDefaults() {
    if (initialized) return groups;
    initialized = true;

    registerGroup({ key: 'foundation', label: 'Foundation', order: 10, items: [
      { label: 'Run Phase 1 Upgrade', functionName: 'reosRunPhase1Upgrade' },
      { label: 'Validate Phase 1 Upgrade', functionName: 'reosValidatePhase1Upgrade' }
    ]});

    registerGroup({ key: 'platform', label: 'Platform', order: 20, items: [
      { label: 'Open Dashboard Hub', functionName: 'showDashboardHub' },
      { label: 'Open Finance Manager', functionName: 'showFinanceManager' },
      { label: 'Open Finance Enhancements', functionName: 'showFinanceEnhancements' },
      { label: 'Open Finance Dashboards', functionName: 'showFinanceDashboards' },
      { label: 'Open QuickBooks Connector', functionName: 'showQuickBooksConnector' },
      { label: 'Open QuickBooks OAuth', functionName: 'showQuickBooksOAuth' },
      { label: 'Open Portal Foundation', functionName: 'showPortalFoundation' },
      { label: 'Open Portal Auth', functionName: 'showPortalAuth' },
      { label: 'Open Investor Portal', functionName: 'showInvestorPortal' },
      { label: 'Open Vendor Portal UI', functionName: 'showVendorPortalUI' },
      { label: 'Open Client/Lender Portal', functionName: 'showClientLenderPortal' }
    ]});

    registerGroup({ key: 'applications', label: 'Applications', order: 30, items: [
      { label: 'Open Deployment Wizard', functionName: 'showDeploymentWizard' },
      { label: 'Open Enterprise Seeder', functionName: 'showEnterpriseSeeder' },
      { label: 'Open Operational Validator', functionName: 'showOperationalValidator' },
      { label: 'Open Production Monitoring', functionName: 'showProductionMonitoring' },
      { label: 'Open Release Package', functionName: 'showReleasePackage' },
      { label: 'Open Production Launch', functionName: 'showProductionLaunch' },
      { label: 'Open Maintenance Manager', functionName: 'showMaintenanceManager' },
      { label: 'Open Dashboard Export', functionName: 'showDashboardExport' },
      { label: 'Open Documents', functionName: 'showDocuments' },
      { label: 'Open AI Agents', functionName: 'showAIAgents' },
      { label: 'Open Dashboard', functionName: 'reosOpenDashboard' },
      { label: 'Open Executive Dashboard', functionName: 'showExecutiveDashboard' },
      { label: 'Open CRM', functionName: 'showCRM' },
      { label: 'Open CRM Dashboard', functionName: 'showCRMDashboard' },
      { label: 'Open Acquisitions', functionName: 'showAcquisitions' },
      { label: 'Open Acquisitions Dashboard', functionName: 'showAcquisitionsDashboard' },
      { label: 'Open Deal Analyzer', functionName: 'reosOpenDealAnalyzer' },
      { label: 'Preview Targeted Deal', functionName: 'reosSprint52PreviewDealPrompt' },
      { label: 'Activate Eligible Deal', functionName: 'reosSprint52ActivateEligibleDealPrompt' },
      { label: 'Open Vendors', functionName: 'showVendors' },
      { label: 'Open Vendor Dashboard', functionName: 'showVendorDashboard' },
      { label: 'Open Properties', functionName: 'showProperties' },
      { label: 'Open Property Dashboard', functionName: 'showPropertyDashboard' },
      { label: 'Open Automation', functionName: 'showAutomation' },
      { label: 'Open Automation Dashboard', functionName: 'showAutomationDashboard' },
      { label: 'Open Automation Templates', functionName: 'showAutomationTemplates' },
      { label: 'Open External Integrations', functionName: 'showExternalIntegrations' },
      { label: 'Open Production Hardening', functionName: 'showProductionHardening' },
      { label: 'Open AI Workspace', functionName: 'showAI' },
      { label: 'Open AI Dashboard', functionName: 'showAIDashboard' },
      { label: 'Open Admin', functionName: 'showAdmin' }
    ]});

    registerGroup({ key: 'acquisition_intelligence', label: 'Acquisition Intelligence', order: 40, items: [
      { label: 'Setup Acquisition Intelligence', functionName: 'runAcquisitionSprint31Setup' },
      { label: 'Run Acquisition Scan', functionName: 'runDailyAcquisitionScan' },
      { label: 'Install Daily Acquisition Trigger', functionName: 'installDailyAcquisitionTrigger' }
    ]});

    registerGroup({ key: 'system', label: 'System', order: 50, items: [
      { label: 'Initialize Workbook', functionName: 'reosInitializeWorkbook' },
      { label: 'Health Check', functionName: 'runHealthCheck' },
      { label: 'Run Tests', functionName: 'reosRunTests' }
    ]});

    return groups;
  }

  function getGroups() {
    initializeDefaults();
    return groups.filter(function (g) { return g.enabled && g.items.length; }).sort(function (a, b) { return a.order - b.order; });
  }

  function render() {
    var ui = SpreadsheetApp.getUi();
    var menu = ui.createMenu('REOS');
    var activeGroups = getGroups();
    activeGroups.forEach(function (group, groupIndex) {
      if (groupIndex > 0) menu.addSeparator();
      group.items.forEach(function (item) {
        if (functionExists_(item.functionName)) menu.addItem(item.label, item.functionName);
      });
    });
    menu.addToUi();
    return activeGroups;
  }

  function functionExists_(functionName) {
    try { return typeof globalThis[functionName] === 'function'; } catch (error) { return true; }
  }

  return { reset: reset, registerGroup: registerGroup, registerItem: registerItem, initializeDefaults: initializeDefaults, getGroups: getGroups, render: render };
})();

function reosMenuRegistrySummary() {
  var groups = REOS.MenuRegistry.getGroups();
  SpreadsheetApp.getUi().alert('REOS Menu Registry', JSON.stringify(groups, null, 2).slice(0, 1800), SpreadsheetApp.getUi().ButtonSet.OK);
  return groups;
}

function reosRebuildMenu() {
  REOS.MenuRegistry.reset();
  REOS.MenuRegistry.initializeDefaults();
  REOS.buildMenu_();
  SpreadsheetApp.getUi().alert('REOS menu rebuilt from registry.');
  return REOS.MenuRegistry.getGroups();
}
