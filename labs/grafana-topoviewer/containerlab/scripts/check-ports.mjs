#!/usr/bin/env node
import net from 'node:net';
import { envNumber } from './env.mjs';

const ports = [
  { name: 'Grafana', envKey: 'GRAFANA_HTTP_PORT', defaultPort: 3001 },
  { name: 'Prometheus', envKey: 'PROMETHEUS_HTTP_PORT', defaultPort: 9091 },
  { name: 'gNMIc Prometheus exporter', envKey: 'GNMIC_HTTP_PORT', defaultPort: 9804 },
  { name: 'TopoViewer normalizer', envKey: 'NORMALIZER_HTTP_PORT', defaultPort: 9110 }
];

function checkPort({ name, envKey, defaultPort }) {
  const port = envNumber(envKey, defaultPort);
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`${name} Containerlab port ${port} is already in use. Stop the owner or run with ${envKey}=<free-port>.`));
        return;
      }
      reject(error);
    });
    server.once('listening', () => {
      server.close(() => {
        console.log(`${name} Containerlab port is available: ${port}`);
        resolve();
      });
    });
    server.listen(port, '0.0.0.0');
  });
}

for (const port of ports) {
  await checkPort(port);
}

