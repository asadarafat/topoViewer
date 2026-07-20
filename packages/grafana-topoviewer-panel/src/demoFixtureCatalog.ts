import { demoFixtures } from './generated/demoFixtures';
import { DEFAULT_FIXTURE_ID, type GrafanaDemoFixture } from './types';

const fixturesById = new Map(demoFixtures.map((fixture) => [fixture.id, fixture]));

export function listDemoFixtures(): GrafanaDemoFixture[] {
  return [...demoFixtures];
}

export function listDemoFixtureIds(): string[] {
  return demoFixtures.map((fixture) => fixture.id);
}

export function listDemoFixtureOptions() {
  return demoFixtures.map((fixture) => ({
    value: fixture.id,
    label: fixture.name,
    description: `${fixture.source.topology} + ${fixture.source.stylesheet}`
  }));
}

export function defaultDemoFixture(): GrafanaDemoFixture {
  return getDemoFixture(DEFAULT_FIXTURE_ID) || demoFixtures[0];
}

export function getDemoFixture(fixtureId: string | undefined): GrafanaDemoFixture | undefined {
  if (!fixtureId) return defaultDemoFixture();
  return fixturesById.get(fixtureId);
}
