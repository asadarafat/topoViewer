# Production Hardening

This document defines the production guardrails for TopoViewer as a general diagramming DSL and declarative graph renderer.

## Validation Gates

Use the repository-root CI lanes for production validation. They are the same
commands used by GitHub Actions, so a local failure maps to the same remote
gate.

```bash
npm run ci:generated
npm run ci:quality
npm run ci:schemas
npm run ci:build
npm run ci:docs
npm run ci:render-parity
npm run ci:test:topoviewer
npm run ci:test:harness
npm run ci:perf:smoke
npm run ci:package
npm run ci:public-readiness
```

`npm run ci` runs the same lanes in order. `npm run ci:remote-parity` runs the
full lane set with `CI=true` and `NODE_ENV=test`, which is useful when a local
machine has a server already running or a cached browser state that could hide
a GitHub Actions failure.

| Lane | Purpose |
|---|---|
| `ci:generated` | Regenerates docs/examples and fails if committed generated files are stale. |
| `ci:quality` | Runs code-health checks, Oxlint, TypeScript checks, dependency boundaries, and copy-paste detection. |
| `ci:schemas` | Validates YAML schemas and semantic graph linting. |
| `ci:build` | Builds packages and verifies vendored MkDocs embed assets are committed. |
| `ci:docs` | Builds MkDocs, Zensical, and the browser harness, then opens the built `site/` artifact in Chromium. |
| `ci:render-parity` | Opens the same canonical fixtures through harness, MkDocs embed assets, and Zensical embed assets, then compares viewer-only DOM geometry and screenshots. |
| `ci:test:topoviewer` | Runs unit and Playwright tests for the renderer package. |
| `ci:test:harness` | Runs Playwright tests for the VS Code browser harness. |
| `ci:perf:smoke` | Enforces attention-engine and CLOS layout smoke benchmarks. |
| `ci:package` | Runs npm pack inspection and MkDocs wheel inspection. |
| `ci:public-readiness:core` | Runs remote readiness guardrails that are not already covered by the package and security workflow steps: docs lint, render parity, hostile-content tests, security health report, and public leak/readiness guardrails. |
| `ci:public-readiness` | Runs the full local/release public-adoption gate: core readiness plus package dry-run, install-command checks, Grafana artifact autopsy, dependency triage, and Go vulnerability check. |

JSON Schema catches malformed document shape. Semantic lint catches broken meaning:

- Duplicate IDs.
- Missing names on graph objects.
- Links with missing source/target nodes.
- Paths with missing sequence nodes.
- Stitched child paths with missing or invalid parent paths.
- Regions with missing members or parents.
- Unknown layers.
- Unused stylesheet selectors.
- Unsafe image references.
- Renderer limit violations.

The docs smoke gate catches deployment-specific behavior that static tests miss:

- MkDocs embeds render graph nodes and visible links without `.topoviewer-error`.
- Zensical embeds hydrate without requiring a manual browser refresh.
- The browser harness loads under the GitHub Pages `/topoviewer/harness/` base path.

The renderer parity gate is narrower than docs smoke. It treats the browser
harness as the golden authoring surface, then renders the same canonical YAML
fixtures through MkDocs and Zensical using a fixed viewport and parity theme.
Allowed differences are page chrome, surrounding documentation layout, and
non-parity wrapper themes. Not allowed: different graph geometry, missing
edges, changed label placement, changed icon fit, style default drift, or
different topology/stylesheet composition. Failure screenshots are stored in
the ignored local artifact directory for review.

## Performance Budgets

Performance gates are intentionally split by responsibility:

- `benchmark:attention:smoke` covers dense attention indexing, focus updates,
  graph reduction, and first compile behavior.
- `benchmark:clos:smoke` covers layout-only CLOS placement without React,
  browser APIs, or the harness.

The CLOS smoke benchmark uses a deterministic synthetic graph:

