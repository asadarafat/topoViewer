import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseDocument } from 'yaml';

const root = process.cwd();
const args = process.argv.slice(2);
const write = args.includes('--write');
const help = args.includes('--help') || args.includes('-h');
const requestedPaths = args.filter((value) => !value.startsWith('--'));
const defaultPaths = [
  'packages/topoviewer/content/examples',
  'labs/grafana-topoviewer/topoviewer-bundles',
  'packages/vscode-topoviewer/tests/extension/fixture/topology.yaml'
];

if (help) {
  console.log(`Usage: npm run migrate:identity -- [--write] [path ...]

Checks topology/stylesheet YAML pairs for the canonical 0.2 identity contract.
Pass --write to apply the migration. Without --write, required changes fail the
command so it can be used as a repository gate.`);
  process.exit(0);
}

const runtime = await import(pathToFileURL(path.join(root, 'packages/topoviewer/dist/topoviewer.mjs')));

function withinRoot(value) {
  const resolved = path.resolve(root, value);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Migration path must stay inside the repository: ${value}`);
  }
  return resolved;
}

function topologyFile(value) {
  const base = path.basename(value);
  return /(?:^|-)topology\.ya?ml$/.test(base) || /\.topo\.tv\.ya?ml$/.test(base);
}

function collectTopologyFiles(value, result = []) {
  const resolved = withinRoot(value);
  if (!fs.existsSync(resolved)) throw new Error(`Migration path does not exist: ${value}`);
  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    if (!topologyFile(resolved)) throw new Error(`Expected a topology YAML file: ${value}`);
    result.push(resolved);
    return result;
  }
  for (const entry of fs.readdirSync(resolved, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const child = path.join(resolved, entry.name);
    if (entry.isDirectory()) collectTopologyFiles(child, result);
    else if (entry.isFile() && topologyFile(child)) result.push(child);
  }
  return result;
}

function stylesheetPath(topologyPath) {
  const base = path.basename(topologyPath);
  if (base === 'topology.yaml' || base === 'topology.yml') {
    return path.join(path.dirname(topologyPath), base === 'topology.yml' ? 'stylesheet.yml' : 'stylesheet.yaml');
  }
  if (/-topology\.ya?ml$/.test(base)) {
    const paired = topologyPath.replace(/-topology\.(ya?ml)$/, '-stylesheet.$1');
    if (fs.existsSync(paired)) return paired;
    return path.join(path.dirname(topologyPath), base.endsWith('.yml') ? 'stylesheet.yml' : 'stylesheet.yaml');
  }
  return topologyPath.replace(/\.topo\.tv\.(ya?ml)$/, '.style.tv.$1');
}

function sourceDocument(file, required = true) {
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`Required source does not exist: ${path.relative(root, file)}`);
    return undefined;
  }
  const text = fs.readFileSync(file, 'utf8');
  const document = parseDocument(text, { keepSourceTokens: true, lineCounter: false, prettyErrors: true });
  if (document.errors.length) {
    throw new Error(`${path.relative(root, file)}: ${document.errors.map((error) => error.message).join('; ')}`);
  }
  const value = document.toJS();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path.relative(root, file)} must contain a YAML mapping.`);
  }
  return { document, file, text, value };
}

function plainRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sameValue(left, right) {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length
      && left.every((value, index) => sameValue(value, right[index]));
  }
  if (!plainRecord(left) || !plainRecord(right)) return false;
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && sameValue(left[key], right[key]));
}

function reconcile(document, current, next, yamlPath = []) {
  if (sameValue(current, next)) return;
  if (plainRecord(current) && plainRecord(next)) {
    for (const key of Object.keys(current)) {
      if (!Object.prototype.hasOwnProperty.call(next, key)) document.deleteIn([...yamlPath, key]);
    }
    for (const [key, value] of Object.entries(next)) {
      if (!Object.prototype.hasOwnProperty.call(current, key)) {
        if (yamlPath.length === 0 && key === 'version' && Array.isArray(document.contents?.items)) {
          document.contents.items.unshift(document.createPair(key, value));
        } else {
          document.setIn([...yamlPath, key], value);
        }
      }
      else reconcile(document, current[key], value, [...yamlPath, key]);
    }
    return;
  }
  if (Array.isArray(current) && Array.isArray(next)) {
    const shared = Math.min(current.length, next.length);
    for (let index = 0; index < shared; index += 1) reconcile(document, current[index], next[index], [...yamlPath, index]);
    for (let index = current.length - 1; index >= next.length; index -= 1) document.deleteIn([...yamlPath, index]);
    for (let index = shared; index < next.length; index += 1) document.addIn(yamlPath, next[index]);
    return;
  }
  document.setIn(yamlPath, next);
}

function migratedText(source, nextValue) {
  if (!source) {
    const document = parseDocument('{}\n');
    reconcile(document, {}, nextValue);
    return document.toString({ flowCollectionPadding: false, lineWidth: 0 });
  }
  reconcile(source.document, source.value, nextValue);
  return source.document.toString({ flowCollectionPadding: false, lineWidth: 0 });
}

const topologyFiles = [...new Set((requestedPaths.length ? requestedPaths : defaultPaths)
  .flatMap((value) => collectTopologyFiles(value)))]
  .sort();
const plannedWrites = new Map();

function addPlan(file, text) {
  const existing = plannedWrites.get(file);
  if (existing !== undefined && existing !== text) {
    throw new Error(`Multiple topology documents produced conflicting migrations for ${path.relative(root, file)}.`);
  }
  plannedWrites.set(file, text);
}

for (const topologyPath of topologyFiles) {
  const topology = sourceDocument(topologyPath);
  const pairedStylesheetPath = stylesheetPath(topologyPath);
  const stylesheet = sourceDocument(pairedStylesheetPath, false);
  const migrated = runtime.migrateTopoBundle({ stylesheet: stylesheet?.value, topology: topology.value });

  runtime.validateTopoDocument(migrated.topology, path.relative(root, topologyPath));
  runtime.composeTopoViewerDocument(migrated.topology, migrated.stylesheet, {
    validationContext: `${path.relative(root, topologyPath)} bundle`
  });
  const repeated = runtime.migrateTopoBundle(migrated);
  if (!sameValue(repeated, migrated)) throw new Error(`${path.relative(root, topologyPath)} migration is not idempotent.`);

  const topologyText = migratedText(topology, migrated.topology);
  if (topologyText !== topology.text) addPlan(topologyPath, topologyText);
  if (migrated.stylesheet) {
    const stylesheetText = migratedText(stylesheet, migrated.stylesheet);
    if (!stylesheet || stylesheetText !== stylesheet.text) addPlan(pairedStylesheetPath, stylesheetText);
  }
}

const plans = [...plannedWrites].map(([file, text]) => ({ file, text }));

if (!plans.length) {
  console.log(`Canonical identity migration is current for ${topologyFiles.length} topology bundle(s).`);
  process.exit(0);
}

if (!write) {
  console.error(`Canonical identity migration is required for ${plans.length} file(s):`);
  plans.forEach((plan) => console.error(`- ${path.relative(root, plan.file)}`));
  console.error('Run npm run migrate:identity -- --write [path ...] to apply it.');
  process.exit(1);
}

for (const plan of plans) {
  fs.mkdirSync(path.dirname(plan.file), { recursive: true });
  fs.writeFileSync(plan.file, plan.text);
}
console.log(`Migrated ${plans.length} file(s) across ${topologyFiles.length} topology bundle(s).`);
