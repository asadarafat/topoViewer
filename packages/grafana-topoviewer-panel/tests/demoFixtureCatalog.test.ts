import { describe, expect, it } from 'vitest';
import {
  defaultDemoFixture,
  listDemoFixtureIds,
  listDemoFixtures
} from '../src/demoFixtureCatalog';
import { DEFAULT_FIXTURE_ID } from '../src/types';

describe('demo fixture catalog', () => {
  it('lists every canonical browser demo fixture', () => {
    expect(listDemoFixtureIds()).toEqual([
      'layered-network',
      'clos-2spine-4leaf',
      'insert-workflow',
      'attention-workflow',
      'inspector-workflow',
      'dense-links',
      'region-label-placement'
    ]);
  });

  it('keeps fixture source paths under canonical content examples', () => {
    for (const fixture of listDemoFixtures()) {
      expect(fixture.source.topology).not.toContain('..');
      expect(fixture.source.stylesheet).not.toContain('..');
      expect(fixture.source.topology).toMatch(/topology\.yaml$/);
      expect(fixture.source.stylesheet).toMatch(/stylesheet\.yaml$/);
      expect(fixture.topologyYaml).toContain('graph:');
      expect(fixture.stylesheetYaml).toContain('stylesheet:');
    }
  });

  it('uses layered network as the default fixture', () => {
    expect(DEFAULT_FIXTURE_ID).toBe('layered-network');
    expect(defaultDemoFixture().id).toBe(DEFAULT_FIXTURE_ID);
  });
});
