/**
 * REOS Enterprise Module Loader v1.0.0
 *
 * Runtime layer between:
 * - Module Registry
 * - Router
 * - Command Center
 * - Module UI fragments
 * - Backend module initializers
 *
 * Lifecycle states:
 * registered, loading, ready, degraded, failed,
 * disabled, unauthorized, unloaded
 */

var REOS = REOS || {};

REOS.ModuleLoader = (function () {
  'use strict';

  var VERSION = '1.0.0';
  var statuses_ = {};

  /**
   * Explicit initializer allowlist.
   *
   * Add additional module initializer functions here as modules become active.
   * Avoid eval() or dynamic global execution.
   */
  function getInitializerMap_() {
    return {
      'command-center': function (context) {
        return typeof reosInitializeCommandCenter === 'function'
          ? reosInitializeCommandCenter(context)
          : null;
      },

      'crm': function (context) {
        return typeof reosInitializeCRM === 'function'
          ? reosInitializeCRM(context)
          : null;
      },

      'acquisitions': function (context) {
        return typeof reosInitializeAcquisitions === 'function'
          ? reosInitializeAcquisitions(context)
          : null;
      },

      'properties': function (context) {
        return typeof reosInitializeProperties === 'function'
          ? reosInitializeProperties(context)
          : null;
      },

      'vendors': function (context) {
        return typeof reosInitializeVendors === 'function'
          ? reosInitializeVendors(context)
          : null;
      },

      'tasks': function (context) {
        return typeof reosInitializeTasks === 'function'
          ? reosInitializeTasks(context)
          : null;
      },

      'maintenance': function (context) {
        return typeof reosInitializeMaintenance === 'function'
          ? reosInitializeMaintenance(context)
          : null;
      },

      'rentals': function (context) {
        return typeof reosInitializeRentals === 'function'
          ? reosInitializeRentals(context)
          : null;
      },

      'transactions': function (context) {
        return typeof reosInitializeTransactions === 'function'
          ? reosInitializeTransactions(context)
          : null;
      },

      'finance': function (context) {
        return typeof reosInitializeFinance === 'function'
          ? reosInitializeFinance(context)
          : null;
      },

      'documents': function (context) {
        return typeof reosInitializeDocuments === 'function'
          ? reosInitializeDocuments(context)
          : null;
      },

      'automation': function (context) {
        return typeof reosInitializeAutomation === 'function'
          ? reosInitializeAutomation(context)
          : null;
      },

      'integrations': function (context) {
        return typeof reosInitializeIntegrations === 'function'
          ? reosInitializeIntegrations(context)
          : null;
      },

      'reports': function (context) {
        return typeof reosInitializeReports === 'function'
          ? reosInitializeReports(context)
          : null;
      },

      'ai-intelligence': function (context) {
        return typeof reosInitializeAIIntelligence === 'function'
          ? reosInitializeAIIntelligence(context)
          : null;
      },

      'administration': function (context) {
        return typeof reosInitializeAdministration === 'function'
          ? reosInitializeAdministration(context)
          : null;
      }
    };
  }

  function now_() {
    return new Date().toISOString();
  }

  function clone_(value) {
    if (value === undefined) {
      return undefined;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function normalizeId_(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeContext_(context) {
    var normalized = context && typeof context === 'object'
      ? clone_(context)
      : {};

    normalized.role = String(normalized.role || '').trim();
    normalized.requestId = String(normalized.requestId || '').trim();

    return normalized;
  }

  function createError_(code, message, details) {
    return {
      code: code,
      message: message,
      details: details || {}
    };
  }

  function setStatus_(moduleId, status, details) {
    statuses_[moduleId] = {
      moduleId: moduleId,
      status: status,
      updatedAt: now_(),
      details: details || {}
    };

    return clone_(statuses_[moduleId]);
  }

  function getRegistryModules_(options) {
    if (
      typeof REOS.ModuleRegistry !== 'object' ||
      REOS.ModuleRegistry === null
    ) {
      throw new Error('REOS.ModuleRegistry is not available.');
    }

    if (typeof REOS.ModuleRegistry.list === 'function') {
      return REOS.ModuleRegistry.list(options || {}) || [];
    }

    if (typeof REOS.ModuleRegistry.getAll === 'function') {
      return REOS.ModuleRegistry.getAll(options || {}) || [];
    }

    throw new Error(
      'Module Registry does not expose list() or getAll().'
    );
  }

  function moduleMatchesId_(moduleDefinition, moduleId) {
    if (!moduleDefinition) {
      return false;
    }

    var candidates = [
      moduleDefinition.id,
      moduleDefinition.key,
      moduleDefinition.moduleId,
      moduleDefinition.route,
      moduleDefinition.slug,
      moduleDefinition.name
    ];

    return candidates.some(function (candidate) {
      return normalizeId_(candidate) === moduleId;
    });
  }

  function resolveModule_(moduleId, context) {
    var roleOptions = {
      includeDisabled: true,
      role: context.role || ''
    };

    var accessibleModules = getRegistryModules_(roleOptions);
    var accessibleModule = null;

    for (var index = 0; index < accessibleModules.length; index += 1) {
      if (moduleMatchesId_(accessibleModules[index], moduleId)) {
        accessibleModule = accessibleModules[index];
        break;
      }
    }

    if (accessibleModule) {
      return {
        module: clone_(accessibleModule),
        authorized: true
      };
    }

    /*
     * Search the unrestricted registry to distinguish an unknown module
     * from one excluded by role-based access.
     */
    var allModules = getRegistryModules_({
      includeDisabled: true
    });

    for (var allIndex = 0; allIndex < allModules.length; allIndex += 1) {
      if (moduleMatchesId_(allModules[allIndex], moduleId)) {
        return {
          module: clone_(allModules[allIndex]),
          authorized: false
        };
      }
    }

    return {
      module: null,
      authorized: false
    };
  }

  function isEnabled_(moduleDefinition) {
    if (moduleDefinition.enabled === undefined) {
      return true;
    }

    return moduleDefinition.enabled === true;
  }

  function resolveTemplateName_(moduleDefinition) {
    return String(
      moduleDefinition.ui ||
      moduleDefinition.template ||
      moduleDefinition.templateName ||
      moduleDefinition.view ||
      ''
    ).trim();
  }

  function createPlaceholderView_(moduleDefinition, message) {
    var name = String(
      moduleDefinition.name ||
      moduleDefinition.title ||
      moduleDefinition.id ||
      'Module'
    );

    return {
      type: 'placeholder',
      template: '',
      html:
        '<section class="reos-module-placeholder">' +
          '<h2>' + escapeHtml_(name) + '</h2>' +
          '<p>' + escapeHtml_(message) + '</p>' +
        '</section>'
    };
  }

  function escapeHtml_(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderUi_(moduleDefinition, context) {
    var templateName = resolveTemplateName_(moduleDefinition);

    if (!templateName) {
      return {
        view: createPlaceholderView_(
          moduleDefinition,
          'This module is registered, but its UI fragment has not been assigned.'
        ),
        warning: 'No UI template is registered for this module.'
      };
    }

    try {
      var template = HtmlService.createTemplateFromFile(templateName);

      template.reosModule = clone_(moduleDefinition);
      template.reosContext = clone_(context);

      return {
        view: {
          type: 'html',
          template: templateName,
          html: template.evaluate().getContent()
        },
        warning: ''
      };
    } catch (error) {
      return {
        view: createPlaceholderView_(
          moduleDefinition,
          'The module UI could not be loaded.'
        ),
        warning:
          'Unable to load UI template "' +
          templateName +
          '": ' +
          (error.message || String(error))
      };
    }
  }

  function initializeService_(moduleId, context) {
    var initializerMap = getInitializerMap_();
    var initializer = initializerMap[moduleId];

    if (!initializer) {
      return {
        initialized: false,
        result: null,
        warning: 'No backend initializer is registered.'
      };
    }

    try {
      var result = initializer(context);

      if (result === null) {
        return {
          initialized: false,
          result: null,
          warning:
            'The initializer is registered, but its function is not implemented.'
        };
      }

      return {
        initialized: true,
        result: clone_(result),
        warning: ''
      };
    } catch (error) {
      return {
        initialized: false,
        result: null,
        warning:
          'Backend initialization failed: ' +
          (error.message || String(error))
      };
    }
  }

  function createFailureResponse_(
    moduleId,
    status,
    error,
    startedAt
  ) {
    var durationMs = Date.now() - startedAt;

    setStatus_(moduleId, status, {
      durationMs: durationMs,
      error: error
    });

    return {
      ok: false,
      moduleId: moduleId,
      lifecycle: {
        status: status,
        durationMs: durationMs,
        completedAt: now_()
      },
      error: error
    };
  }

  function load(moduleId, context) {
    var id = normalizeId_(moduleId);
    var normalizedContext = normalizeContext_(context);
    var startedAt = Date.now();

    if (!id) {
      return createFailureResponse_(
        '',
        'failed',
        createError_(
          'MODULE_ID_REQUIRED',
          'A module ID is required.'
        ),
        startedAt
      );
    }

    setStatus_(id, 'loading', {
      startedAt: now_(),
      context: normalizedContext
    });

    try {
      var resolution = resolveModule_(id, normalizedContext);

      if (!resolution.module) {
        return createFailureResponse_(
          id,
          'failed',
          createError_(
            'MODULE_NOT_FOUND',
            'The requested module is not registered.'
          ),
          startedAt
        );
      }

      if (!resolution.authorized) {
        return createFailureResponse_(
          id,
          'unauthorized',
          createError_(
            'MODULE_ACCESS_DENIED',
            'Access to this module was denied.'
          ),
          startedAt
        );
      }

      var moduleDefinition = resolution.module;

      if (!isEnabled_(moduleDefinition)) {
        return createFailureResponse_(
          id,
          'disabled',
          createError_(
            'MODULE_DISABLED',
            String(moduleDefinition.name || id) + ' is disabled.'
          ),
          startedAt
        );
      }

      var rendered = renderUi_(
        moduleDefinition,
        normalizedContext
      );

      var service = initializeService_(
        id,
        normalizedContext
      );

      var warnings = [];

      if (rendered.warning) {
        warnings.push(rendered.warning);
      }

      if (service.warning) {
        warnings.push(service.warning);
      }

      var finalStatus = warnings.length > 0
        ? 'degraded'
        : 'ready';

      var durationMs = Date.now() - startedAt;

      setStatus_(id, finalStatus, {
        durationMs: durationMs,
        warnings: warnings,
        template: rendered.view.template || '',
        serviceInitialized: service.initialized
      });

      return {
        ok: true,
        module: moduleDefinition,
        lifecycle: {
          status: finalStatus,
          loadedAt: now_(),
          durationMs: durationMs
        },
        view: rendered.view,
        service: {
          initialized: service.initialized,
          result: service.result
        },
        warnings: warnings
      };
    } catch (error) {
      return createFailureResponse_(
        id,
        'failed',
        createError_(
          'MODULE_LOAD_FAILED',
          error.message || String(error)
        ),
        startedAt
      );
    }
  }

  function unload(moduleId) {
    var id = normalizeId_(moduleId);

    if (!id) {
      return {
        ok: false,
        error: createError_(
          'MODULE_ID_REQUIRED',
          'A module ID is required.'
        )
      };
    }

    setStatus_(id, 'unloaded', {
      unloadedAt: now_()
    });

    return {
      ok: true,
      moduleId: id,
      lifecycle: {
        status: 'unloaded',
        unloadedAt: now_()
      }
    };
  }

  function reload(moduleId, context) {
    unload(moduleId);
    return load(moduleId, context || {});
  }

  function getStatus(moduleId) {
    var id = normalizeId_(moduleId);

    if (statuses_[id]) {
      return clone_(statuses_[id]);
    }

    return {
      moduleId: id,
      status: 'registered',
      updatedAt: null,
      details: {}
    };
  }

  function getAllStatuses() {
    return clone_(statuses_);
  }

  function health() {
    var registryHealth = {
      ok: true,
      available: false
    };

    if (
      REOS.ModuleRegistry &&
      typeof REOS.ModuleRegistry.health === 'function'
    ) {
      registryHealth = REOS.ModuleRegistry.health();
      registryHealth.available = true;
    }

    var statusList = Object.keys(statuses_).map(function (key) {
      return clone_(statuses_[key]);
    });

    var counts = {
      registered: 0,
      loading: 0,
      ready: 0,
      degraded: 0,
      failed: 0,
      disabled: 0,
      unauthorized: 0,
      unloaded: 0
    };

    statusList.forEach(function (item) {
      if (counts[item.status] !== undefined) {
        counts[item.status] += 1;
      }
    });

    return {
      ok:
        registryHealth.ok !== false &&
        counts.failed === 0,
      version: VERSION,
      checkedAt: now_(),
      registry: registryHealth,
      loader: {
        trackedCount: statusList.length,
        counts: counts
      },
      statuses: statusList
    };
  }

  return {
    version: VERSION,
    load: load,
    unload: unload,
    reload: reload,
    getStatus: getStatus,
    getAllStatuses: getAllStatuses,
    health: health
  };
})();


/**
 * Apps Script RPC compatibility functions.
 */

function reosLoadModule(moduleId, context) {
  return REOS.ModuleLoader.load(moduleId, context || {});
}

function reosUnloadModule(moduleId) {
  return REOS.ModuleLoader.unload(moduleId);
}

function reosReloadModule(moduleId, context) {
  return REOS.ModuleLoader.reload(moduleId, context || {});
}

function reosGetModuleStatus(moduleId) {
  return REOS.ModuleLoader.getStatus(moduleId);
}

function reosGetAllModuleStatuses() {
  return REOS.ModuleLoader.getAllStatuses();
}

function reosGetModuleLoaderHealth() {
  return REOS.ModuleLoader.health();
}
