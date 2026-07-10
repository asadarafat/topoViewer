import { describe, expect, it } from 'vitest';
import {
  parseStudioHostReport,
  parseStudioHostRequest,
  parseStudioHostResponse,
  parseStudioHostWatch
} from '../../src/shared/studioHostProtocol';

function nested(depth: number): unknown {
  let value: unknown = { leaf: true };
  for (let index = 0; index < depth; index += 1) value = { value };
  return value;
}

describe('Studio host protocol bounded fuzz', () => {
  it('rejects malformed, cyclic, deep, and oversized messages without throwing', () => {
    const cyclic: Record<string, unknown> = { type: 'studio:host-request' };
    cyclic.self = cyclic;
    const corpus: unknown[] = [
      null,
      undefined,
      '',
      [],
      cyclic,
      nested(64),
      { args: [nested(64)], id: 'deep', method: 'saveProject', type: 'studio:host-request' },
      { args: [new Uint8Array(33 * 1024 * 1024)], id: 'large', method: 'saveProject', type: 'studio:host-request' },
      { args: [], id: '../bad', method: 'unknown', type: 'studio:host-request' },
      { event: { category: 'security', name: 'x'.repeat(300) }, type: 'studio:host-report' },
      { event: { kind: 'changed', reference: { path: '../outside' } }, type: 'studio:host-watch' }
    ];
    const parsers = [parseStudioHostRequest, parseStudioHostResponse, parseStudioHostReport, parseStudioHostWatch];
    const started = performance.now();
    for (let index = 0; index < 2_000; index += 1) {
      const value = corpus[index % corpus.length];
      for (const parse of parsers) expect(() => parse(value)).not.toThrow();
    }
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
