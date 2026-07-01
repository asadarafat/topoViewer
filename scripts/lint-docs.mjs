#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { sourceFileFor } from './lib/content-examples.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentPagesRoot = path.join(repoRoot, 'packages/topoviewer/content/pages');
const contentExamplesRoot = path.join(repoRoot, 'packages/topoviewer/content/examples');
const docsRoot = path.join(repoRoot, 'docs');
const packageRoot = path.join(repoRoot, 'packages/topoviewer');
const packageDocsRoot = path.join(packageRoot, 'docs');

const errors = [];
const supportStatusLabels = new Set([
  'Supported',
  'Pre-Publish Supported',
  'Supported Adapter',
  'Experimental',
  'Lab',
  'Roadmap',
  'Maintainer'
]);

const integrationStatusPages = [
  ['react.md', 'Pre-Publish Supported'],
  ['mkdocs.md', 'Supported'],
  ['zensical.md', 'Supported Adapter'],
  ['browser-harness.md', 'Experimental'],
  ['grafana.md', 'Experimental'],
  ['integration-roadmap.md', 'Roadmap'],
  ['grafana-telemetry-call-flow.md', 'Lab']
];

const packageReadmeStatuses = [
  ['packages/topoviewer/README.md', 'Pre-Publish Supported'],
  ['packages/mkdocs-topoviewer/README.md', 'Supported'],
  ['packages/vscode-topoviewer/README.md', 'Experimental'],
  ['packages/grafana-topoviewer-panel/README.md', 'Experimental']
];

const majorGuidePages = [
  'why-topoviewer.md',
  'getting-started.md',
  'examples.md',
  'authoring.md',
  'style-a-topology.md',
  'browser-harness.md',
  'validate-yaml.md',
  'debugging.md',
  'layout-guide.md',
  'react.md',
  'mkdocs.md',
  'zensical.md',
  'grafana.md'
];

const taskGuideLineBudget = 320;
const integrationGuideLineBudget = 480;
const guidePageLengthBudgets = new Map([
  ['why-topoviewer.md', taskGuideLineBudget],
  ['getting-started.md', taskGuideLineBudget],
  ['examples.md', taskGuideLineBudget],
  ['style-a-topology.md', taskGuideLineBudget],
  ['browser-harness.md', taskGuideLineBudget],
  ['validate-yaml.md', taskGuideLineBudget],
  ['debugging.md', taskGuideLineBudget],
  ['layout-guide.md', taskGuideLineBudget],
  ['react.md', integrationGuideLineBudget],
  ['mkdocs.md', taskGuideLineBudget],
  ['zensical.md', taskGuideLineBudget]
]);

const forbiddenPublicClaimPhrases = [
  [/\bproduction[- ]ready\b/i, 'Do not claim production-ready in public docs until the readiness gate is complete.'],
  [/\bSupported source API\b/, 'Use the canonical status label "Pre-Publish Supported".'],
  [/\bSupported adapter\b/, 'Use the canonical status label "Supported Adapter".'],
  [/\bExperimental package\b/, 'Use the canonical status label "Experimental".'],
  [/\bExploratory panel spike\b/, 'Use the canonical status label "Experimental".'],
  [/\bFeasibility\b/i, 'Use the canonical status label "Roadmap" for planned integrations.']
];

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readYaml(filePath) {
  return yaml.load(readText(filePath)) || {};
}

function lineCount(text) {
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join(path.posix.sep);
}

function fail(message) {
  errors.push(message);
}

function assertFile(filePath, label = relative(filePath)) {
  if (!fs.existsSync(filePath)) {
    fail(`Missing ${label}`);
    return false;
  }
  return true;
}

function listMarkdownFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolute));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolute);
    }
  }
  return files;
}

function packageReadmes() {
  const packagesRoot = path.join(repoRoot, 'packages');
  if (!fs.existsSync(packagesRoot)) return [];
  return fs.readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(packagesRoot, entry.name, 'README.md'))
    .filter((filePath) => fs.existsSync(filePath));
}

