import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as yaml from 'js-yaml';
import { sourceFileFor } from '../../../scripts/lib/content-examples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageRoot, '../..');
const repoRoot = monorepoRoot;
const defaultDocsRoot = path.join(monorepoRoot, 'docs');
const contentExamplesRoot = path.join(packageRoot, 'content/examples');
const catalogFile = path.join(contentExamplesRoot, 'catalog.yaml');
const checkOnly = process.argv.includes('--check');
const allowDirtyProjectionOverwrite = process.env.TOPOVIEWER_SYNC_ALLOW_DIRTY_PROJECTIONS === '1';

function argValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

const docsRoot = path.resolve(
  argValue('--docs-root')
  || process.env.TOPOVIEWER_DOCS_ROOT
  || defaultDocsRoot
);

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readYaml(filePath) {
  return yaml.load(readText(filePath)) || {};
}

function writeTextIfChanged(filePath, content) {
  const existing = fs.existsSync(filePath) ? readText(filePath) : undefined;
  if (existing === content) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

function removeStaleGeneratedPaths() {
  const stalePaths = [
    'topoviewer/examples/harness',
    'topoviewer/examples/real-network-demo',
    'topoviewer/examples/examples-gallery.md',
    'topoviewer/examples/use-cases.md',
    'topoviewer/examples/kubernetes-service-map',
    'topoviewer/examples/yaml-to-network-diagram',
    'topoviewer/examples/integration/yaml-to-network-diagram',
    'topoviewer/examples/service-provider-network',
    'topoviewer/reference/graph',
    'topoviewer/reference/nodes',
    'topoviewer/reference/edges',
    'topoviewer/reference/paths',
    'topoviewer/reference/attention',
    'topoviewer/reference/regions',
    'topoviewer/reference/shapes',
    'topoviewer/reference/callouts',
    'topoviewer/reference/styling',
    'topoviewer/reference/layout',
    'topoviewer/reference/validation'
  ];

  for (const relativePath of stalePaths) {
    const target = path.join(docsRoot, relativePath);
    if (!fs.existsSync(target)) continue;
    if (checkOnly) {
      console.error(`stale generated docs example exists: ${path.relative(repoRoot, target)}`);
      process.exitCode = 1;
      continue;
    }
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`removed stale generated docs example: ${path.relative(docsRoot, target)}`);
  }
}

function removeConflictingReadmeProjections(catalog) {
  for (const example of catalog.examples || []) {
    if (!isPublicExample(example)) continue;
    const readmeTarget = path.join(docsRoot, docsExamplePath(example, 'README.md'));
    const generatedPage = pageFile(example);
    if (path.dirname(readmeTarget) !== path.dirname(generatedPage)) continue;
    if (!fs.existsSync(readmeTarget)) continue;
    if (checkOnly) {
      console.error(`stale README projection conflicts with generated example page: ${path.relative(repoRoot, readmeTarget)}`);
      process.exitCode = 1;
      continue;
    }
    fs.rmSync(readmeTarget, { force: true });
    console.log(`removed stale conflicting README projection: ${path.relative(docsRoot, readmeTarget)}`);
  }
}

function repoRelative(filePath) {
  return toPosix(path.relative(repoRoot, filePath));
}

