/**
 * REOS Enterprise shared brand UI adapter.
 */
var REOS = REOS || {};

/**
 * Includes an HTML partial in an Apps Script template.
 *
 * @param {string} filename HTML filename without extension.
 * @return {string} HTML contents.
 */
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}

/**
 * Returns the browser-safe REOS branding payload.
 *
 * @return {Object} REOS brand configuration.
 */
function getReosBrandConfig() {
  var config =
    typeof getReosGeneratedBrandConfig === 'function'
      ? getReosGeneratedBrandConfig()
      : {};

  var brand = config.brand || {};

  return {
    schemaVersion: config.schemaVersion || '1.0.0',

    brand: brand,

    contact: config.contact || {},

    logos: config.logos || {},

    templates: config.templates || {},

    cssVariables: {
      '--reos-primary':
        brand.primaryColor || '#0F3557',

      '--reos-secondary':
        brand.secondaryColor || '#5F6B73',

      '--reos-accent':
        brand.accentColor || '#F47C20',

      '--reos-text':
        brand.textColor || '#2B2B2B',

      '--reos-background':
        brand.backgroundColor || '#FFFFFF',

      '--reos-heading-font':
        '"' +
        (brand.headingFont || 'Montserrat') +
        '", Arial, sans-serif',

      '--reos-body-font':
        '"' +
        (brand.bodyFont || 'Source Sans Pro') +
        '", Arial, sans-serif'
    }
  };
}