function checkRequiredPages() {
  const required = [
    'getting-started.md',
    'examples.md',
    'style-a-topology.md',
    'browser-harness.md',
    'validate-yaml.md',
    'debugging.md',
    'layout-guide.md',
    'architecture.md',
    'threat-model.md',
    'build-vs-adopt.md',
    'design-review-checklist.md',
    'performance-reliability-accessibility.md',
    'object-reference.md',
    'api-reference.md',
    'compatibility.md',
    'glossary.md',
    'decisions.md',
    'docs-standard.md'
  ];

  for (const page of required) {
    assertFile(path.join(contentPagesRoot, page), `canonical docs page ${page}`);
  }
}

function checkDocsStandard() {
  const filePath = path.join(contentPagesRoot, 'docs-standard.md');
  if (!assertFile(filePath)) return;
  const text = readText(filePath);
  for (const phrase of [
    'Required Artifacts',
    'Page Jobs',
    'Example README Contract',
    'Wording Rules',
    'Support status',
    ...supportStatusLabels
  ]) {
    if (!text.includes(phrase)) {
      fail(`docs-standard.md must describe ${phrase}`);
    }
  }
}

function supportStatusForPage(filePath) {
  const text = readText(filePath);
  const match = text.match(/^\*\*Support status:\*\*\s+(.+?)\s*$/m);
  return match ? match[1] : undefined;
}

function checkIntegrationPageStatusLabels() {
  for (const [page, expectedStatus] of integrationStatusPages) {
    const filePath = path.join(contentPagesRoot, page);
    if (!assertFile(filePath, `integration status page ${page}`)) continue;
    const status = supportStatusForPage(filePath);
    if (!status) {
      fail(`${relative(filePath)} must include "**Support status:** <label>" near the top.`);
      continue;
    }
    if (!supportStatusLabels.has(status)) {
      fail(`${relative(filePath)} uses unsupported support status "${status}".`);
      continue;
    }
    if (status !== expectedStatus) {
      fail(`${relative(filePath)} must use support status "${expectedStatus}", found "${status}".`);
    }
  }
}

function checkPackageReadmeStatusLabels() {
  for (const [packageReadme, expectedStatus] of packageReadmeStatuses) {
    const filePath = path.join(repoRoot, packageReadme);
    if (!assertFile(filePath, `package README ${packageReadme}`)) continue;
    const status = supportStatusForPage(filePath);
    if (!status) {
      fail(`${packageReadme} must include "**Support status:** <label>" near the top.`);
      continue;
    }
    if (!supportStatusLabels.has(status)) {
      fail(`${packageReadme} uses unsupported support status "${status}".`);
      continue;
    }
    if (status !== expectedStatus) {
      fail(`${packageReadme} must use support status "${expectedStatus}", found "${status}".`);
    }
  }
}

function statusColumnValues(markdownTableText, tableLabel) {
  const statuses = [];
  let inStatusTable = false;
  let sawSeparator = false;
  for (const line of markdownTableText.split('\n')) {
    if (!line.trim().startsWith('|')) {
      inStatusTable = false;
      sawSeparator = false;
      continue;
    }
    if (/\|\s*Surface\s*\|\s*Status\s*\|/.test(line)) {
      inStatusTable = true;
      sawSeparator = false;
      continue;
    }
    if (!inStatusTable) continue;
    if (/^\|\s*-+/.test(line)) {
      sawSeparator = true;
      continue;
    }
    if (!sawSeparator) continue;
    const columns = line.split('|').slice(1, -1).map((column) => column.trim());
    if (columns.length < 2) continue;
    statuses.push({ status: columns[1], line, tableLabel });
  }
  return statuses;
}

function checkSupportStatusTables() {
  const files = [
    path.join(contentPagesRoot, '_fragments/integration-surfaces.md'),
    path.join(contentPagesRoot, 'integration-roadmap.md')
  ];

  for (const filePath of files) {
    if (!assertFile(filePath)) continue;
    for (const { status, line } of statusColumnValues(readText(filePath), relative(filePath))) {
      if (!supportStatusLabels.has(status)) {
        fail(`${relative(filePath)} uses unsupported integration status "${status}" in table row: ${line}`);
      }
    }
  }
}

function checkPublicClaimWording() {
  const files = [
    path.join(repoRoot, 'README.md'),
    ...packageReadmes(),
    ...listMarkdownFiles(contentPagesRoot),
    ...listMarkdownFiles(docsRoot)
  ].filter((filePath) => !relative(filePath).includes('/_fragments/'));

  for (const filePath of files) {
    const text = readText(filePath);
    for (const [pattern, guidance] of forbiddenPublicClaimPhrases) {
      const match = text.match(pattern);
      if (match) {
        fail(`${relative(filePath)} uses public claim wording "${match[0]}". ${guidance}`);
      }
    }
  }
}

