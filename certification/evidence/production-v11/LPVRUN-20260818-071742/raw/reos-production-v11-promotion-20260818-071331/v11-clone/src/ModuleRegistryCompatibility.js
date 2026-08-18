/**
 * Temporary compatibility layer for existing REOS dashboards.
 *
 * Remove aliases after all UI components call getModuleNavigation().
 */

function getAvailableModules() {
  return REOS.ModuleRegistry.navigation('');
}

function loadModules() {
  return REOS.ModuleRegistry.navigation('');
}

function refreshModules() {
  REOS.ModuleRegistry.initialize(false);

  return {
    ok: true,
    modules: REOS.ModuleRegistry.navigation(''),
    health: REOS.ModuleRegistry.health()
  };
}
