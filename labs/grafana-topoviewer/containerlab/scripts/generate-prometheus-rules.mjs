#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

let yaml;

async function loadYaml() {
  const candidates = [
    'js-yaml',
    pathToFileURL(path.join(process.cwd(), 'scripts/node_modules/js-yaml/index.js')).href,
    pathToFileURL(path.join(process.cwd(), 'node_modules/js-yaml/index.js')).href
  ];
  for (const candidate of candidates) {
    try {
      return await import(candidate);
    } catch (error) {
      if (error?.code !== 'ERR_MODULE_NOT_FOUND' && error?.code !== 'ERR_UNSUPPORTED_DIR_IMPORT') throw error;
    }
  }
  throw new Error('Missing js-yaml. In a standalone lab checkout, run: npm --prefix scripts install');
}

function usage() {
  return [
    'Usage:',
    '  node generate-prometheus-rules.mjs --topology <file> --output <file> [options]',
    '',
    'Options:',
    '  --check                      Fail when the output file is not in sync.',
    '  --group <name>               Prometheus rule group name. Default: topoviewer.',
    '  --interval <duration>        Prometheus rule interval. Default: 5s.',
    '  --identity-label <label>     Output label carrying graph identity. Default: topology.',
    '  --identity-value <value>     Output identity value. Default: graph.id.',
    '  --stdout                     Write generated rules to stdout instead of --output.',
    '',
    'Telemetry binding shape:',
    '  graph.links[].data.telemetry.up.metric',
    '  graph.links[].data.telemetry.up.labels',
    '  graph.links[].directions.<direction>.data.telemetry.bps.metric',
    '  graph.links[].directions.<direction>.data.telemetry.bps.labels'
  ].join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument "${token}".\n${usage()}`);
    }
    const key = token.slice(2);
    if (key === 'check' || key === 'stdout') {
      args[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}.\n${usage()}`);
    }
    args[key] = value;
    index += 1;
  }
  return args;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function recordValue(value) {
  return isRecord(value) ? value : undefined;
}

function asRuleLabelValue(value) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function orderedEntries(record, preferredOrder = []) {
  const seen = new Set();
  const entries = [];
  for (const key of preferredOrder) {
    if (record[key] === undefined) continue;
    entries.push([key, record[key]]);
    seen.add(key);
  }
  for (const key of Object.keys(record).sort()) {
    if (!seen.has(key)) entries.push([key, record[key]]);
  }
  return entries;
}

