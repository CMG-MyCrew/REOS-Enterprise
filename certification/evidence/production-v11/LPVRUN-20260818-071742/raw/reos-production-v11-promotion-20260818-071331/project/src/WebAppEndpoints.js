/**
 * Dashboard overview endpoint exposed to google.script.run.
 *
 * @return {Object}
 */
function reosDashboardOverview() {
  try {
    return {
      ok: true,
      generatedAt: new Date().toISOString(),

      crm: {
        recentClients: [],
        recentLeads: [],
        recentActivities: []
      },

      acquisitions: {
        recentLeads: [],
        activeDeals: []
      },

      properties: {
        recentProperties: [],
        totalProperties: 0
      },

      vendors: {
        recentVendors: [],
        totalVendors: 0
      },

      tasks: {
        recentTasks: [],
        openTasks: 0
      },

      records: []
    };
  } catch (error) {
    throw new Error(
      'Dashboard overview failed: ' +
      (error && error.message ? error.message : String(error))
    );
  }
}
