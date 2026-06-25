#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const siteRoot = path.join(repoRoot, 'site');

function redirectHtml(target) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=${target}">
    <link rel="canonical" href="${target}">
    <title>TopoViewer</title>
  </head>
  <body>
    <p><a href="${target}">Open TopoViewer documentation</a></p>
  </body>
</html>
`;
}

function writeRedirect(relativePath, target) {
  const filePath = path.join(siteRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, redirectHtml(target));
}

writeRedirect('index.html', 'docs/mkdocs/');
writeRedirect('docs/index.html', 'mkdocs/');

console.log('Pages redirects written: site/index.html, site/docs/index.html');
