#!/usr/bin/env node
import fs from 'node:fs';
import http from 'node:http';

const port = Number(process.env.PORT || process.env.NORMALIZER_PORT || 9110);
const gnmicMetricsUrl = process.env.GNMIC_METRICS_URL || 'http://gnmic:9804/metrics';
const inventoryPath = process.env.TOPOVIEWER_LINK_INVENTORY || '/inventory/clab-clos-links.json';
const counterHoldMs = Number(process.env.TOPOVIEWER_COUNTER_HOLD_MS || 30_000);
const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));

let scenario = 'live';
let previousCounters = new Map();
let lastGnmicFetch = {
  ok: false,
  at: 0,
  error: '',
  metricCount: 0
};

function escapeLabel(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function line(name, labels, value) {
  const labelText = Object.entries(labels)
    .filter(([, labelValue]) => labelValue !== undefined && labelValue !== null && labelValue !== '')
    .map(([key, labelValue]) => `${key}="${escapeLabel(labelValue)}"`)
    .join(',');
  return `${name}{${labelText}} ${Number.isFinite(Number(value)) ? Number(value) : 0}`;
}

function parsePrometheusText(text) {
  return text
    .split(/\r?\n/)
    .filter((row) => row && !row.startsWith('#'))
    .flatMap((row) => {
      const match = row.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?)$/i);
      if (!match) return [];
      const labels = {};
      const labelText = match[2] || '';
      for (const labelMatch of labelText.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)="((?:\\"|[^"])*)"/g)) {
        labels[labelMatch[1]] = labelMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
      return [{
        name: match[1],
        labels,
        value: Number(match[3])
      }];
    });
}

async function fetchGnmicMetrics() {
  try {
    const response = await fetch(gnmicMetricsUrl, { signal: AbortSignal.timeout(3500) });
    const text = await response.text();
    if (!response.ok) throw new Error(`gNMIc returned HTTP ${response.status}`);
    const samples = parsePrometheusText(text);
    lastGnmicFetch = {
      ok: true,
      at: Date.now(),
      error: '',
      metricCount: samples.length
    };
    return samples;
  } catch (error) {
    lastGnmicFetch = {
      ok: false,
      at: Date.now(),
      error: error instanceof Error ? error.message : String(error),
      metricCount: 0
    };
    return [];
  }
}

function targetMatches(labels, nodeId) {
  const candidates = [
    labels.target,
    labels.target_name,
    labels.source,
    labels.node,
    labels.node_id,
    labels.instance
  ].filter(Boolean).map(String);
  return candidates.some((candidate) => candidate === nodeId || candidate.includes(nodeId));
}

function interfaceMatches(labels, interfaceName) {
  const candidates = [
    labels.interface,
    labels.interface_name,
    labels.name,
    labels.if_name,
    labels.path
  ].filter(Boolean).map(String);
  return candidates.some((candidate) => candidate === interfaceName || candidate.includes(interfaceName));
}

function sampleLooksLikeOperState(sample) {
  return /oper.*state|admin.*state|interface.*state/i.test(sample.name);
}

function sampleLooksLikeCounter(sample) {
  return /octets|bytes|in_.*packets|out_.*packets/i.test(sample.name);
}

function sampleLooksLikeError(sample) {
  return /error|discard|drop/i.test(sample.name);
}

function interfaceOperUp(samples, nodeId, interfaceName) {
  const matches = samples.filter((sample) => (
    sampleLooksLikeOperState(sample) &&
    targetMatches(sample.labels, nodeId) &&
    interfaceMatches(sample.labels, interfaceName)
  ));
  if (!matches.length) return undefined;
  return matches.some((sample) => Number(sample.value) > 0) ? 1 : 0;
}

function interfaceCounter(samples, nodeId, interfaceName) {
  const matches = samples.filter((sample) => (
    sampleLooksLikeCounter(sample) &&
    !sampleLooksLikeError(sample) &&
    targetMatches(sample.labels, nodeId) &&
    interfaceMatches(sample.labels, interfaceName)
  ));
  return matches.reduce((sum, sample) => sum + Math.max(0, Number(sample.value) || 0), 0);
}

function interfaceErrors(samples, nodeId, interfaceName) {
  const matches = samples.filter((sample) => (
    sampleLooksLikeError(sample) &&
    targetMatches(sample.labels, nodeId) &&
    interfaceMatches(sample.labels, interfaceName)
  ));
  return matches.reduce((sum, sample) => sum + Math.max(0, Number(sample.value) || 0), 0);
}

function utilizationForCounter(link, counter) {
  const now = Date.now();
  const previous = previousCounters.get(link.id);
  if (!previous || counter < previous.counter) {
    previousCounters.set(link.id, {
      counter,
      observedAt: now,
      utilization: undefined
    });
    return undefined;
  }

  if (counter === previous.counter) {
    if (previous.utilization !== undefined && now - previous.observedAt <= counterHoldMs) {
      return previous.utilization;
    }
    previousCounters.set(link.id, {
      counter,
      observedAt: previous.observedAt,
      utilization: undefined
    });
    return undefined;
  }

  const elapsedSeconds = Math.max(1, (now - previous.observedAt) / 1000);
  const bps = ((counter - previous.counter) * 8) / elapsedSeconds;
  const utilization = Math.max(0, Math.min(100, (bps / Number(link.capacityBps || 1_000_000_000)) * 100));
  previousCounters.set(link.id, {
    counter,
    observedAt: now,
    utilization
  });
  return utilization;
}

function scenarioValue(defaultValue, overrides) {
  return Object.prototype.hasOwnProperty.call(overrides, scenario) ? overrides[scenario] : defaultValue;
}

