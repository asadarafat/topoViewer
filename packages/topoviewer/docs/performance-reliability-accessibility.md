# Performance, Reliability, And Accessibility

TopoViewer is a visual runtime, so adoption depends on more than schema
correctness. Users need to know the graph sizes the project optimizes for, how
failures behave, what keyboard/focus behavior is expected, and what data is
kept by each surface.

## Performance Tiers

| Tier | Typical size | Use case | Expected path |
|---|---:|---|---|
| Tiny | Up to 20 nodes and 40 edges | README snippets, first topology, simple docs examples | Render directly in docs, harness, React, or Grafana. |
| Curated | Up to 100 nodes and 200 edges | Public examples, service paths, small operational views | Render interactively with labels, regions, and selected layers. |
| Dense | Up to the default limits: 1200 nodes, 2400 edges, 1600 path segments | Large CLOS or inventory-derived views | Use layout directives, layers, regions, attention, and aggregation. |
| Stress | Around 10000 synthetic nodes | Maintainer profiling only | Run local benchmarks; do not expose as default harness/docs fixture. |

Default renderer limits are intentionally conservative. Raise them only when the
embedding product owns the browser, hardware profile, and failure behavior.

## Budgets

| Scenario | Budget | Gate or evidence |
|---|---:|---|
| Tiny first render | <= 1500 ms from viewport mount to visible nodes/links on CI Chromium | Docs smoke or representative Playwright test |
| Curated first render | <= 2500 ms from viewport mount to visible nodes/links on CI Chromium | Docs smoke or representative Playwright test |
| Dense first render | <= 5000 ms for default-limit diagrams after YAML is already loaded | Pre-release render-parity/perf run |
| Interaction latency | <= 100 ms for common pan/zoom/select response on tiny/curated diagrams; <= 200 ms on dense diagrams | Pre-release Playwright/perf run |
| Memory ceiling | Default-limit diagrams should stay under 512 MB Chromium renderer memory in pre-release profiling | Pre-release profiling note |
| Screenshot stability | Geometry-sensitive parity fixtures should stay within the documented render-parity tolerance; color-only theme differences are allowed only when documented | `npm run render:parity` |
| 1k CLOS layout median | <= 2000 ms on CI runners | `npm run benchmark:clos:smoke` |
| 1k CLOS max layout round | <= 4000 ms on CI runners | `npm run benchmark:clos:smoke` |
| 1k attention indexing/focus smoke | Must pass smoke assertions | `npm run benchmark:attention:smoke` |
| Tiny/curated docs embed hydration | Must render visible nodes and links without manual refresh | `npm run docs:smoke` |
| Renderer parity fixtures | Geometry, sizing, label, icon, edge, and region placement must match across harness, MkDocs, and Zensical | `npm run render:parity` |
| Package/public readiness | No local path leaks, stale generated output, or unsafe public claims | `npm run public-readiness` |

The benchmark summaries published in docs must avoid local host paths. Local
deep profiles belong in an ignored local artifact directory, not in public
docs, package files, or checked-in media.

## Benchmark Scenarios

| Scenario | Command | Notes |
|---|---|---|
| CLOS layout smoke | `npm run benchmark:clos:smoke` | Layout-only, renderer-agnostic, deterministic 1k-node graph. |
| CLOS layout local profile | `npm run benchmark:clos:local` | Writes local artifact output for maintainer review. |
| Attention smoke | `npm run benchmark:attention:smoke` | Dense attention indexing and focus behavior. |
| Attention local profile | `npm run benchmark:attention:local` | Local-only multi-size profile. |
| Docs smoke | `npm run docs:smoke` | Built docs hydration and live viewport smoke. |
| Render parity | `npm run render:parity` | Cross-surface renderer geometry parity. |
| Grafana lab smoke | `npm run grafana:lab:smoke:phase4` | Mounted bundle and mapper overlay workflow without source edits. |
| Grafana Containerlab smoke | `npm run grafana:clab:smoke` | Advanced lab telemetry mode; not a default PR gate. |

Selection, zoom/pan, mapper overlay refresh, and full accessibility automation
are release-readiness scenarios. They should become stronger gates before a
stable `1.0` claim.

## Reliability Contract

