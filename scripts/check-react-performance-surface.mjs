#!/usr/bin/env node
import { gzipSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(repoRoot, 'scripts/react-performance-budgets.json');
const args = new Set(process.argv.slice(2));
const mode = args.has('--check') ? 'check' : 'report';

if (args.has('--self-test')) {
  runSelfTest();
  process.exit(0);
}

const budgets = readJson(budgetPath);
const report = {
  generatedAt: new Date().toISOString(),
  mode,
  surfaces: Object.fromEntries(
    Object.entries(budgets.surfaces).map(([name, config]) => [name, inspectSurface(name, config)])
  ),
  forbiddenImports: inspectForbiddenImports(budgets.forbiddenImports || [])
};

if (args.has('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printHumanReport(report);
}

if (mode === 'check') {
  const failures = [
    ...budgetFailures(report, budgets),
    ...report.forbiddenImports.violations.map((violation) => (
      `Forbidden import ${violation.importText} in ${violation.path}:${violation.line}`
    ))
  ];
  if (failures.length) {
    console.error('\nReact performance surface check failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join('/');
}

function resolveRepo(relativePath) {
  return path.join(repoRoot, relativePath);
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function htmlAssetRefs(html) {
  const refs = [];
  const patterns = [
    /<script\b[^>]*\bsrc=["']([^"']+\.js)["'][^>]*>/g,
    /<link\b[^>]*\bhref=["']([^"']+\.js)["'][^>]*>/g
  ];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      refs.push(match[1]);
    }
  }
  return refs;
}

function assetPathFromRef(assetRoot, ref) {
  const clean = ref.split('?')[0].split('#')[0];
  const assetIndex = clean.indexOf('/assets/');
  if (assetIndex !== -1) {
    return path.join(assetRoot, clean.slice(assetIndex + 1));
  }
  if (clean.startsWith('assets/')) {
    return path.join(assetRoot, clean);
  }
  return path.join(assetRoot, clean.replace(/^\/+/, ''));
}

function inspectFile(filePath, role) {
  const bytes = fs.readFileSync(filePath);
  return {
    path: relative(filePath),
    role,
    bytes: bytes.length,
    gzipBytes: gzipSync(bytes).length
  };
}

function inspectSurface(name, config) {
  const htmlPath = resolveRepo(config.html);
  const assetRoot = resolveRepo(config.assetRoot);
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`Missing ${name} HTML artifact: ${relative(htmlPath)}`);
  }
  if (!fs.existsSync(assetRoot)) {
    throw new Error(`Missing ${name} asset root: ${relative(assetRoot)}`);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const initialPaths = new Set(htmlAssetRefs(html).map((ref) => assetPathFromRef(assetRoot, ref)));
  const assetDir = path.join(assetRoot, 'assets');
  const jsFiles = fs.existsSync(assetDir)
    ? fs.readdirSync(assetDir)
      .filter((file) => file.endsWith('.js'))
      .map((file) => path.join(assetDir, file))
      .sort()
    : [];
  const chunks = jsFiles.map((filePath) => inspectFile(filePath, initialPaths.has(filePath) ? 'initial' : 'lazy'));
  const initialJsBytes = chunks.filter((chunk) => chunk.role === 'initial').reduce((sum, chunk) => sum + chunk.bytes, 0);
  const lazyJsBytes = chunks.filter((chunk) => chunk.role === 'lazy').reduce((sum, chunk) => sum + chunk.bytes, 0);
  return {
    html: relative(htmlPath),
    initialJsBytes,
    lazyJsBytes,
    largestInitialChunk: largest(chunks.filter((chunk) => chunk.role === 'initial')),
    largestLazyChunk: largest(chunks.filter((chunk) => chunk.role === 'lazy')),
    chunks
  };
}

function largest(chunks) {
  return chunks.slice().sort((left, right) => right.bytes - left.bytes)[0] || null;
}

function printHumanReport(report) {
  console.log('# React performance surface report');
  for (const [name, surface] of Object.entries(report.surfaces)) {
    console.log(`\n## ${name}`);
    console.log(`HTML: ${surface.html}`);
    console.log(`Initial JS: ${formatBytes(surface.initialJsBytes)}`);
    console.log(`Lazy JS: ${formatBytes(surface.lazyJsBytes)}`);
    if (surface.largestInitialChunk) {
      console.log(`Largest initial: ${surface.largestInitialChunk.path} (${formatBytes(surface.largestInitialChunk.bytes)}, gzip ${formatBytes(surface.largestInitialChunk.gzipBytes)})`);
    }
    if (surface.largestLazyChunk) {
      console.log(`Largest lazy: ${surface.largestLazyChunk.path} (${formatBytes(surface.largestLazyChunk.bytes)}, gzip ${formatBytes(surface.largestLazyChunk.gzipBytes)})`);
    }
  }
  if (report.forbiddenImports.violations.length) {
    console.log('\n## Forbidden imports');
    for (const violation of report.forbiddenImports.violations) {
      console.log(`- ${violation.path}:${violation.line} ${violation.importText}`);
    }
  } else {
    console.log('\n## Forbidden imports\nNone.');
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function budgetFailures(report, budgetsConfig) {
  const tolerance = budgetsConfig.toleranceBytes || 0;
  const failures = [];
  for (const [name, config] of Object.entries(budgetsConfig.surfaces)) {
    const surface = report.surfaces[name];
    if (!surface) {
      failures.push(`Missing report for ${name}`);
      continue;
    }
    const initialBudget = config.maxInitialJsBytes + tolerance;
    if (surface.initialJsBytes > initialBudget) {
      failures.push(`${name} initial JS ${surface.initialJsBytes} exceeds ${config.maxInitialJsBytes} + tolerance ${tolerance}`);
    }
    const lazyBudget = config.maxLazyJsBytes + tolerance;
    if (surface.lazyJsBytes > lazyBudget) {
      failures.push(`${name} lazy JS ${surface.lazyJsBytes} exceeds ${config.maxLazyJsBytes} + tolerance ${tolerance}`);
    }
  }
  return failures;
}

function* walkFiles(start) {
  if (!fs.existsSync(start)) return;
  const stat = fs.statSync(start);
  if (stat.isFile()) {
    yield start;
    return;
  }
  for (const entry of fs.readdirSync(start, { withFileTypes: true })) {
    const child = path.join(start, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(child);
    } else if (entry.isFile()) {
      yield child;
    }
  }
}

function inspectForbiddenImports(rules) {
  const violations = [];
  for (const rule of rules) {
    const source = rule.source;
    const importPattern = new RegExp(`from\\s+['"]${escapeRegExp(source)}['"]`);
    for (const configuredPath of rule.paths || []) {
      for (const filePath of walkFiles(resolveRepo(configuredPath))) {
        if (!/\.[cm]?[jt]sx?$/.test(filePath)) continue;
        const rel = relative(filePath);
        const lines = fs.readFileSync(filePath, 'utf8').split('\n');
        lines.forEach((lineText, index) => {
          if (importPattern.test(lineText)) {
            violations.push({
              path: rel,
              line: index + 1,
              importText: lineText.trim()
            });
          }
        });
      }
    }
  }
  return { violations };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function runSelfTest() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'topoviewer-react-perf-'));
  try {
    const assetRoot = path.join(tmp, 'site');
    fs.mkdirSync(path.join(assetRoot, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(assetRoot, 'index.html'), '<script type="module" src="/topoviewer/harness/assets/index.js"></script>');
    fs.writeFileSync(path.join(assetRoot, 'assets/index.js'), 'console.log("entry");');
    fs.writeFileSync(path.join(assetRoot, 'assets/editor.js'), 'console.log("lazy");');
    const surface = inspectSurface('self-test', {
      html: toPosix(path.relative(repoRoot, path.join(assetRoot, 'index.html'))),
      assetRoot: toPosix(path.relative(repoRoot, assetRoot))
    });
    if (surface.chunks.length !== 2) throw new Error(`Expected two chunks, got ${surface.chunks.length}`);
    if (surface.largestInitialChunk?.path !== toPosix(path.relative(repoRoot, path.join(assetRoot, 'assets/index.js')))) {
      throw new Error('Initial chunk classification failed.');
    }
    if (surface.largestLazyChunk?.path !== toPosix(path.relative(repoRoot, path.join(assetRoot, 'assets/editor.js')))) {
      throw new Error('Lazy chunk classification failed.');
    }
    const failures = budgetFailures({
      surfaces: {
        'self-test': {
          initialJsBytes: 10,
          lazyJsBytes: 9
        }
      }
    }, {
      toleranceBytes: 0,
      surfaces: {
        'self-test': {
          maxInitialJsBytes: 1,
          maxLazyJsBytes: 1
        }
      }
    });
    if (!failures.some((failure) => failure.includes('self-test initial JS 10 exceeds 1'))) {
      throw new Error('Initial budget failure message is not actionable.');
    }
    if (!failures.some((failure) => failure.includes('self-test lazy JS 9 exceeds 1'))) {
      throw new Error('Lazy budget failure message is not actionable.');
    }
    console.log('React performance surface self-test passed.');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
