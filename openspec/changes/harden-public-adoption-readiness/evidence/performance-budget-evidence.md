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
| Attention smoke, 1000 nodes | Passed; total 680.683 ms, index 105.716 ms, focus 2.309 ms. |
| CLOS layout smoke, 1000 nodes / 2520 links | Passed; median 38.479 ms, max 40.996 ms. |

Open performance/readiness gaps:

| Gap | Owner task |
|---|---|
| Automated first-render benchmark across harness/docs/Grafana | 22.2 |
| Automated accessibility checks | 22.8 |
| Curated screenshot evidence | 5.6 and 10.7 |
| Cross-surface render parity fixture expansion | 9.1-9.7 |
