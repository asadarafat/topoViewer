import { authoringFieldIsVisible, ingestMapperSamples } from 'topoviewer/authoring';
import { describe, expect, it } from 'vitest';
import { decodeStudioProjectArchive } from '../../src/archive/projectArchive';
import { createStudioCommandDispatcher, StudioCommandExecutionError } from '../../src/commands';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession } from '../../src/session';
import { parseStudioSource } from '../../src/session/yamlSource';
import { malformedManifestArchive } from '../fixtures/security/adversarial';

function generator(seed = 0x5eed1234) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function token(random: () => number, length = 24): string {
  const alphabet = 'abcXYZ012:-[]{}&*!?<>/\\\n\u0000';
  return Array.from({ length }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
}

function commandProject() {
  const project = createStarterProject({ id: 'security-fuzz', name: 'Security fuzz' });
  project.documents.topology.text = project.documents.topology.text.replace(
    '  nodes: []',
    '  nodes:\n    - id: n1\n      labels:\n        name: Node 1\n      layers: [physical]\n      position: [100, 100]'
  );
  return project;
}

describe('Studio bounded security fuzz', () => {
  it('contains random YAML and archive manifests within a bounded runtime', () => {
    const random = generator();
    const started = performance.now();
    for (let index = 0; index < 250; index += 1) {
      expect(() => parseStudioSource('topology', token(random, 32 + Math.floor(random() * 256)))).not.toThrow();
      const manifest = {
        files: Array.from({ length: Math.floor(random() * 8) }, () => ({
          contentHash: token(random, 12),
          documentKind: token(random, 8),
          mediaType: token(random, 16),
          path: token(random, 24),
          size: Math.floor(random() * 20_000_000)
        })),
        format: random() > 0.5 ? 'topoviewer-studio-project' : token(random, 12),
        project: { id: token(random, 12), metadata: {}, name: token(random, 12), revision: token(random, 12) },
        version: Math.floor(random() * 4)
      };
      try {
        decodeStudioProjectArchive(malformedManifestArchive(manifest));
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    }
    expect(performance.now() - started).toBeLessThan(4_000);
  });

  it('contains random command plans and preserves a valid session snapshot', () => {
    const random = generator(0xc0ffee);
    const session = createStudioDocumentSession(commandProject());
    const dispatcher = createStudioCommandDispatcher(session, { maxBytes: 512_000, maxEntries: 20 });
    const paths: Array<Array<string | number>> = [
      ['graph', 'nodes', 0, 'labels', 'name'],
      ['graph', 'nodes', 0, 'position', 0],
      ['graph', 'nodes', 0, 'position', 1],
      ['graph', 'nodes', 99, 'labels', 'name'],
      ['unknown', 'value']
    ];
    const started = performance.now();
    for (let index = 0; index < 300; index += 1) {
      const path = paths[Math.floor(random() * paths.length)];
      const value = path.at(-1) === 'name' || path[0] === 'unknown' ? token(random, 12).replace(/[\u0000\n]/g, 'x') : Math.round(random() * 2_000 - 1_000);
      try {
        dispatcher.dispatch({
          execute: () => ({ mutations: [{ document: 'topology', kind: 'set-value', path, value }], summary: 'Fuzz mutation' }),
          id: `fuzz-${index}`,
          label: 'Fuzz mutation'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(StudioCommandExecutionError);
      }
    }
    expect(session.snapshot().projection.document.graph?.nodes?.[0]?.id).toBe('n1');
    expect(session.snapshot().invalidDrafts).toEqual({});
    expect(dispatcher.historyState().estimatedBytes).toBeLessThanOrEqual(512_000);
    expect(performance.now() - started).toBeLessThan(4_000);
  });

  it('contains mapper samples and metadata conditions without evaluating strings', () => {
    const random = generator(0xbadc0de);
    const started = performance.now();
    for (let index = 0; index < 200; index += 1) {
      const expression = `\${${token(random, 20)}}`;
      const result = ingestMapperSamples(
        {
          samples: Array.from({ length: Math.floor(random() * 80) }, (_, sample) => ({
            fields: { expression },
            labels: { node_id: `n${sample}` },
            metric: token(random, 20),
            value: expression
          }))
        },
        { maximumBytes: 128 * 1024, maximumSamples: 50 }
      );
      expect(result.samples.length).toBeLessThanOrEqual(50);
      if (result.samples[0]) expect(result.samples[0].value).toBe(expression);

      expect(() =>
        authoringFieldIsVisible(
          {
            visibleWhen: {
              equals: random() > 0.5 ? token(random, 8) : true,
              path: Array.from({ length: 1 + Math.floor(random() * 12) }, () => token(random, 5)).join('.')
            }
          },
          { nested: { enabled: true } }
        )
      ).not.toThrow();
    }
    expect(performance.now() - started).toBeLessThan(4_000);
  });
});
