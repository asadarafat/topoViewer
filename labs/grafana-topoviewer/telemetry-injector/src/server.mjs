import http from 'node:http';
import { applyMetricOverride, buildScenario, scenarioNames } from './scenarios.mjs';
import { renderPrometheusMetrics } from './metrics.mjs';

const port = Number(process.env.TELEMETRY_INJECTOR_PORT || 9108);
let activeScenario = process.env.TOPOVIEWER_TELEMETRY_SCENARIO || 'healthy';
let overrides = [];

function json(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function notFound(res) {
  json(res, 404, {
    error: 'not-found',
    scenarios: scenarioNames
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('error', reject);
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
  });
}

function currentEntries() {
  return overrides.reduce((entries, override) => applyMetricOverride(entries, override), buildScenario(activeScenario));
}

function setScenario(name) {
  if (!scenarioNames.includes(name)) {
    throw new Error(`Unknown telemetry scenario "${name}". Expected one of: ${scenarioNames.join(', ')}.`);
  }
  activeScenario = name;
  overrides = [];
  return {
    scenario: activeScenario,
    samples: currentEntries().length
  };
}

async function handleRequest(req, res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    json(res, 200, {
      status: 'ok',
      scenario: activeScenario,
      samples: currentEntries().length
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/metrics') {
    res.writeHead(200, {
      'content-type': 'text/plain; version=0.0.4; charset=utf-8',
      'cache-control': 'no-store'
    });
    res.end(renderPrometheusMetrics(currentEntries()));
    return;
  }
  if (req.method === 'GET' && url.pathname === '/scenario') {
    json(res, 200, {
      scenario: activeScenario,
      scenarios: scenarioNames,
      samples: currentEntries()
    });
    return;
  }
  if ((req.method === 'GET' || req.method === 'POST') && url.pathname.startsWith('/scenario/')) {
    try {
      json(res, 200, setScenario(url.pathname.slice('/scenario/'.length)));
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  if (req.method === 'POST' && url.pathname === '/metric') {
    try {
      const payload = await readJson(req);
      overrides.push(payload);
      json(res, 200, {
        scenario: activeScenario,
        overrides: overrides.length,
        samples: currentEntries().length
      });
    } catch (error) {
      json(res, 400, { error: error instanceof Error ? error.message : String(error) });
    }
    return;
  }
  notFound(res);
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    json(res, 500, { error: error instanceof Error ? error.message : String(error) });
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`TopoViewer telemetry injector listening on ${port} (${activeScenario})`);
});
