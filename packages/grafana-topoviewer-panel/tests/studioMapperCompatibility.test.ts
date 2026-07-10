import fs from 'node:fs';
import path from 'node:path';
import { dump } from 'js-yaml';
import { describe, expect, it } from 'vitest';
import {
  createBasicMapperRule,
  mapperAuthoringTargetKinds
} from 'topoviewer/authoring';
import { parseTopoViewerMapperYaml } from '../src/mapperParser';

const repoRoot = path.resolve(import.meta.dirname, '../../..');

describe('Studio mapper compatibility without Grafana runtime', () => {
  it('parses Studio-generated Basic rules for every supported target kind', () => {
    const mapper: Record<string, unknown> = { version: 1, rules: [] };
    const rules = mapperAuthoringTargetKinds.map((targetKind) => createBasicMapperRule(mapper, {
      metric: `studio_${targetKind}_metric`,
      stateExpression: '==0',
      stateName: 'down',
      targetKind,
      value: targetKind === 'linkDirection' ? 'bps' : 'health'
    }));
    const yaml = dump({ version: 1, rules }, { lineWidth: 120, noRefs: true });
    const parsed = parseTopoViewerMapperYaml(yaml, 'Studio generated mapper');

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.mapper?.mappings.map((mapping) => mapping.target.kind))
      .toEqual(mapperAuthoringTargetKinds);
  });

  it('keeps the checked-in Containerlab mapper valid at the same parser boundary', () => {
    const yaml = fs.readFileSync(path.join(
      repoRoot,
      'labs/grafana-topoviewer/topoviewer-bundles/clab-clos/clab-clos.mapper.tv.yaml'
    ), 'utf8');
    const parsed = parseTopoViewerMapperYaml(yaml, 'Containerlab mapper fixture');

    expect(parsed.diagnostics).toEqual([]);
    expect(parsed.mapper?.mappings.some((mapping) => mapping.target.kind === 'linkDirection')).toBe(true);
    expect(parsed.mapper?.mappings.some((mapping) => mapping.target.kind === 'node')).toBe(true);
  });
});
