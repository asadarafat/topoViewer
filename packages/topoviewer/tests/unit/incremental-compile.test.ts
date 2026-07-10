import { describe, expect, it } from 'vitest';
import {
  assertValidPositionOnlyFields,
  patchCompiledPositions,
  positionInsensitiveDocumentSignature,
  supportsPositionOnlyCompile
} from '../../src/core/incrementalCompile';
import type { CompiledGraph, TopoDocument } from '../../src/core/types';

function document(position: [number, number] = [20, 40]): TopoDocument {
  return {
    layout: { mode: 'manual' },
    graph: {
      layers: [{ id: 'physical', name: 'Physical' }],
      nodes: [
        { id: 'node-a', layers: ['physical'], position },
        { id: 'node-b', layers: ['physical'], position: [120, 40] }
      ],
      links: [{ id: 'link-a-b', source: 'node-a', target: 'node-b', layers: ['physical'] }]
    }
  };
}

describe('incremental position compilation', () => {
  it('keeps the signature stable only for position changes', () => {
    const initial = document();
    const moved = document([80, 90]);
    const renamed = document();
    renamed.graph!.nodes![0].name = 'Renamed';

    expect(positionInsensitiveDocumentSignature(moved)).toBe(positionInsensitiveDocumentSignature(initial));
    expect(positionInsensitiveDocumentSignature(renamed)).not.toBe(positionInsensitiveDocumentSignature(initial));
  });

  it('changes the signature when graph or annotation cardinality changes', () => {
    const initial = document();
    const withNode = structuredClone(initial);
    const withShape = structuredClone(initial);
    withNode.graph!.nodes!.push({ id: 'node-c', layers: ['physical'], position: [220, 40] });
    withShape.diagram = {
      shapes: [{ id: 'shape-a', position: [20, 120], size: [80, 40], type: 'rectangle' }]
    };

    expect(positionInsensitiveDocumentSignature(withNode)).not.toBe(positionInsensitiveDocumentSignature(initial));
    expect(positionInsensitiveDocumentSignature(withShape)).not.toBe(positionInsensitiveDocumentSignature(initial));
  });

  it('patches changed positions without replacing unrelated nodes or edges', () => {
    const nodeA = { id: 'node-a', position: { x: 20, y: 40 }, data: {} };
    const nodeB = { id: 'node-b', position: { x: 120, y: 40 }, data: {} };
    const edge = { id: 'link-a-b', source: 'node-a', target: 'node-b', data: {} };
    const compiled = {
      nodes: [nodeA, nodeB],
      edges: [edge],
      selectedLayerIds: ['physical']
    } as CompiledGraph;

    const patched = patchCompiledPositions(compiled, document([80, 90]));

    expect(patched).not.toBe(compiled);
    expect(patched.nodes[0].position).toEqual({ x: 80, y: 90 });
    expect(patched.nodes[1]).toBe(nodeB);
    expect(patched.edges).toBe(compiled.edges);
  });

  it('validates position-only fields without rescanning unchanged graph semantics', () => {
    expect(() => assertValidPositionOnlyFields(document())).not.toThrow();
    const objectPosition = document();
    objectPosition.graph!.nodes![0].position = { x: 20, y: 40 };
    expect(() => assertValidPositionOnlyFields(objectPosition)).not.toThrow();

    const invalid = document();
    invalid.graph!.nodes![0].position = [Number.NaN, 40];
    expect(() => assertValidPositionOnlyFields(invalid)).toThrow(/invalid position/);
  });

  it('falls back when geometry or extension ownership is not position-local', () => {
    const manual = document();
    expect(supportsPositionOnlyCompile({ document: manual, hasExtensions: false })).toBe(true);
    expect(supportsPositionOnlyCompile({
      document: { ...manual, layout: { mode: 'force' } },
      hasExtensions: false
    })).toBe(false);
    expect(supportsPositionOnlyCompile({ document: manual, hasExtensions: true })).toBe(false);
    expect(supportsPositionOnlyCompile({
      document: {
        ...manual,
        graph: { ...manual.graph, regions: [{ id: 'region-a', members: ['node-a'] }] }
      },
      hasExtensions: false
    })).toBe(false);
  });
});
