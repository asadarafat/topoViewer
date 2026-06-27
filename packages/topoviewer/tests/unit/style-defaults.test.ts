import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalStyleKeyByLowercase,
  compileTopoGraph,
  styleDefaultNumber,
  styleDefaultSummary,
  styleDefaultValue,
  styleDefinitions,
  styleDefinitionsByKind,
  type StyleTargetKind,
  type TopoDocument
} from '../../src';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '../..');
const repoRoot = path.resolve(packageRoot, '../..');

function readText(...segments: string[]) {
  return fs.readFileSync(path.join(repoRoot, ...segments), 'utf8');
}

function stylePropertiesFromSchema() {
  const schema = JSON.parse(readText('packages/topoviewer/schemas/topoviewer.schema.json')) as {
    definitions: { style: { properties: Record<string, unknown> } };
  };
  return Object.keys(schema.definitions.style.properties);
}

describe('canonical style defaults registry', () => {
  it('defines complete style metadata without per-kind duplicate keys', () => {
    expect(styleDefinitions.length).toBeGreaterThan(0);

    for (const definition of styleDefinitions) {
      expect(definition.key).toMatch(/^[a-z][A-Za-z0-9]*$/);
      expect(definition.label).toBeTruthy();
      expect(definition.use).toBeTruthy();
      expect(definition.targets.length).toBeGreaterThan(0);
      expect(['value', 'derived', 'none']).toContain(definition.default.kind);
      expect(canonicalStyleKeyByLowercase.get(definition.key.toLowerCase())).toBe(definition.key);
      expect(styleDefaultSummary(definition)).toBeTruthy();
    }

    for (const [kind, definitions] of Object.entries(styleDefinitionsByKind) as Array<[StyleTargetKind, typeof styleDefinitionsByKind[StyleTargetKind]]>) {
      const keys = definitions.map((definition) => definition.key);
      expect(new Set(keys).size, `${kind} has duplicate style keys`).toBe(keys.length);
    }
  });

  it('provides registry-backed primitive defaults to the compiler', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['physical'], position: [0, 0] },
          { id: 'b', name: 'B', layers: ['physical'], position: [240, 0] }
        ],
        links: [
          { id: 'a-b', source: 'a', target: 'b', layers: ['physical'] }
        ],
        regions: [
          { id: 'region-a', name: 'Region A', members: ['a'], layers: ['physical'] }
        ]
      },
      diagram: {
        shapes: [
          { id: 'shape-a', layers: ['physical'], position: [0, 160] }
        ],
        callouts: [
          { id: 'callout-a', layers: ['physical'], position: [240, 160], title: 'Note' }
        ]
      }
    };

    const compiled = compileTopoGraph(document, ['physical'], { showRegions: true });
    const node = compiled.nodes.find((item) => item.id === 'a');
    const edge = compiled.edges.find((item) => item.id === 'a-b');
    const region = compiled.nodes.find((item) => item.id === 'region:region-a');
    const shape = compiled.nodes.find((item) => item.id === 'shape-a');
    const callout = compiled.nodes.find((item) => item.id === 'callout-a');

    expect(node?.data).toMatchObject({
      nodeShapeType: styleDefaultValue('node', 'shape'),
      labelPosition: styleDefaultValue('node', 'labelPosition'),
      badgePosition: styleDefaultValue('node', 'badgePosition'),
      statusPlacement: styleDefaultValue('node', 'statusPlacement')
    });
    expect(node?.style).toMatchObject({
      width: styleDefaultNumber('node', 'width', 0)
    });
    expect(node?.zIndex).toBe(styleDefaultValue('node', 'zIndex'));
    expect(edge?.style).toMatchObject({
      stroke: styleDefaultValue('link', 'lineColor'),
      strokeWidth: styleDefaultValue('link', 'lineWidth')
    });
    expect(edge?.data).toMatchObject({
      anchor: styleDefaultValue('link', 'anchor'),
      curveType: styleDefaultValue('link', 'curveStyle'),
      sourceArrowShape: styleDefaultValue('link', 'sourceArrowShape'),
      targetArrowShape: styleDefaultValue('link', 'targetArrowShape')
    });
    expect(edge?.zIndex).toBe(styleDefaultValue('link', 'zIndex'));
    expect(region?.data).toMatchObject({
      borderWidth: styleDefaultValue('region', 'borderWidth'),
      labelPosition: styleDefaultValue('region', 'labelPosition'),
      labelMargin: styleDefaultValue('region', 'labelMargin')
    });
    expect(region?.zIndex).toBe(styleDefaultValue('region', 'zIndex'));
    expect(shape?.data).toMatchObject({
      shapeType: 'rectangle'
    });
    expect(shape?.style).toMatchObject({
      width: styleDefaultValue('shape', 'width'),
      height: styleDefaultValue('shape', 'height')
    });
    expect(shape?.zIndex).toBe(styleDefaultValue('shape', 'zIndex'));
    expect(callout?.style).toMatchObject({
      width: styleDefaultValue('callout', 'width'),
      minHeight: styleDefaultValue('callout', 'height')
    });
    expect(callout?.zIndex).toBe(styleDefaultValue('callout', 'zIndex'));
  });

  it('keeps schema-owned style keys and public docs aligned with the registry', () => {
    const documented = readText('packages/topoviewer/content/pages/stylesheet.md');

    for (const key of stylePropertiesFromSchema()) {
      expect(canonicalStyleKeyByLowercase.has(key.toLowerCase()), `schema style key ${key} is missing from registry`).toBe(true);
    }

    for (const definition of styleDefinitions) {
      expect(documented.includes(`\`${definition.key}\``), `stylesheet docs missing ${definition.key}`).toBe(true);
    }

    [
      'Defaults to `rectangle`',
      'Defaults to `82` x `60`',
      'Defaults to `bezier`',
      'Defaults to `roundRectangle`',
      'Defaults to `180` x `72`',
      'Defaults to `320` x `120`'
    ].forEach((needle) => {
      expect(documented).toContain(needle);
    });
  });
});
