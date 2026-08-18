/**
 * REOS Enterprise Module Registry
 *
 * Authoritative registry for:
 * - module metadata
 * - navigation
 * - enable/disable state
 * - role visibility
 * - module health
 *
 * Stored overrides survive deployments through Script Properties.
 */

var REOS = REOS || {};

REOS.ModuleRegistry = (function () {
  'use strict';

  var REGISTRY_KEY = 'REOS_MODULE_REGISTRY_V1';
  var REGISTRY_VERSION = '1.0.0';

  /**
   * Core module catalog.
   *
   * route:
   *   Client-side route identifier.
   *
   * ui:
   *   HTML file associated with the module.
   *
   * service:
   *   Primary Apps Script service/module name.
   */
  var DEFAULT_MODULES = [
    {
      id: 'command-center',
      name: 'Command Center',
      description: 'Executive operational overview and system launchpad.',
      icon: 'dashboard',
      category: 'core',
      route: 'command-center',
      ui: 'DashboardComponents',
      service: 'DashboardService',
      order: 10,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'crm',
      name: 'CRM',
      description: 'Contacts, leads, activities, follow-ups and client relationships.',
      icon: 'groups',
      category: 'sales',
      route: 'crm',
      ui: 'CRMUI',
      service: 'CRM',
      order: 20,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'acquisitions',
      name: 'Acquisitions',
      description: 'Property leads, underwriting, offers and acquisition workflow.',
      icon: 'real_estate_agent',
      category: 'investing',
      route: 'acquisitions',
      ui: 'AcquisitionsUI',
      service: 'Acquisitions',
      order: 30,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'properties',
      name: 'Properties',
      description: 'Property records, occupancy, ownership and portfolio operations.',
      icon: 'home_work',
      category: 'operations',
      route: 'properties',
      ui: 'PropertiesUI',
      service: 'Properties',
      order: 40,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'vendors',
      name: 'Vendors',
      description: 'Vendor onboarding, compliance and service-provider management.',
      icon: 'handyman',
      category: 'operations',
      route: 'vendors',
      ui: 'VendorsUI',
      service: 'Vendors',
      order: 50,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'tasks',
      name: 'Tasks',
      description: 'Assignments, deadlines, workflow actions and follow-up queues.',
      icon: 'task_alt',
      category: 'operations',
      route: 'tasks',
      ui: '',
      service: 'Tasks',
      order: 60,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      description: 'Work orders, repairs, inspections and maintenance operations.',
      icon: 'construction',
      category: 'property-management',
      route: 'maintenance',
      ui: 'MaintenanceManagerUI',
      service: 'MaintenanceManager',
      order: 70,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'rentals',
      name: 'Rentals',
      description: 'Rental portfolio, leases, tenants and occupancy management.',
      icon: 'apartment',
      category: 'property-management',
      route: 'rentals',
      ui: '',
      service: 'Rentals',
      order: 80,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'transactions',
      name: 'Transactions',
      description: 'Real-estate transaction coordination and milestone tracking.',
      icon: 'receipt_long',
      category: 'operations',
      route: 'transactions',
      ui: '',
      service: 'Transactions',
      order: 90,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'finance',
      name: 'Finance',
      description: 'Financial operations, reporting, cash flow and performance.',
      icon: 'account_balance',
      category: 'finance',
      route: 'finance',
      ui: 'FinanceManagerUI',
      service: 'FinanceManager',
      order: 100,
      enabled: true,
      requiredRoles: ['OWNER', 'ADMIN', 'FINANCE']
    },
    {
      id: 'documents',
      name: 'Documents',
      description: 'Document storage, generation and transaction files.',
      icon: 'folder',
      category: 'operations',
      route: 'documents',
      ui: 'DocumentsUI',
      service: 'Documents',
      order: 110,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'automation',
      name: 'Automation',
      description: 'Recurring workflows, triggers, queues and operational automation.',
      icon: 'automation',
      category: 'platform',
      route: 'automation',
      ui: 'AutomationUI',
      service: 'Automation',
      order: 120,
      enabled: true,
      requiredRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Connected platforms, APIs and connector management.',
      icon: 'hub',
      category: 'platform',
      route: 'integrations',
      ui: 'ExternalIntegrationsUI',
      service: 'Integrations',
      order: 130,
      enabled: true,
      requiredRoles: ['OWNER', 'ADMIN']
    },
    {
      id: 'reports',
      name: 'Reports',
      description: 'Operational, financial and portfolio reporting.',
      icon: 'analytics',
      category: 'intelligence',
      route: 'reports',
      ui: '',
      service: 'Reports',
      order: 140,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'ai',
      name: 'AI Intelligence',
      description: 'AI insights, summaries, deal intelligence and recommendations.',
      icon: 'psychology',
      category: 'intelligence',
      route: 'ai',
      ui: 'AIUI',
      service: 'AI',
      order: 150,
      enabled: true,
      requiredRoles: []
    },
    {
      id: 'admin',
      name: 'Administration',
      description: 'Users, permissions, configuration and system administration.',
      icon: 'admin_panel_settings',
      category: 'platform',
      route: 'admin',
      ui: 'AdminUI',
      service: 'Admin',
      order: 900,
      enabled: true,
      requiredRoles: ['OWNER', 'ADMIN']
    }
  ];

  function clone_(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeId_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function validateModule_(module) {
    if (!module || typeof module !== 'object') {
      throw new Error('Module definition must be an object.');
    }

    var id = normalizeId_(module.id);

    if (!id) {
      throw new Error('Module ID is required.');
    }

    if (!module.name) {
      throw new Error('Module name is required for: ' + id);
    }

    return {
      id: id,
      name: String(module.name),
      description: String(module.description || ''),
      icon: String(module.icon || 'extension'),
      category: String(module.category || 'other'),
      route: String(module.route || id),
      ui: String(module.ui || ''),
      service: String(module.service || ''),
      order: Number(module.order || 500),
      enabled: module.enabled !== false,
      requiredRoles: Array.isArray(module.requiredRoles)
        ? module.requiredRoles.map(function (role) {
            return String(role).toUpperCase();
          })
        : []
    };
  }

  function defaultRegistry_() {
    return {
      version: REGISTRY_VERSION,
      updatedAt: new Date().toISOString(),
      modules: DEFAULT_MODULES.map(validateModule_)
    };
  }

  function readRegistry_() {
    var raw = PropertiesService
      .getScriptProperties()
      .getProperty(REGISTRY_KEY);

    if (!raw) {
      return defaultRegistry_();
    }

    try {
      var parsed = JSON.parse(raw);

      if (!parsed || !Array.isArray(parsed.modules)) {
        return defaultRegistry_();
      }

      parsed.modules = parsed.modules.map(validateModule_);
      return parsed;
    } catch (error) {
      console.error('Invalid module registry; using defaults.', error);
      return defaultRegistry_();
    }
  }

  function writeRegistry_(registry) {
    registry.version = REGISTRY_VERSION;
    registry.updatedAt = new Date().toISOString();

    PropertiesService
      .getScriptProperties()
      .setProperty(REGISTRY_KEY, JSON.stringify(registry));

    CacheService
      .getScriptCache()
      .remove(REGISTRY_KEY);

    return registry;
  }

  function mergeWithDefaults_(storedRegistry) {
    var storedById = {};

    storedRegistry.modules.forEach(function (module) {
      storedById[module.id] = module;
    });

    var merged = DEFAULT_MODULES.map(function (defaultModule) {
      var normalizedDefault = validateModule_(defaultModule);
      var stored = storedById[normalizedDefault.id];

      if (!stored) {
        return normalizedDefault;
      }

      /*
       * Preserve deployment-controlled metadata while retaining
       * administrator enable/disable choices.
       */
      normalizedDefault.enabled = stored.enabled !== false;
      return normalizedDefault;
    });

    /*
     * Preserve registered custom modules not present in defaults.
     */
    storedRegistry.modules.forEach(function (storedModule) {
      var exists = merged.some(function (module) {
        return module.id === storedModule.id;
      });

      if (!exists) {
        merged.push(validateModule_(storedModule));
      }
    });

    return {
      version: REGISTRY_VERSION,
      updatedAt: new Date().toISOString(),
      modules: merged
    };
  }

  function sortModules_(modules) {
    return modules.sort(function (a, b) {
      if (a.order !== b.order) {
        return a.order - b.order;
      }

      return a.name.localeCompare(b.name);
    });
  }

  function roleCanAccess_(module, role) {
    if (!module.requiredRoles.length) {
      return true;
    }

    var normalizedRole = String(role || '').toUpperCase();

    /*
     * Until user-role resolution is configured, the deploying owner
     * receives OWNER access.
     */
    if (!normalizedRole) {
      normalizedRole = 'OWNER';
    }

    return module.requiredRoles.indexOf(normalizedRole) !== -1;
  }

  function getRegistry() {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(REGISTRY_KEY);

    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (error) {
        cache.remove(REGISTRY_KEY);
      }
    }

    var registry = mergeWithDefaults_(readRegistry_());

    cache.put(
      REGISTRY_KEY,
      JSON.stringify(registry),
      300
    );

    return registry;
  }

  function initialize(forceReset) {
    var lock = LockService.getScriptLock();

    lock.waitLock(30000);

    try {
      var registry = forceReset
        ? defaultRegistry_()
        : mergeWithDefaults_(readRegistry_());

      writeRegistry_(registry);

      return {
        ok: true,
        version: registry.version,
        moduleCount: registry.modules.length,
        enabledCount: registry.modules.filter(function (module) {
          return module.enabled;
        }).length,
        updatedAt: registry.updatedAt
      };
    } finally {
      lock.releaseLock();
    }
  }

  function list(options) {
    options = options || {};

    var role = options.role || '';
    var includeDisabled = options.includeDisabled === true;
    var category = String(options.category || '').toLowerCase();

    var modules = getRegistry().modules.filter(function (module) {
      if (!includeDisabled && !module.enabled) {
        return false;
      }

      if (category && module.category.toLowerCase() !== category) {
        return false;
      }

      return roleCanAccess_(module, role);
    });

    return sortModules_(clone_(modules));
  }

  function get(moduleId) {
    var normalizedId = normalizeId_(moduleId);
    var registry = getRegistry();

    for (var index = 0; index < registry.modules.length; index += 1) {
      if (registry.modules[index].id === normalizedId) {
        return clone_(registry.modules[index]);
      }
    }

    return null;
  }

  function register(moduleDefinition) {
    var module = validateModule_(moduleDefinition);
    var registry = getRegistry();
    var found = false;

    registry.modules = registry.modules.map(function (existingModule) {
      if (existingModule.id !== module.id) {
        return existingModule;
      }

      found = true;
      return module;
    });

    if (!found) {
      registry.modules.push(module);
    }

    writeRegistry_(registry);
    return clone_(module);
  }

  function setEnabled(moduleId, enabled) {
    var normalizedId = normalizeId_(moduleId);
    var registry = getRegistry();
    var updated = null;

    registry.modules = registry.modules.map(function (module) {
      if (module.id !== normalizedId) {
        return module;
      }

      module.enabled = enabled === true;
      updated = module;
      return module;
    });

    if (!updated) {
      throw new Error('Unknown module: ' + normalizedId);
    }

    writeRegistry_(registry);
    return clone_(updated);
  }

  function navigation(role) {
    return list({
      role: role || '',
      includeDisabled: false
    }).map(function (module) {
      return {
        id: module.id,
        label: module.name,
        name: module.name,
        description: module.description,
        icon: module.icon,
        category: module.category,
        route: module.route,
        ui: module.ui,
        order: module.order,
        enabled: module.enabled
      };
    });
  }

  function health() {
    var registry = getRegistry();
    var duplicateIds = [];
    var seen = {};

    registry.modules.forEach(function (module) {
      if (seen[module.id]) {
        duplicateIds.push(module.id);
      }

      seen[module.id] = true;
    });

    return {
      ok: duplicateIds.length === 0 && registry.modules.length > 0,
      registryVersion: registry.version,
      moduleCount: registry.modules.length,
      enabledCount: registry.modules.filter(function (module) {
        return module.enabled;
      }).length,
      disabledCount: registry.modules.filter(function (module) {
        return !module.enabled;
      }).length,
      duplicateIds: duplicateIds,
      categories: registry.modules.reduce(function (result, module) {
        result[module.category] = (result[module.category] || 0) + 1;
        return result;
      }, {}),
      updatedAt: registry.updatedAt
    };
  }

  return {
    initialize: initialize,
    list: list,
    get: get,
    register: register,
    setEnabled: setEnabled,
    navigation: navigation,
    health: health
  };
})();


/**
 * Web-app RPC endpoints
 */

function initializeModuleRegistry(forceReset) {
  return REOS.ModuleRegistry.initialize(forceReset === true);
}

function getModuleRegistrySnapshot(options) {
  return {
    ok: true,
    modules: REOS.ModuleRegistry.list(options || {}),
    health: REOS.ModuleRegistry.health()
  };
}

function getModuleNavigation(role) {
  return REOS.ModuleRegistry.navigation(role || '');
}

function getModuleRegistryHealth() {
  return REOS.ModuleRegistry.health();
}

function setModuleRegistryEnabled(moduleId, enabled) {
  return REOS.ModuleRegistry.setEnabled(moduleId, enabled === true);
}