function isGitDirty(filePath) {
  try {
    const relativePath = path.relative(repoRoot, filePath);
    const output = execFileSync('git', ['status', '--porcelain', '--', relativePath], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return output.trim().length > 0;
  } catch {
    return false;
  }
}

function assertProjectionCanBeOverwritten(source, target, expected, label) {
  if (allowDirtyProjectionOverwrite || !fs.existsSync(target)) return;
  const existing = readText(target);
  if (existing === expected) return;
  if (!isGitDirty(target) || isGitDirty(source)) return;

  throw new Error([
    `Refusing to overwrite dirty generated docs example: ${repoRelative(target)}`,
    `Projection: ${label}`,
    `Canonical source: ${repoRelative(source)}`,
    '',
    'Edit the canonical source under packages/topoviewer/content/examples/**, then run:',
    '  npm run sync:docs',
    '',
    'If this projected file was changed by mistake, revert or discard that generated-file edit first.',
    'To force regeneration anyway, rerun with TOPOVIEWER_SYNC_ALLOW_DIRTY_PROJECTIONS=1.'
  ].join('\n'));
}

function assertSynced(target, expected, label) {
  const actual = fs.existsSync(target) ? readText(target) : undefined;
  if (actual !== expected) {
    console.error(`${label} is out of sync: ${path.relative(repoRoot, target)}`);
    process.exitCode = 1;
  }
}

function toPosix(value) {
  return value.split(path.sep).join(path.posix.sep);
}

function exampleSourceFile(example, fileName) {
  return sourceFileFor(contentExamplesRoot, example, fileName);
}

function readExampleFile(example, fileName) {
  return readText(exampleSourceFile(example, fileName));
}

function exampleExtraSourceFile(example, fileName) {
  const source = path.join(contentExamplesRoot, example.sourcePath || example.path, fileName);
  const relativePath = path.relative(contentExamplesRoot, source);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`Example ${example.id} extra file resolves outside examples content: ${source}`);
  }
  return source;
}

function docsExamplePath(example, fileName) {
  return path.posix.join('topoviewer/examples', example.path, fileName);
}

function pageFile(example) {
  return path.join(docsRoot, example.page, 'index.md');
}

function isPublicExample(example) {
  return example.publicPage !== false;
}

function categoryFile(feature) {
  return path.join(docsRoot, 'topoviewer/examples', feature, 'index.md');
}

function relativeFromMarkdownFile(markdownFile, docsRelativePath) {
  return toPosix(path.relative(path.dirname(markdownFile), path.join(docsRoot, docsRelativePath)));
}

function includePath(docsRelativePath) {
  return toPosix(path.join(path.basename(docsRoot), docsRelativePath));
}

function dumpYaml(document) {
  return yaml.dump(document, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"'
  });
}

function boolText(value, fallback) {
  return value === undefined ? String(fallback) : String(value);
}

function compactExpectedMetadata(expected) {
  const dom = expected.dom || {};
  const keys = ['graphNodes', 'shapes', 'visibleCallouts', 'texts', 'minVisibleEdges', 'minRegions'];
  const metadata = Object.fromEntries(keys
    .filter((key) => dom[key] !== undefined)
    .map((key) => [key, dom[key]]));
  return Object.keys(metadata).length ? metadata : undefined;
}

function indentBlock(value, spaces = 4) {
  const prefix = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => line ? `${prefix}${line}` : '')
    .join('\n');
}

function generatedCatalog(catalog) {
  return {
    version: catalog.version,
    docsRoot: toPosix(path.relative(repoRoot, docsRoot) || '.'),
    examples: (catalog.examples || []).map((example) => {
      const expected = readYaml(exampleSourceFile(example, 'expected.yaml'));
      const expectedMetadata = compactExpectedMetadata(expected);
      const publicPage = isPublicExample(example);
      return {
        id: example.id,
        title: example.title,
        feature: example.feature,
        path: example.path,
        page: example.page,
        renderable: expected.renderable,
        topology: includePath(docsExamplePath(example, 'topology.yaml')),
        stylesheet: includePath(docsExamplePath(example, 'stylesheet.yaml')),
        ...(expectedMetadata ? { expected: expectedMetadata } : {}),
        ...(publicPage
          ? { markdown: includePath(path.posix.join(example.page, 'index.md')) }
          : { readme: includePath(docsExamplePath(example, 'README.md')) })
      };
    })
  };
}