function checkOpenSpecIndex() {
  const readmePath = path.join(repoRoot, 'openspec/README.md');
  if (!assertFile(readmePath, 'OpenSpec README')) return;
  const text = readText(readmePath);
  if (!text.includes('Active plans are not public support claims.')) {
    fail('openspec/README.md must state that active OpenSpec plans are not public support claims.');
  }

  const changesRoot = path.join(repoRoot, 'openspec/changes');
  const activeChanges = new Set(
    fs.existsSync(changesRoot)
      ? fs.readdirSync(changesRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
      : []
  );
  const listedChanges = new Set([...text.matchAll(/^- `changes\/([^/]+)\/`/gm)].map((match) => match[1]));

  for (const change of activeChanges) {
    if (!listedChanges.has(change)) {
      fail(`openspec/README.md is missing active change: changes/${change}/`);
    }
  }
  for (const change of listedChanges) {
    if (!activeChanges.has(change)) {
      fail(`openspec/README.md lists non-active change under Current active plans: changes/${change}/`);
    }
  }
}

function checkCatalogDuplicateKeys() {
  const catalogFile = path.join(contentExamplesRoot, 'catalog.yaml');
  if (!assertFile(catalogFile)) return;
  const lines = readText(catalogFile).split('\n');
  let currentId = undefined;
  let topLevelKeys = new Map();

  function flush() {
    if (!currentId) return;
    for (const [key, occurrences] of topLevelKeys.entries()) {
      if (occurrences.length > 1) {
        fail(`Example ${currentId} has duplicate catalog key "${key}" at lines ${occurrences.join(', ')}`);
      }
    }
    topLevelKeys = new Map();
  }

  lines.forEach((line, index) => {
    const idMatch = line.match(/^  - id:\s*(.+)\s*$/);
    if (idMatch) {
      flush();
      currentId = idMatch[1].replace(/^"|"$/g, '');
      topLevelKeys = new Map([['id', [index + 1]]]);
      return;
    }

    if (!currentId) return;
    const keyMatch = line.match(/^    ([A-Za-z0-9_-]+):/);
    if (!keyMatch) return;
    const key = keyMatch[1];
    const occurrences = topLevelKeys.get(key) || [];
    occurrences.push(index + 1);
    topLevelKeys.set(key, occurrences);
  });
  flush();
}

function checkExampleSources() {
  const catalog = readYaml(path.join(contentExamplesRoot, 'catalog.yaml'));
  const requiredFiles = ['README.md', 'topology.yaml', 'stylesheet.yaml', 'expected.yaml'];
  for (const example of catalog.examples || []) {
    for (const fileName of requiredFiles) {
      const filePath = sourceFileFor(contentExamplesRoot, example, fileName);
      assertFile(filePath, `${example.id} ${fileName}`);
    }
    if (!example.summary || String(example.summary).trim().length < 24) {
      fail(`Example ${example.id} needs a clear catalog summary.`);
    }
  }
}

function isNodeStyleSelector(selector) {
  return typeof selector === 'string' && /^node(\b|\[|\.|#|$)/.test(selector.trim());
}

function checkExampleNodeDimensions() {
  const catalog = readYaml(path.join(contentExamplesRoot, 'catalog.yaml'));
  for (const example of catalog.examples || []) {
    const stylesheetFile = sourceFileFor(contentExamplesRoot, example, 'stylesheet.yaml');
    if (!fs.existsSync(stylesheetFile)) continue;
    const stylesheet = readYaml(stylesheetFile);
    for (const [index, rule] of (stylesheet.stylesheet || []).entries()) {
      const style = rule.style || {};
      if (!isNodeStyleSelector(rule.selector)) continue;
      if (style.width === undefined || style.height === undefined) continue;
      if (Number(style.width) !== Number(style.height)) continue;
      const shape = style.shape === undefined ? 'rectangle' : String(style.shape);
      if (shape === 'rectangle') {
        fail(`${example.id} stylesheet rule ${index} uses rectangle node dimensions ${style.width}x${style.height}; use non-equal dimensions or an explicit square/circle shape.`);
      }
    }
  }
}

function styleKeysFromRegistry() {
  const styleDefaults = readText(path.join(packageRoot, 'src/core/styleDefaults.ts'));
  const keys = new Set();
  const matcher = /def\(\s*\[[^\]]+\]\s*,\s*'([^']+)'/g;
  let match;
  while ((match = matcher.exec(styleDefaults)) !== null) {
    keys.add(match[1]);
  }
  return [...keys].sort();
}

function checkStylesheetCoverage() {
  const stylesheetFile = path.join(contentPagesRoot, 'stylesheet-reference.md');
  if (!assertFile(stylesheetFile)) return;
  const text = readText(stylesheetFile);
  const missing = styleKeysFromRegistry().filter((key) => !new RegExp(`\\\`${key}\\\``).test(text));
  if (missing.length) {
    fail(`stylesheet-reference.md is missing style registry keys: ${missing.join(', ')}`);
  }
}

function exportedNames() {
  const indexText = readText(path.join(packageRoot, 'src/index.ts'));
  const names = new Set();

  for (const match of indexText.matchAll(/export\s+\{\s*([^}]+)\s*\}/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().replace(/\s+as\s+.+$/, '');
      if (name) names.add(name);
    }
  }

  for (const match of indexText.matchAll(/export\s+type\s+\{\s*([^}]+)\s*\}/g)) {
    for (const raw of match[1].split(',')) {
      const name = raw.trim().replace(/\s+as\s+.+$/, '');
      if (name) names.add(name);
    }
  }

  return [...names].sort();
}