| Fixture | Value |
|---|---:|
| Nodes | 1000 |
| Links | 2520 |
| Stages | 5 |
| Stage counts | 158, 211, 264, 210, 157 |
| Layout mode | `clos` |

The CI smoke budget is deliberately looser than a developer laptop baseline so
GitHub runner variance does not hide real regressions behind flaky thresholds:

| Measurement | CI smoke threshold |
|---|---:|
| Fixture generation | 250 ms |
| Median CLOS layout | 2000 ms |
| Max CLOS layout round | 4000 ms |
| Generation + median layout | 2200 ms |

Current local Node 24 baseline recorded with `npm run benchmark:clos -- --nodes
1000 --rounds 7`:

| Measurement | Local result |
|---|---:|
| Fixture generation | 17.507 ms |
| Median CLOS layout | 37.271 ms |
| Max CLOS layout round | 39.687 ms |
| Generation + median layout | 54.778 ms |

Interaction budgets for production authoring and embedded docs:

| Surface | Budget |
|---|---|
| Default interactive diagrams | Stay within the default renderer limits unless the host explicitly raises them. |
| 1k-node CLOS apply/layout | Complete layout in the `benchmark:clos:smoke` median budget before handing positioned nodes to React Flow. |
| Dense operational views | Prefer layers, regions, aggregates, and attention state over rendering every repeated service or endpoint. |
| Browser harness and docs smoke | Assert durable rendered graph state instead of transient status text or fixed sleeps. |

Stress fixtures are intentionally outside the required CI gate. The policy is:

| Class | Size | Command home | Required gate |
|---|---:|---|---|
| Default | Up to the renderer defaults | Normal examples, docs, and harness fixtures | `npm run ci` |
| Dense smoke | 1000 CLOS nodes and 2520 links | `npm run benchmark:clos:smoke` | `npm run ci:perf:smoke` |
| Local stress | 10000-node synthetic graphs | `npm run benchmark:clos -- --nodes 10000 --rounds 3` | Manual before changing layout complexity |

10k-node runs are useful for profiling algorithmic changes, but they are not
published as browser harness templates and are not part of every pull-request
gate. If a change improves or regresses stress behavior, record the timing in
the change discussion and keep the required CI smoke threshold focused on the
1k-node production interaction budget.

Grafana Containerlab validation is also intentionally outside the default pull
request gate. Run `npm run grafana:clab:up`, `npm run grafana:clab:smoke`, and
`npm run grafana:clab:down` when changing the real telemetry lab, Containerlab
topology, generated Prometheus rules, or mapper behavior that depends on live
gNMIc/Prometheus data.

## Generated Artifact Contract

TopoViewer has generated files because one canonical content tree feeds npm
examples, MkDocs pages, Zensical pages, and package docs. The mutation rule is:

| Prefix | Contract |
|---|---|
| `sync:*` | May write generated sources or projection files. Review and commit the diff. |
| `check:*` | Must report drift without leaving source changes. |
| `validate:*` | Must validate inputs and should not leave generated source changes. |
| `test:*` | May write test artifacts under ignored report directories only. |
| `ci:*` | May run sync/build steps, but must fail if generated files required by the repository are left dirty. |

If `ci:generated`, `ci:build`, or `ci:docs` fails with a stale generated-file
message, read the reported canonical source area and generated projection path,
run the matching sync/build command locally, review the exact diff, and commit
it with the source change.

## Failure Triage

Classify CI failures before changing code:

| Classification | Signal | Response |
|---|---|---|
| Product regression | The same command fails locally and the output is genuinely wrong. | Fix product code or fixtures and keep/add regression coverage. |
| Generated artifact drift | A sync/build step changes tracked projections or vendored assets. | Run the matching `sync:*` or build step, review the diff, and commit it. |
| Environment drift | GitHub differs from local Node, npm, Python, browser, OS, or env vars. | Compare `ci:env` output and reproduce with `npm run ci:remote-parity`. |
| Server orchestration drift | Playwright attaches to a stale server or wrong port. | Run under `CI=true`; CI-mode Playwright must start its own server. |
| Browser timing or hydration drift | The page needs a manual refresh or a selector is asserted before hydration. | Wait for durable rendered DOM state, not arbitrary timeouts. |
| Brittle assertion | The test checks SVG string spacing, transient status text, or overly tight pixel values. | Assert durable YAML, object state, graph semantics, or documented tolerances. |
| Resource/performance flake | The runner is constrained but the behavior is correct. | Preserve traces and metrics before adjusting budgets. |
| Command contract drift | A command name hides mutation or differs from GitHub workflow behavior. | Move behavior behind the correct command prefix and update the docs. |

Remote-only failure workflow:

```bash
gh run view <run-id> --log-failed
npm run ci:env
npm run ci:remote-parity
```

Use the failing named lane first when the GitHub step identifies one, for
example `npm run ci:test:harness` or `npm run ci:docs`. Do not retry a required
CI test to hide a regression. A temporary retry is acceptable only when there is
a tracked flaky-browser issue and the first failure preserves trace, screenshot,
console output, environment report, and generated artifacts.

## Renderer Limits

Default limits are intentionally conservative:

| Limit | Default |
|---|---:|
| Nodes | 1200 |
| Edges | 2400 |
| Path segments | 1600 |
| Labels | 2000 |
| Callouts | 250 |
| Shapes | 500 |
| Embedded image bytes | 750000 |

Override only when the target environment is known:

```yaml
limits:
  maxNodes: 2000
  maxEdges: 4000
  maxPathSegments: 2400
```

If a use case has thousands of repeated services, model them as aggregate objects with `data.serviceCount`; do not render thousands of individual lanes by default.

## Schema Versioning And Migration

Use `version` on authored documents:

```yaml
version: "0.1"
```

Missing versions are migrated to the current compatible version at runtime. Breaking model changes must add a migration step instead of silently changing semantics.

## Reference Resolution Rules

For Markdown and image references:

- Relative paths are resolved by the host: MkDocs, browser app, or portal.
- `https:` is allowed for remote references.
- `http:` should only be used in trusted lab environments.
- Data images are allowed for PNG, JPEG, GIF, and WebP.
- SVG data URLs are blocked in Markdown image references.
- Inline icon SVG is sanitized before being converted to a data image.

MkDocs embeds resolve `topology` and `stylesheet` relative to the Markdown page.

## Security Baseline

TopoViewer treats authored diagrams as content, not code:

- Markdown rendering escapes raw HTML.
- Markdown links are URL-filtered.
- Markdown image URLs are URL-filtered.
- Inline SVG icons strip `script`, `foreignObject`, event-handler attributes, and JavaScript hrefs.
- Public documentation should not enable untrusted third-party YAML without server-side review.

## Accessibility Baseline

TopoViewer provides:

- A top-level `role="img"` with diagram label.
- Node `role="group"` labels from object names.
- Callout `role="note"`.
- Theme-aware CSS variables for light/dark mode.

Authoring guidance:

- Do not rely on color alone. Use labels, line style, shape, or icons.
- Keep sufficient contrast in both light and dark themes.
- Use `name` on graph objects for readable labels, tooltips, and export.

## Static Export

The package exports:

- `topoviewerToSvg`
- `topoviewerToPng`
- `topoviewerToPdf`
- `downloadTopoViewerSvg`
- `downloadTopoViewerPng`
- `downloadTopoViewerPdf`

For deterministic exports:

- Use explicit `layout.mode: manual`, or fixed force-layout parameters.
- Set deterministic viewport size in the host.
- Avoid remote images unless the host can load them consistently.
- Prefer packaged fonts or system-safe fonts.

## Visual Regression

DOM tests are not enough for diagrams. Use Playwright screenshots for baseline views and interaction-critical views. Update snapshots only after reviewing the visual change.
