import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageRoot, '../..');
const repoRoot = monorepoRoot;
const defaultDocsRoot = path.join(monorepoRoot, 'docs');
const catalogFile = path.join(packageRoot, 'examples/test-cases/catalog.yaml');
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

function caseDir(example) {
  return path.join(packageRoot, 'examples/test-cases', example.path);
}

function docsExamplePath(example, fileName) {
  return path.posix.join('topoviewer/examples', example.path, fileName);
}

function pageFile(example) {
  return path.join(docsRoot, example.page, 'index.md');
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
      const expected = readYaml(path.join(caseDir(example), 'expected.yaml'));
      return {
        id: example.id,
        title: example.title,
        feature: example.feature,
        path: example.path,
        page: example.page,
        renderable: expected.renderable,
        topology: includePath(docsExamplePath(example, 'topology.yaml')),
        stylesheet: includePath(docsExamplePath(example, 'stylesheet.yaml')),
        expected: includePath(docsExamplePath(example, 'expected.yaml')),
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

function pageMarkdown(example) {
  const dir = caseDir(example);
  const readme = readText(path.join(dir, 'README.md')).trim();
  const expected = readYaml(path.join(dir, 'expected.yaml'));

  return [
    '---',
    'hide:',
    '  - toc',
    '---',
    '',
    `# ${example.title}`,
    '',
    readme,
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
    const dir = caseDir(example);
    const readme = readText(path.join(dir, 'README.md')).trim();
    const expected = readYaml(path.join(dir, 'expected.yaml'));
    lines.push(`## ${example.title}`, '', readme, '', exampleTabsMarkdown(example, expected, markdownFile), '');
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

function navDocument(catalog) {
  const groups = groupExamples(catalog.examples || []);
  const reference = [];
  for (const [feature, examples] of groups.entries()) {
    if (feature === 'integration') continue;
    reference.push({ [featureTitle(feature)]: `reference/${feature}/index.md` });
  }
  return {
    title: 'TopoViewer',
    nav: [
      { Overview: 'index.md' },
      { Reference: reference },
      ...((groups.get('integration') || []).map((example) => ({ [example.title]: pageNavPath(example) })))
    ]
  };
}

function indexMarkdown(catalog) {
  const groups = groupExamples(catalog.examples || []);
  const lines = [
    '# TopoViewer Reference',
    '',
    'TopoViewer renders declarative graph and diagram documents from YAML. The canonical examples on this site are generated from `examples/test-cases/` in the npm package so each documented behavior has one matching test fixture.',
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
    for (const example of examples) {
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
  const dir = caseDir(example);
  const targets = [
    ['topology.yaml', docsExamplePath(example, 'topology.yaml')],
    ['stylesheet.yaml', docsExamplePath(example, 'stylesheet.yaml')],
    ['README.md', docsExamplePath(example, 'README.md')],
    ['expected.yaml', docsExamplePath(example, 'expected.yaml')]
  ];

  for (const [sourceName, targetRelative] of targets) {
    const source = path.join(dir, sourceName);
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

  const page = pageFile(example);
  const markdown = pageMarkdown(example);
  if (checkOnly) {
    assertSynced(page, markdown, `${example.id} markdown page`);
  } else if (writeTextIfChanged(page, markdown)) {
    console.log(`generated ${path.relative(docsRoot, page)}`);
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