function renderBlock(example, expected, markdownFile = pageFile(example)) {
  if (expected.renderable === false) {
    return [
      '!!! warning "Intentional validation failure"',
      '    This source is deliberately invalid. Copy the two YAML tabs and run the linked validator to see the diagnostic before repairing it.'
    ].join('\n');
  }

  const topology = relativeFromMarkdownFile(markdownFile, docsExamplePath(example, 'topology.yaml'));
  const stylesheet = relativeFromMarkdownFile(markdownFile, docsExamplePath(example, 'stylesheet.yaml'));
  const render = example.render || {};
  const lines = [
    '```topoviewer',
    `topology: ${topology}`,
    `stylesheet: ${stylesheet}`,
    `height: ${render.height || '420px'}`,
    `controls: ${boolText(render.controls, true)}`,
    `controlsOpen: ${boolText(render.controlsOpen, false)}`
  ];
  if (render.width) lines.push(`width: ${render.width}`);
  if (render.title || example.title) lines.push(`title: ${render.title || example.title}`);
  if (render.selectedLayerIds) {
    lines.push('selectedLayerIds:');
    lines.push(indentBlock(dumpYaml(render.selectedLayerIds).trimEnd(), 2));
  }
  if (render.attention) {
    lines.push('attention:');
    lines.push(indentBlock(dumpYaml(render.attention).trimEnd(), 2));
  }
  lines.push('```');
  return lines.join('\n');
}

function exampleTabsMarkdown(example, expected, markdownFile) {
  const topologyInclude = includePath(docsExamplePath(example, 'topology.yaml'));
  const stylesheetInclude = includePath(docsExamplePath(example, 'stylesheet.yaml'));
  const viewport = renderBlock(example, expected, markdownFile);
  const render = example.render || {};
  const topologySnippet = [
    '```yaml',
    `--8<-- "${topologyInclude}"`,
    '```'
  ].join('\n');
  const stylesheetSnippet = [
    '```yaml',
    `--8<-- "${stylesheetInclude}"`,
    '```'
  ].join('\n');
  const attentionSnippet = render.attention
    ? [
      '```yaml',
      dumpYaml({ attention: render.attention }).trimEnd(),
      '```'
    ].join('\n')
    : undefined;

  const tabs = [
    '=== "Live Viewport"',
    '',
    indentBlock(viewport),
    '',
    '=== "Topology YAML"',
    '',
    indentBlock(topologySnippet),
    '',
    '=== "Stylesheet YAML"',
    '',
    indentBlock(stylesheetSnippet)
  ];

  if (attentionSnippet) {
    tabs.push(
      '',
      '=== "Attention YAML"',
      '',
      indentBlock(attentionSnippet)
    );
  }

  return tabs.join('\n');
}

