import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { sourceFileFor } from '../../../scripts/lib/content-examples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageRoot, '../..');
const repoRoot = monorepoRoot;
const defaultDocsRoot = path.join(monorepoRoot, 'docs');
const contentExamplesRoot = path.join(packageRoot, 'content/examples');
const catalogFile = path.join(contentExamplesRoot, 'catalog.yaml');
const checkOnly = process.argv.includes('--check');

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
  return path.join(docsRoot, 'topoviewer/reference', feature, 'index.md');
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
  const keys = ['graphNodes', 'shapes', 'visibleCallouts', 'minVisibleEdges', 'minRegions'];
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
        readme: includePath(docsExamplePath(example, 'README.md'))
      };
    })
  };
}

function renderBlock(example, expected, markdownFile = pageFile(example)) {
  if (expected.renderable === false) {
    return [
      '!!! warning "Non-renderable validation fixture"',
      '    This test case intentionally violates semantic validation. It is documented so the linter behavior is testable and stable.'
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

function featureInspectHints(feature) {
  const hints = {
    attention: [
      'Review the attention state in the live viewport and compare it with the optional Attention YAML tab.',
      'Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.'
    ],
    callouts: [
      'Inspect `diagram.callouts` for visual notes that do not change graph semantics.',
      'Check the stylesheet rule that controls callout color, border, and text treatment.'
    ],
    edges: [
      'Inspect `graph.links` for endpoint IDs and labels.',
      'Compare line, arrow, label, and curve style keys in the stylesheet.'
    ],
    graph: [
      'Inspect `graph.nodes`, `graph.links`, and object labels.',
      'Check how the stylesheet turns semantic facts into visual presentation.'
    ],
    harness: [
      'Use the example as an authoring template in the browser harness.',
      'Apply changes and confirm the rendered viewport stays in sync with YAML.'
    ],
    layout: [
      'Inspect `layout` options and node positions.',
      'Check whether positions are authored manually, inferred, or preserved by layout settings.'
    ],
    nodes: [
      'Inspect node labels, data, icon definitions, and body shape settings.',
      'Compare label, badge, status, icon, border, and underlay style keys.'
    ],
    paths: [
      'Inspect `graph.paths` and the nodes or links they traverse.',
      'Check lane, pipe, label, and arrow styling for service-path readability.'
    ],
    regions: [
      'Inspect `graph.regions` membership and label placement.',
      'Check padding and region style keys that prevent overlap with member nodes.'
    ],
    shapes: [
      'Inspect `diagram.shapes` and confirm they are visual explanation objects, not graph facts.',
      'Check shape geometry, fill, stroke, z-index, and label behavior.'
    ],
    styling: [
      'Inspect selector order and the style keys applied by each rule.',
      'Compare broad defaults with more specific label or data selectors.'
    ],
    validation: [
      'Inspect the invalid or edge-case YAML and the expected diagnostic behavior.',
      'Use this example to understand what CI should reject.'
    ]
  };
  return hints[feature] || [
    'Inspect the topology YAML for semantic objects.',
    'Inspect the stylesheet YAML for the visual contract.'
  ];
}

function featureUseWhen(feature) {
  const useWhen = {
    attention: 'Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.',
    callouts: 'Use this pattern when the diagram needs explanatory annotations without changing graph semantics.',
    edges: 'Use this pattern when link readability, routing, arrowheads, or edge labels matter.',
    graph: 'Use this pattern when modeling the core semantic graph.',
    harness: 'Use this pattern when building browser or VS Code authoring workflows.',
    integration: 'Use this pattern when documenting how TopoViewer fits into another system, dashboard, or operational workflow.',
    layout: 'Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.',
    nodes: 'Use this pattern when node identity, iconography, labels, status, or shape treatment matters.',
    paths: 'Use this pattern when visualizing service paths, dependency paths, or multi-hop routes.',
    regions: 'Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.',
    shapes: 'Use this pattern when adding visual explanation objects around a graph.',
    styling: 'Use this pattern when building reusable visual rules from labels and data.',
    validation: 'Use this pattern when documenting lint, schema, or invalid-input behavior.'
  };
  return useWhen[feature] || 'Use this pattern when documenting a reusable TopoViewer behavior.';
}

function expectedResultMarkdown(example, expected) {
  if (expected.renderable === false) {
    return 'This fixture should not render as a normal topology. It should produce the documented validation behavior without hiding the diagnostic.';
  }

  const metadata = compactExpectedMetadata(expected);
  const details = metadata
    ? Object.entries(metadata)
      .map(([key, value]) => `\`${key}\`: \`${JSON.stringify(value)}\``)
      .join(', ')
    : undefined;

  return [
    `The live viewport should render "${example.title}" without blocking diagnostics.`,
    example.summary ? `It should show: ${example.summary}` : undefined,
    details ? `The test metadata expects ${details}.` : undefined
  ].filter(Boolean).join(' ');
}

function requiredExampleSections(readme) {
  return [
    'What This Demonstrates',
    'Expected Result',
    'What To Inspect',
    'Use When'
  ].every((heading) => new RegExp(`^#{2,6}\\s+${heading}\\s*$`, 'm').test(readme));
}

function exampleIntroMarkdown(example, expected, headingLevel = 2) {
  const readme = readExampleFile(example, 'README.md').trim();
  if (requiredExampleSections(readme)) {
    return readme;
  }

  const heading = '#'.repeat(headingLevel);
  const inspect = featureInspectHints(example.feature)
    .map((hint) => `- ${hint}`)
    .join('\n');

  return [
    `${heading} What This Demonstrates`,
    '',
    readme,
    '',
    `${heading} Expected Result`,
    '',
    expectedResultMarkdown(example, expected),
    '',
    `${heading} What To Inspect`,
    '',
    inspect,
    '',
    `${heading} Use When`,
    '',
    featureUseWhen(example.feature)
  ].join('\n');
}

function pageMarkdown(example) {
  const expected = readYaml(exampleSourceFile(example, 'expected.yaml'));

  return [
    '---',
    'hide:',
    '  - toc',
    '---',
    '',
    `# ${example.title}`,
    '',
    exampleIntroMarkdown(example, expected, 2),
    '',
    exampleTabsMarkdown(example, expected, pageFile(example)),
    ''
  ].join('\n');
}

function categoryMarkdown(feature, examples) {
  const markdownFile = categoryFile(feature);
  const lines = [
    `# ${featureTitle(feature)}`,
    '',
    `These examples document the ${featureTitle(feature).toLowerCase()} behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.`,
    ''
  ];

  for (const example of examples) {
    const expected = readYaml(exampleSourceFile(example, 'expected.yaml'));
    lines.push(`## ${example.title}`, '', exampleIntroMarkdown(example, expected, 3), '', exampleTabsMarkdown(example, expected, markdownFile), '');
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
        items.push({ 'Real Network Demo': 'examples/real-network-demo.md' });
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
  const reference = [];
  for (const feature of groups.keys()) {
    if (feature === 'integration') continue;
    reference.push({ [featureTitle(feature)]: `reference/${feature}/index.md` });
  }
  return {
    title: 'TopoViewer',
    nav: [
      { Overview: 'index.md' },
      { Reference: reference },
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
    '| Diagram primitives | `diagram.shapes`, `diagram.callouts` | Visual explanation objects that should not pollute graph facts |',
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
          lines.push('- [Real Network Demo](examples/real-network-demo.md): One provider topology rendered as underlay, BGP, transport, service path, and failure views.');
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

for (const example of catalog.examples || []) {
  const targets = [
    ['topology.yaml', docsExamplePath(example, 'topology.yaml')],
    ['stylesheet.yaml', docsExamplePath(example, 'stylesheet.yaml')],
    ['README.md', docsExamplePath(example, 'README.md')]
  ];

  for (const [sourceName, targetRelative] of targets) {
    const source = exampleSourceFile(example, sourceName);
    const target = path.join(docsRoot, targetRelative);
    if (!fs.existsSync(source)) {
      throw new Error(`Example ${example.id} source file is missing: ${source}`);
    }
    const content = readText(source);
    if (checkOnly) {
      assertSynced(target, content, `${example.id} ${sourceName}`);
    } else if (writeTextIfChanged(target, content)) {
      console.log(`synced ${path.relative(packageRoot, source)} -> ${path.relative(docsRoot, target)}`);
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
