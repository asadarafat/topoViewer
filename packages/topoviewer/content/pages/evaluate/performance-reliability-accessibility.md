# Performance, Reliability, Accessibility

TopoViewer is a visual runtime, so adoption depends on more than schema
correctness. Users need to know the graph sizes the project optimizes for, how
failures behave, what keyboard/focus behavior is expected, and what data is
kept by each surface.

## Performance Tiers

| Tier | Typical size | Use case | Expected path |
|---|---:|---|---|
| Tiny | Up to 20 nodes and 40 edges | README snippets, first topology, simple docs examples | Render directly in docs, Studio, React, or Grafana. |
| Curated | Up to 100 nodes and 200 edges | Public examples, service paths, small operational views | Render interactively with labels, regions, and selected layers. |
| Dense | Up to the default limits: 1200 nodes, 2400 edges, 1600 path segments | Large CLOS or inventory-derived views | Use layout directives, layers, regions, attention, and aggregation. |
| Stress | Around 10000 synthetic nodes | Maintainer profiling only | Run local benchmarks; do not expose as a default Studio/docs fixture. |

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
| Renderer parity fixtures | Geometry, sizing, label, icon, edge, and region placement must match across MkDocs and Zensical | `npm run render:parity` |
| Package/public readiness | No local path leaks, stale generated output, or unsafe public claims | `npm run public-readiness` |

The benchmark summaries published in docs must avoid local host paths. Local
deep profiles belong in an ignored local artifact directory, not in public
docs, package files, or checked-in media.

## Benchmark Scenarios

| Scenario | Current gate | Automation level | Notes |
|---|---|---|---|
| First render, tiny and curated examples | `npm run docs:smoke`, `npm run render:parity` | CI/pre-release | Built docs must hydrate live viewports and parity fixtures must render visible nodes and links. |
| First render, dense topology | `npm run ci:perf:smoke` plus release profiling | CI smoke plus pre-release review | Uses 1k attention and CLOS smoke today; default-limit browser profiling remains a release review item. |
| Zoom/pan interaction | `npm run render:parity` and representative Playwright runs | Pre-release | Geometry must remain stable after viewport operations; stronger latency instrumentation is expected before a stable `1.0` claim. |
| Selection interaction | `npm run render:parity`, `npm --workspace topoviewer run test` | CI/pre-release | Selection and object events are covered by renderer and workbench interaction tests. |
| Attention focus | `npm run benchmark:attention:smoke` | CI | Dense indexing and focus query behavior must pass smoke thresholds. |
| Layout | `npm run benchmark:clos:smoke` | CI | Renderer-agnostic 1k-node CLOS layout benchmark. |
| Mapper overlays | `npm run grafana:panel:test` | CI | Mapper parsing, schema validation, overlay execution, and mounted-bundle runtime model tests. |
| Docs embeds | `npm run docs:smoke`, `npm run render:parity` | CI/pre-release | MkDocs and Zensical embeds must hydrate without manual refresh and must not leak host CSS geometry. |
| TopoViewer Studio | `npm run studio:test:browser` | CI | Authoring workflow, YAML assist, persistence, export, mapper diagnostics, and editor behavior. |
| Grafana panel telemetry | `npm run grafana:clab:smoke` | Advanced lab/manual | Containerlab, Prometheus refresh, mounted bundle discovery, mapper coverage, directional lanes, and overlay update behavior. |

The current benchmark matrix is enough to block obvious regressions before
public adoption. It is not yet a full performance lab: browser memory ceilings,
per-interaction latency histograms, and Grafana dashboard refresh timing still
belong in pre-release review until the project has stable release hardware.

## Reliability Contract

| Failure class | Expected behavior |
|---|---|
| Bad YAML parse | Surface reports parse diagnostics and keeps the last valid applied document where drafts exist. |
| Bad schema or compile input | `compileTopoGraphResult` and `TopoViewer` return or render structured diagnostics instead of throwing through the host tree. |
| Broken topology reference | Semantic lint reports the broken source, target, parent, region member, path sequence, layer, or pin. |
| Unsupported style key | Validation or lint reports the unsupported key; runtime does not invent a silently different behavior. |
| Missing icon key | Renderer falls back to a safe generic glyph rather than crashing. |
| Unsafe image or SVG | Sanitizer/lint blocks unsafe image references and strips hostile SVG/HTML payloads. |
| Renderer limit exceeded | Safe compilation reports `renderer-limit`; the renderer shows its error fallback instead of mounting an unsafe graph. |
| Empty topology | The renderer shows an accessible empty state. Authoring hosts may retain the canvas when mutation controls are enabled. |
| Filtered-empty topology | The renderer distinguishes an empty filtered view from an empty source document. |
| Bad mapper YAML | Parser returns mapper diagnostics and blocks overlays. |
| Missing telemetry | Grafana renders the base topology and reports no-data diagnostics. |
| Ambiguous mapper match | Mapper coverage reports ambiguity and avoids applying a guessed overlay. |

