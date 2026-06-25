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
npm run ci:test:topoviewer
npm run ci:test:harness
npm run ci:perf:smoke
npm run ci:package
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
| `ci:test:topoviewer` | Runs unit and Playwright tests for the renderer package. |
| `ci:test:harness` | Runs Playwright tests for the VS Code browser harness. |
| `ci:perf:smoke` | Enforces the attention-engine smoke benchmark. |
| `ci:package` | Runs npm pack inspection and MkDocs wheel inspection. |

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
- The browser harness loads under the GitHub Pages `/TopoViewer/harness/` base path.

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
message, run the matching sync/build command locally, review the exact diff,
and commit it with the source change.

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
