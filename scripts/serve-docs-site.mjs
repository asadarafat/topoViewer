#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDocsStaticServer, pagesBasePath } from './lib/docs-static-server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');
const host = process.env.TOPOVIEWER_DOCS_HOST || '127.0.0.1';
const port = Number(process.env.TOPOVIEWER_DOCS_PORT || 8001);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(siteRoot)) {
  fail('Docs preview requires a built site/ directory. Run npm run docs:build:parallel first.');
}

const { server, baseUrl } = await createDocsStaticServer({ siteRoot, host, port, basePath: pagesBasePath });

console.log(`[topoviewer] MkDocs:          ${baseUrl}${pagesBasePath}/docs/mkdocs/`);
console.log(`[topoviewer] Zensical:        ${baseUrl}${pagesBasePath}/docs/zensical/`);
console.log(`[topoviewer] Studio:          ${baseUrl}${pagesBasePath}/studio/`);

function shutdown(signal) {
  server.close(() => {
    process.exit(signal === 'SIGINT' ? 130 : 143);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
