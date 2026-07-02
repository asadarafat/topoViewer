import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { sourceFileFor } from '../../../scripts/lib/content-examples.mjs';

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
  readJson(schemaPath('topoviewer-mapper.schema.json')),
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
const contentExamplesRoot = path.join(packageRoot, 'content/examples');
const generatedCatalogFile = path.join(docsRoot, 'topoviewer/examples/catalog.generated.yaml');
const grafanaBundleRoot = path.join(repoRoot, 'labs/grafana-topoviewer/topoviewer-bundles');

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

function isExternalReference(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/') || value.startsWith('#');
}

function resolveMkdocsReference(markdownFile, reference) {
  const value = String(reference || '');
  if (!value || isExternalReference(value)) return undefined;
  if (value.startsWith('examples/')) {
    return path.resolve(docsRoot, 'topoviewer', value);
  }
  return path.resolve(path.dirname(markdownFile), value);
}

function fencedTopoviewerBlocks(markdownFile) {
  const markdown = fs.readFileSync(markdownFile, 'utf8');
  return [...markdown.matchAll(/```topoviewer\n([\s\S]*?)```/g)]
    .map((match) => yaml.load(match[1]) || {});
}

function expectedCaseFiles(example) {
  return {
    topology: sourceFileFor(contentExamplesRoot, example, 'topology.yaml'),
    stylesheet: sourceFileFor(contentExamplesRoot, example, 'stylesheet.yaml'),
    readme: sourceFileFor(contentExamplesRoot, example, 'README.md'),
    expected: sourceFileFor(contentExamplesRoot, example, 'expected.yaml')
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
    'canonical examples catalog',
    'https://topoviewer.dev/schemas/topoviewer-examples-catalog.schema.json',
    readYaml(contentCatalogFile)
  );

  const catalog = readYaml(contentCatalogFile);
  for (const example of catalog.examples || []) {
    const source = expectedCaseFiles(example);
    const generated = docsCaseFiles(example);

    validateFile(`example ${example.id} topology YAML`, 'https://topoviewer.dev/schemas/topoviewer-topology.schema.json', source.topology);
    validateFile(`example ${example.id} stylesheet YAML`, 'https://topoviewer.dev/schemas/topoviewer-stylesheet.schema.json', source.stylesheet);
    validateFile(`example ${example.id} expected YAML`, 'https://topoviewer.dev/schemas/topoviewer-test-expected.schema.json', source.expected);
    validateNow(`example ${example.id} composed TopoViewer document`, 'https://topoviewer.dev/schemas/topoviewer.schema.json', compose(source.topology, source.stylesheet));

    if (!fs.existsSync(source.readme)) {
      fail(`example ${example.id} README is missing: ${source.readme}`);
    }

    assertGeneratedCopy(source.topology, generated.topology, `${example.id} topology`);
    assertGeneratedCopy(source.stylesheet, generated.stylesheet, `${example.id} stylesheet`);
    assertGeneratedCopy(source.readme, generated.readme, `${example.id} README`);

    if (example.publicPage === false) {
      continue;
    }

    const markdownFile = pageMarkdownPath(example.page);
    if (!markdownFile) {
      fail(`example ${example.id} generated page does not exist: ${example.page}`);
      continue;
    }

    const expected = readYaml(source.expected);
    const blocks = fencedTopoviewerBlocks(markdownFile);
    if (expected.renderable === false) {
      if (blocks.length) {
        fail(`example ${example.id} is non-renderable but generated page contains a topoviewer fence`);
      }
      continue;
    }

    if (!blocks.length) {
      fail(`example ${example.id} page has no topoviewer fenced block: ${example.page}`);
      continue;
    }

    blocks.forEach((block, index) => {
      validateNow(`example ${example.id} MkDocs fenced block ${index + 1}`, 'https://topoviewer.dev/schemas/topoviewer-mkdocs-block.schema.json', block);
    });

    const block = blocks.find((candidate) => {
      const candidateTopology = resolveMkdocsReference(markdownFile, candidate.topology);
      const candidateStylesheet = resolveMkdocsReference(markdownFile, candidate.stylesheet);
      return candidateTopology === generated.topology && candidateStylesheet === generated.stylesheet;
    });
    if (!block) {
      fail(`example ${example.id} page has no topoviewer fence for the canonical fixture`);
      continue;
    }

    const blockTopology = resolveMkdocsReference(markdownFile, block.topology);
    const blockStylesheet = resolveMkdocsReference(markdownFile, block.stylesheet);
    if (blockTopology !== generated.topology) {
      fail(`example ${example.id} topology disagrees with MkDocs block: ${generated.topology} != ${block.topology}`);
    }
    if (blockStylesheet !== generated.stylesheet) {
      fail(`example ${example.id} stylesheet disagrees with MkDocs block: ${generated.stylesheet} != ${block.stylesheet}`);
    }
  }
} else {
  fail(`Canonical examples catalog is missing: ${contentCatalogFile}`);
}

if (fs.existsSync(generatedCatalogFile)) {
  validateNow('generated examples catalog', 'https://topoviewer.dev/schemas/topoviewer-examples-manifest.schema.json', readYaml(generatedCatalogFile));
}

if (fs.existsSync(grafanaBundleRoot)) {
  fs.readdirSync(grafanaBundleRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      const bundleDir = path.join(grafanaBundleRoot, entry.name);
      const mapperFiles = fs.readdirSync(bundleDir)
        .filter((file) => file.endsWith('.mapper.tv.yaml'))
        .map((file) => path.join(bundleDir, file));
      for (const mapperFile of mapperFiles) {
        validateFile(
          `Grafana bundle ${entry.name} mapper YAML`,
          'https://topoviewer.dev/schemas/topoviewer-mapper.schema.json',
          mapperFile
        );
      }
    });
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
