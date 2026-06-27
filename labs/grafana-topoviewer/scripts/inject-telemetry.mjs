#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const labRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(labRoot, '../..');
const env = parseEnvFile(path.join(labRoot, '.env'));
const runtimeEnv = parseOptionalEnvFile(path.join(repoRoot, '.artifacts/grafana-topoviewer-lab.env'));
const scenario = process.argv[2] || 'healthy';
const injectorPort = process.env.TELEMETRY_INJECTOR_HTTP_PORT ||
  runtimeEnv.TELEMETRY_INJECTOR_HTTP_PORT ||
  publishedInjectorPortFromDocker() ||
  env.TELEMETRY_INJECTOR_HTTP_PORT ||
  '9108';
const injectorBaseUrl = process.env.TELEMETRY_INJECTOR_URL || `http://127.0.0.1:${injectorPort}`;

function parseEnvFile(filePath) {
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        return [line.slice(0, separator), line.slice(separator + 1)];
      })
  );
}

function parseOptionalEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return parseEnvFile(filePath);
}

function publishedInjectorPortFromDocker() {
  try {
    const output = execFileSync('docker', ['port', 'topoviewer-telemetry-injector-phase2', '9108/tcp'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    const firstBinding = output.split(/\r?\n/)[0] || '';
    const match = firstBinding.match(/:(\d+)$/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

try {
  const response = await fetch(`${injectorBaseUrl}/scenario/${scenario}`, { method: 'POST' });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`Unable to set telemetry scenario "${scenario}": ${JSON.stringify(payload)}`);
  }

  console.log(`TopoViewer telemetry scenario set to "${payload.scenario}" (${payload.samples} samples) at ${injectorBaseUrl}.`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Unable to reach TopoViewer telemetry injector at ${injectorBaseUrl}: ${message}\n` +
    'Start the lab with npm run grafana:lab:up, or pass TELEMETRY_INJECTOR_HTTP_PORT / TELEMETRY_INJECTOR_URL if you started it manually.'
  );
}
