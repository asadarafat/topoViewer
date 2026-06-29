import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const containerlabRoot = path.resolve(scriptDir, '..');
export const grafanaLabRoot = path.resolve(containerlabRoot, '..');
export const repoRoot = path.resolve(grafanaLabRoot, '../..');
export const artifactRoot = path.join(repoRoot, '.artifacts/grafana-containerlab');
export const envPath = path.join(containerlabRoot, '.env');
export const runtimeEnvPath = path.join(repoRoot, '.artifacts/grafana-containerlab.env');

export function parseEnvFile(filePath = envPath) {
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

export const fileEnv = parseEnvFile();
export const env = {
  ...fileEnv,
  ...Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key in fileEnv)
  )
};

export function envNumber(key, fallback) {
  const value = Number(env[key] || fallback);
  if (!Number.isFinite(value)) {
    throw new Error(`${key} must be a number, got "${env[key]}".`);
  }
  return value;
}

export function grafanaUrl() {
  return process.env.GRAFANA_URL || `http://127.0.0.1:${envNumber('GRAFANA_HTTP_PORT', 3001)}`;
}

export function prometheusUrl() {
  return process.env.PROMETHEUS_URL || `http://127.0.0.1:${envNumber('PROMETHEUS_HTTP_PORT', 9091)}`;
}

export function gnmicUrl() {
  return process.env.GNMIC_URL || `http://127.0.0.1:${envNumber('GNMIC_HTTP_PORT', 9804)}`;
}

export function normalizerUrl() {
  return process.env.NORMALIZER_URL || `http://127.0.0.1:${envNumber('NORMALIZER_HTTP_PORT', 9110)}`;
}

