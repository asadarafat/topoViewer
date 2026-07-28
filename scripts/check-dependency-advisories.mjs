#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const acceptedTemporaryDevRisks = new Map([
  [
    '@grafana/data',
    {
      reason: 'Grafana plugin SDK package. Current npm audit proposes a breaking package path; keep pinned until Grafana-compatible remediation is validated.',
      nodes: ['node_modules/@grafana/data']
    }
  ],
  [
    '@grafana/runtime',
    {
      reason: 'Grafana plugin SDK package. Current npm audit proposes a breaking package path; keep pinned until Grafana-compatible remediation is validated.',
      nodes: ['node_modules/@grafana/runtime']
    }
  ],
  [
    '@grafana/ui',
    {
      reason: 'Transitive Grafana UI package used by the plugin SDK runtime surface.',
      nodes: ['node_modules/@grafana/ui']
    }
  ],
  [
    'dompurify',
    {
      reason: 'Nested under @grafana/data. The direct TopoViewer package copy is upgraded and production audit is clean.',
      nodes: ['node_modules/@grafana/data/node_modules/dompurify']
    }
  ],
  [
    'js-cookie',
    {
      reason: 'Transitive through Grafana packages via react-use.',
      nodes: ['node_modules/js-cookie']
    }
  ],
  [
    'react-use',
    {
      reason: 'Transitive through Grafana packages.',
      nodes: ['node_modules/react-use']
    }
  ],
  [
    'react-router',
    {
      reason: 'Nested React Router 6 compatibility runtime from @grafana/ui. No patched React Router 6 release exists; npm proposes an incompatible Grafana SDK downgrade.',
      nodes: ['node_modules/react-router-dom-v5-compat/node_modules/react-router']
    }
  ],
  [
    'react-router-dom-v5-compat',
    {
      reason: 'Transitive compatibility package from @grafana/ui. Remediation is owned by the Grafana SDK dependency line.',
      nodes: ['node_modules/react-router-dom-v5-compat']
    }
  ]
]);

function runAudit(args) {
  return spawnSync('npm', ['audit', ...args, '--json'], {
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
}

function parseAuditJson(result, label) {
  const raw = `${result.stdout || ''}`.trim();
  if (!raw) {
    throw new Error(`${label} did not produce JSON output.`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`${label} produced invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function vulnerabilityCount(audit) {
  return audit.metadata?.vulnerabilities?.total ?? Object.keys(audit.vulnerabilities || {}).length;
}

const productionAudit = runAudit(['--omit=dev', '--audit-level=moderate']);
const productionAuditJson = parseAuditJson(productionAudit, 'production npm audit');
if (productionAudit.status !== 0 || vulnerabilityCount(productionAuditJson) > 0) {
  console.error('Production npm dependency audit failed. Shipped runtime dependencies must be fixed before public readiness.');
  console.error(productionAudit.stdout || productionAudit.stderr);
  process.exit(productionAudit.status || 1);
}

const fullAudit = runAudit(['--audit-level=moderate']);
const fullAuditJson = parseAuditJson(fullAudit, 'full npm audit');
const vulnerabilities = fullAuditJson.vulnerabilities || {};
const unaccepted = [];

for (const [name, vulnerability] of Object.entries(vulnerabilities)) {
  const accepted = acceptedTemporaryDevRisks.get(name);
  if (!accepted) {
    unaccepted.push(`${name}: not listed in accepted temporary dev/tooling risks`);
    continue;
  }

  const nodes = vulnerability.nodes || [];
  const unexpectedNodes = nodes.filter((node) => !accepted.nodes.includes(node));
  if (unexpectedNodes.length) {
    unaccepted.push(`${name}: unexpected vulnerable install path(s): ${unexpectedNodes.join(', ')}`);
  }
}

for (const acceptedName of acceptedTemporaryDevRisks.keys()) {
  if (!vulnerabilities[acceptedName]) {
    continue;
  }
  const accepted = acceptedTemporaryDevRisks.get(acceptedName);
  console.log(`accepted temporary npm audit risk: ${acceptedName} - ${accepted.reason}`);
}

if (unaccepted.length) {
  console.error('Full npm audit found untriaged advisories:');
  for (const item of unaccepted) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

const count = vulnerabilityCount(fullAuditJson);
if (count > 0) {
  console.log(`full npm audit has ${count} documented temporary dev/tooling advisory path(s); production audit is clean.`);
} else {
  console.log('full npm audit passed with no advisories.');
}