function checkApiCoverage() {
  const apiFile = path.join(contentPagesRoot, 'api-reference.md');
  if (!assertFile(apiFile)) return;
  const text = readText(apiFile);
  const ignoredTypeGroups = new Set([
    'AttentionGraphInput',
    'AttentionIndexedObject',
    'AttentionObjectByKind',
    'AttentionObjectKind',
    'FocusDependencyDirection',
    'FocusDependencyQuery',
    'FocusChangeQuery',
    'FocusQueryErrorCode',
    'AttentionViewportPolicy',
    'AggregateGroupDefinition',
    'AggregateGroupKind',
    'AggregateGroupSummary',
    'DeriveAggregateGraphOptions',
    'LabelAggregateGroupDefinition',
    'LinkAggregateGroupSummary',
    'LinkGroupingKey',
    'LinkGroupingOptions',
    'LinkGroupingViewportPolicy',
    'ParentAggregateGroupDefinition',
    'RegionAggregateGroupDefinition',
    'AttentionLabelPriority',
    'AttentionPresentation',
    'AttentionPresentationState',
    'AttentionScore',
    'AttentionScoringOptions',
    'StaticExportOptions',
    'StaticPdfExportOptions',
    'ComposeTopoViewerDocumentOptions',
    'LintIssue',
    'LintOptions',
    'ClosLayoutDiagnostic',
    'NodeShapePoint',
    'ParsedNodeShapePoints',
    'NodeBorderStyle',
    'NodeLabelTextOverflow',
    'NodeLabelTextWrap'
  ]);
  const missing = exportedNames().filter((name) => !ignoredTypeGroups.has(name) && !new RegExp(`\\\`${name}\\\``).test(text));
  if (missing.length) {
    fail(`api-reference.md is missing exported names: ${missing.join(', ')}`);
  }
}

function withoutFencedCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, '');
}

function checkLocalLinks() {
  for (const filePath of listMarkdownFiles(contentPagesRoot)) {
    if (relative(filePath).includes('/_fragments/')) continue;
    const text = withoutFencedCode(readText(filePath));
    for (const match of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
      if (target.startsWith('http')) continue;
      if (target.startsWith('topoviewer/')) continue;
      const resolved = path.resolve(path.dirname(filePath), target);
      const generatedResolved = path.resolve(docsRoot, 'topoviewer', target);
      const candidates = [
        resolved,
        `${resolved}.md`,
        path.join(resolved, 'index.md'),
        generatedResolved,
        `${generatedResolved}.md`,
        path.join(generatedResolved, 'index.md'),
        path.resolve(docsRoot, target),
        path.resolve(docsRoot, `${target}.md`),
        path.resolve(docsRoot, target, 'index.md')
      ];
      if (!candidates.some((candidate) => fs.existsSync(candidate))) {
        fail(`${relative(filePath)} has a broken local link: ${target}`);
      }
    }
  }
}

