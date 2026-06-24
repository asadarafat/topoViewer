import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(packageRoot, '../..');
const repoRoot = monorepoRoot;
const schemaDir = path.join(packageRoot, 'schemas');
const defaultDocsRoot = path.join(monorepoRoot, 'docs');
const docsRoot = path.resolve(process.env.TOPOVIEWER_DOCS_ROOT || defaultDocsRoot);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
}

function schemaPath(name) {
  return path.join(schemaDir, name);
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function formatErrors(ajv, errors) {
  return ajv.errorsText(errors, { separator: '\n  ' });
}

function toPosix(value) {
  return value.split(path.sep).join(path.posix.sep);
}

const schemas = [
  readJson(schemaPath('topoviewer.schema.json')),
  readJson(schemaPath('topoviewer-topology.schema.json')),
  readJson(schemaPath('topoviewer-stylesheet.schema.json')),
  readJson(schemaPath('topoviewer-mkdocs-block.schema.json')),
  readJson(schemaPath('topoviewer-examples-catalog.schema.json')),
  readJson(schemaPath('topoviewer-examples-manifest.schema.json')),
  readJson(schemaPath('topoviewer-test-expected.schema.json'))
];

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  allowUnionTypes: true
});

for (const schema of schemas) {
  ajv.addSchema(schema);
}

const checks = [];
const contentCatalogFile = path.join(packageRoot, 'content/examples/catalog.yaml');
const catalogFile = path.join(packageRoot, 'examples/test-cases/catalog.yaml');
const generatedCatalogFile = path.join(docsRoot, 'topoviewer/examples/catalog.generated.yaml');

function validateNow(name, schemaId, document) {
  checks.push({ name, schemaId, document });
}

function validateFile(name, schemaId, filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`${name} does not exist: ${filePath}`);
    return;
  }
  validateNow(name, schemaId, readYaml(filePath));
}

function compose(topologyFile, stylesheetFile) {
  const topology = readYaml(topologyFile);
  const stylesheet = readYaml(stylesheetFile);
  return {
    ...topology,
    ...stylesheet,
    graph: topology.graph || {},
    diagram: topology.diagram || {},
    toggles: topology.toggles || stylesheet.toggles || []
  };
}

function pageMarkdownPath(page) {
  const indexPage = path.join(docsRoot, page, 'index.md');
  if (fs.existsSync(indexPage)) return indexPage;
  const markdownPage = path.join(docsRoot, `${page}.md`);
  if (fs.existsSync(markdownPage)) return markdownPage;
  return undefined;
}

function fencedTopoviewerBlock(markdownFile) {
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  const fencedBlock = markdown.match(/```topoviewer\n([\s\S]*?)```/);
  return fencedBlock ? yaml.load(fencedBlock[1]) || {} : undefined;
}

function expectedCaseFiles(example) {
  const dir = path.join(packageRoot, 'examples/test-cases', example.path);
  return {
    dir,
    topology: path.join(dir, 'topology.yaml'),
    stylesheet: path.join(dir, 'stylesheet.yaml'),
    readme: path.join(dir, 'README.md'),
    expected: path.join(dir, 'expected.yaml')
  };
}

function docsCaseFiles(example) {
  const rel = path.join('topoviewer/examples', example.path);
  return {
    topology: path.join(docsRoot, rel, 'topology.yaml'),
    stylesheet: path.join(docsRoot, rel, 'stylesheet.yaml'),
    readme: path.join(docsRoot, rel, 'README.md')
  };
}

function assertGeneratedCopy(source, target, label) {
  if (!fs.existsSync(target)) {
    fail(`${label} generated file is missing: ${target}`);
    return;
  }
  const sourceText = fs.readFileSync(source, 'utf8');
  const targetText = fs.readFileSync(target, 'utf8');
  if (sourceText !== targetText) {
    fail(`${label} generated file is out of sync: ${toPosix(path.relative(repoRoot, target))}`);
  }
}

if (fs.existsSync(contentCatalogFile)) {
  validateNow(
    'canonical content examples catalog',
    'https://topoviewer.dev/schemas/topoviewer-examples-catalog.schema.json',
    readYaml(contentCatalogFile)
  );
} else {
  fail(`Canonical content examples catalog is missing: ${contentCatalogFile}`);
}

if (!fs.existsSync(catalogFile)) {
  fail(`Canonical examples catalog is missing: ${catalogFile}`);
} else {
  const catalog = readYaml(catalogFile);
  validateNow('canonical examples catalog', 'https://topoviewer.dev/schemas/topoviewer-examples-catalog.schema.json', catalog);

  for (const example of catalog.examples || []) {
    const source = expectedCaseFiles(example);
    const generated = docsCaseFiles(example);

    validateFile(`test case ${example.id} topology YAML`, 'https://topoviewer.dev/schemas/topoviewer-topology.schema.json', source.topology);
    validateFile(`test case ${example.id} stylesheet YAML`, 'https://topoviewer.dev/schemas/topoviewer-stylesheet.schema.json', source.stylesheet);
    validateFile(`test case ${example.id} expected YAML`, 'https://topoviewer.dev/schemas/topoviewer-test-expected.schema.json', source.expected);
    validateNow(`test case ${example.id} composed TopoViewer document`, 'https://topoviewer.dev/schemas/topoviewer.schema.json', compose(source.topology, source.stylesheet));

    if (!fs.existsSync(source.readme)) {
      fail(`test case ${example.id} README is missing: ${source.readme}`);
    }

    assertGeneratedCopy(source.topology, generated.topology, `${example.id} topology`);
    assertGeneratedCopy(source.stylesheet, generated.stylesheet, `${example.id} stylesheet`);
    assertGeneratedCopy(source.readme, generated.readme, `${example.id} README`);

    const markdownFile = pageMarkdownPath(example.page);
    if (!markdownFile) {
      fail(`test case ${example.id} generated page does not exist: ${example.page}`);
      continue;
    }

    const expected = readYaml(source.expected);
    const block = fencedTopoviewerBlock(markdownFile);
    if (expected.renderable === false) {
      if (block) {
        fail(`test case ${example.id} is non-renderable but generated page contains a topoviewer fence`);
      }
      continue;
    }

    if (!block) {
      fail(`test case ${example.id} page has no topoviewer fenced block: ${example.page}`);
      continue;
    }

    validateNow(`test case ${example.id} MkDocs fenced block`, 'https://topoviewer.dev/schemas/topoviewer-mkdocs-block.schema.json', block);

    const blockTopology = path.resolve(path.dirname(markdownFile), block.topology || '');
    const blockStylesheet = path.resolve(path.dirname(markdownFile), block.stylesheet || '');
    if (blockTopology !== generated.topology) {
      fail(`test case ${example.id} topology disagrees with MkDocs block: ${generated.topology} != ${block.topology}`);
    }
    if (blockStylesheet !== generated.stylesheet) {
      fail(`test case ${example.id} stylesheet disagrees with MkDocs block: ${generated.stylesheet} != ${block.stylesheet}`);
    }
  }
}

if (fs.existsSync(generatedCatalogFile)) {
  validateNow('generated examples catalog', 'https://topoviewer.dev/schemas/topoviewer-examples-manifest.schema.json', readYaml(generatedCatalogFile));
}

for (const check of checks) {
  const validate = ajv.getSchema(check.schemaId);
  if (!validate) {
    fail(`Schema not registered: ${check.schemaId}`);
    continue;
  }

  if (!validate(check.document)) {
    fail(`${check.name} failed schema validation:\n  ${formatErrors(ajv, validate.errors)}`);
    continue;
  }

  console.log(`validated ${check.name}`);
}
