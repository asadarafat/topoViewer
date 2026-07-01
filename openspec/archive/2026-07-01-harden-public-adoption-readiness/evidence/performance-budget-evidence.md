# Performance Budget Evidence

Public budget source:

- `packages/topoviewer/content/pages/performance-reliability-accessibility.md`
- `packages/topoviewer/content/pages/production.md`

Current smoke commands:

```bash
npm run ci:perf:smoke
```

Recorded latest local run during this implementation:

| Check | Result |
|---|---|
| Attention smoke, 1000 nodes | Passed; total 529.782 ms, index 79.647 ms, focus 1.926 ms. |
| CLOS layout smoke, 1000 nodes / 2520 links | Passed; median 30.22 ms, max 32.421 ms. |

Benchmark scenario registry:

| Scenario | Gate or evidence |
|---|---|
| First render, tiny and curated examples | `npm run docs:smoke`, `npm run render:parity` |
| First render, dense topology | `npm run ci:perf:smoke` plus pre-release profiling |
| Zoom/pan interaction | `npm run render:parity` and representative Playwright runs |
| Selection interaction | `npm run render:parity`, `npm --workspace topoviewer run test` |
| Attention focus | `npm run benchmark:attention:smoke` |
| Layout | `npm run benchmark:clos:smoke` |
| Mapper overlays | `npm run grafana:panel:test` |
| Docs embeds | `npm run docs:smoke`, `npm run render:parity` |
| Browser harness | `npm run test:vscode-harness` |
| Grafana panel refresh | `npm run grafana:lab:smoke:phase4` |
| Grafana Containerlab telemetry | `npm run grafana:clab:smoke` |

Accessibility check evidence:

| Check | Evidence |
|---|---|
| Focus visibility | `packages/topoviewer/tests/topoviewer-interactions.spec.js` focuses an attention-focused topology object and asserts the visible focus filter. |
| Color contrast | The same Playwright check asserts representative node label contrast is at least 4.5:1. |
| Non-color status cues | The same Playwright check requires both badge text and a status marker for degraded state. |
| Reduced motion | The same Playwright check emulates `prefers-reduced-motion: reduce` and asserts transition/animation durations are reduced. |
| Keyboard escape behavior | The same Playwright check presses Escape and verifies focus can leave the viewer. |

Open performance/readiness gaps:

| Gap | Owner task |
|---|---|
| Curated screenshot evidence | 5.6 and 10.7 |
| Cross-surface render parity fixture expansion | 9.1-9.7 |
| Full browser-memory profiling on release hardware | Release review |
| Grafana Containerlab telemetry latency on real lab hardware | Release review |
