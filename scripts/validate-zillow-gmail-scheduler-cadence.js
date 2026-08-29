#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();

const zillowPath = path.join(
  root,
  'build/apps-script-brand/ZillowGmailConnector.js'
);

const registryPath = path.join(
  root,
  'build/apps-script-brand/ConnectorRegistry.js'
);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function requireCondition(condition, message) {
  if (!condition) {
    console.error('FAIL: ' + message);
    process.exit(1);
  }
}

const zillow = read(zillowPath);
const registry = read(registryPath);

requireCondition(
  zillow.includes(".everyMinutes(15)"),
  'Zillow trigger must use everyMinutes(15).'
);

requireCondition(
  !zillow.includes(".everyMinutes(5)"),
  'Legacy everyMinutes(5) must not remain.'
);

requireCondition(
  zillow.includes("schedule: 'Every 15 minutes'"),
  'Zillow installer response must report Every 15 minutes.'
);

requireCondition(
  !zillow.includes("schedule: 'Every 5 minutes'"),
  'Legacy installer schedule text must not remain.'
);

requireCondition(
  registry.includes(
    "'zillow_gmail_leads','Zillow Gmail Multi-Folder Leads'," +
    "'GMAIL','Zillow Lead','reosConnectorHandleZillowGmail'," +
    "'false','Every 15 minutes',65"
  ),
  'Connector registry metadata must report Every 15 minutes.'
);

requireCondition(
  !registry.includes(
    "'zillow_gmail_leads','Zillow Gmail Multi-Folder Leads'," +
    "'GMAIL','Zillow Lead','reosConnectorHandleZillowGmail'," +
    "'false','Every 5 minutes',65"
  ),
  'Legacy Zillow registry cadence must not remain.'
);

requireCondition(
  zillow.includes(
    "ScriptApp.newTrigger('reosZillowGmailScheduledSync')"
  ),
  'Zillow scheduler handler contract changed unexpectedly.'
);

console.log(
  'PASS: Zillow Gmail scheduler cadence contract is 15 minutes.'
);