function fallbackUtilization(link, index) {
  if (scenario === 'high-utilization') return index % 2 === 0 ? 92 : 76;
  if (scenario === 'link-failure') return link.id === 'spine1-leaf1' ? 0 : 22 + (index * 4);
  return 12 + (index * 5);
}

function topologyMetrics(samples) {
  const rows = [
    '# HELP topoviewer_clab_link_up Mapper-friendly link state derived from Containerlab/gNMIc telemetry.',
    '# TYPE topoviewer_clab_link_up gauge',
    '# HELP topoviewer_clab_link_utilization_percent Mapper-friendly link utilization derived from interface counters or lab scenario fallback.',
    '# TYPE topoviewer_clab_link_utilization_percent gauge',
    '# HELP topoviewer_clab_link_errors_total Mapper-friendly link error count derived from interface telemetry.',
    '# TYPE topoviewer_clab_link_errors_total counter',
    '# HELP topoviewer_clab_node_health Mapper-friendly node health status derived from gNMIc target health.',
    '# TYPE topoviewer_clab_node_health gauge',
    '# HELP topoviewer_clab_adjacency_up Mapper-friendly adjacency status for the compact CLOS fabric.',
    '# TYPE topoviewer_clab_adjacency_up gauge'
  ];
  const nodeHealth = new Map();
  for (const node of inventory.nodes || []) {
    const targetSample = samples.find((sample) => targetMatches(sample.labels, node.id));
    const health = scenarioValue(targetSample ? 1 : (samples.length ? 0 : 1), {
      'node-degraded': node.id === 'leaf2' ? 0 : 1
    });
    nodeHealth.set(node.id, health);
    rows.push(line('topoviewer_clab_node_health', {
      topology: inventory.topology,
      node_id: node.id,
      role: node.role
    }, health));
  }

  inventory.links.forEach((link, index) => {
    const sourceUp = interfaceOperUp(samples, link.source, link.sourceInterface);
    const targetUp = interfaceOperUp(samples, link.target, link.targetInterface);
    const liveUp = sourceUp === 0 || targetUp === 0 ? 0 : 1;
    const up = scenarioValue(liveUp, {
      'link-failure': link.id === 'spine1-leaf1' ? 0 : 1
    });
    const counter = interfaceCounter(samples, link.source, link.sourceInterface) +
      interfaceCounter(samples, link.target, link.targetInterface);
    const liveUtilization = counter > 0 ? utilizationForCounter(link, counter) : undefined;
    const utilization = scenarioValue(liveUtilization ?? fallbackUtilization(link, index), {
      healthy: 10 + index,
      'high-utilization': link.id === 'spine2-leaf2' ? 96 : 64,
      'link-failure': link.id === 'spine1-leaf1' ? 0 : 28
    });
    const errors = interfaceErrors(samples, link.source, link.sourceInterface) +
      interfaceErrors(samples, link.target, link.targetInterface) +
      scenarioValue(0, { 'link-failure': link.id === 'spine1-leaf1' ? 5 : 0 });
    const commonLabels = {
      topology: inventory.topology,
      link_id: link.id,
      source: link.source,
      target: link.target,
      source_interface: link.sourceInterface,
      target_interface: link.targetInterface,
      protocol: 'fabric'
    };
    rows.push(line('topoviewer_clab_link_up', commonLabels, up));
    rows.push(line('topoviewer_clab_link_utilization_percent', commonLabels, utilization));
    rows.push(line('topoviewer_clab_link_errors_total', commonLabels, errors));
    rows.push(line('topoviewer_clab_adjacency_up', commonLabels, up && nodeHealth.get(link.source) && nodeHealth.get(link.target) ? 1 : 0));
    if (link.directional === true) {
      rows.push(line('topoviewer_clab_link_direction_utilization_percent', {
        ...commonLabels,
        direction: 'sourceToTarget',
        interface: link.sourceInterface
      }, utilization));
      rows.push(line('topoviewer_clab_link_direction_utilization_percent', {
        ...commonLabels,
        direction: 'targetToSource',
        interface: link.targetInterface
      }, Math.max(0, utilization - 8)));
    }
  });
  rows.push(line('topoviewer_clab_gnmic_up', {
    topology: inventory.topology,
    source: 'gnmic'
  }, lastGnmicFetch.ok ? 1 : 0));
  rows.push(line('topoviewer_clab_gnmic_metric_count', {
    topology: inventory.topology,
    source: 'gnmic'
  }, lastGnmicFetch.metricCount));
  return `${rows.join('\n')}\n`;
}

async function metrics() {
  const samples = await fetchGnmicMetrics();
  return topologyMetrics(samples);
}

function jsonResponse(response, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    if (url.pathname === '/health') {
      jsonResponse(response, 200, {
        status: 'ok',
        scenario,
        inventory: {
          topology: inventory.topology,
          links: inventory.links.length,
          nodes: inventory.nodes.length
        },
        gnmic: lastGnmicFetch
      });
      return;
    }
    if (url.pathname.startsWith('/scenario/')) {
      scenario = decodeURIComponent(url.pathname.slice('/scenario/'.length)) || 'live';
      jsonResponse(response, 200, { status: 'ok', scenario });
      return;
    }
    if (url.pathname === '/metrics') {
      const body = await metrics();
      response.writeHead(200, {
        'content-type': 'text/plain; version=0.0.4; charset=utf-8',
        'content-length': Buffer.byteLength(body)
      });
      response.end(body);
      return;
    }
    jsonResponse(response, 404, { status: 'not-found', path: url.pathname });
  } catch (error) {
    jsonResponse(response, 500, {
      status: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`TopoViewer Containerlab normalizer listening on :${port}`);
});
