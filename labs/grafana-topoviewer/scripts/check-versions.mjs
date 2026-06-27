#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(labRoot, '.env');

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

const fileEnv = parseEnvFile(envPath);
const env = {
  ...fileEnv,
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key in fileEnv)
  )
};
const version = env.GRAFANA_VERSION;
const image = env.GRAFANA_IMAGE;
const prometheusVersion = env.PROMETHEUS_VERSION;
const prometheusImage = env.PROMETHEUS_IMAGE;
const injectorImage = env.TELEMETRY_INJECTOR_IMAGE;

if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  throw new Error(`GRAFANA_VERSION must be pinned to an exact version, got "${version}".`);
}

if (image !== `grafana/grafana:${version}`) {
  throw new Error(`GRAFANA_IMAGE must be exactly grafana/grafana:${version}, got "${image}".`);
}

if (image.includes(':latest') || image === 'grafana/grafana') {
  throw new Error(`Floating Grafana images are not allowed in the Grafana lab: ${image}`);
}

if (!/^\d+\.\d+\.\d+$/.test(prometheusVersion || '')) {
  throw new Error(`PROMETHEUS_VERSION must be pinned to an exact version, got "${prometheusVersion}".`);
}

if (prometheusImage !== `prom/prometheus:v${prometheusVersion}`) {
  throw new Error(`PROMETHEUS_IMAGE must be exactly prom/prometheus:v${prometheusVersion}, got "${prometheusImage}".`);
}

if (prometheusImage.includes(':latest') || prometheusImage === 'prom/prometheus') {
  throw new Error(`Floating Prometheus images are not allowed in the Grafana lab: ${prometheusImage}`);
}

if (!/^node:24\.\d+\.\d+-[a-z0-9.-]+$/.test(injectorImage || '')) {
  throw new Error(`TELEMETRY_INJECTOR_IMAGE must be pinned to an exact Node 24 image tag, got "${injectorImage}".`);
}

if (injectorImage.includes(':latest') || injectorImage === 'node') {
  throw new Error(`Floating telemetry injector images are not allowed in the Grafana lab: ${injectorImage}`);
}

console.log(`Grafana lab versions are pinned: ${image}, ${prometheusImage}, ${injectorImage}`);
