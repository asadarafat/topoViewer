#!/usr/bin/env node
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = parseEnvFile(path.join(labRoot, '.env'));

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

const ports = [
  { name: 'Grafana', envKey: 'GRAFANA_HTTP_PORT', defaultPort: 3000 },
  { name: 'Prometheus', envKey: 'PROMETHEUS_HTTP_PORT', defaultPort: 9090 },
  { name: 'Telemetry injector', envKey: 'TELEMETRY_INJECTOR_HTTP_PORT', defaultPort: 9108 }
];

function checkPort({ name, envKey, defaultPort }) {
  const port = Number(process.env[envKey] || env[envKey] || defaultPort);
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`${name} lab port ${port} is already in use. Stop the process using that port or run with ${envKey}=<free-port>.`));
        return;
      }
      reject(error);
    });
    server.once('listening', () => {
      server.close(() => {
        console.log(`${name} localhost lab port is available: ${port}`);
        resolve();
      });
    });
    server.listen(port, '127.0.0.1');
  });
}

try {
  for (const portConfig of ports) {
    await checkPort(portConfig);
  }
} catch (error) {
  console.error(`[topoviewer] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
