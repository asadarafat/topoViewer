import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderPrometheusMetrics } from '../src/metrics.mjs';
import { applyMetricOverride, buildScenario, scenarioNames } from '../src/scenarios.mjs';

describe('telemetry injector scenarios', () => {
  it('defines the expected deterministic scenarios', () => {
    assert.deepEqual(scenarioNames, ['healthy', 'high-utilization', 'link-failure']);
    assert.equal(buildScenario('healthy').length, 15);
    assert.equal(buildScenario('high-utilization').length, 15);
    assert.equal(buildScenario('link-failure').length, 15);
  });

  it('includes layered network and CLOS fixture samples', () => {
    const entries = buildScenario('link-failure');
    assert(entries.some((entry) => entry.fixtureId === 'layered-network' && entry.linkId === 'underlay-ams-lon' && entry.up === 0));
    assert(entries.some((entry) => entry.fixtureId === 'clos-2spine-4leaf' && entry.linkId === 'Spine-1-Leaf-3' && entry.up === 0));
  });

  it('renders Prometheus metric labels used by the Grafana panel parser', () => {
    const metrics = renderPrometheusMetrics(buildScenario('healthy'));
    assert.match(metrics, /topoviewer_link_up\{fixture_id="layered-network",link_id="underlay-fra-ams"/);
    assert.match(metrics, /topoviewer_link_utilization_percent\{fixture_id="clos-2spine-4leaf",link_id="Spine-2-Leaf-4"/);
    assert.match(metrics, /topoviewer_link_direction_utilization_percent\{fixture_id="clos-2spine-4leaf",link_id="Spine-2-Leaf-4",source="Spine-2",target="Leaf-4",site="fabric",pod="pair-2",direction="sourceToTarget"/);
    assert.match(metrics, /topoviewer_metric_timestamp_seconds/);
  });

  it('applies metric overrides without changing other samples', () => {
    const entries = applyMetricOverride(buildScenario('healthy'), {
      fixtureId: 'layered-network',
      linkId: 'underlay-fra-ams',
      field: 'utilizationPercent',
      value: 96
    });
    const changed = entries.find((entry) => entry.linkId === 'underlay-fra-ams');
    const unchanged = entries.find((entry) => entry.linkId === 'underlay-ams-lon');
    assert.equal(changed?.utilizationPercent, 96);
    assert.notEqual(unchanged?.utilizationPercent, 96);
  });
});
