#!/usr/bin/env node
import net from 'node:net';

const [, , label = 'server', host = '127.0.0.1', rawPort] = process.argv;
const port = Number(rawPort);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`[topoviewer] Invalid ${label} port: ${rawPort}`);
  process.exit(2);
}

const socket = net.createConnection({ host, port });
socket.setTimeout(750);

socket.once('connect', () => {
  socket.destroy();
  console.error(`[topoviewer] Cannot start ${label}: ${host}:${port} is already in use.`);
  console.error('[topoviewer] Stop the process using that port, then run the command again.');
  process.exit(1);
});

socket.once('error', (error) => {
  socket.destroy();
  if (error.code === 'ECONNREFUSED') {
    process.exit(0);
  }
  console.error(`[topoviewer] Could not check ${label} port ${host}:${port}: ${error.message}`);
  process.exit(2);
});

socket.once('timeout', () => {
  socket.destroy();
  console.error(`[topoviewer] Timed out while checking ${label} port ${host}:${port}.`);
  process.exit(2);
});
