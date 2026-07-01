import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDocsRoot = path.join(repoRoot, 'docs');
const sourceTopoviewerRoot = path.join(sourceDocsRoot, 'topoviewer');
const sourceAssetsRoot = path.join(repoRoot, 'docs', 'assets');
const sourceExamplesRoot = path.join(sourceTopoviewerRoot, 'examples');
const zensicalDocsRoot = path.join(repoRoot, '.artifacts', 'zensical-docs');
const targetAssetsRoot = path.join(zensicalDocsRoot, 'assets');
const targetExamplesRoot = path.join(zensicalDocsRoot, 'assets', 'topoviewer', 'examples');
const mkdocsConfigPath = path.join(repoRoot, 'mkdocs.yml');
const zensicalConfigPath = path.join(repoRoot, 'zensical.toml');

const generatedNavStart = '# BEGIN GENERATED ZENSICAL NAV';
const generatedNavEnd = '# END GENERATED ZENSICAL NAV';

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function normalizeSeparators(value) {
  return value.split(path.sep).join('/');
}

function isExternalReference(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/') || value.startsWith('#');
}

function isSubpath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function cleanDirectory(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function listFiles(dirPath) {
  const files = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolute));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }
  return files;
}

function copyTree(sourceRoot, targetRoot) {
  cleanDirectory(targetRoot);
  for (const source of listFiles(sourceRoot)) {
    const relative = path.relative(sourceRoot, source);
    const target = path.join(targetRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function copyExampleAssets(sourceRoot, targetRoot) {
  cleanDirectory(targetRoot);
  for (const source of listFiles(sourceRoot)) {
    if (source.endsWith('.md')) continue;
    const relative = path.relative(sourceRoot, source);
    const target = path.join(targetRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function copyTreeInto(sourceRoot, targetRoot) {
  if (!fs.existsSync(sourceRoot)) return;
  for (const source of listFiles(sourceRoot)) {
    const relative = path.relative(sourceRoot, source);
    const target = path.join(targetRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function parseFenceBool(config, key, defaultValue) {
  const value = config[key] ?? defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return !new Set(['0', 'false', 'no', 'off']).has(value.trim().toLowerCase());
  }
  return Boolean(value);
}

function resolveSourceReference(markdownPath, reference) {
  if (!reference || isExternalReference(String(reference))) return undefined;
  const pageRelative = path.resolve(path.dirname(markdownPath), String(reference));
  if (fs.existsSync(pageRelative)) return pageRelative;
  const topoviewerRelative = path.resolve(sourceTopoviewerRoot, String(reference));
  if (fs.existsSync(topoviewerRelative)) return topoviewerRelative;
  return pageRelative;
}

function exampleTargetForSource(sourcePath) {
  if (!sourcePath || !isSubpath(sourceExamplesRoot, sourcePath) || !fs.existsSync(sourcePath)) {
    return undefined;
  }
  return path.join(targetExamplesRoot, path.relative(sourceExamplesRoot, sourcePath));
}

function outputPageDirectory(markdownPath) {
  const parsed = path.parse(markdownPath);
  if (parsed.base === 'index.md') return path.dirname(markdownPath);
  return path.join(parsed.dir, parsed.name);
}

function relativeUrl(fromMarkdownPath, targetPath) {
  return normalizeSeparators(path.relative(outputPageDirectory(fromMarkdownPath), targetPath));
}

function renderTopoViewerEmbed(config, sourceMarkdownPath, targetMarkdownPath, ordinal) {
  const topologySource = resolveSourceReference(sourceMarkdownPath, config.topology);
  const stylesheetSource = config.stylesheet
    ? resolveSourceReference(sourceMarkdownPath, config.stylesheet)
    : undefined;
  const topologyTarget = exampleTargetForSource(topologySource);
  const stylesheetTarget = stylesheetSource ? exampleTargetForSource(stylesheetSource) : undefined;

  if (!topologyTarget || (config.stylesheet && !stylesheetTarget)) {
    return undefined;
  }

  const topologyUrl = relativeUrl(targetMarkdownPath, topologyTarget);
  const stylesheetUrl = stylesheetTarget ? relativeUrl(targetMarkdownPath, stylesheetTarget) : '';
  const height = escapeHtml(config.height || '560px');
  const width = escapeHtml(config.width || '100%');
  const controls = parseFenceBool(config, 'controls', true) ? 'true' : 'false';
  const controlsOpen = parseFenceBool(config, 'controlsOpen', false) ? 'true' : 'false';
  const title = String(config.title || '').trim();
  const seed = `${normalizeSeparators(path.relative(sourceDocsRoot, sourceMarkdownPath))}:${ordinal}:${topologyUrl}:${stylesheetUrl}`;
  const embedId = `topoviewer-${crypto.createHash('sha1').update(seed).digest('hex').slice(0, 10)}`;
  const attributes = [
    `id="${embedId}"`,
    'class="topoviewer-embed topoviewer-parity-theme"',
    `data-topology="${escapeHtml(topologyUrl)}"`,
    `data-controls="${controls}"`,
    `data-controls-open="${controlsOpen}"`,
    `style="height: ${height};"`,
  ];

  if (stylesheetUrl) {
    attributes.splice(3, 0, `data-stylesheet="${escapeHtml(stylesheetUrl)}"`);
  }
  if (config.attention !== undefined) {
    const attention = JSON.stringify(config.attention);
    attributes.push(`data-attention="${escapeHtml(attention)}"`);
  }
  if (config.selectedLayerIds !== undefined) {
    const selectedLayerIds = JSON.stringify(config.selectedLayerIds);
    attributes.push(`data-selected-layer-ids="${escapeHtml(selectedLayerIds)}"`);
  }

  const caption = title ? [`<figcaption class="topoviewer-title">${escapeHtml(title)}</figcaption>`] : [];
  const embedDiv = `<div ${attributes.join(' ')}></div>`;
  return [
    `<figure class="topoviewer-figure" style="--topoviewer-width: ${width};">`,
    ...caption,
    embedDiv,
    '</figure>',
  ].join('\n');
}

function rewriteTopoViewerFences(markdown, sourceMarkdownPath, targetMarkdownPath) {
  let ordinal = 0;
  return markdown.replace(/(^|\n)([ \t]*)```topoviewer[ \t]*\n([\s\S]*?)\n\2```/g, (match, prefix, indent, rawConfig) => {
    let config;
    try {
      config = yaml.load(rawConfig) || {};
    } catch {
      return match;
    }
    if (!config || typeof config !== 'object' || !config.topology) {
      return match;
    }

    ordinal += 1;
    const embed = renderTopoViewerEmbed(config, sourceMarkdownPath, targetMarkdownPath, ordinal);
    if (!embed) return match;
    const indented = embed
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
    return `${prefix}${indented}`;
  });
}

function expandSnippetDirectives(markdown) {
  return markdown.replace(/^([ \t]*)--8<--\s+"([^"]+)"\s*$/gm, (match, indent, includePath) => {
    const source = path.resolve(repoRoot, includePath);
    if (!fs.existsSync(source) || !fs.statSync(source).isFile()) return match;
    return readText(source)
      .replace(/\r\n/g, '\n')
      .replace(/\n$/, '')
      .split('\n')
      .map((line) => `${indent}${line}`)
      .join('\n');
  });
}

function adaptMarkdown(markdown, sourceMarkdownPath, targetMarkdownPath) {
  return expandSnippetDirectives(rewriteTopoViewerFences(markdown, sourceMarkdownPath, targetMarkdownPath));
}

function isPublicExamplePage(relativePath) {
  return [
    'topoviewer/examples/examples-gallery.md',
    'topoviewer/examples/object-family-examples.md',
    'topoviewer/examples/real-network-demo.md',
    'topoviewer/examples/yaml-to-network-diagram/index.md',
  ].includes(relativePath)
    || /^topoviewer\/examples\/real-network-demo\/[^/]+\/index\.md$/.test(relativePath);
}

function syncMarkdownDocs() {
  cleanDirectory(zensicalDocsRoot);
  for (const source of listFiles(sourceDocsRoot)) {
    const relative = path.relative(sourceDocsRoot, source);
    const parts = relative.split(path.sep);
    const normalizedRelative = normalizeSeparators(relative);
    if (parts[0] === 'topoviewer' && parts[1] === 'examples' && !isPublicExamplePage(normalizedRelative)) {
      continue;
    }
    if (relative === '.nav.yml' || !source.endsWith('.md')) {
      continue;
    }
    const target = path.join(zensicalDocsRoot, relative);
    writeText(target, adaptMarkdown(readText(source), source, target));
  }
}

function tomlString(value) {
  return JSON.stringify(value);
}

function convertMkdocsNavItem(item) {
  if (typeof item !== 'object' || !item || Array.isArray(item)) return undefined;
  const [[title, value]] = Object.entries(item);
  if (title === 'Home') return undefined;
  if (typeof value === 'string') {
    return { title, path: value };
  }
  if (Array.isArray(value)) {
    return {
      title,
      children: value.map(convertMkdocsNavItem).filter(Boolean),
    };
  }
  return undefined;
}

function renderNavItem(item, indentLevel) {
  const indent = ' '.repeat(indentLevel);
  if (item.path) {
    return `${indent}{ ${tomlString(item.title)} = ${tomlString(item.path)} }`;
  }
  const childLines = item.children.map((child) => renderNavItem(child, indentLevel + 2)).join(',\n');
  return `${indent}{ ${tomlString(item.title)} = [\n${childLines}\n${indent}] }`;
}

function withZensicalAdapterPage(navItems) {
  return navItems.map((item) => {
    if (item.title !== 'Embed' || !item.children) return item;
    if (item.children.some((child) => /Zensical/.test(child.title || ''))) return item;
    return {
      ...item,
      children: [
        ...item.children,
        { title: 'Zensical Adapter', path: 'topoviewer/zensical-embed.md' },
      ],
    };
  });
}

function generateZensicalNav() {
  const mkdocsConfig = yaml.load(readText(mkdocsConfigPath)) || {};
  const mirroredNav = withZensicalAdapterPage((mkdocsConfig.nav || []).map(convertMkdocsNavItem).filter(Boolean));
  const nav = [
    { title: 'Overview', path: 'index.md' },
    ...mirroredNav,
  ];
  return [
    generatedNavStart,
    'nav = [',
    nav.map((item) => renderNavItem(item, 2)).join(',\n'),
    ']',
    generatedNavEnd,
  ].join('\n');
}

function syncZensicalNav() {
  const generatedNav = generateZensicalNav();
  const config = readText(zensicalConfigPath);
  let next;
  if (config.includes(generatedNavStart) && config.includes(generatedNavEnd)) {
    const start = config.indexOf(generatedNavStart);
    const end = config.indexOf(generatedNavEnd, start) + generatedNavEnd.length;
    next = `${config.slice(0, start)}${generatedNav}${config.slice(end)}`;
  } else {
    const match = config.match(/nav = \[\n[\s\S]*?\n\]\n\n\[project\.theme\]/);
    if (match) {
      next = config.replace(match[0], `${generatedNav}\n\n[project.theme]`);
    }
  }
  if (next === undefined) {
    throw new Error('Could not locate the Zensical nav block in zensical.toml.');
  }
  if (next !== config) {
    writeText(zensicalConfigPath, next);
  }
}

syncMarkdownDocs();
copyTreeInto(sourceAssetsRoot, targetAssetsRoot);
copyExampleAssets(sourceExamplesRoot, targetExamplesRoot);
syncZensicalNav();

console.log(`synced Zensical docs from ${path.relative(repoRoot, sourceDocsRoot)} into ${path.relative(repoRoot, zensicalDocsRoot)}`);