function exampleExperiment(example, expected, markdownFile) {
  const validationGuide = relativeFromMarkdownFile(markdownFile, 'topoviewer/author/validate-yaml.md');
  if (expected.renderable === false) {
    const codes = expected.semantic?.errors || [];
    return [
      `Copy the two YAML tabs into local files and [run the file validator](${validationGuide}) with those paths. It should exit with an error.`,
      codes.length ? `Find the diagnostic ${codes.map((code) => `\`${code}\``).join(', ')} and locate the offending source field.` : 'Locate the reported diagnostic and the source field it names.',
      `Correct that field in a local copy, then [validate the same files again](${validationGuide}). The intended failure should disappear before you publish the diagram.`
    ];
  }
  const setup = ['Copy the two YAML tabs into your own project.'];
  if (example.render?.attention) {
    setup.push('Copy the Attention YAML tab into your `topoviewer` fence too; focus and collapse settings are separate from the two source files.');
  }
  if (example.render?.selectedLayerIds) {
    setup.push(`Select the same layers in the viewer: ${example.render.selectedLayerIds.map((id) => `\`${id}\``).join(', ')}.`);
  }
  const stylesheet = readYaml(exampleSourceFile(example, 'stylesheet.yaml'));
  const topology = readYaml(exampleSourceFile(example, 'topology.yaml'));
  const recipe = (...steps) => [setup.join(' '), ...steps, 'Restore the original settings and reload to compare with the starting view.'];
  if (example.feature === 'layout') {
    const layout = stylesheet.layout || {};
    if (layout.mode === 'manual') {
      const node = topology.graph.nodes.find((candidate) => Array.isArray(candidate.position));
      const moved = [node.position[0], node.position[1] + 100];
      return recipe(
        `In topology.yaml, change node \`${node.id}\`'s \`position\` from \`${JSON.stringify(node.position)}\` to \`${JSON.stringify(moved)}\`.`,
        'Reload. That node moves down relative to the other authored positions, and its connected links follow it.'
      );
    }
    if (layout.mode === 'force') {
      return recipe(
        `In stylesheet.yaml, change \`layout.linkDistance\` from \`${layout.linkDistance}\` to \`${layout.linkDistance + 80}\`.`,
        'Reload and compare the recomputed node spacing. Reload once more without another edit: the same input should produce the same layout.'
      );
    }
    if (layout.mode === 'clos' || layout.mode === 'tree') {
      const direction = layout[layout.mode]?.direction || 'topToBottom';
      const next = direction === 'leftToRight' ? 'topToBottom' : 'leftToRight';
      return recipe(
        `In stylesheet.yaml, change \`layout.${layout.mode}.direction\` from \`${direction}\` to \`${next}\`.`,
        'Reload. The stages or hierarchy turn to the new orientation while node IDs and link endpoints stay the same.'
      );
    }
  }
  if (example.feature === 'attention') {
    const attention = example.render?.attention || topology.attention || {};
    const location = example.render?.attention ? 'the Attention YAML block in your page' : 'topology.yaml';
    if (attention.query?.mode === 'hide-context') {
      return recipe(
        `In ${location}, change \`attention.query.mode\` from \`hide-context\` to \`dim-context\`.`,
        'Reload. The same PE nodes remain focused, while the previously hidden core nodes and links return as muted context.'
      );
    }
    if (attention.query?.dependency) {
      return recipe(
        `In ${location}, change \`attention.query.dependency.depth\` from \`${attention.query.dependency.depth}\` to \`1\`.`,
        'Reload. The seed and its immediate downstream neighbors remain emphasized; the access nodes two hops away return to dimmed context.'
      );
    }
    if (attention.query?.changes) {
      return recipe(
        `In ${location}, change \`attention.query.changes.since\` to \`"2026-06-16T00:00:00Z"\`, after this example's recorded changes.`,
        'Reload. CORE-1 and the degraded core link are no longer matched by the change query; their stored timestamps and status stay unchanged.'
      );
    }
    if (attention.query?.regionIds) {
      const regionId = attention.query.regionIds[0];
      const region = topology.graph.regions.find((candidate) => candidate.id === regionId);
      const member = region.members.at(-1);
      return recipe(
        `In topology.yaml, remove \`${member}\` only from region \`${regionId}\`'s \`members\` list. Keep the node and its links.`,
        'Reload. That node becomes dimmed context instead of a focused region member, and the auto-fit hull adjusts to its remaining members.'
      );
    }
    if (attention.query) {
      return recipe(
        `In ${location}, replace the entire \`attention.query\` value with \`{ ids: [NOC], mode: dim-context }\`. Remove its other criteria; focus criteria are combined.`,
        'Reload. NOC is the only focused object, while the previous role, severity, and fiber-link matches return to context.'
      );
    }
    if (example.id === 'attention-aggregate-badge-status') {
      return recipe(
        'Keep the Access region summary collapsed. In topology.yaml, change ACC-2\'s data.severity from critical to normal.',
        'Reload. The summary\'s worst severity changes from critical to major because AGG-1 is still major. Its member-count badge remains 3.'
      );
    }
    if (attention.aggregate?.viewport) {
      return recipe(
        `In ${location}, set \`attention.aggregate.viewport.collapseBelowZoom: 0.7\` and \`expandAboveZoom: 1.0\`.`,
        'Reload, then use the zoom controls to move below 0.7: both metros collapse. Zoom above 1.0: their member nodes return. Cross each threshold without clicking summaries so the zoom policy drives this comparison.'
      );
    }
    if (attention.aggregate?.groups?.length) {
      const group = attention.aggregate.groups[0];
      return recipe(
        `In ${location}, add \`expandedGroupIds: [${group.id}]\` under \`attention.aggregate\`, alongside \`groups\`.`,
        `Reload. \`${group.label || group.id}\` starts expanded into its member nodes; other configured groups remain collapsed. This sets the initial view without a click.`
      );
    }
    if (attention.links?.grouping) {
      return recipe(
        `In ${location}, change \`attention.links.grouping.threshold\` from \`${attention.links.grouping.threshold}\` to \`4\`.`,
        'Reload. These three parallel links no longer meet the threshold, so they render individually instead of as one counted summary.'
      );
    }
    if (attention.interactive) {
      const node = topology.graph.nodes[0];
      return recipe(
        `In ${location}, change \`attention.clickMode\` from \`dim-context\` to \`hide-context\`.`,
        `Reload, then click node \`${node.id}\`. Unrelated objects disappear instead of dimming. Click empty viewport space to restore the starting topology.`
      );
    }
  }
  if (example.feature === 'regions') {
    if (example.id === 'regions-draggable-regions') {
      return recipe(
        'Drag the Site A hull by its label or border and observe both member nodes moving with it. Reload to reset the temporary movement.',
        'In stylesheet.yaml, set draggable: false on the region rule. Reload and drag the same hull again: it stays fixed, while individual node dragging remains available.'
      );
    }
    if (example.id === 'regions-region-label-placement') {
      return recipe(
        'In stylesheet.yaml, find `region[labels.placement = "side"]` and change `labelPosition` from `rightCenter` to `leftCenter`.',
        'Reload. That region\'s label moves to the opposite side; its member nodes and membership stay unchanged.'
      );
    }
    const regionId = example.id === 'regions-overlapping-regions' ? 'isis-l2' : 'isis-l1';
    return recipe(
      `In topology.yaml, remove \`R05\` only from region \`${regionId}\`'s \`members\` list. Keep R05 itself and its membership in every other region.`,
      `Reload. The \`${regionId}\` hull contracts around its remaining member. R05 and its links remain visible; the outer AS region still contains it.`
    );
  }
  const experiments = JSON.parse(readText(path.join(contentExamplesRoot, 'experiments.json')));
  const experiment = experiments[example.id];
  if (!experiment) throw new Error(`Missing reviewed experiment for ${example.id}`);
  const field = experiment.path.slice(experiment.file === 'stylesheet.yaml' ? 3 : 0).join('.');
  const location = experiment.selector
    ? `the \`${experiment.selector}\` rule in stylesheet.yaml`
    : `\`${experiment.path.slice(0, 3).join('.')}\` in topology.yaml`;
  return recipe(
    `In ${location}, set \`${field}\` to \`${JSON.stringify(experiment.value)}\`.`,
    `Reload. ${experiment.expected}`
  );

}

