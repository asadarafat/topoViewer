import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import {
  compileTopoGraph,
  composeTopoViewerDocument,
  lintTopoDocument,
  validateTopoDocument,
  type TopoDocument
} from '../../src';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const compatibilityRoot = path.resolve(testDir, '../fixtures/compatibility/v0.1');

function readYamlFixture(fileName: string): Record<string, unknown> {
  return (yaml.load(fs.readFileSync(path.join(compatibilityRoot, fileName), 'utf8')) || {}) as Record<string, unknown>;
}

describe('document compatibility fixtures', () => {
  it('keeps previously documented no-version topology and stylesheet YAML renderable', () => {
    const document = composeTopoViewerDocument(
      readYamlFixture('basic.topo.tv.yaml'),
      readYamlFixture('basic.style.tv.yaml'),
      { validationContext: 'compatibility v0.1 basic' }
    );

    expect(() => validateTopoDocument(document, 'compatibility v0.1 basic')).not.toThrow();
    expect(lintTopoDocument(document, { requireNames: false }).filter((issue) => issue.severity === 'error')).toEqual([]);

    const compiled = compileTopoGraph(document as TopoDocument, ['physical'], { showEdgeLabels: true });
    expect(compiled.nodes.map((node) => node.id)).toEqual(['R01', 'R02']);
    expect(compiled.edges.map((edge) => edge.id)).toEqual(['R01-R02']);
  });

  it('fails old kebab-case stylesheet keys with an explicit camelCase migration diagnostic', () => {
    const topology = readYamlFixture('basic.topo.tv.yaml');
    const oldStyle = readYamlFixture('kebab-style-key.style.tv.yaml');

    expect(() => composeTopoViewerDocument(topology, oldStyle, {
      validationContext: 'compatibility v0.1 kebab style'
    })).toThrow(/line-color.*camelCase style keys/);
  });
});