function checkGeneratedCriticalPages() {
  const critical = [
    'docs/index.md',
    'docs/topoviewer/getting-started.md',
    'docs/topoviewer/browser-harness.md',
    'docs/topoviewer/api-reference.md',
    'docs/topoviewer/docs-standard.md',
    'docs/topoviewer/reference/graph/index.md'
  ];
  for (const page of critical) {
    assertFile(path.join(repoRoot, page), page);
  }

  const graphIndex = path.join(docsRoot, 'topoviewer/reference/graph/index.md');
  if (fs.existsSync(graphIndex)) {
    const text = readText(graphIndex);
    for (const heading of ['What This Demonstrates', 'Expected Result', 'What To Inspect', 'Use When']) {
      if (!text.includes(heading)) {
        fail(`Generated graph examples page is missing "${heading}" sections.`);
      }
    }
  }
}

function collectNavTargets(navItems, targets = new Set()) {
  for (const item of navItems || []) {
    if (typeof item === 'string') {
      targets.add(item);
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    for (const value of Object.values(item)) {
      if (typeof value === 'string') {
        targets.add(value);
      } else if (Array.isArray(value)) {
        collectNavTargets(value, targets);
      }
    }
  }
  return targets;
}

function findNavSection(navItems, sectionName) {
  for (const item of navItems || []) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    if (Object.prototype.hasOwnProperty.call(item, sectionName)) {
      return item[sectionName];
    }
  }
  return undefined;
}

function isAllowedUnnavedDocsPage(relativePath) {
  return [
    /^topoviewer\/examples\/.+\/README\.md$/,
    /^topoviewer\/reference\/[^/]+\/[^/]+\/index\.md$/,
    /^topoviewer\/real-network-demo\/[^/]+\/index\.md$/
  ].some((pattern) => pattern.test(relativePath))
    || [
      'topoviewer/index.md',
      'topoviewer/zensical-embed.md',
      'topoviewer/complete-network-demo/index.md'
    ].includes(relativePath);
}

function checkMkDocsNavCoverage() {
  const mkdocsConfig = readYaml(path.join(repoRoot, 'mkdocs.yml'));
  const navTargets = collectNavTargets(mkdocsConfig.nav || []);
  const docsFiles = listMarkdownFiles(docsRoot)
    .map((filePath) => path.relative(docsRoot, filePath).split(path.sep).join(path.posix.sep));

  const unexpected = docsFiles
    .filter((filePath) => !navTargets.has(filePath))
    .filter((filePath) => !isAllowedUnnavedDocsPage(filePath));

  if (unexpected.length) {
    fail(`Unexpected MkDocs pages are missing from nav or allowlist: ${unexpected.join(', ')}`);
  }
}

function checkStartNavBoundary() {
  const mkdocsConfig = readYaml(path.join(repoRoot, 'mkdocs.yml'));
  const startTargets = collectNavTargets(findNavSection(mkdocsConfig.nav || [], 'Start'));
  const forbiddenStartTargets = new Set([
    'topoviewer/grafana-telemetry-call-flow.md',
    'topoviewer/monorepo.md',
    'topoviewer/production.md',
    'topoviewer/release.md',
    'topoviewer/docs-standard.md'
  ]);

  for (const target of startTargets) {
    if (forbiddenStartTargets.has(target)) {
      fail(`MkDocs Start nav must not include Lab or Maintainer page: ${target}`);
    }
  }
}

function navEntryValue(entry, key) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return undefined;
  return Object.prototype.hasOwnProperty.call(entry, key) ? entry[key] : undefined;
}