| Failure class | Expected behavior |
|---|---|
| Bad YAML parse | Surface reports parse diagnostics and keeps the last valid applied document where drafts exist. |
| Bad schema | Validation blocks apply/render and reports the invalid path. |
| Broken topology reference | Semantic lint reports the broken source, target, parent, region member, path sequence, layer, or pin. |
| Unsupported style key | Validation or lint reports the unsupported key; runtime does not invent a silently different behavior. |
| Missing icon key | Renderer falls back to a safe generic glyph rather than crashing. |
| Unsafe image or SVG | Sanitizer/lint blocks unsafe image references and strips hostile SVG/HTML payloads. |
| Renderer limit exceeded | Lint reports `renderer-limit` before the surface attempts an unsafe render. |
| Bad mapper YAML | Parser returns mapper diagnostics and blocks overlays. |
| Missing telemetry | Grafana renders the base topology and reports no-data diagnostics. |
| Ambiguous mapper match | Mapper coverage reports ambiguity and avoids applying a guessed overlay. |

## Accessibility Posture

TopoViewer is not yet claiming complete accessibility coverage. The current
posture is:

| Area | Current expectation |
|---|---|
| Keyboard focus | Host and surface chrome should keep visible focus for buttons, tabs, selectors, and editor controls. |
| Canvas interaction | Pan, zoom, selection, and dragging are visual interactions; keyboard alternatives are limited today. |
| Escape behavior | Modal/editor/suggestion surfaces should let users close or leave transient UI without corrupting YAML. |
| Color contrast | Public examples should avoid color-only meaning; labels and badges should remain readable in light and dark mode. |
| Non-color cues | Operational states should use label, badge, line style, width, or arrow changes in addition to color. |
| Reduced motion | The runtime should avoid essential meaning that depends on animation. |
| Screen readers | The graph surface exposes a high-level diagram label today; object-level screen-reader navigation needs explicit design before being claimed. |

## Keyboard And Focus Contract

| Surface | Supported today | Not yet claimed |
|---|---|---|
| React runtime | Host can focus surrounding UI and receives object events through props. Viewport controls are ordinary buttons when shown. | Complete keyboard-only graph navigation, object traversal, and drag alternatives. |
| MkDocs/Zensical embeds | Layer/display checkboxes, attention reset controls, and viewport-control buttons should remain reachable as page controls. | Full screen-reader traversal of graph objects. |
| Browser harness | Material UI tabs, selects, buttons, Monaco editor, diagnostics, and copy/export controls should keep visible focus and normal keyboard behavior. | Keyboard-only canvas authoring parity with pointer dragging. |
| Grafana panel | Grafana chrome owns dashboard-level focus; TopoViewer controls and diagnostics should remain operable as panel controls. | Grafana-specific keyboard workflows for every topology object. |

Until automated a11y checks are complete, release review must manually inspect
focus visibility, keyboard escape behavior, text legibility, contrast, and
non-color status cues on representative light and dark mode examples.

## Data And Privacy

| Surface | Stored data | User expectation |
|---|---|---|
| React runtime | Whatever the host app passes and stores | Host application owns privacy, telemetry, auth, and persistence policy. |
| MkDocs/Zensical | Static YAML assets and transient viewport state | Public docs should not include secrets, private topology, or local artifact paths. |
| Browser harness | Draft/applied topology, stylesheet, mapper YAML, selected template, viewport state | Local browser storage only; export files deliberately before using them elsewhere. |
| Grafana panel | Dashboard options, selected mounted bundle ID, Prometheus query results, runtime overlays | Source YAML remains mounted file content; telemetry overlays are runtime-only. |
| Promo screenshots/video | Captured rendered surfaces | Checked-in assets must avoid personal data, local paths, private lab names, and failed diagnostics. |

## Release Expectations

Before claiming a release is ready for broad adoption:

1. Run `npm run ci`.
2. Run or review the performance smoke lane.
3. Review render parity artifacts for representative diagrams.
4. Review Grafana no-data, ambiguous-data, and degraded-overlay states.
5. Review keyboard/focus and contrast manually until automated a11y checks exist.
6. Record any accepted risk in the release notes or public readiness report.

## Next Steps

- [Production hardening](production.md): CI lanes, renderer limits, and failure triage.
- [Threat model](threat-model.md): untrusted inputs and security guardrails.
- [Object attributes](object-reference.md): accepted authored fields and defaults.
- [Grafana guide](grafana.md): mapper coverage and telemetry overlay behavior.