## Accessibility Posture

TopoViewer does not claim complete WCAG conformance. Its core graph accessibility
contract is nevertheless stronger than a generic unlabeled canvas:

| Area | Current expectation |
|---|---|
| Keyboard focus | React Flow node and edge focus remains enabled by default, with visible focus treatment. Hosts can opt out only with explicit focus props. |
| Object traversal | Focusable nodes and links expose semantic accessible names, including kind, stable identity, link endpoints, and normalized operational status when present. |
| Canvas interaction | React Flow keyboard movement remains available when the corresponding node editing behavior is enabled. Pointer drag, resize, and connection handles do not yet have complete keyboard parity. |
| Escape behavior | Modal/editor/suggestion surfaces should let users close or leave transient UI without corrupting YAML. |
| Color contrast | Public examples should avoid color-only meaning; labels and badges should remain readable in light and dark mode. |
| Non-color cues | Operational states should use label, badge, line style, width, or arrow changes in addition to color. |
| Reduced motion | The runtime should avoid essential meaning that depends on animation. |
| Screen readers | The graph region and focusable graph objects expose labels. A separate tree/list navigator and keyboard-only connection workflow are not yet provided. |

## Keyboard And Focus Contract

| Surface | Supported today | Not yet claimed |
|---|---|---|
| React runtime | Nodes and links participate in native React Flow focus traversal; accessible names include object semantics and status. Viewport controls are ordinary buttons when shown. | Keyboard-only resize and link creation through visual connection handles. |
| MkDocs/Zensical embeds | Graph objects plus layer/display, attention-reset, and viewport controls are keyboard reachable. | A dedicated structural tree view and complete pointer-operation parity. |
| TopoViewer Studio | Material UI tabs, selects, buttons, Monaco editor, diagnostics, and copy/export controls should keep visible focus and normal keyboard behavior. | Keyboard-only canvas authoring parity with pointer dragging. |
| Grafana panel | Grafana chrome owns dashboard-level focus; TopoViewer graph objects, controls, and diagnostics retain the core runtime contract. | Grafana-specific authoring workflows and a separate topology navigator. |

Automated coverage includes runtime accessibility regressions for:

- native node and edge focus traversal;
- semantic object and endpoint names;
- visible focus on attention-focused topology objects;
- non-color operational status cues through badge text plus status markers;
- label contrast for representative runtime labels;
- reduced-motion computed transition and animation durations;
- keyboard escape from the viewer without trapping focus;
- accessible default and host-supplied empty/error states.

Manual release review still checks focus visibility, editor escape behavior,
text legibility, contrast, and non-color cues in representative light and dark
surfaces. Automation supplements that review; it does not establish complete
assistive-technology conformance.

## Data And Privacy

| Surface | Stored data | User expectation |
|---|---|---|
| React runtime | Whatever the host app passes and stores | Host application owns privacy, telemetry, auth, and persistence policy. |
| MkDocs/Zensical | Static YAML assets and transient viewport state | Public docs should not include secrets, private topology, or local artifact paths. |
| TopoViewer Studio | Project sources, invalid drafts, recovery snapshots, preferences, and viewport state | Browser IndexedDB or an approved Desktop Studio directory; export archives deliberately before moving work elsewhere. |
| Grafana panel | Dashboard options, selected mounted bundle ID, Prometheus query results, runtime overlays | Source YAML remains mounted file content; telemetry overlays are runtime-only. |
| Promo screenshots/video | Captured rendered surfaces | Checked-in assets must avoid personal data, local paths, private lab names, and failed diagnostics. |

## Release Expectations

Before claiming a release is ready for broad adoption:

1. Run `npm run ci`.
2. Run or review the performance smoke lane.
3. Review render parity artifacts for representative diagrams.
4. Review Grafana no-data, ambiguous-data, and degraded-overlay states.
5. Review keyboard/focus, screen-reader names, and contrast manually alongside automated accessibility checks.
6. Record any accepted risk in the release notes or public readiness report.
