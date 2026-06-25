# CI And Docs Investigation

Collected on 2026-06-25 with `gh run list` and `gh run view --log-failed`.

## CI Runs On `development`

| Run ID | Commit title | Result | Duration | Failed step | Classification |
|---:|---|---|---:|---|---|
| 28148248910 | fix: align docs fixtures with CI validation | success | 5m32s | none | none |
| 28147754311 | feat: make node dimensions size visible body | failure | 50s | `Run CI` / `validate:schemas` | generated artifact drift |
| 28129425922 | feat(vscode-harness): load fixtures from examples catalog | failure | 1m1s | `Run CI` / `validate:schemas` | generated artifact drift |
| 28120004363 | build(content): generate projections from canonical content | success | 4m56s | none | none |
| 28114196960 | test: split exhaustive topology control coverage | success | 5m49s | none | none |
| 28113298609 | test: assert visible topoviewer nodes | failure | 3m30s | `Run CI` / TopoViewer Playwright | brittle assertion |
| 28112810729 | test: assert durable harness undo redo state | failure | 3m25s | `Run CI` / TopoViewer Playwright | brittle assertion |
| 28112164795 | test: wait for region visibility to settle | failure | 6m33s | `Run CI` / VS Code harness Playwright | brittle assertion |
| 28111597106 | test: retry topoviewer snapshot navigation races | failure | 3m16s | `Run CI` / TopoViewer Playwright | browser timing or hydration drift |
| 28110911671 | test: select harness edges deterministically | failure | 3m19s | `Run CI` / TopoViewer Playwright | browser timing or hydration drift |

Notes:

- The old workflow exposed all inner failures as a single `Run CI` step.
- Runs 28147754311 and 28129425922 failed because harness `expected.yaml`
  projections were missing the required `dom` property. This is generated
  artifact drift.
- Runs 28113298609 and 28112810729 failed in region visibility settling checks.
  The failure shows expected region-hidden state but visible `region:*` nodes
  remained. The checks were timing-sensitive and coupled to internal DOM state.
- Run 28112164795 failed because the harness undo/redo test expected transient
  status text `Redo Insert node`, but the stable diagnostic strip had already
  returned to `No diagnostics`.
- Runs 28111597106 and 28110911671 failed around TopoViewer interaction
  rendering while the page context changed or region visibility was still
  settling.

Local reproduction:

- Historical commits were not re-run locally.
- The current checkout was validated with Node 24.12.0 using the new lane
  structure.
- `CI=true npm run ci:test:harness` passed locally: 27 tests.
- `CI=true npm run ci:test:topoviewer` passed locally: 45 unit tests and 73
  Playwright tests.
- `npm run ci:quality`, `npm run ci:schemas`, `npm run ci:build`,
  `npm run docs:smoke`, `npm run ci:perf:smoke`, and `npm run ci:package`
  passed locally.

Artifact/log sufficiency:

- The previous workflow preserved some Playwright traces, but it did not upload
  them as a top-level GitHub artifact after failure.
- The single `Run CI` step forced log inspection before the failed lane could be
  understood.
- The new workflow separates generated, schema, build, docs, package,
  TopoViewer test, harness test, and performance lanes and uploads failure
  artifacts.

## Docs Runs On `development`

| Run ID | Commit title | Result | Duration | Failed step | Classification |
|---:|---|---|---:|---|---|
| 28148248897 | fix: align docs fixtures with CI validation | success | 1m40s | none | none |
| 28147754310 | feat: make node dimensions size visible body | success | 1m21s | none | none |
| 28129425878 | feat(vscode-harness): load fixtures from examples catalog | success | 1m41s | none | none |
| 28120004400 | build(content): generate projections from canonical content | success | 4m27s | none | none |
| 28114196916 | test: split exhaustive topology control coverage | success | 10m14s | none | none |
| 28113298710 | test: assert visible topoviewer nodes | success | 6m9s | none | none |
| 28112810686 | test: assert durable harness undo redo state | success | 9m46s | none | none |
| 28112164800 | test: wait for region visibility to settle | success | 4m53s | none | none |
| 28111596996 | test: retry topoviewer snapshot navigation races | success | 8m6s | none | none |
| 28110911401 | test: select harness edges deterministically | success | 7m32s | none | none |

Docs conclusion:

- The last 10 Docs runs were green.
- The main Docs risk is not historical failure frequency; it is insufficient
  browser validation before deploy. Static checks could pass while Zensical or
  MkDocs live viewports need refresh or have bad base paths.
- The new `docs:smoke` opens the built `site/**` artifact under the GitHub Pages
  `/topoviewer/` path and validates MkDocs, Zensical, and harness rendering.