function prometheusQuote(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function prometheusSelector(metric, labels) {
  const labelEntries = orderedEntries(labels, ['source', 'interface_name', 'interface', 'direction', 'link_id']);
  if (!labelEntries.length) return metric;
  const selector = labelEntries.map(([key, value]) => `${key}="${prometheusQuote(value)}"`).join(',');
  return `${metric}{${selector}}`;
}

function generatedRecordName(graphId, suffix) {
  const slug = String(graphId || 'graph').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'graph';
  return `topoviewer_${slug}_${suffix}`;
}

function bindingLabels(binding) {
  const labels = recordValue(binding.labels);
  if (labels) return labels;
  const result = {};
  for (const [sourceKey, targetKey] of [
    ['source', 'source'],
    ['interface_name', 'interface_name'],
    ['interfaceName', 'interface_name'],
    ['interface', 'interface']
  ]) {
    const value = asRuleLabelValue(binding[sourceKey]);
    if (value !== undefined) result[targetKey] = value;
  }
  return result;
}

function outputLabels(labels) {
  return Object.fromEntries(
    orderedEntries(labels, ['topology', 'source_id', 'node_id', 'link_id', 'direction', 'source', 'target', 'interface'])
      .flatMap(([key, value]) => {
        const normalized = asRuleLabelValue(value);
        return normalized === undefined ? [] : [[key, normalized]];
      })
  );
}

function ruleFromBinding(binding, context, defaults, errors) {
  if (!binding) return undefined;
  if (!isRecord(binding)) {
    errors.push(`${context}: telemetry binding must be a mapping.`);
    return undefined;
  }

  const record = stringValue(binding.record) || defaults.record;
  const expr = stringValue(binding.expr);
  const metric = stringValue(binding.metric);
  if (!record) errors.push(`${context}: telemetry binding must define record or use a default record.`);
  if (!expr && !metric) errors.push(`${context}: telemetry binding must define expr or metric.`);

  const sourceLabels = bindingLabels(binding);
  const labels = outputLabels({
    [defaults.identityLabel]: defaults.identityValue,
    ...defaults.labels,
    ...(recordValue(binding.outputLabels) || {})
  });

  if (!Object.keys(labels).length) errors.push(`${context}: generated rule needs at least one output label.`);
  if (errors.length) return undefined;

  return {
    record,
    expr: expr || prometheusSelector(metric, sourceLabels),
    labels
  };
}

function linkTelemetry(link) {
  return recordValue(recordValue(link.data)?.telemetry);
}

function directionTelemetry(directionValue) {
  return recordValue(recordValue(directionValue)?.data)?.telemetry;
}

function generateRules(document, options) {
  const graph = recordValue(document.graph);
  if (!graph) throw new Error('Topology YAML must define graph.');
  const graphId = stringValue(graph.id) || 'graph';
  const links = Array.isArray(graph.links) ? graph.links : [];
  const identityLabel = options.identityLabel || 'topology';
  const identityValue = options.identityValue || graphId;
  const errors = [];
  const rules = [];

  for (const link of links) {
    if (!isRecord(link)) continue;
    const linkId = stringValue(link.id);
    if (!linkId) {
      errors.push('graph.links[]: every telemetry-bound link must have id.');
      continue;
    }

    const upBinding = recordValue(linkTelemetry(link)?.up);
    const upRule = ruleFromBinding(upBinding, `link ${linkId} telemetry.up`, {
      record: generatedRecordName(graphId, 'link_up'),
      identityLabel,
      identityValue,
      labels: { link_id: linkId }
    }, errors);
    if (upRule) rules.push(upRule);

    const directions = recordValue(link.directions);
    if (!directions) continue;
    for (const [direction, directionValue] of Object.entries(directions)) {
      const telemetry = directionTelemetry(directionValue);
      const bpsBinding = recordValue(telemetry?.bps);
      const bpsRule = ruleFromBinding(bpsBinding, `link ${linkId} directions.${direction}.telemetry.bps`, {
        record: generatedRecordName(graphId, 'link_direction_bps'),
        identityLabel,
        identityValue,
        labels: { link_id: linkId, direction }
      }, errors);
      if (bpsRule) rules.push(bpsRule);
    }
  }

  if (errors.length) throw new Error(`Unable to generate Prometheus rules:\n- ${errors.join('\n- ')}`);
  if (!rules.length) throw new Error('No telemetry bindings found. Add graph.links[].data.telemetry or graph.links[].directions.*.data.telemetry.');

  return {
    groups: [
      {
        name: options.group || 'topoviewer',
        interval: options.interval || '5s',
        rules
      }
    ]
  };
}

function renderRules(rules, topologyPath) {
  const source = path.basename(topologyPath);
  return [
    `# Generated by TopoViewer from ${source}.`,
    '# Edit topology telemetry bindings, then regenerate this file.',
    yaml.dump(rules, {
      lineWidth: 120,
      noRefs: true,
      quotingType: '"',
      sortKeys: false
    })
  ].join('\n');
}

async function main() {
  yaml = await loadYaml();
  const args = parseArgs(process.argv.slice(2));
  const topologyPath = args.topology;
  const outputPath = args.output;
  if (!topologyPath) throw new Error(`Missing --topology.\n${usage()}`);
  if (!args.stdout && !outputPath) throw new Error(`Missing --output unless --stdout is used.\n${usage()}`);

  const topologyText = fs.readFileSync(topologyPath, 'utf8');
  const document = yaml.load(topologyText);
  if (!isRecord(document)) throw new Error('Topology YAML must be a mapping.');

  const generated = renderRules(generateRules(document, {
    group: args.group,
    interval: args.interval,
    identityLabel: args['identity-label'],
    identityValue: args['identity-value']
  }), topologyPath);

  if (args.stdout) {
    process.stdout.write(generated);
    return;
  }

  if (args.check) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    if (current !== generated) {
      throw new Error(`${outputPath} is out of sync. Re-run without --check to regenerate it.`);
    }
    console.log(`${outputPath} is in sync.`);
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, generated);
  console.log(`Generated ${outputPath}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
