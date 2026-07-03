#!/usr/bin/env node
import net from 'node:net';

const ports = [
  { name: 'Grafana', port: 3000 },
  { name: 'Prometheus', port: 9090 }
];

function checkPort({ name, port }) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`${name} Containerlab port ${port} is already in use. Stop the owner before deploying the upstream-shaped lab.`));
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

try {
  for (const port of ports) {
    await checkPort(port);
  }
} catch (error) {
  console.error(`[topoviewer] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
