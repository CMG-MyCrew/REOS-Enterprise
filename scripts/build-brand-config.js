#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const inputPath = path.join(root, 'config', 'brand.json');
const outputPath = path.join(root, 'src', 'BrandConfig.generated.gs');

if (!fs.existsSync(inputPath)) {
  console.error(`Brand configuration not found: ${inputPath}`);
  process.exit(1);
}

let config;

try {
  config = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (error) {
  console.error(`Invalid brand.json: ${error.message}`);
  process.exit(1);
}

const requiredColors = [
  'primaryColor',
  'secondaryColor',
  'accentColor',
  'textColor',
  'backgroundColor'
];

const brand = config.brand || {};

for (const key of requiredColors) {
  if (!brand[key]) {
    console.error(`Missing brand.${key} in config/brand.json`);
    process.exit(1);
  }
}

const generated = `/**
 * AUTO-GENERATED FILE.
 * Source: config/brand.json
 * Run: node scripts/build-brand-config.js
 * Do not edit manually.
 */
var REOS = REOS || {};

REOS.BRAND_CONFIG = ${JSON.stringify(config, null, 2)};

REOS.Brand = (function () {
  function getConfig() {
    return JSON.parse(JSON.stringify(REOS.BRAND_CONFIG));
  }

  function getBrand() {
    return getConfig().brand || {};
  }

  function getContact() {
    return getConfig().contact || {};
  }

  function getLogos() {
    return getConfig().logos || {};
  }

  function getTemplates() {
    return getConfig().templates || {};
  }

  function getUiPayload() {
    var config = getConfig();
    var brand = config.brand || {};

    return {
      schemaVersion: config.schemaVersion || '1.0.0',
      brand: brand,
      contact: config.contact || {},
      logos: config.logos || {},
      templates: config.templates || {},
      cssVariables: {
        '--reos-primary': brand.primaryColor || '#0F3557',
        '--reos-secondary': brand.secondaryColor || '#5F6B73',
        '--reos-accent': brand.accentColor || '#F47C20',
        '--reos-text': brand.textColor || '#2B2B2B',
        '--reos-background': brand.backgroundColor || '#FFFFFF',
        '--reos-heading-font': brand.headingFont || 'Montserrat',
        '--reos-body-font': brand.bodyFont || 'Source Sans Pro'
      }
    };
  }

  return {
    getConfig: getConfig,
    getBrand: getBrand,
    getContact: getContact,
    getLogos: getLogos,
    getTemplates: getTemplates,
    getUiPayload: getUiPayload
  };
})();

function getReosBrandConfig() {
  return REOS.Brand.getUiPayload();
}
`;

fs.writeFileSync(outputPath, generated, 'utf8');

console.log(`Generated ${path.relative(root, outputPath)}`);
