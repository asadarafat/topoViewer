import { harnessFixtures } from './generated/harnessFixtures';
import { DEFAULT_FIXTURE_ID, type GrafanaHarnessFixture } from './types';

const fixturesById = new Map(harnessFixtures.map((fixture) => [fixture.id, fixture]));

export function listHarnessFixtures(): GrafanaHarnessFixture[] {
  return [...harnessFixtures];
}

export function listHarnessFixtureIds(): string[] {
  return harnessFixtures.map((fixture) => fixture.id);
}

export function listHarnessFixtureOptions() {
  return harnessFixtures.map((fixture) => ({
    value: fixture.id,
    label: fixture.name,
    description: `${fixture.source.topology} + ${fixture.source.stylesheet}`
  }));
}

export function defaultHarnessFixture(): GrafanaHarnessFixture {
  return getHarnessFixture(DEFAULT_FIXTURE_ID) || harnessFixtures[0];
}

export function getHarnessFixture(fixtureId: string | undefined): GrafanaHarnessFixture | undefined {
  if (!fixtureId) return defaultHarnessFixture();
  return fixturesById.get(fixtureId);
}