function checkExamplesNavBoundary() {
  const mkdocsConfig = readYaml(path.join(repoRoot, 'mkdocs.yml'));
  const examplesNav = findNavSection(mkdocsConfig.nav || [], 'Examples');
  if (!Array.isArray(examplesNav)) {
    fail('MkDocs Examples nav must be a list.');
    return;
  }

  const firstEntry = examplesNav[0];
  if (navEntryValue(firstEntry, 'Curated Examples') !== 'topoviewer/examples.md') {
    fail('MkDocs Examples nav must start with Curated Examples: topoviewer/examples.md');
  }

  const generatedCatalog = examplesNav
    .map((entry) => navEntryValue(entry, 'Generated Catalog'))
    .find((value) => Array.isArray(value));
  if (!generatedCatalog) {
    fail('MkDocs Examples nav must keep generated reference pages under Generated Catalog.');
    return;
  }

  const topLevelTargets = new Set();
  for (const entry of examplesNav) {
    for (const value of Object.values(entry || {})) {
      if (typeof value === 'string') {
        topLevelTargets.add(value);
      }
    }
  }

  for (const target of topLevelTargets) {
    if (target.startsWith('topoviewer/reference/')) {
      fail(`Generated reference example page must not be top-level in Examples nav: ${target}`);
    }
  }
}

function checkPublicPathWording() {
  const forbidden = [
    'asadarafat.github.io/TopoViewer',
    'github.com/asadarafat/TopoViewer',
    '/Users/aarafat/_projects/intent/DG_25_6_v2'
  ];

  for (const filePath of [
    ...listMarkdownFiles(contentPagesRoot),
    ...listMarkdownFiles(docsRoot),
    path.join(repoRoot, 'README.md')
  ]) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    for (const value of forbidden) {
      if (text.includes(value)) {
        fail(`${relative(filePath)} contains forbidden public path or slug: ${value}`);
      }
    }
  }
}

function checkPublicPromoArtifactReferences() {
  const publicFiles = [
    ...listMarkdownFiles(contentPagesRoot),
    ...listMarkdownFiles(packageDocsRoot),
    ...listMarkdownFiles(docsRoot),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'mkdocs.yml'),
    path.join(repoRoot, 'zensical.toml')
  ];

  for (const filePath of publicFiles) {
    if (!fs.existsSync(filePath)) continue;
    const text = readText(filePath);
    if (text.includes('.artifacts/promo') || text.includes('artifacts/promo')) {
      fail(`${relative(filePath)} references local promotional media artifacts. Public docs must use docs/assets/ or a durable hosted media URL.`);
    }
  }
}

function checkGuideNextSteps() {
  for (const page of majorGuidePages) {
    const filePath = path.join(contentPagesRoot, page);
    if (!assertFile(filePath, `major guide page ${page}`)) continue;
    const text = readText(filePath);
    const nextStepsMatch = text.match(/^## Next Steps\s*$(?<body>[\s\S]*)/m);
    if (!nextStepsMatch?.groups?.body) {
      fail(`${relative(filePath)} must end with a "## Next Steps" section.`);
      continue;
    }
    if (/\n##\s+/.test(nextStepsMatch.groups.body)) {
      fail(`${relative(filePath)} must not add another H2 section after "## Next Steps".`);
      continue;
    }
    const bodyBeforeNextHeading = nextStepsMatch.groups.body;
    if (!/\[[^\]]+\]\([^)]+\.md(?:#[^)]+)?\)/.test(bodyBeforeNextHeading)) {
      fail(`${relative(filePath)} "## Next Steps" section must include at least one local Markdown link.`);
    }
  }
}

function checkGuidePageLengthBudgets() {
  for (const [page, budget] of guidePageLengthBudgets.entries()) {
    const filePath = path.join(contentPagesRoot, page);
    if (!assertFile(filePath, `guide page ${page}`)) continue;
    const lines = lineCount(readText(filePath));
    if (lines > budget) {
      fail(`${relative(filePath)} has ${lines} lines and exceeds the ${budget}-line guide budget. Split reference material out of the task guide or move the page under Reference, Labs, or Maintainers.`);
    }
  }
}

checkRequiredPages();
checkDocsStandard();
checkIntegrationPageStatusLabels();
checkPackageReadmeStatusLabels();
checkSupportStatusTables();
checkPublicClaimWording();
checkOpenSpecIndex();
checkCatalogDuplicateKeys();
checkExampleSources();
checkExampleNodeDimensions();
checkStylesheetCoverage();
checkApiCoverage();
checkLocalLinks();
checkGeneratedCriticalPages();
checkMkDocsNavCoverage();
checkStartNavBoundary();
checkExamplesNavBoundary();
checkPublicPathWording();
checkPublicPromoArtifactReferences();
checkGuideNextSteps();
checkGuidePageLengthBudgets();

if (errors.length) {
  console.error('Docs lint failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('docs lint passed');
