import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { lintTopoDocument } from '../dist/topoviewer.mjs';
import { sourceFileFor } from '../../../scripts/lib/content-examples.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');
const contentExamplesRoot = path.join(packageRoot, 'content/examples');

function readYaml(filePath) {
  return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
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

function catalogChecks() {
  const catalogFile = path.join(contentExamplesRoot, 'catalog.yaml');
  if (!fs.existsSync(catalogFile)) return [];
  const catalog = readYaml(catalogFile);
  return (catalog.examples || []).map((example) => {
    return {
      name: `example:${example.id}`,
      topology: sourceFileFor(contentExamplesRoot, example, 'topology.yaml'),
      stylesheet: sourceFileFor(contentExamplesRoot, example, 'stylesheet.yaml'),
      expected: sourceFileFor(contentExamplesRoot, example, 'expected.yaml')
    };
  });
}

function expectedCodes(filePath, severity) {
  const expected = readYaml(filePath);
  return new Set(expected.semantic?.[severity] || []);
}

function codes(items) {
  return new Set(items.map((item) => item.code));
}

function difference(left, right) {
  return [...left].filter((item) => !right.has(item));
}

let failures = 0;

for (const check of catalogChecks()) {
  const document = compose(check.topology, check.stylesheet);
  const issues = lintTopoDocument(document);
  const errors = issues.filter((item) => item.severity === 'error');
  const warnings = issues.filter((item) => item.severity === 'warning');
  const actualErrorCodes = codes(errors);
  const actualWarningCodes = codes(warnings);
  const expectedErrorCodes = expectedCodes(check.expected, 'errors');
  const expectedWarningCodes = expectedCodes(check.expected, 'warnings');

  for (const item of issues) {
    const prefix = item.severity === 'error' ? 'ERROR' : 'WARN';
    console.log(`${prefix} ${check.name} ${item.code}${item.path ? ` ${item.path}` : ''}: ${item.message}`);
  }

  const missingErrors = difference(expectedErrorCodes, actualErrorCodes);
  const unexpectedErrors = difference(actualErrorCodes, expectedErrorCodes);
  const missingWarnings = difference(expectedWarningCodes, actualWarningCodes);
  const unexpectedWarnings = difference(actualWarningCodes, expectedWarningCodes);

  for (const code of missingErrors) {
    console.log(`ERROR ${check.name}: expected semantic error "${code}" was not reported`);
  }
  for (const code of unexpectedErrors) {
    console.log(`ERROR ${check.name}: unexpected semantic error "${code}" was reported`);
  }
  for (const code of missingWarnings) {
    console.log(`ERROR ${check.name}: expected semantic warning "${code}" was not reported`);
  }
  for (const code of unexpectedWarnings) {
    console.log(`ERROR ${check.name}: unexpected semantic warning "${code}" was reported`);
  }

  const checkFailures = missingErrors.length + unexpectedErrors.length + missingWarnings.length + unexpectedWarnings.length;
  failures += checkFailures;
  console.log(`linted ${check.name}: ${errors.length} error(s), ${warnings.length} warning(s), ${checkFailures} expectation failure(s)`);
}

if (failures) {
  console.error(`TopoViewer semantic lint failed with ${failures} expectation failure(s).`);
  process.exit(1);
}