function expectedResultMarkdown(example, expected) {
  if (expected.renderable === false) {
    return 'This example intentionally produces a validation diagnostic. Inspect the message and source together before trying the repair below.';
  }
  return example.summary || `The viewport shows ${example.title.toLowerCase()}.`;
}

function requiredExampleSections(readme) {
  return [
    'What This Demonstrates',
    'Expected Result',
    'What To Inspect',
    'Use When'
  ].every((heading) => new RegExp(`^#{2,6}\\s+${heading}\\s*$`, 'm').test(readme));
}

function exampleIntroMarkdown(example, expected, headingLevel = 2, markdownFile = pageFile(example)) {
  const readme = readExampleFile(example, 'README.md').trim();
  if (example.introMode === 'narrative' || requiredExampleSections(readme)) return readme;
  const heading = '#'.repeat(headingLevel);
  const experiment = exampleExperiment(example, expected, markdownFile)
    .map((instruction, index) => `${index + 1}. ${instruction}`)
    .join('\n');
  return [
    readme,
    '',
    `${heading} Expected Result`,
    '',
    expectedResultMarkdown(example, expected),
    '',
    `${heading} Try It`,
    '',
    experiment
  ].join('\n');
}

function pageMarkdown(example) {
  const expected = readYaml(exampleSourceFile(example, 'expected.yaml'));
  const intro = exampleIntroMarkdown(example, expected, 2);

  return [
    '---',
    'hide:',
    '  - toc',
    '---',
    '',
    `# ${example.title}`,
    '',
    intro,
    example.introMode === 'narrative' ? undefined : '',
    example.introMode === 'narrative' ? undefined : exampleTabsMarkdown(example, expected, pageFile(example)),
    ''
  ].filter((line) => line !== undefined).join('\n');
}

