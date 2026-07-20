import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const repoRoot = path.resolve(import.meta.dirname, '../..');
export const screenshotManifestPath = 'docs/assets/readme/manifest.json';
export const screenshotGenerator = 'scripts/capture-readme-screenshots.mjs';
export const screenshotManifestSchemaVersion = 2;
export const grafanaCaptureImage = 'grafana/grafana:13.1.0';
export const canonicalBundle = {
  id: 'st-clos',
  name: 'ST CLOS telemetry fabric',
  files: [
    {
      kind: 'topology',
      path: 'labs/grafana-topoviewer/topoviewer-bundles/st-clos/st-clos.topo.tv.yaml'
    },
    {
      kind: 'stylesheet',
      path: 'labs/grafana-topoviewer/topoviewer-bundles/st-clos/st-clos.style.tv.yaml'
    },
    {
      kind: 'mapper',
      path: 'labs/grafana-topoviewer/topoviewer-bundles/st-clos/st-clos.mapper.tv.yaml'
    }
  ]
};

export const documentationScreenshots = [
  {
    file: 'studio-visual.png',
    minHeight: 800,
    minWidth: 1400,
    path: 'docs/assets/readme/studio-visual.png',
    surface: 'studio'
  },
  {
    file: 'mkdocs.png',
    minHeight: 800,
    minWidth: 1400,
    path: 'docs/assets/readme/mkdocs.png',
    surface: 'mkdocs'
  },
  {
    file: 'zensical.png',
    minHeight: 800,
    minWidth: 1400,
    path: 'docs/assets/readme/zensical.png',
    surface: 'zensical'
  },
  {
    file: 'grafana-panel.png',
    minHeight: 800,
    minWidth: 1400,
    path: 'docs/assets/readme/grafana-panel.png',
    surface: 'grafana'
  },
  {
    file: 'topoviewer-yaml-to-diagram.png',
    minHeight: 800,
    minWidth: 1400,
    path: 'docs/assets/topoviewer-yaml-to-diagram.png',
    surface: 'studio-code'
  },
  {
    file: 'topoviewer-yaml-to-graph-collage.png',
    minHeight: 1400,
    minWidth: 2000,
    path: 'docs/assets/topoviewer-yaml-to-graph-collage.png',
    surface: 'collage'
  }
];

const rasterExtensions = new Set(['.gif', '.jpeg', '.jpg', '.png', '.webp']);
const ignoredDirectories = new Set(['.git', '.artifacts', 'node_modules', 'site']);

export function absoluteRepoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

export function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function pngDimensions(bytes) {
  const signature = '89504e470d0a1a0a';
  if (bytes.subarray(0, 8).toString('hex') !== signature
    || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a PNG with an IHDR header');
  }
  return { height: bytes.readUInt32BE(20), width: bytes.readUInt32BE(16) };
}

export function releaseVersion() {
  return JSON.parse(fs.readFileSync(absoluteRepoPath('packages/topoviewer/package.json'), 'utf8')).version;
}

export function canonicalBundleSources() {
  return Object.fromEntries(canonicalBundle.files.map((entry) => [
    entry.kind,
    {
      ...entry,
      text: fs.readFileSync(absoluteRepoPath(entry.path), 'utf8')
    }
  ]));
}

function walkFiles(relativeRoot) {
  const absoluteRoot = absoluteRepoPath(relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const stat = fs.statSync(absoluteRoot);
  if (stat.isFile()) return [relativeRoot.split(path.sep).join(path.posix.sep)];

  const files = [];
  for (const entry of fs.readdirSync(absoluteRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && (entry.name.startsWith('.') || ignoredDirectories.has(entry.name))) continue;
    const relativePath = path.join(relativeRoot, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(relativePath));
    else if (entry.isFile()) files.push(relativePath.split(path.sep).join(path.posix.sep));
  }
  return files;
}

export function documentationRasterAssets() {
  return walkFiles('docs')
    .filter((filePath) => rasterExtensions.has(path.extname(filePath).toLowerCase()))
    .sort();
}

export function documentationRasterReferences() {
  const markdownFiles = ['README.md', ...walkFiles('docs').filter((filePath) => filePath.endsWith('.md'))];
  const references = [];
  const markdownImage = /!\[[^\]]*\]\(([^)\s]+)(?:\s+[^)]*)?\)/g;

  for (const markdownPath of markdownFiles) {
    const source = fs.readFileSync(absoluteRepoPath(markdownPath), 'utf8');
    for (const match of source.matchAll(markdownImage)) {
      const rawTarget = match[1].replace(/^<|>$/g, '');
      if (/^(?:data:|https?:)/i.test(rawTarget)) continue;
      const withoutFragment = rawTarget.split('#', 1)[0].split('?', 1)[0];
      if (!rasterExtensions.has(path.extname(withoutFragment).toLowerCase())) continue;
      const resolved = path.resolve(path.dirname(absoluteRepoPath(markdownPath)), decodeURI(withoutFragment));
      references.push({
        document: markdownPath,
        path: path.relative(repoRoot, resolved).split(path.sep).join(path.posix.sep)
      });
    }
  }

  return references;
}