function categoryMarkdown(feature, examples) {
  const markdownFile = categoryFile(feature);
  const lines = [
    `# ${featureTitle(feature)}`,
    '',
    `Explore ${featureTitle(feature).toLowerCase()} behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.`,
    ''
  ];

  for (const example of examples) {
    const expected = readYaml(exampleSourceFile(example, 'expected.yaml'));
    lines.push(`## ${example.title}`, '', exampleIntroMarkdown(example, expected, 3, markdownFile));
    if (example.introMode !== 'narrative') {
      lines.push('', exampleTabsMarkdown(example, expected, markdownFile));
    }
    lines.push('');
  }

  return lines.join('\n');
}

function groupExamples(examples) {
  return examples.reduce((groups, example) => {
    const current = groups.get(example.feature) || [];
    current.push(example);
    groups.set(example.feature, current);
    return groups;
  }, new Map());
}

function featureTitle(feature) {
  return feature
    .split('-')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function pageNavPath(example) {
  const relative = example.page.startsWith('topoviewer/')
    ? example.page.slice('topoviewer/'.length)
    : example.page;
  return `${relative}/index.md`;
}

function isRealNetworkExample(example) {
  return String(example.path || '').startsWith('integration/real-network-');
}

function isHiddenPublicIntegrationExample(example) {
  return String(example.path || '') === 'integration/complete-network-demo';
}

function integrationNavItems(examples) {
  const items = [];
  let realNetworkAdded = false;
  for (const example of examples) {
    if (!isPublicExample(example)) {
      continue;
    }
    if (isHiddenPublicIntegrationExample(example)) {
      continue;
    }
    if (isRealNetworkExample(example)) {
      if (!realNetworkAdded) {
        items.push({ 'Service Provider Network': 'examples/use-cases/service-provider-network.md' });
        realNetworkAdded = true;
      }
      continue;
    }
    items.push({ [example.title]: pageNavPath(example) });
  }
  return items;
}

function navDocument(catalog) {
  const groups = groupExamples(catalog.examples || []);
  const examples = [];
  for (const feature of groups.keys()) {
    if (feature === 'integration') continue;
    examples.push({ [featureTitle(feature)]: `examples/${feature}/index.md` });
  }
  return {
    title: 'TopoViewer',
    nav: [
      { Overview: 'index.md' },
      { Examples: examples },
      ...integrationNavItems(groups.get('integration') || [])
    ]
  };
}

function indexMarkdown(catalog) {
  const groups = groupExamples(catalog.examples || []);
  const lines = [
    '# TopoViewer Reference',
    '',
    'TopoViewer renders declarative graph and diagram documents from YAML. The canonical examples on this site are generated from `packages/topoviewer/content/examples/` so each documented behavior has one matching test fixture.',
    '',
    '| Model | YAML section | Purpose |',
    '|---|---|---|',
    '| Semantic graph | `graph.nodes`, `graph.links`, `graph.paths`, `graph.regions` | Network, service, infrastructure, or dependency facts |',
    '| Diagram primitives | `diagram.shapes`, `diagram.callouts`, `diagram.texts` | Visual explanation objects that should not pollute graph facts |',
    '',
    '## Feature Test Cases',
    ''
  ];

  for (const [feature, examples] of groups.entries()) {
    lines.push(`### ${featureTitle(feature)}`, '');
    let realNetworkAdded = false;
    for (const example of examples) {
      if (!isPublicExample(example)) {
        continue;
      }
      if (isHiddenPublicIntegrationExample(example)) {
        continue;
      }
      if (isRealNetworkExample(example)) {
        if (!realNetworkAdded) {
          lines.push('- [Service Provider Network](examples/use-cases/service-provider-network.md): One provider topology rendered as underlay, BGP, transport, service path, and failure views.');
          realNetworkAdded = true;
        }
        continue;
      }
      lines.push(`- [${example.title}](${pageNavPath(example)}): ${example.summary}`);
    }
    lines.push('');
  }

  lines.push('The important rule is simple: if an object is part of the topology, model it under `graph.*`. If it explains the topology visually, model it under `diagram.*`.', '');
  return lines.join('\n');
}

if (!fs.existsSync(catalogFile)) {
  throw new Error(`Canonical examples catalog is missing: ${catalogFile}`);
}

const catalog = readYaml(catalogFile);

removeStaleGeneratedPaths();
removeConflictingReadmeProjections(catalog);

for (const example of catalog.examples || []) {
  const shouldProjectReadme = !isPublicExample(example);
  const targets = [
    ['topology.yaml', docsExamplePath(example, 'topology.yaml')],
    ['stylesheet.yaml', docsExamplePath(example, 'stylesheet.yaml')],
    ...(shouldProjectReadme ? [['README.md', docsExamplePath(example, 'README.md')]] : []),
    ...(example.extraFiles || []).map((fileName) => [fileName, docsExamplePath(example, fileName)])
  ];

  for (const [sourceName, targetRelative] of targets) {
    const source = sourceName in { 'topology.yaml': true, 'stylesheet.yaml': true, 'README.md': true }
      ? exampleSourceFile(example, sourceName)
      : exampleExtraSourceFile(example, sourceName);
    const target = path.join(docsRoot, targetRelative);
    if (!fs.existsSync(source)) {
      throw new Error(`Example ${example.id} source file is missing: ${source}`);
    }
    const content = readText(source);
    if (checkOnly) {
      assertSynced(target, content, `${example.id} ${sourceName}`);
    } else {
      assertProjectionCanBeOverwritten(source, target, content, `${example.id} ${sourceName}`);
      if (writeTextIfChanged(target, content)) {
        console.log(`synced ${path.relative(packageRoot, source)} -> ${path.relative(docsRoot, target)}`);
      }
    }
  }

  if (isPublicExample(example)) {
    const page = pageFile(example);
    const markdown = pageMarkdown(example);
    if (checkOnly) {
      assertSynced(page, markdown, `${example.id} markdown page`);
    } else if (writeTextIfChanged(page, markdown)) {
      console.log(`generated ${path.relative(docsRoot, page)}`);
    }
  }
}

for (const [feature, examples] of groupExamples(catalog.examples || []).entries()) {
  if (feature === 'integration') continue;
  const page = categoryFile(feature);
  const markdown = categoryMarkdown(feature, examples);
  if (checkOnly) {
    assertSynced(page, markdown, `${feature} category page`);
  } else if (writeTextIfChanged(page, markdown)) {
    console.log(`generated ${path.relative(docsRoot, page)}`);
  }
}

const generatedCatalogFile = path.join(docsRoot, 'topoviewer/examples/catalog.generated.yaml');
const generatedCatalogText = dumpYaml(generatedCatalog(catalog));
if (checkOnly) {
  assertSynced(generatedCatalogFile, generatedCatalogText, 'generated examples catalog');
} else if (writeTextIfChanged(generatedCatalogFile, generatedCatalogText)) {
  console.log(`generated ${path.relative(docsRoot, generatedCatalogFile)}`);
}

const navFile = path.join(docsRoot, 'topoviewer/.nav.yml');
const navText = dumpYaml(navDocument(catalog));
if (checkOnly) {
  assertSynced(navFile, navText, 'TopoViewer nav');
} else if (writeTextIfChanged(navFile, navText)) {
  console.log(`generated ${path.relative(docsRoot, navFile)}`);
}

const indexFile = path.join(docsRoot, 'topoviewer/index.md');
const indexText = indexMarkdown(catalog);
if (checkOnly) {
  assertSynced(indexFile, indexText, 'TopoViewer index');
} else if (writeTextIfChanged(indexFile, indexText)) {
  console.log(`generated ${path.relative(docsRoot, indexFile)}`);
}
